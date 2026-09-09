<?php

namespace Tests\Feature;

use App\Http\Controllers\Compliance\ComplianceReportController;
use App\Models\ComplianceReport;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Inventory\Models\Issuance;
use Modules\Suppliers\Models\Supplier;
use Tests\TestCase;

class DateHandlingRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();
    }

    public function test_compliance_report_persists_exact_local_date_without_regression(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $selectedDate = '2026-09-10';

        $response = $this->post(route('compliance.reports.store'), [
            'title' => 'Test Date Integrity Report',
            'type' => 'RSMI',
            'periodType' => 'specific',
            'date' => $selectedDate,
            'generatedDate' => $selectedDate,
            'items' => [],
        ]);

        $response->assertSessionHasNoErrors();

        $report = ComplianceReport::where('title', 'Test Date Integrity Report')->first();
        $this->assertNotNull($report);
        $this->assertSame($selectedDate, $report->date ? $report->date->format('Y-m-d') : null);
        $this->assertSame($selectedDate, $report->payload['generatedDate'] ?? null);
        $this->assertStringStartsWith($selectedDate, $report->reference);
    }

    public function test_compliance_report_normalizes_utc_midnight_iso_string_to_manila_date(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Simulated UTC midnight or browser offset that previously converted 2026-09-10 to 2026-09-09T16:00:00.000Z
        $isoDate = '2026-09-09T16:00:00.000Z'; // This is 2026-09-10 00:00:00 Manila (UTC+8)

        $response = $this->post(route('compliance.reports.store'), [
            'title' => 'Test ISO Date Normalization',
            'type' => 'Stock Card',
            'periodType' => 'specific',
            'date' => $isoDate,
            'generatedDate' => $isoDate,
            'items' => [],
        ]);

        $response->assertSessionHasNoErrors();

        $report = ComplianceReport::where('title', 'Test ISO Date Normalization')->first();
        $this->assertNotNull($report);
        $this->assertSame('2026-09-10', $report->date ? $report->date->format('Y-m-d') : null);
        $this->assertSame('2026-09-10', $report->payload['generatedDate'] ?? null);
        $this->assertStringStartsWith('2026-09-10', $report->reference);
    }

    public function test_receiving_stores_exact_date_without_regression(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $supplier = Supplier::create([
            'name' => 'Acme Supplies',
            'tin' => '123-456-789-000',
            'reg_number' => 'REG-DATE-01',
            'category' => 'Office Supplies',
            'contact_person' => 'John Doe',
            'email' => 'acme@example.com',
            'phone' => '1234567890',
            'address' => 'City',
            'status' => 'Active',
            'created_by' => $user->id,
        ]);

        $item = Item::create([
            'name' => 'Ballpen Black',
            'sku' => 'PEN-BLK-001',
            'stock' => 10,
            'unit_cost' => 15.00,
            'amount' => 150.00,
            'status' => 'Available',
            'supplier_id' => $supplier->id,
            'created_by' => $user->id,
        ]);

        $selectedDate = '2026-09-10';

        $response = $this->post(route('inventory.receiving.store'), [
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 20,
            'date_received' => $selectedDate,
        ]);

        $response->assertSessionHasNoErrors();

        $receiving = Receiving::where('item_id', $item->id)->latest()->first();
        $this->assertNotNull($receiving);
        $this->assertSame($selectedDate, $receiving->date_received->format('Y-m-d'));
    }

    public function test_issuance_stores_exact_date_without_regression(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $supplier = Supplier::create([
            'name' => 'General Supplies Inc',
            'tin' => '987-654-321-000',
            'reg_number' => 'REG-DATE-02',
            'category' => 'Office Supplies',
            'contact_person' => 'Jane Smith',
            'email' => 'gen@example.com',
            'phone' => '0987654321',
            'address' => 'City',
            'status' => 'Active',
            'created_by' => $user->id,
        ]);

        $item = Item::create([
            'name' => 'Folder Long',
            'sku' => 'FLD-LNG-001',
            'stock' => 50,
            'unit_cost' => 8.50,
            'amount' => 425.00,
            'status' => 'Available',
            'supplier_id' => $supplier->id,
            'created_by' => $user->id,
        ]);

        $selectedDate = '2026-09-10';

        $response = $this->post(route('inventory.issuance.store'), [
            'recipient' => 'Juan Dela Cruz',
            'department' => 'Accounting',
            'date_issued' => $selectedDate,
            'issuances' => [
                [
                    'item_id' => $item->id,
                    'quantity' => 5,
                ]
            ],
        ]);

        $response->assertSessionHasNoErrors();

        $issuance = Issuance::where('item_id', $item->id)->latest()->first();
        $this->assertNotNull($issuance);
        $this->assertSame($selectedDate, $issuance->date_issued->format('Y-m-d'));
    }
}
