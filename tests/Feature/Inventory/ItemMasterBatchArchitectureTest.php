<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\IssuanceBatchAllocation;
use Modules\Inventory\Models\IssuanceItem;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Inventory\Services\InventoryBalanceService;
use Modules\Inventory\Services\InventoryCostingService;
use Modules\Inventory\Services\InventoryDuplicateDetectionService;
use Modules\Inventory\Services\InventoryIssuanceService;
use Modules\Inventory\Services\InventoryReceivingService;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ItemMasterBatchArchitectureTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Supplier $supplierA;
    protected Supplier $supplierB;
    protected InventoryReceivingService $receivingService;
    protected InventoryIssuanceService $issuanceService;
    protected InventoryBalanceService $balanceService;
    protected InventoryCostingService $costingService;
    protected InventoryDuplicateDetectionService $duplicateService;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'System Admin']);

        $this->adminUser = User::factory()->create(['is_active' => true]);
        $this->adminUser->assignRole('System Admin');

        $this->supplierA = Supplier::create([
            'name' => 'Crown Paper Supplies Corp.',
            'tin' => '111-222-333-000',
            'address' => 'Naga City, Camarines Sur',
            'reg_number' => 'REG-001',
            'category' => 'Office Supplies',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $this->supplierB = Supplier::create([
            'name' => 'Bicol School & Office Depot',
            'tin' => '444-555-666-000',
            'address' => 'Daet, Camarines Norte',
            'reg_number' => 'REG-002',
            'category' => 'Office Supplies',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $this->receivingService = app(InventoryReceivingService::class);
        $this->issuanceService = app(InventoryIssuanceService::class);
        $this->balanceService = app(InventoryBalanceService::class);
        $this->costingService = app(InventoryCostingService::class);
        $this->duplicateService = app(InventoryDuplicateDetectionService::class);
    }

    /**
     * Scenario 1: One Item Master with multiple receiving batches from different suppliers at different unit costs.
     */
    public function test_scenario_1_one_item_master_with_multiple_receiving_batches(): void
    {
        // Create Item Master identity
        $item = Item::create([
            'name' => 'Bond Paper A4 80 GSM',
            'sku' => 'PAP-A4-80G',
            'unit_of_issue' => 'Ream',
            'description' => 'Multi-purpose copy paper 80gsm A4 size',
            'stock' => 0,
            'unit_cost' => 0.00,
            'amount' => 0.00,
            'status' => 'Out of Stock',
            'created_by' => $this->adminUser->id,
        ]);

        // Batch 1: Supplier A, 50 reams @ 230.00
        $result1 = $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 50,
            'unit_cost' => 230.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Batch 2: Supplier B, 30 reams @ 245.00
        $result2 = $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierB->id,
            'quantity' => 30,
            'unit_cost' => 245.00,
            'date_received' => '2026-09-05',
        ], $this->adminUser->id);

        // Exactly 1 Item Master exists
        $this->assertEquals(1, Item::where('name', 'Bond Paper A4 80 GSM')->count());

        // 2 Batches exist for the same item master
        $this->assertCount(2, $item->batches);
        $this->assertEquals(50, $result1['batch']->quantity_received);
        $this->assertEquals(230.00, $result1['batch']->unit_cost);
        $this->assertEquals(30, $result2['batch']->quantity_received);
        $this->assertEquals(245.00, $result2['batch']->unit_cost);

        $item->refresh();
        $this->assertEquals(80, $item->stock);
    }

    /**
     * Scenario 2: Item master stock strictly equals the sum of its active batches' remaining stock.
     */
    public function test_scenario_2_item_master_stock_strictly_equals_sum_of_active_batches(): void
    {
        $item = Item::create([
            'name' => 'Ballpen Black 0.5mm',
            'sku' => 'PEN-BLK-05',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'status' => 'Out of Stock',
            'created_by' => $this->adminUser->id,
        ]);

        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 100,
            'unit_cost' => 12.50,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierB->id,
            'quantity' => 75,
            'unit_cost' => 13.00,
            'date_received' => '2026-09-02',
        ], $this->adminUser->id);

        $item->refresh();
        $sumOfBatches = (int) $item->activeBatches()->sum('quantity_remaining');
        $this->assertEquals($sumOfBatches, $item->stock);
        $this->assertEquals(175, $item->stock);
    }

    /**
     * Scenario 3: Total inventory value equals the sum of quantity_remaining * unit_cost across batches.
     */
    public function test_scenario_3_inventory_value_equals_sum_of_batch_values(): void
    {
        $item = Item::create([
            'name' => 'Permanent Marker Black',
            'sku' => 'MKR-BLK-PERM',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        // 40 units @ 45.00 = 1,800.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 40,
            'unit_cost' => 45.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // 20 units @ 50.00 = 1,000.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierB->id,
            'quantity' => 20,
            'unit_cost' => 50.00,
            'date_received' => '2026-09-03',
        ], $this->adminUser->id);

        $item->refresh();
        // 1,800 + 1,000 = 2,800.00
        $this->assertEquals(2800.00, $item->inventory_value);
        $this->assertEquals(2800.00, $item->amount);
    }

    /**
     * Scenario 4: Item master unit cost is no longer a single fixed source of truth for stock valuation.
     */
    public function test_scenario_4_valuation_driven_by_batches_not_single_unit_cost(): void
    {
        $item = Item::create([
            'name' => 'Stapler #35 Heavy Duty',
            'sku' => 'STP-35-HD',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'unit_cost' => 150.00, // Legacy fallback unit cost
            'created_by' => $this->adminUser->id,
        ]);

        // Batch 1: 10 @ 200.00 = 2000.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 10,
            'unit_cost' => 200.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Batch 2: 10 @ 250.00 = 2500.00
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierB->id,
            'quantity' => 10,
            'unit_cost' => 250.00,
            'date_received' => '2026-09-02',
        ], $this->adminUser->id);

        $item->refresh();
        // Total value must be 4,500.00, NOT stock (20) * 150.00 (3,000.00)
        $this->assertEquals(4500.00, $item->inventory_value);
        $this->assertNotEquals(20 * 150.00, $item->inventory_value);
    }

    /**
     * Scenario 5: Receiving an existing item via HTTP does NOT create a duplicate item row.
     */
    public function test_scenario_5_receiving_via_http_does_not_create_duplicate_item(): void
    {
        $item = Item::create([
            'name' => 'Folder Long White',
            'sku' => 'FLD-LNG-WHT',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        $initialItemCount = Item::count();

        // HTTP Receiving 1
        $this->actingAs($this->adminUser)->post(route('inventory.receiving.store'), [
            'item_id' => $item->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 50,
            'unit_cost' => 8.50,
            'date_received' => '2026-09-01',
        ]);

        // HTTP Receiving 2 with different supplier and cost
        $this->actingAs($this->adminUser)->post(route('inventory.receiving.store'), [
            'item_id' => $item->id,
            'supplier_id' => $this->supplierB->id,
            'quantity' => 30,
            'unit_cost' => 9.25,
            'date_received' => '2026-09-05',
        ]);

        $this->assertEquals($initialItemCount, Item::count());
        $item->refresh();
        $this->assertEquals(80, $item->stock);
        $this->assertEquals(2, $item->batches()->count());
    }

    /**
     * Scenario 6: Issuing stock consumes batches in strict FIFO order (oldest received batch first).
     */
    public function test_scenario_6_fifo_allocation_consumes_oldest_batch_first(): void
    {
        $item = Item::create([
            'name' => 'Correction Pen 7ml',
            'sku' => 'COR-PEN-7ML',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        // Batch 1 (Oldest): 50 units @ 30.00
        $res1 = $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 50,
            'unit_cost' => 30.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Batch 2 (Newer): 30 units @ 35.00
        $res2 = $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierB->id,
            'quantity' => 30,
            'unit_cost' => 35.00,
            'date_received' => '2026-09-05',
        ], $this->adminUser->id);

        // Issue 40 units
        $this->issuanceService->store([
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 40],
            ],
            'recipient' => 'Prof. Alan Turing',
            'department' => 'Computer Science',
            'date_issued' => '2026-09-06',
        ], $this->adminUser->id);

        $batch1 = $res1['batch']->fresh();
        $batch2 = $res2['batch']->fresh();

        // Batch 1 should have 50 - 40 = 10 remaining
        $this->assertEquals(10, $batch1->quantity_remaining);
        // Batch 2 should be untouched with 30 remaining
        $this->assertEquals(30, $batch2->quantity_remaining);

        $item->refresh();
        $this->assertEquals(40, $item->stock);
    }

    /**
     * Scenario 7: Issuing across multiple batches splits allocation correctly.
     */
    public function test_scenario_7_issuing_across_batches_splits_allocation(): void
    {
        $item = Item::create([
            'name' => 'Bond Paper Short 70 GSM',
            'sku' => 'PAP-SHT-70G',
            'unit_of_issue' => 'Ream',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        // Batch 1: 15 reams @ 200.00
        $res1 = $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 15,
            'unit_cost' => 200.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Batch 2: 25 reams @ 220.00
        $res2 = $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierB->id,
            'quantity' => 25,
            'unit_cost' => 220.00,
            'date_received' => '2026-09-05',
        ], $this->adminUser->id);

        // Issue 25 reams (15 from Batch 1, 10 from Batch 2)
        $issuance = $this->issuanceService->store([
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 25],
            ],
            'recipient' => 'Registrar Office',
            'department' => 'Administration',
            'date_issued' => '2026-09-06',
        ], $this->adminUser->id);

        $batch1 = $res1['batch']->fresh();
        $batch2 = $res2['batch']->fresh();

        $this->assertEquals(0, $batch1->quantity_remaining);
        $this->assertEquals(15, $batch2->quantity_remaining);

        $item->refresh();
        $this->assertEquals(15, $item->stock);

        // Assert allocation records
        $issuanceItem = $issuance->items()->first();
        $allocations = $issuanceItem->allocations;
        $this->assertCount(2, $allocations);

        $alloc1 = $allocations->where('inventory_batch_id', $batch1->id)->first();
        $alloc2 = $allocations->where('inventory_batch_id', $batch2->id)->first();

        $this->assertEquals(15, $alloc1->quantity);
        $this->assertEquals(200.00, $alloc1->unit_cost);
        $this->assertEquals(3000.00, $alloc1->amount);

        $this->assertEquals(10, $alloc2->quantity);
        $this->assertEquals(220.00, $alloc2->unit_cost);
        $this->assertEquals(2200.00, $alloc2->amount);
    }

    /**
     * Scenario 8: Issuance items preserve allocated cost and total amount.
     */
    public function test_scenario_8_issuance_item_preserves_historical_cost_and_amount(): void
    {
        $item = Item::create([
            'name' => 'Whiteboard Marker Blue',
            'sku' => 'WBM-BLU-001',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 10,
            'unit_cost' => 50.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierB->id,
            'quantity' => 10,
            'unit_cost' => 60.00,
            'date_received' => '2026-09-02',
        ], $this->adminUser->id);

        // Issue 15 units (10 @ 50 = 500, 5 @ 60 = 300; total = 800.00)
        $issuance = $this->issuanceService->store([
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 15],
            ],
            'recipient' => 'Dean Office',
            'department' => 'Education',
            'date_issued' => '2026-09-03',
        ], $this->adminUser->id);

        $issuanceItem = $issuance->items()->first();
        $this->assertEquals(800.00, $issuanceItem->amount);
        $this->assertEquals(53.33, $issuanceItem->unit_cost);
    }

    /**
     * Scenario 9: An item cannot be issued if requested quantity exceeds total active batch stock.
     */
    public function test_scenario_9_over_issuance_throws_validation_exception(): void
    {
        $item = Item::create([
            'name' => 'Scissors 8 inch',
            'sku' => 'SCI-08-INC',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 10,
            'unit_cost' => 75.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        $this->expectException(ValidationException::class);

        $this->issuanceService->store([
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 15], // Only 10 in stock
            ],
            'recipient' => 'Procurement Office',
            'date_issued' => '2026-09-02',
        ], $this->adminUser->id);
    }

    /**
     * Scenario 10: Canceling/voiding an issuance restores stock back to the original batches correctly.
     */
    public function test_scenario_10_voiding_issuance_restores_batch_stock(): void
    {
        $item = Item::create([
            'name' => 'Glue Stick 21g',
            'sku' => 'GLU-STK-21G',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        $res1 = $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 20,
            'unit_cost' => 25.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        $res2 = $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierB->id,
            'quantity' => 20,
            'unit_cost' => 30.00,
            'date_received' => '2026-09-02',
        ], $this->adminUser->id);

        // Issue 25 (20 from Batch 1, 5 from Batch 2)
        $issuance = $this->issuanceService->store([
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 25],
            ],
            'recipient' => 'Library',
            'date_issued' => '2026-09-03',
        ], $this->adminUser->id);

        $this->assertEquals(0, $res1['batch']->fresh()->quantity_remaining);
        $this->assertEquals(15, $res2['batch']->fresh()->quantity_remaining);
        $this->assertEquals(15, $item->fresh()->stock);

        // Destroy / void the issuance
        $this->issuanceService->destroy($issuance, $this->adminUser->id);

        // Batch 1 and Batch 2 must be restored
        $this->assertEquals(20, $res1['batch']->fresh()->quantity_remaining);
        $this->assertEquals(20, $res2['batch']->fresh()->quantity_remaining);
        $this->assertEquals(40, $item->fresh()->stock);
    }

    /**
     * Scenario 11: Updating a receiving record adjusts batch quantity and re-syncs item stock.
     */
    public function test_scenario_11_updating_receiving_adjusts_batch_and_item_stock(): void
    {
        $item = Item::create([
            'name' => 'Battery AA 2-pack',
            'sku' => 'BAT-AA-2PK',
            'unit_of_issue' => 'Pack',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        $result = $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 30,
            'unit_cost' => 80.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        $receiving = $result['receiving'];
        $batch = $result['batch'];

        // Increase received from 30 to 45 (+15)
        $this->receivingService->update($receiving, [
            'quantity' => 45,
            'unit_cost' => 80.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        $batch->refresh();
        $this->assertEquals(45, $batch->quantity_received);
        $this->assertEquals(45, $batch->quantity_remaining);

        $item->refresh();
        $this->assertEquals(45, $item->stock);
        $this->assertEquals(3600.00, $item->amount);
    }

    /**
     * Scenario 12: Attempting to reduce a receiving batch below already issued quantity is rejected.
     */
    public function test_scenario_12_cannot_reduce_receiving_below_issued_quantity(): void
    {
        $item = Item::create([
            'name' => 'Packaging Tape 2 inch',
            'sku' => 'TAP-PKG-2IN',
            'unit_of_issue' => 'Roll',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        $result = $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 50,
            'unit_cost' => 60.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Issue 35 rolls from this batch
        $this->issuanceService->store([
            'lines' => [
                ['item_id' => $item->id, 'quantity' => 35],
            ],
            'recipient' => 'Property Custodian',
            'date_issued' => '2026-09-02',
        ], $this->adminUser->id);

        // Attempt to update receiving to 30 (which is less than the 35 already issued)
        $this->expectException(ValidationException::class);

        $this->receivingService->update($result['receiving'], [
            'quantity' => 30,
            'unit_cost' => 60.00,
        ], $this->adminUser->id);
    }

    /**
     * Scenario 13: Duplicate item master creation attempt with matching canonical identity triggers warning/rejection.
     */
    public function test_scenario_13_duplicate_detection_warns_on_canonical_match(): void
    {
        Item::create([
            'name' => 'Bond Paper A4 80 GSM',
            'sku' => 'PAP-A4-80G',
            'unit_of_issue' => 'Ream',
            'description' => 'Multi-purpose copy paper 80gsm A4 size',
            'stock' => 10,
            'created_by' => $this->adminUser->id,
        ]);

        // Exact match with different casing & spacing
        $check1 = $this->duplicateService->checkDuplicate([
            'name' => '  bond paper a4 80 gsm  ',
            'unit_of_issue' => 'ream',
        ]);

        $this->assertTrue($check1['is_duplicate']);
        $this->assertEquals('exact_match', $check1['reason']);

        // Legitimate variant (70 GSM instead of 80 GSM) is NOT an exact duplicate
        $check2 = $this->duplicateService->checkDuplicate([
            'name' => 'Bond Paper A4 70 GSM',
            'unit_of_issue' => 'Ream',
        ]);

        $this->assertFalse($check2['is_duplicate']);
    }

    /**
     * Scenario 14: Supplier contract supplies value dynamically reflects current on-hand batches.
     */
    public function test_scenario_14_supplier_contract_supplies_value_reflects_active_batches(): void
    {
        $item1 = Item::create([
            'name' => 'Folder Short White',
            'sku' => 'FLD-SHT-WHT',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        $item2 = Item::create([
            'name' => 'Clip Binder 1 inch',
            'sku' => 'CLP-BND-1IN',
            'unit_of_issue' => 'Box',
            'stock' => 0,
            'created_by' => $this->adminUser->id,
        ]);

        // Supplier A delivers Item 1: 50 @ 10.00 = 500.00
        $this->receivingService->record([
            'item_id' => $item1->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 50,
            'unit_cost' => 10.00,
            'date_received' => '2026-09-01',
        ], $this->adminUser->id);

        // Supplier A delivers Item 2: 20 @ 30.00 = 600.00
        $this->receivingService->record([
            'item_id' => $item2->id,
            'supplier_id' => $this->supplierA->id,
            'quantity' => 20,
            'unit_cost' => 30.00,
            'date_received' => '2026-09-02',
        ], $this->adminUser->id);

        // Supplier B delivers Item 1: 30 @ 12.00 = 360.00
        $this->receivingService->record([
            'item_id' => $item1->id,
            'supplier_id' => $this->supplierB->id,
            'quantity' => 30,
            'unit_cost' => 12.00,
            'date_received' => '2026-09-03',
        ], $this->adminUser->id);

        // Total on-hand supplied by Supplier A: 500 + 600 = 1,100.00
        $this->assertEquals(1100.00, $this->supplierA->contract_supplies_value);

        // Total on-hand supplied by Supplier B: 360.00
        $this->assertEquals(360.00, $this->supplierB->contract_supplies_value);

        // Issue 30 units of Item 1 (FIFO will consume 30 from Supplier A's batch)
        $this->issuanceService->store([
            'lines' => [
                ['item_id' => $item1->id, 'quantity' => 30],
            ],
            'recipient' => 'Accounting Office',
            'date_issued' => '2026-09-04',
        ], $this->adminUser->id);

        // Now Supplier A's batch 1 has 20 remaining @ 10 = 200. Plus batch 2: 600. Total = 800.00
        $this->assertEquals(800.00, $this->supplierA->fresh()->contract_supplies_value);

        // Supplier B's batch 1 is untouched: 360.00
        $this->assertEquals(360.00, $this->supplierB->fresh()->contract_supplies_value);
    }
}
