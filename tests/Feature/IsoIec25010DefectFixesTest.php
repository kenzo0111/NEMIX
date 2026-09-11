<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Compliance\ComplianceReportDataService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\IssuanceItem;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class IsoIec25010DefectFixesTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $staffUser;
    protected Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'System Admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Supply Staff', 'guard_name' => 'web']);

        $this->adminUser = User::factory()->create([
            'name' => 'System Administrator',
            'email' => 'admin@ucn.edu.ph',
            'is_active' => true,
        ]);
        $this->adminUser->assignRole('System Admin');

        $this->staffUser = User::factory()->create([
            'name' => 'Supply Officer',
            'email' => 'staff@ucn.edu.ph',
            'is_active' => true,
        ]);
        $this->staffUser->assignRole('Supply Staff');

        $this->supplier = Supplier::create([
            'name' => 'National Supplies Depot',
            'tin' => '123-456-789-000',
            'address' => 'Daet, Camarines Norte',
            'reg_number' => 'REG-2026-SUP1',
            'category' => 'Office Supplies',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);
    }

    /**
     * TEST 1 — Supplier Deletion Protection
     * Create Supplier -> Receiving. Attempt hard delete.
     * Expected: Deletion blocked, Receiving remains.
     */
    public function test_supplier_deletion_is_blocked_when_referenced_by_receiving(): void
    {
        $item = Item::create([
            'name' => 'Ballpen Blue',
            'sku' => 'PEN-BLU-001',
            'supplier_id' => $this->supplier->id,
            'stock' => 50,
            'unit_cost' => 12.50,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $receiving = Receiving::create([
            'item_id' => $item->id,
            'supplier_id' => $this->supplier->id,
            'quantity' => 50,
            'date_received' => '2026-09-01',
            'created_by' => $this->adminUser->id,
        ]);

        // Attempting deletion via HTTP route
        $response = $this->actingAs($this->adminUser)->delete(route('suppliers.destroy', $this->supplier->id));
        $response->assertSessionHas('error');

        // Attempting direct hard delete on model should throw exception
        $exceptionThrown = false;
        try {
            $this->supplier->delete();
        } catch (\Throwable $e) {
            $exceptionThrown = true;
            $this->assertStringContainsString('referenced by existing inventory transactions', $e->getMessage());
        }

        $this->assertTrue($exceptionThrown);
        $this->assertDatabaseHas('suppliers', ['id' => $this->supplier->id]);
        $this->assertDatabaseHas('receivings', ['id' => $receiving->id]);
    }

    /**
     * TEST 2 — User Deletion Protection
     * Create User -> Issuance. Attempt hard delete.
     * Expected: Deletion blocked or archived, Issuance remains.
     */
    public function test_user_deletion_is_blocked_when_referenced_by_issuance(): void
    {
        $item = Item::create([
            'name' => 'Marker Black',
            'sku' => 'MRK-BLK-001',
            'supplier_id' => $this->supplier->id,
            'stock' => 30,
            'unit_cost' => 25.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $issuance = Issuance::create([
            'ris_number' => 'RIS-2026-09-0001',
            'item_id' => $item->id,
            'quantity' => 5,
            'recipient' => 'Prof. Santos',
            'department' => 'College of Science',
            'date_issued' => '2026-09-02',
            'status' => 'Issued',
            'issued_by' => $this->staffUser->id,
        ]);

        // Attempting self deletion via profile
        $response = $this->actingAs($this->staffUser)->delete('/profile', [
            'password' => 'password',
        ]);
        $response->assertSessionHas('error');

        // Attempting model delete
        $exceptionThrown = false;
        try {
            $this->staffUser->delete();
        } catch (\Throwable $e) {
            $exceptionThrown = true;
            $this->assertStringContainsString('referenced by existing inventory transactions', $e->getMessage());
        }

        $this->assertTrue($exceptionThrown);
        $this->assertDatabaseHas('users', ['id' => $this->staffUser->id]);
        $this->assertDatabaseHas('issuances', ['id' => $issuance->id]);
    }

    /**
     * TEST 3 — Multi-Item RSMI
     * Create one RIS containing Item A = 5, Item B = 10, Item C = 3.
     * Generate RSMI.
     * Expected: 3 separate line items, correct quantities, unit costs, and financial amounts.
     */
    public function test_multi_item_rsmi_generates_distinct_lines_and_correct_totals(): void
    {
        $itemA = Item::create([
            'name' => 'Ballpen 0.5 Black',
            'sku' => 'PEN-BLK-005',
            'supplier_id' => $this->supplier->id,
            'stock' => 100,
            'unit_cost' => 10.00,
            'unit_of_issue' => 'pc',
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $itemB = Item::create([
            'name' => 'Bond Paper A4 80gsm',
            'sku' => 'PAP-A4-80G',
            'supplier_id' => $this->supplier->id,
            'stock' => 50,
            'unit_cost' => 200.00,
            'unit_of_issue' => 'ream',
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $itemC = Item::create([
            'name' => 'Permanent Marker Blue',
            'sku' => 'MRK-BLU-002',
            'supplier_id' => $this->supplier->id,
            'stock' => 20,
            'unit_cost' => 35.00,
            'unit_of_issue' => 'pc',
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $issuance = Issuance::create([
            'ris_number' => 'RIS-2026-09-0099',
            'item_id' => $itemA->id,
            'quantity' => 18, // Total quantity sum
            'recipient' => 'Dr. Cruz',
            'department' => 'Dean Office',
            'date_issued' => '2026-09-05',
            'status' => 'Issued',
            'issued_by' => $this->adminUser->id,
        ]);

        IssuanceItem::create([
            'issuance_id' => $issuance->id,
            'item_id' => $itemA->id,
            'quantity' => 5,
            'unit_cost' => 10.00,
            'amount' => 50.00,
        ]);

        IssuanceItem::create([
            'issuance_id' => $issuance->id,
            'item_id' => $itemB->id,
            'quantity' => 10,
            'unit_cost' => 200.00,
            'amount' => 2000.00,
        ]);

        IssuanceItem::create([
            'issuance_id' => $issuance->id,
            'item_id' => $itemC->id,
            'quantity' => 3,
            'unit_cost' => 35.00,
            'amount' => 105.00,
        ]);

        $service = app(ComplianceReportDataService::class);
        $dataset = $service->getRsmiRecords(['periodType' => 'all']);

        $matchingRows = collect($dataset['issuedItems'])->where('risNo', 'RIS-2026-09-0099')->values();

        $this->assertCount(3, $matchingRows);

        $rowA = $matchingRows->firstWhere('stockNo', 'PEN-BLK-005');
        $this->assertNotNull($rowA);
        $this->assertEquals(5, $rowA['quantityIssued']);
        $this->assertEquals('₱10.00', $rowA['unitCost']);
        $this->assertEquals('₱50.00', $rowA['amount']);

        $rowB = $matchingRows->firstWhere('stockNo', 'PAP-A4-80G');
        $this->assertNotNull($rowB);
        $this->assertEquals(10, $rowB['quantityIssued']);
        $this->assertEquals('₱200.00', $rowB['unitCost']);
        $this->assertEquals('₱2,000.00', $rowB['amount']);

        $rowC = $matchingRows->firstWhere('stockNo', 'MRK-BLU-002');
        $this->assertNotNull($rowC);
        $this->assertEquals(3, $rowC['quantityIssued']);
        $this->assertEquals('₱35.00', $rowC['unitCost']);
        $this->assertEquals('₱105.00', $rowC['amount']);

        $recapTotal = collect($dataset['recapitulation'])->sum('rawTotalCost');
        $this->assertEquals(2155.00, $recapTotal);
    }

    /**
     * TEST 4 — Secondary Item Stock Card
     * Create RIS with Item A and Item B.
     * Generate Stock Card for Item B.
     * Expected: Item B issuance appears with accurate running balance.
     */
    public function test_stock_card_inspects_secondary_issuance_items_and_running_balance(): void
    {
        $itemA = Item::create([
            'name' => 'Staple Wire #35',
            'sku' => 'STP-WIR-035',
            'supplier_id' => $this->supplier->id,
            'stock' => 50,
            'unit_cost' => 40.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $itemB = Item::create([
            'name' => 'Correction Tape 5mm',
            'sku' => 'COR-TAP-005',
            'supplier_id' => $this->supplier->id,
            'stock' => 42,
            'unit_cost' => 30.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        // Receiving for Item B: 50 received
        Receiving::create([
            'item_id' => $itemB->id,
            'supplier_id' => $this->supplier->id,
            'quantity' => 50,
            'date_received' => '2026-09-01',
            'created_by' => $this->adminUser->id,
        ]);

        // RIS has Item A as primary, Item B as secondary line item
        $issuance = Issuance::create([
            'ris_number' => 'RIS-2026-09-0105',
            'item_id' => $itemA->id,
            'quantity' => 18,
            'recipient' => 'Registrar Office',
            'department' => 'Registrar',
            'date_issued' => '2026-09-03',
            'status' => 'Issued',
            'issued_by' => $this->adminUser->id,
        ]);

        IssuanceItem::create([
            'issuance_id' => $issuance->id,
            'item_id' => $itemA->id,
            'quantity' => 10,
            'unit_cost' => 40.00,
            'amount' => 400.00,
        ]);

        IssuanceItem::create([
            'issuance_id' => $issuance->id,
            'item_id' => $itemB->id,
            'quantity' => 8,
            'unit_cost' => 30.00,
            'amount' => 240.00,
        ]);

        $service = app(ComplianceReportDataService::class);
        $stockCard = $service->getStockCardRecords([
            'itemName' => 'Correction Tape 5mm',
            'periodType' => 'all',
        ]);

        $entries = collect($stockCard['entries']);
        $secondaryIssuanceEntry = $entries->firstWhere('reference', 'RIS-2026-09-0105');

        $this->assertNotNull($secondaryIssuanceEntry, 'Item B secondary issuance must appear on Item B Stock Card');
        $this->assertEquals(8, $secondaryIssuanceEntry['issue_qty']);
        $this->assertEquals('Registrar', $secondaryIssuanceEntry['issue_office']);
        $this->assertEquals(42, $stockCard['summary']['currentBalance']);
    }

    /**
     * TEST 5 — MOR Multi-Item
     * Create several RIS records for one end user.
     * Expected: MOR contains all applicable issuance line items belonging only to that end user.
     */
    public function test_memorandum_receipt_includes_all_lines_for_end_user_only(): void
    {
        $item1 = Item::create([
            'name' => 'Scientific Calculator 570ES',
            'sku' => 'CALC-570ES',
            'supplier_id' => $this->supplier->id,
            'stock' => 10,
            'unit_cost' => 950.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $item2 = Item::create([
            'name' => 'Desk Lamp LED',
            'sku' => 'LMP-DSK-01',
            'supplier_id' => $this->supplier->id,
            'stock' => 8,
            'unit_cost' => 1200.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $itemOther = Item::create([
            'name' => 'Executive Chair',
            'sku' => 'CHR-EXEC-01',
            'supplier_id' => $this->supplier->id,
            'stock' => 5,
            'unit_cost' => 4500.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        // Issuance for Prof. Reyes with 2 items
        $issuanceReyes = Issuance::create([
            'ris_number' => 'RIS-2026-09-0201',
            'item_id' => $item1->id,
            'quantity' => 3,
            'recipient' => 'Prof. Reyes',
            'department' => 'Math Department',
            'date_issued' => '2026-09-04',
            'status' => 'Issued',
            'issued_by' => $this->adminUser->id,
        ]);

        IssuanceItem::create([
            'issuance_id' => $issuanceReyes->id,
            'item_id' => $item1->id,
            'quantity' => 2,
            'unit_cost' => 950.00,
            'amount' => 1900.00,
        ]);

        IssuanceItem::create([
            'issuance_id' => $issuanceReyes->id,
            'item_id' => $item2->id,
            'quantity' => 1,
            'unit_cost' => 1200.00,
            'amount' => 1200.00,
        ]);

        // Issuance for someone else (Prof. Gomez)
        $issuanceGomez = Issuance::create([
            'ris_number' => 'RIS-2026-09-0202',
            'item_id' => $itemOther->id,
            'quantity' => 1,
            'recipient' => 'Prof. Gomez',
            'department' => 'Arts Department',
            'date_issued' => '2026-09-04',
            'status' => 'Issued',
            'issued_by' => $this->adminUser->id,
        ]);

        IssuanceItem::create([
            'issuance_id' => $issuanceGomez->id,
            'item_id' => $itemOther->id,
            'quantity' => 1,
            'unit_cost' => 4500.00,
            'amount' => 4500.00,
        ]);

        $service = app(ComplianceReportDataService::class);
        $mor = $service->getMemorandumReceiptRecords([
            'endUser' => 'Prof. Reyes',
            'periodType' => 'all',
        ]);

        $items = collect($mor['items']);
        $this->assertCount(2, $items);
        $this->assertNotNull($items->firstWhere('description', 'Scientific Calculator 570ES'));
        $this->assertNotNull($items->firstWhere('description', 'Desk Lamp LED'));
        $this->assertNull($items->firstWhere('description', 'Executive Chair'), 'Items belonging to another end user must be excluded');
        $this->assertEquals(3100.00, $mor['grandTotal']);
    }

    /**
     * TEST 6 — RFID Unauthorized Request
     * Without credentials: GET /rfid-scanner/lookup/TAG001. Expected: 401.
     */
    public function test_rfid_unauthorized_request_returns_401(): void
    {
        $response = $this->getJson('/rfid-scanner/lookup/TAG001');
        $response->assertStatus(401);

        $responseLive = $this->getJson('/rfid-scanner/live-feed');
        $responseLive->assertStatus(401);

        $responseStatus = $this->getJson('/rfid-scanner/status');
        $responseStatus->assertStatus(401);
    }

    /**
     * TEST 7 — RFID Authorized Request
     * With correct token: Expected: 200.
     */
    public function test_rfid_authorized_request_with_bearer_token_returns_200(): void
    {
        $item = Item::create([
            'name' => 'RFID Tagged Laptop',
            'sku' => 'LAP-TAG-001',
            'supplier_id' => $this->supplier->id,
            'stock' => 1,
            'unit_cost' => 38000.00,
            'rfid_tag' => 'TAG-HARDWARE-001',
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $validToken = config('services.rfid.device_token');

        // Without auth header
        $this->getJson('/rfid-scanner/lookup/TAG-HARDWARE-001')->assertStatus(401);

        // With invalid token
        $this->withHeaders(['Authorization' => 'Bearer invalid-secret-token'])
            ->getJson('/rfid-scanner/lookup/TAG-HARDWARE-001')
            ->assertStatus(401);

        // With valid token
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $validToken])
            ->getJson('/rfid-scanner/lookup/TAG-HARDWARE-001');

        $response->assertOk();
        $response->assertJson([
            'found' => true,
            'item' => [
                'id' => $item->id,
                'name' => 'RFID Tagged Laptop',
                'sku' => 'LAP-TAG-001',
                'rfid_tag' => 'TAG-HARDWARE-001',
                'stock' => 1,
            ],
        ]);
        $this->assertArrayNotHasKey('created_by', $response->json('item'));
        $this->assertArrayNotHasKey('supplier_id', $response->json('item'));
    }

    /**
     * TEST 8 — Staff Directory Authorization
     * Regular Supply Staff: GET /access-control/manage-staffs -> 403.
     * System Administrator -> 200.
     */
    public function test_staff_directory_authorization_enforcement(): void
    {
        $responseStaff = $this->actingAs($this->staffUser)->get('/access-control/manage-staffs');
        $responseStaff->assertStatus(403);

        $responseAdmin = $this->actingAs($this->adminUser)->get('/access-control/manage-staffs');
        $responseAdmin->assertOk();
    }

    /**
     * TEST 9 — Active RFID Duplicate
     * Item A uses: TAG001. Assign TAG001 to Item B -> Expected: Rejected.
     */
    public function test_assigning_duplicate_rfid_tag_to_active_item_is_rejected(): void
    {
        $itemA = Item::create([
            'name' => 'Active Item A',
            'sku' => 'ACT-ITM-001',
            'supplier_id' => $this->supplier->id,
            'stock' => 10,
            'rfid_tag' => 'TAG-ACTIVE-001',
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $itemB = Item::create([
            'name' => 'Active Item B',
            'sku' => 'ACT-ITM-002',
            'supplier_id' => $this->supplier->id,
            'stock' => 5,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)->post(route('rfid-scanner.assign'), [
            'item_id' => $itemB->id,
            'rfid_tag' => 'TAG-ACTIVE-001',
        ]);

        $response->assertSessionHasErrors('rfid_tag');
        $itemB->refresh();
        $this->assertNull($itemB->rfid_tag);
    }

    /**
     * TEST 10 — Retired RFID Reuse
     * Item A: TAG001. Soft-delete Item A. Assign TAG001 to Item B.
     * Expected: Controlled reassignment succeeds, Old item tag cleared, New item receives TAG001, Audit log created.
     */
    public function test_retired_rfid_tag_can_be_reassigned_with_audit_trail(): void
    {
        $itemA = Item::create([
            'name' => 'Retired Item A',
            'sku' => 'RET-ITM-001',
            'supplier_id' => $this->supplier->id,
            'stock' => 0,
            'rfid_tag' => 'TAG-REUSE-999',
            'status' => 'Out of Stock',
            'created_by' => $this->adminUser->id,
        ]);

        // Item A is soft deleted / retired
        $itemA->delete();
        $this->assertSoftDeleted('items', ['id' => $itemA->id]);

        $itemB = Item::create([
            'name' => 'New Item B',
            'sku' => 'NEW-ITM-002',
            'supplier_id' => $this->supplier->id,
            'stock' => 15,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)->post(route('rfid-scanner.assign'), [
            'item_id' => $itemB->id,
            'rfid_tag' => 'TAG-REUSE-999',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $itemA->refresh();
        $itemB->refresh();

        $this->assertNull($itemA->rfid_tag, 'Retired item RFID tag must be cleared');
        $this->assertEquals('TAG-REUSE-999', $itemB->rfid_tag, 'New item must receive reassigned RFID tag');

        $audit = TransactionTrail::where('module', 'RFID Scanner')
            ->where('action', 'reassign')
            ->where('resource_ref', 'NEW-ITM-002')
            ->first();

        $this->assertNotNull($audit, 'Reassignment audit trail entry must be recorded');
        $this->assertStringContainsString('TAG-REUSE-999', $audit->details);
        $this->assertStringContainsString('Retired Item A', $audit->details);
    }

    /**
     * TEST 11 — Concurrent Issuance Update
     * Update issuance quantities affecting low-stock items with row locking.
     * Expected: Consistent stock, No negative stock, No parent-child divergence.
     */
    public function test_issuance_update_maintains_consistent_stock_and_synchronizes_children(): void
    {
        $item1 = Item::create([
            'name' => 'Ballpen Red',
            'sku' => 'PEN-RED-001',
            'supplier_id' => $this->supplier->id,
            'stock' => 20,
            'unit_cost' => 10.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $item2 = Item::create([
            'name' => 'Folder Long',
            'sku' => 'FLD-LNG-001',
            'supplier_id' => $this->supplier->id,
            'stock' => 15,
            'unit_cost' => 8.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        // Original issuance: Ballpen Red = 5 (Stock 20 - 5 = 15)
        $issuance = Issuance::create([
            'ris_number' => 'RIS-2026-09-0301',
            'item_id' => $item1->id,
            'quantity' => 5,
            'recipient' => 'Finance Dept',
            'date_issued' => '2026-09-05',
            'status' => 'Issued',
            'issued_by' => $this->adminUser->id,
        ]);

        IssuanceItem::create([
            'issuance_id' => $issuance->id,
            'item_id' => $item1->id,
            'quantity' => 5,
            'unit_cost' => 10.00,
            'amount' => 50.00,
        ]);
        $item1->update(['stock' => 15]);

        // Update issuance: Ballpen Red = 3 (returns 5, deducts 3 -> stock should be 17), Folder Long = 5 (deducts 5 -> stock should be 10)
        $response = $this->actingAs($this->adminUser)->put(route('inventory.issuance.update', $issuance->id), [
            'issuances' => [
                ['item_id' => $item1->id, 'quantity' => 3],
                ['item_id' => $item2->id, 'quantity' => 5],
            ],
            'recipient' => 'Finance Dept',
            'date_issued' => '2026-09-05',
            'status' => 'Issued',
        ]);

        $response->assertSessionHasNoErrors();

        $item1->refresh();
        $item2->refresh();
        $issuance->refresh();

        $this->assertEquals(17, $item1->stock);
        $this->assertEquals(10, $item2->stock);
        $this->assertEquals(8, $issuance->quantity, 'Parent quantity must match sum of child items');
        $this->assertEquals(8, $issuance->items()->sum('quantity'), 'Child items sum must match parent');
    }

    /**
     * TEST 12 — Transaction Rollback
     * Force an exception after one item deduction during multi-item issuance update.
     * Expected: All stock values restored, No partial issuance_items update, No partial parent update.
     */
    public function test_issuance_update_rolls_back_completely_when_stock_is_insufficient(): void
    {
        $item1 = Item::create([
            'name' => 'Flash Drive 32GB',
            'sku' => 'USB-32GB-01',
            'supplier_id' => $this->supplier->id,
            'stock' => 10,
            'unit_cost' => 350.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $item2 = Item::create([
            'name' => 'Highlighter Yellow',
            'sku' => 'HLT-YEL-01',
            'supplier_id' => $this->supplier->id,
            'stock' => 2, // Low stock: only 2 available
            'unit_cost' => 45.00,
            'status' => 'Low Stock',
            'created_by' => $this->adminUser->id,
        ]);

        $issuance = Issuance::create([
            'ris_number' => 'RIS-2026-09-0401',
            'item_id' => $item1->id,
            'quantity' => 2,
            'recipient' => 'Auditing Unit',
            'date_issued' => '2026-09-06',
            'status' => 'Issued',
            'issued_by' => $this->adminUser->id,
        ]);

        IssuanceItem::create([
            'issuance_id' => $issuance->id,
            'item_id' => $item1->id,
            'quantity' => 2,
            'unit_cost' => 350.00,
            'amount' => 700.00,
        ]);
        $item1->update(['stock' => 8]); // 10 - 2

        // Attempt update requesting 4 of Flash Drive and 5 of Highlighter (Highlighter only has 2!)
        $response = $this->actingAs($this->adminUser)->put(route('inventory.issuance.update', $issuance->id), [
            'issuances' => [
                ['item_id' => $item1->id, 'quantity' => 4],
                ['item_id' => $item2->id, 'quantity' => 5], // Exceeds available 2!
            ],
            'recipient' => 'Auditing Unit',
            'date_issued' => '2026-09-06',
            'status' => 'Issued',
        ]);

        $response->assertSessionHasErrors();

        $item1->refresh();
        $item2->refresh();
        $issuance->refresh();

        // Verify total rollback: stock unchanged, issuance unchanged
        $this->assertEquals(8, $item1->stock, 'Item 1 stock must be completely restored upon rollback');
        $this->assertEquals(2, $item2->stock, 'Item 2 stock must remain untouched');
        $this->assertEquals(2, $issuance->quantity, 'Issuance quantity must not change');
        $this->assertEquals(1, $issuance->items()->count(), 'Issuance items count must remain 1');
        $this->assertEquals(2, $issuance->items()->first()->quantity);
    }

    /**
     * TEST 13 — Item Permanent Deletion Protection (GAP-001)
     * Create Item A -> Receiving & Issuance referencing Item A.
     * Soft delete allowed (archived). Force delete blocked.
     * Transaction history preserved. Raw SQL delete blocked by database constraint.
     */
    public function test_item_permanent_deletion_is_blocked_when_referenced_by_transactions(): void
    {
        $item = Item::create([
            'name' => 'Item A Testing Consumable',
            'sku' => 'ITM-A-GAP001',
            'supplier_id' => $this->supplier->id,
            'stock' => 50,
            'unit_cost' => 100.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $receiving = Receiving::create([
            'item_id' => $item->id,
            'supplier_id' => $this->supplier->id,
            'quantity' => 50,
            'date_received' => '2026-09-01',
            'created_by' => $this->adminUser->id,
        ]);

        $issuance = Issuance::create([
            'ris_number' => 'RIS-2026-09-GAP01',
            'item_id' => $item->id,
            'quantity' => 10,
            'recipient' => 'Records Section',
            'date_issued' => '2026-09-02',
            'status' => 'Issued',
            'issued_by' => $this->adminUser->id,
        ]);

        $issuanceItem = IssuanceItem::create([
            'issuance_id' => $issuance->id,
            'item_id' => $item->id,
            'quantity' => 10,
            'unit_cost' => 100.00,
            'amount' => 1000.00,
        ]);

        // 1. Normal soft deletion: allowed for archiving
        $item->delete();
        $this->assertSoftDeleted('items', ['id' => $item->id]);

        // Historical transactions must remain intact
        $this->assertDatabaseHas('receivings', ['id' => $receiving->id]);
        $this->assertDatabaseHas('issuances', ['id' => $issuance->id]);
        $this->assertDatabaseHas('issuance_items', ['id' => $issuanceItem->id]);

        // 2. Permanent forceDelete: must be blocked because transaction history exists
        $forceDeleteBlocked = false;
        try {
            $item->forceDelete();
        } catch (\Throwable $e) {
            $forceDeleteBlocked = true;
            $this->assertStringContainsString('cannot be permanently deleted because it is referenced by existing inventory transactions', $e->getMessage());
        }

        $this->assertTrue($forceDeleteBlocked, 'Permanent forceDelete must be blocked by model protection when referenced by transactions');
        $this->assertSoftDeleted('items', ['id' => $item->id]);
        $this->assertDatabaseHas('receivings', ['id' => $receiving->id]);
        $this->assertDatabaseHas('issuances', ['id' => $issuance->id]);
        $this->assertDatabaseHas('issuance_items', ['id' => $issuanceItem->id]);

        // 3. Raw database constraint level protection
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }

        $rawSqlDeleteBlocked = false;
        try {
            DB::delete('DELETE FROM items WHERE id = ?', [$item->id]);
        } catch (\Throwable $e) {
            $rawSqlDeleteBlocked = true;
        }

        $this->assertTrue($rawSqlDeleteBlocked, 'Raw database DELETE statement must be rejected by foreign key constraint');
        $this->assertDatabaseHas('receivings', ['id' => $receiving->id]);
        $this->assertDatabaseHas('issuances', ['id' => $issuance->id]);
        $this->assertDatabaseHas('issuance_items', ['id' => $issuanceItem->id]);
    }
}

