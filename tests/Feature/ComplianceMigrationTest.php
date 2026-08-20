<?php

namespace Tests\Feature;

use App\Models\ComplianceMigrationLog;
use App\Models\Compliance\RsmiMigratedRecord;
use App\Models\Compliance\RpcIMigratedRecord;
use App\Models\Compliance\StockCardMigratedRecord;
use App\Models\Compliance\MemorandumReceiptMigratedRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComplianceMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_rsmi_records_are_migrated_to_dedicated_rsmi_table(): void
    {
        $this->withoutMiddleware();

        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'System Admin']);
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole($role);

        $response = $this->actingAs($user)->post(route('compliance.migrations.store'), [
            'form_type' => 'RSMI',
            'source' => 'rsmi_excel',
            'records' => [[
                'reference' => 'RIS-2024-001',
                'ris_no' => 'RIS-2024-001',
                'date' => '2024-01-15',
                'item_name' => 'Ballpen',
                'quantity' => 10,
                'recipient' => 'Supply Office',
                'department' => 'Accounting',
                'center_code' => 'ACC-01',
                'unit' => 'box',
                'unit_cost' => 150.00,
                'amount' => 1500.00,
            ]],
        ]);

        $response->assertRedirect(route('compliance.reports'));
        $this->assertSame(1, RsmiMigratedRecord::count());
        $this->assertSame(1, ComplianceMigrationLog::count());

        $record = RsmiMigratedRecord::first();
        $this->assertSame('RSMI', $record->form_identifier);
        $this->assertSame('RIS-2024-001', $record->ris_no);
        $this->assertSame('Ballpen', $record->item);
        $this->assertSame(10, $record->quantity_issued);
        $this->assertEquals(150.00, $record->unit_cost);
        $this->assertSame('ACC-01', $record->center_code);
        $this->assertSame('University of Camarines Norte', $record->entity_name);
    }

    public function test_rpci_records_are_migrated_to_dedicated_rpci_table(): void
    {
        $this->withoutMiddleware();

        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'System Admin']);
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole($role);

        $response = $this->actingAs($user)->post(route('compliance.migrations.store'), [
            'form_type' => 'RPCI',
            'source' => 'rpci_excel',
            'records' => [[
                'reference' => 'PROP-2024-01',
                'stock_no' => 'STK-001',
                'date' => '2024-12-31',
                'item_name' => 'Desktop Computer',
                'quantity' => 5,
                'on_hand_count' => 5,
                'department' => 'IT Dept',
                'unit' => 'unit',
                'unit_cost' => 35000.00,
                'amount' => 175000.00,
            ]],
        ]);

        $response->assertRedirect(route('compliance.reports'));
        $this->assertSame(1, RpcIMigratedRecord::count());
        $this->assertSame(1, ComplianceMigrationLog::count());

        $record = RpcIMigratedRecord::first();
        $this->assertSame('RPCI', $record->form_identifier);
        $this->assertSame('PROP-2024-01', $record->serial_no);
        $this->assertSame('Desktop Computer', $record->item);
        $this->assertSame(5, $record->quantity_per_books);
    }

    public function test_stock_card_records_are_migrated_to_dedicated_stock_card_table_via_dedicated_route(): void
    {
        $this->withoutMiddleware();

        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'System Admin']);
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole($role);

        $response = $this->actingAs($user)->post(route('compliance.migrate.stock_card'), [
            'source' => 'stock_card_doc',
            'records' => [[
                'reference' => 'SC-2024-88',
                'stock_no' => 'SC-ITEM-01',
                'date' => '2024-03-10',
                'item_name' => 'Bond Paper A4',
                'quantity' => 20,
                'receipt_qty' => 50,
                'balance_qty' => 30,
                'recipient' => 'Supply Office',
                'unit' => 'ream',
                'unit_cost' => 250.00,
                'amount' => 5000.00,
            ]],
        ]);

        $response->assertRedirect(route('compliance.reports'));
        $this->assertSame(1, StockCardMigratedRecord::count());
        $this->assertSame(1, ComplianceMigrationLog::count());

        $record = StockCardMigratedRecord::first();
        $this->assertSame('STOCK_CARD', $record->form_identifier);
        $this->assertSame('SC-2024-88', $record->reference_no);
        $this->assertSame('Bond Paper A4', $record->item);
        $this->assertSame(20, $record->issue_quantity);
        $this->assertSame(50, $record->receipt_quantity);
        $this->assertSame(30, $record->balance);
    }

    public function test_memorandum_receipt_records_are_migrated_to_dedicated_mr_table_via_dedicated_route(): void
    {
        $this->withoutMiddleware();

        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'System Admin']);
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole($role);

        $response = $this->actingAs($user)->post(route('compliance.migrate.memorandum_receipt'), [
            'source' => 'mr_excel_archive',
            'records' => [[
                'reference' => 'MR-2024-001',
                'date' => '2024-02-10',
                'item_name' => 'Executive Office Desk',
                'quantity' => 1,
                'unit' => 'unit',
                'unit_cost' => 12500,
                'amount' => 12500,
                'recipient' => 'Juan Dela Cruz',
                'department' => 'Admin Office',
                'designation' => 'Director',
                'remarks' => 'Official Business',
            ]],
        ]);

        $response->assertRedirect(route('compliance.reports'));
        $this->assertSame(1, MemorandumReceiptMigratedRecord::count());
        $this->assertSame(1, ComplianceMigrationLog::count());

        $record = MemorandumReceiptMigratedRecord::first();
        $this->assertSame('MR', $record->form_identifier);
        $this->assertSame('MR-2024-001', $record->memorial_no);
        $this->assertSame('Juan Dela Cruz', $record->received_by);
        $this->assertSame('Admin Office', $record->received_from);
    }

    public function test_duplicate_records_are_prevented_across_batches(): void
    {
        $this->withoutMiddleware();

        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'System Admin']);
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole($role);

        // First batch
        $this->actingAs($user)->post(route('compliance.migrations.store'), [
            'form_type' => 'RSMI',
            'source' => 'rsmi_excel',
            'records' => [[
                'reference' => 'RIS-BATCH-1',
                'date' => '2024-01-15',
                'item_name' => 'Ballpen',
                'quantity' => 10,
            ]],
        ]);
        $this->assertSame(1, RsmiMigratedRecord::count());

        // Duplicate batch (same reference)
        $this->actingAs($user)->post(route('compliance.migrations.store'), [
            'form_type' => 'RSMI',
            'source' => 'rsmi_excel',
            'records' => [[
                'reference' => 'RIS-BATCH-1',
                'date' => '2024-01-15',
                'item_name' => 'Ballpen',
                'quantity' => 10,
            ]],
        ]);

        $this->assertSame(1, RsmiMigratedRecord::count());
    }

    public function test_compliance_reports_endpoint_aggregates_all_dedicated_tables(): void
    {
        $this->withoutMiddleware();

        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'System Admin']);
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole($role);

        RsmiMigratedRecord::create([
            'form_identifier' => 'RSMI',
            'ris_no' => 'RIS-TEST-1',
            'item' => 'Test Item 1',
            'quantity_issued' => 5,
        ]);

        RpcIMigratedRecord::create([
            'form_identifier' => 'RPCI',
            'serial_no' => 'RPCI-TEST-1',
            'item' => 'Test Item 2',
            'quantity_per_books' => 10,
        ]);

        StockCardMigratedRecord::create([
            'form_identifier' => 'STOCK_CARD',
            'reference_no' => 'SC-TEST-1',
            'item' => 'Test Item 3',
            'issue_quantity' => 15,
        ]);

        MemorandumReceiptMigratedRecord::create([
            'form_identifier' => 'MR',
            'memorial_no' => 'MR-TEST-1',
            'received_by' => 'Officer A',
            'remarks' => 'Test Item 4',
        ]);

        $response = $this->actingAs($user)->get(route('compliance.reports'));
        $response->assertOk();

        $migrated = $response->viewData('page')['props']['migratedRecords'];
        $this->assertCount(4, $migrated);
    }

    public function test_artisan_verification_command_runs_successfully(): void
    {
        $this->artisan('compliance:verify-migration')
            ->expectsOutputToContain('COA HISTORICAL MIGRATION DATA INTEGRITY CHECK')
            ->expectsOutputToContain('VERIFICATION COMPLETE')
            ->assertExitCode(0);
    }
}

