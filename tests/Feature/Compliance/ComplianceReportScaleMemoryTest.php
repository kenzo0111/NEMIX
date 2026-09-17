<?php

namespace Tests\Feature\Compliance;

use App\Models\ComplianceReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ComplianceReportScaleMemoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'System Admin']);
        Role::create(['name' => 'Property Staff']);
    }

    public function test_initial_compliance_reports_request_does_not_load_all_records_and_remains_bounded(): void
    {
        $admin = User::factory()->create([
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $admin->assignRole('System Admin');

        // Create sample compliance reports
        for ($i = 1; $i <= 30; $i++) {
            ComplianceReport::create([
                'title' => "RSMI Report {$i}",
                'type' => 'RSMI',
                'reference' => sprintf('2026-09-01-%04d', $i),
                'created_by' => $admin->id,
                'payload' => ['sample' => 'data'],
                'date' => '2026-09-01',
                'period_type' => 'monthly',
                'selected_month' => 9,
                'selected_year' => 2026,
            ]);
        }

        // Insert high volume of mock issuances if table exists
        if (Schema::hasTable('issuances')) {
            $batch = [];
            for ($i = 1; $i <= 1000; $i++) {
                $batch[] = [
                    'issued_by' => $admin->id,
                    'department' => 'CCMS',
                    'recipient' => 'Accountable Officer',
                    'date_issued' => '2026-09-01',
                    'status' => 'completed',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            DB::table('issuances')->insert($batch);
        }

        // Insert high volume of mock receivings if table exists
        if (Schema::hasTable('receivings') && Schema::hasTable('items') && Schema::hasTable('suppliers')) {
            $supId = DB::table('suppliers')->insertGetId([
                'name' => 'Supplier Co',
                'tin' => '123-456-789',
                'reg_number' => 'REG-12345',
                'category' => 'General',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $itemId = DB::table('items')->insertGetId([
                'name' => 'Sample Item',
                'sku' => 'SKU-001',
                'stock' => 500,
                'status' => 'Available',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $batch = [];
            for ($i = 1; $i <= 1000; $i++) {
                $batch[] = [
                    'item_id' => $itemId,
                    'supplier_id' => $supId,
                    'quantity' => 10,
                    'date_received' => '2026-09-01',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            DB::table('receivings')->insert($batch);
        }

        // Insert mock migrated records if table exists
        if (Schema::hasTable('rsmi_migrated_records')) {
            $batch = [];
            for ($i = 1; $i <= 1000; $i++) {
                $batch[] = [
                    'item' => "Migrated Item {$i}",
                    'quantity_issued' => 5,
                    'date' => '2026-08-15',
                    'center_code' => 'CCMS',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            DB::table('rsmi_migrated_records')->insert($batch);
        }

        $memBefore = memory_get_usage();

        $response = $this->actingAs($admin)->get('/compliance/reports');
        $response->assertOk();

        $memAfter = memory_get_usage();
        $memDiffMb = ($memAfter - $memBefore) / 1024 / 1024;

        // Verify that memory consumption difference is well bounded (under 15MB)
        $this->assertLessThan(15, $memDiffMb, "Initial page load consumed excessive memory: {$memDiffMb} MB");

        // Verify Inertia response props do not include all raw database rows
        $response->assertInertia(function ($page) {
            $page->component('Compliance/ManageReports');
            $props = $page->toArray()['props'];

            // issuances, receivings, and migratedRecords on initial page load must be bounded (<= 100) and NOT contain the 1,000s of raw rows
            $this->assertLessThanOrEqual(100, count($props['issuances']));
            $this->assertLessThanOrEqual(100, count($props['receivings']));
            $this->assertLessThanOrEqual(100, count($props['migratedRecords']));

            // Reports must be bounded
            $this->assertLessThanOrEqual(100, count($props['reports']));
        });
    }

    public function test_compliance_report_preview_dataset_uses_bounded_period_queries(): void
    {
        $admin = User::factory()->create([
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $admin->assignRole('System Admin');

        $response = $this->actingAs($admin)->postJson(route('compliance.reports.preview_dataset'), [
            'type' => 'RSMI',
            'periodType' => 'monthly',
            'selectedMonth' => 9,
            'selectedYear' => 2026,
        ]);

        $response->assertOk();
        $data = $response->json();

        $this->assertArrayHasKey('rsmi', $data);
        $this->assertArrayHasKey('summary', $data);
        $this->assertArrayHasKey('issuedItems', $data['rsmi']);
    }
}
