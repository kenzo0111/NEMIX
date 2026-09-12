<?php

namespace Tests\Feature\Suppliers;

use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Services\InventoryIssuanceService;
use Modules\Inventory\Services\InventoryReceivingService;
use Modules\Inventory\Services\InventoryValuationService;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SupplierValuationTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected InventoryReceivingService $receivingService;
    protected InventoryIssuanceService $issuanceService;
    protected InventoryValuationService $valuationService;
    protected DashboardService $dashboardService;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'System Admin']);

        $this->adminUser = User::factory()->create(['is_active' => true]);
        $this->adminUser->assignRole('System Admin');

        $this->receivingService = app(InventoryReceivingService::class);
        $this->issuanceService = app(InventoryIssuanceService::class);
        $this->valuationService = app(InventoryValuationService::class);
        $this->dashboardService = app(DashboardService::class);
    }

    /**
     * Scenario 1: Supplier with batches receives correct Total Received Value.
     */
    public function test_supplier_with_batches_receives_correct_total_received_value(): void
    {
        $supplier = Supplier::create([
            'name' => 'Crown Supply Corporation',
            'tin' => '111-222-333-000',
            'address' => 'Naga City',
            'reg_number' => 'REG-CROWN-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $item = Item::create([
            'name' => 'Bond Paper A4',
            'sku' => 'PAP-A4-01',
            'unit_of_issue' => 'Ream',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        // Batch 1: 100 @ 250.00 = 25,000.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 100,
            'unit_cost' => 250.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Batch 2: 50 @ 260.00 = 13,000.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 50,
            'unit_cost' => 260.00,
            'date_received' => '2026-09-05',
        ], $this->adminUser->id);

        $metrics = $this->valuationService->getSupplierMetrics($supplier->id);
        $this->assertEquals(38000.00, $metrics['total_received_value']);
        $this->assertEquals(150, $metrics['total_received_quantity']);
        $this->assertEquals(2, $metrics['batch_count']);
    }

    /**
     * Scenario 2: Supplier with remaining stock receives correct Current Inventory Value.
     */
    public function test_supplier_with_remaining_stock_receives_correct_current_inventory_value(): void
    {
        $supplier = Supplier::create([
            'name' => 'Advance Paper Corp',
            'tin' => '222-333-444-000',
            'address' => 'Manila',
            'reg_number' => 'REG-ADV-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $item = Item::create([
            'name' => 'Index Card 3x5',
            'sku' => 'CRD-3X5-01',
            'unit_of_issue' => 'Pack',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        // Receive 500 @ 15.00 = 7,500.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 500,
            'unit_cost' => 15.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Issue 100 units (400 remaining @ 15.00 = 6,000.00)
        $this->issuanceService->store([
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 100],
            ],
            'recipient' => 'Registrar',
            'date_issued' => '2026-09-02',
        ], $this->adminUser->id);

        $metrics = $this->valuationService->getSupplierMetrics($supplier->id);
        $this->assertEquals(7500.00, $metrics['total_received_value']);
        $this->assertEquals(6000.00, $metrics['current_inventory_value']);
        $this->assertEquals(400, $metrics['current_quantity']);
    }

    /**
     * Scenario 3: Fully consumed supplier batches produce current value zero but preserve received value.
     */
    public function test_fully_consumed_supplier_batches_produce_current_value_zero_but_preserve_received_value(): void
    {
        $supplier = Supplier::create([
            'name' => 'Depleted Supply Co',
            'tin' => '333-444-555-000',
            'address' => 'Legazpi City',
            'reg_number' => 'REG-DEP-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $item = Item::create([
            'name' => 'Marker Whiteboard Black',
            'sku' => 'MRK-WHT-BLK',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        // Receive 50 @ 35.00 = 1,750.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 50,
            'unit_cost' => 35.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Issue all 50 units
        $this->issuanceService->store([
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 50],
            ],
            'recipient' => 'College of Science',
            'date_issued' => '2026-09-03',
        ], $this->adminUser->id);

        $metrics = $this->valuationService->getSupplierMetrics($supplier->id);
        $this->assertEquals(1750.00, $metrics['total_received_value']);
        $this->assertEquals(0.00, $metrics['current_inventory_value']);
        $this->assertEquals(50, $metrics['total_received_quantity']);
        $this->assertEquals(0, $metrics['current_quantity']);
    }

    /**
     * Scenario 4: Different suppliers of same Item Master receive separate correct values.
     */
    public function test_different_suppliers_of_same_item_master_receive_separate_correct_values(): void
    {
        $supplierA = Supplier::create([
            'name' => 'Camarines Office Supplies Trading',
            'tin' => '001-002-003-000',
            'address' => 'Daet',
            'reg_number' => 'REG-COS-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $supplierB = Supplier::create([
            'name' => 'National Book Store, Inc.',
            'tin' => '004-005-006-000',
            'address' => 'Quezon City',
            'reg_number' => 'REG-NBS-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $item = Item::create([
            'name' => 'Specialty Paper A4',
            'sku' => 'PAP-SPC-A4',
            'unit_of_issue' => 'Ream',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        // Supplier A delivers 100 @ 50.00 = 5,000.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $supplierA->id,
            'quantity' => 100,
            'unit_cost' => 50.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Supplier B delivers 80 @ 45.00 = 3,600.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $supplierB->id,
            'quantity' => 80,
            'unit_cost' => 45.00,
            'date_received' => '2026-09-02',
        ], $this->adminUser->id);

        // Issue 50 units (consumed from Supplier A due to FIFO)
        $this->issuanceService->store([
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 50],
            ],
            'recipient' => 'Admin Office',
            'date_issued' => '2026-09-03',
        ], $this->adminUser->id);

        $metricsA = $this->valuationService->getSupplierMetrics($supplierA->id);
        $metricsB = $this->valuationService->getSupplierMetrics($supplierB->id);

        // Supplier A: received 5,000; remaining 50 @ 50 = 2,500.00
        $this->assertEquals(5000.00, $metricsA['total_received_value']);
        $this->assertEquals(2500.00, $metricsA['current_inventory_value']);
        $this->assertEquals(50, $metricsA['current_quantity']);

        // Supplier B: received 3,600; remaining 80 @ 45 = 3,600.00 (untouched)
        $this->assertEquals(3600.00, $metricsB['total_received_value']);
        $this->assertEquals(3600.00, $metricsB['current_inventory_value']);
        $this->assertEquals(80, $metricsB['current_quantity']);
    }

    /**
     * Scenario 5: Supplier value does not use Item Master supplier_id.
     */
    public function test_supplier_value_does_not_use_item_master_supplier_id(): void
    {
        $legacySupplier = Supplier::create([
            'name' => 'Legacy Attached Supplier',
            'tin' => '999-999-999-000',
            'address' => 'Old Town',
            'reg_number' => 'REG-LEG-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $actualSupplier = Supplier::create([
            'name' => 'Actual Delivering Supplier',
            'tin' => '888-888-888-000',
            'address' => 'New Town',
            'reg_number' => 'REG-ACT-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        // Item Master has legacy supplier_id pointing to $legacySupplier
        $item = Item::create([
            'name' => 'Ballpen 0.5 Black',
            'supplier_id' => $legacySupplier->id,
            'sku' => 'PEN-05-BLK',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        // Actual delivery came from $actualSupplier: 200 @ 12.00 = 2,400.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $actualSupplier->id,
            'quantity' => 200,
            'unit_cost' => 12.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        $legacyMetrics = $this->valuationService->getSupplierMetrics($legacySupplier->id);
        $actualMetrics = $this->valuationService->getSupplierMetrics($actualSupplier->id);

        // Legacy supplier has zero batches -> must receive 0.00, NOT the item's valuation
        $this->assertEquals(0.00, $legacyMetrics['total_received_value']);
        $this->assertEquals(0.00, $legacyMetrics['current_inventory_value']);

        // Actual supplier receives the full valuation
        $this->assertEquals(2400.00, $actualMetrics['total_received_value']);
        $this->assertEquals(2400.00, $actualMetrics['current_inventory_value']);
    }

    /**
     * Scenario 6: Dashboard Inventory Value equals sum of supplier current values.
     */
    public function test_dashboard_inventory_value_equals_sum_of_supplier_current_values(): void
    {
        $supplierA = Supplier::create([
            'name' => 'Supplier Alpha',
            'tin' => '111-000-111-000',
            'address' => 'Zone 1',
            'reg_number' => 'REG-ALP-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $supplierB = Supplier::create([
            'name' => 'Supplier Beta',
            'tin' => '222-000-222-000',
            'address' => 'Zone 2',
            'reg_number' => 'REG-BET-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $itemA = Item::create([
            'name' => 'Item A',
            'sku' => 'ITM-A',
            'unit_of_issue' => 'Box',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        $itemB = Item::create([
            'name' => 'Item B',
            'sku' => 'ITM-B',
            'unit_of_issue' => 'Box',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        $this->receivingService->record([
            'item_id' => $itemA->id,
            'supplier_id' => $supplierA->id,
            'quantity' => 10,
            'unit_cost' => 100.00, // 1,000.00
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        $this->receivingService->record([
            'item_id' => $itemB->id,
            'supplier_id' => $supplierB->id,
            'quantity' => 20,
            'unit_cost' => 50.00, // 1,000.00
            'date_received' => '2026-09-02',
        ], $this->adminUser->id);

        $dashboardVal = $this->dashboardService->getSummaryStats()['summary']['total_inventory_value'];
        $recon = $this->valuationService->reconcileSupplierValuationWithDashboard();

        $this->assertEquals(2000.00, $dashboardVal);
        $this->assertEquals(2000.00, $recon['sum_suppliers_current_value']);
        $this->assertTrue($recon['is_reconciled']);
        $this->assertEquals(0.00, $recon['difference']);
    }

    /**
     * Scenario 7: Supplier with no batches returns real zero.
     */
    public function test_supplier_with_no_batches_returns_real_zero(): void
    {
        $supplier = Supplier::create([
            'name' => 'Empty Supplier',
            'tin' => '000-111-222-333',
            'address' => 'Empty Town',
            'reg_number' => 'REG-EMP-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $metrics = $this->valuationService->getSupplierMetrics($supplier->id);
        $this->assertSame(0.00, $metrics['total_received_value']);
        $this->assertSame(0.00, $metrics['current_inventory_value']);
        $this->assertSame(0, $metrics['batch_count']);
        $this->assertSame(0, $metrics['total_received_quantity']);
        $this->assertSame(0, $metrics['current_quantity']);

        // Assert Model accessors also return real zero
        $this->assertSame(0.00, $supplier->total_received_value);
        $this->assertSame(0.00, $supplier->current_inventory_value);
        $this->assertSame(0, $supplier->batch_count);
    }

    /**
     * Scenario 8: Supplier with missing/non-applicable contract shows appropriate state in Inertia.
     */
    public function test_supplier_with_missing_contract_shows_appropriate_state(): void
    {
        $supplier = Supplier::create([
            'name' => 'Contractless Vendor',
            'tin' => '777-111-222-000',
            'address' => 'Pasay City',
            'reg_number' => 'REG-NO-CNT',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('suppliers.index'));
        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Suppliers/ManageSupplier')
            ->has('suppliers', 1)
            ->where('suppliers.0.id', $supplier->id)
            ->where('suppliers.0.total_received_value', 0)
            ->where('suppliers.0.current_inventory_value', 0)
            ->where('suppliers.0.batch_count', 0)
        );
    }

    /**
     * Scenario 9: Editing supplier metadata does not change historical batch value.
     */
    public function test_editing_supplier_metadata_does_not_change_historical_batch_value(): void
    {
        $supplier = Supplier::create([
            'name' => 'Original Name Corp',
            'tin' => '123-456-789-000',
            'address' => 'Old Address',
            'reg_number' => 'REG-ORIG-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $item = Item::create([
            'name' => 'Staple Wire #35',
            'sku' => 'STP-WIR-35',
            'unit_of_issue' => 'Box',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 100,
            'unit_cost' => 45.00, // 4,500.00
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Edit supplier metadata
        $supplier->update([
            'name' => 'Updated Name Enterprise',
            'address' => 'New Modern Address',
            'tin' => '999-888-777-000',
        ]);

        $metrics = $this->valuationService->getSupplierMetrics($supplier->id);
        $this->assertEquals(4500.00, $metrics['total_received_value']);
        $this->assertEquals(4500.00, $metrics['current_inventory_value']);
    }

    /**
     * Scenario 10: Unit cost differences across batches are preserved.
     */
    public function test_unit_cost_differences_are_preserved(): void
    {
        $supplier = Supplier::create([
            'name' => 'Multi-Price Supplier',
            'tin' => '555-666-777-000',
            'address' => 'Cebu City',
            'reg_number' => 'REG-MPS-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $item = Item::create([
            'name' => 'Flash Drive 32GB',
            'sku' => 'USB-32GB',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        // Batch 1: 10 @ 200.00 = 2,000.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 10,
            'unit_cost' => 200.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Batch 2: 10 @ 250.00 = 2,500.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 10,
            'unit_cost' => 250.00,
            'date_received' => '2026-09-05',
        ], $this->adminUser->id);

        $batches = InventoryBatch::where('supplier_id', $supplier->id)->orderBy('id')->get();
        $this->assertEquals(200.00, (float) $batches[0]->unit_cost);
        $this->assertEquals(250.00, (float) $batches[1]->unit_cost);

        $metrics = $this->valuationService->getSupplierMetrics($supplier->id);
        $this->assertEquals(4500.00, $metrics['total_received_value']);
        $this->assertEquals(4500.00, $metrics['current_inventory_value']);
    }

    /**
     * Scenario 11: Current valuation uses quantity_remaining.
     */
    public function test_current_valuation_uses_quantity_remaining(): void
    {
        $supplier = Supplier::create([
            'name' => 'Remaining Stock Supplier',
            'tin' => '444-111-222-000',
            'address' => 'Iloilo City',
            'reg_number' => 'REG-RSS-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $item = Item::create([
            'name' => 'Correction Tape',
            'sku' => 'COR-TAP-01',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        // Receive 100 @ 30.00 = 3,000.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 100,
            'unit_cost' => 30.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Issue 35 units (65 remaining)
        $this->issuanceService->store([
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 35],
            ],
            'recipient' => 'Library',
            'date_issued' => '2026-09-02',
        ], $this->adminUser->id);

        $metrics = $this->valuationService->getSupplierMetrics($supplier->id);
        // 65 * 30.00 = 1,950.00
        $this->assertEquals(1950.00, $metrics['current_inventory_value']);
        $this->assertEquals(65, $metrics['current_quantity']);
    }

    /**
     * Scenario 12: Total received valuation uses quantity_received.
     */
    public function test_total_received_valuation_uses_quantity_received(): void
    {
        $supplier = Supplier::create([
            'name' => 'Received Qty Supplier',
            'tin' => '999-555-111-000',
            'address' => 'Bacolod City',
            'reg_number' => 'REG-RQS-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $item = Item::create([
            'name' => 'Glue Stick 21g',
            'sku' => 'GLU-STK-21G',
            'unit_of_issue' => 'Tube',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        // Receive 200 @ 25.00 = 5,000.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 200,
            'unit_cost' => 25.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Issue 150 units
        $this->issuanceService->store([
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 150],
            ],
            'recipient' => 'HR Office',
            'date_issued' => '2026-09-04',
        ], $this->adminUser->id);

        $metrics = $this->valuationService->getSupplierMetrics($supplier->id);
        // Total received valuation must stay 200 * 25.00 = 5,000.00 despite 150 issued
        $this->assertEquals(5000.00, $metrics['total_received_value']);
        $this->assertEquals(200, $metrics['total_received_quantity']);
    }

    /**
     * Audit Command Test: runs inventory:audit-supplier-valuation and verifies output.
     */
    public function test_audit_supplier_valuation_command_executes_successfully(): void
    {
        $supplier = Supplier::create([
            'name' => 'Audit Test Supplier',
            'tin' => '123-000-456-000',
            'address' => 'Audit City',
            'reg_number' => 'REG-AUD-01',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $item = Item::create([
            'name' => 'Audit Paper A4',
            'sku' => 'AUD-PAP-A4',
            'unit_of_issue' => 'Ream',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 10,
            'unit_cost' => 100.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        $this->artisan('inventory:audit-supplier-valuation')
            ->expectsOutputToContain('NEMIX SUPPLIER VALUATION & INVENTORY AUDIT REPORT')
            ->expectsOutputToContain('Audit Test Supplier')
            ->expectsOutputToContain('RECONCILED')
            ->assertSuccessful();
    }
}
