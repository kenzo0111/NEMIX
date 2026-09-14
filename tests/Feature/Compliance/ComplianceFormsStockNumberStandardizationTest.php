<?php

namespace Tests\Feature\Compliance;

use App\Models\ComplianceReport;
use App\Models\User;
use App\Services\Compliance\ComplianceReportDataService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\IssuanceBatchAllocation;
use Modules\Inventory\Models\IssuanceItem;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Inventory\Services\InventoryIssuanceService;
use Modules\Inventory\Services\InventoryReceivingService;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ComplianceFormsStockNumberStandardizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Supplier $supplier;
    protected ComplianceReportDataService $dataService;
    protected InventoryReceivingService $receivingService;
    protected InventoryIssuanceService $issuanceService;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'System Admin']);
        $this->user = User::factory()->create(['is_active' => true]);
        $this->user->assignRole('System Admin');
        $this->actingAs($this->user);

        $this->supplier = Supplier::create([
            'name' => 'Crown Paper Supplies Corp.',
            'tin' => '111-222-333-000',
            'reg_number' => 'REG-001',
            'category' => 'Office Supplies',
            'address' => 'Naga City',
            'status' => 'active',
            'created_by' => $this->user->id,
        ]);

        $this->dataService = app(ComplianceReportDataService::class);
        $this->receivingService = app(InventoryReceivingService::class);
        $this->issuanceService = app(InventoryIssuanceService::class);
    }

    /**
     * Requirement: RPCI, RSMI, Stock Card, and MOR all display Supplier Stock No.
     * and NOT internal Item No. (SKU).
     */
    public function test_all_compliance_forms_consistently_display_supplier_stock_number(): void
    {
        // Given Item:
        // Internal Item No: ITEM-BOND-0001
        // Supplier Stock No: COS-26-09-001-0001
        $item = Item::create([
            'name' => 'A4 Bond Paper 80 GSM',
            'sku' => 'ITEM-BOND-0001',
            'unit_of_issue' => 'Ream',
            'stock' => 0,
            'unit_cost' => 0.00,
            'created_by' => $this->user->id,
        ]);

        // Receive 100 units with Supplier Stock No COS-26-09-001-0001
        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplier->id,
            'supplier_stock_no' => 'COS-26-09-001-0001',
            'quantity' => 100,
            'unit_cost' => 250.00,
            'date_received' => '2026-09-01',
        ], $this->user->id);

        // Issue 20 units to SDO
        $issuance = $this->issuanceService->issue([
            'date_issued' => '2026-09-05',
            'recipient' => 'Juan Dela Cruz',
            'recipient_designation' => 'Administrative Officer',
            'department' => 'Sports and Development Office (SDO)',
            'fund_cluster' => '01 - Regular Agency Fund',
            'purpose' => 'For sports meet preparation',
        ], [
            ['item_id' => $item->id, 'quantity' => 20],
        ], $this->user->id);

        // 1. Verify RPCI
        $rpciDataset = $this->dataService->getRpciRecords(['supplier_id' => $this->supplier->id]);
        $rpciItem = collect($rpciDataset['items'])->firstWhere('article', 'A4 Bond Paper 80 GSM');
        $this->assertNotNull($rpciItem);
        $this->assertEquals('COS-26-09-001-0001', $rpciItem['stock_no']);
        $this->assertEquals('COS-26-09-001-0001', $rpciItem['supplier_stock_no']);
        $this->assertEquals('ITEM-BOND-0001', $rpciItem['item_no']);
        $this->assertNotEquals('ITEM-BOND-0001', $rpciItem['stock_no']);

        // 2. Verify RSMI
        $rsmiDataset = $this->dataService->getRsmiRecords(['periodType' => 'all']);
        $rsmiItem = collect($rsmiDataset['issuedItems'])->firstWhere('itemDescription', 'A4 Bond Paper 80 GSM');
        $this->assertNotNull($rsmiItem);
        $this->assertEquals('COS-26-09-001-0001', $rsmiItem['stockNo']);
        $this->assertEquals('COS-26-09-001-0001', $rsmiItem['stock_no']);
        $this->assertEquals('COS-26-09-001-0001', $rsmiItem['supplier_stock_no']);
        $this->assertEquals('ITEM-BOND-0001', $rsmiItem['item_no']);
        $this->assertNotEquals('ITEM-BOND-0001', $rsmiItem['stockNo']);

        // RSMI Recapitulation must also display Supplier Stock No.
        $recapItem = collect($rsmiDataset['recapitulationItems'])->firstWhere('stockNo', 'COS-26-09-001-0001');
        $this->assertNotNull($recapItem);
        $this->assertEquals('COS-26-09-001-0001', $recapItem['stockNo']);
        $this->assertEquals(20, $recapItem['quantity']);

        // 3. Verify Stock Card
        $stockCardDataset = $this->dataService->getStockCardRecords([
            'itemName' => 'A4 Bond Paper 80 GSM',
            'periodType' => 'all',
        ]);
        $this->assertEquals('COS-26-09-001-0001', $stockCardDataset['stock_no']);
        $this->assertEquals('COS-26-09-001-0001', $stockCardDataset['supplier_stock_no']);
        $this->assertEquals('ITEM-BOND-0001', $stockCardDataset['item_no']);
        $this->assertNotEquals('ITEM-BOND-0001', $stockCardDataset['stock_no']);

        // 4. Verify MOR / Memorandum Receipt
        $morDataset = $this->dataService->getMemorandumReceiptRecords([
            'endUser' => 'Juan Dela Cruz',
            'periodType' => 'all',
        ]);
        $morItem = collect($morDataset['items'])->firstWhere('description', 'A4 Bond Paper 80 GSM');
        $this->assertNotNull($morItem);
        $this->assertEquals('COS-26-09-001-0001', $morItem['propertyNo']);
        $this->assertEquals('COS-26-09-001-0001', $morItem['stock_no']);
        $this->assertEquals('COS-26-09-001-0001', $morItem['supplier_stock_no']);
        $this->assertEquals('ITEM-BOND-0001', $morItem['item_no']);
        $this->assertNotEquals('ITEM-BOND-0001', $morItem['propertyNo']);
    }

    /**
     * Requirement: Missing Supplier Stock No. must display '-' and NEVER fall back
     * to internal item_no / SKU.
     */
    public function test_missing_supplier_stock_no_falls_back_to_dash_not_internal_item_no(): void
    {
        $item = Item::create([
            'name' => 'Blue Ballpoint Pen 0.5mm',
            'sku' => 'ITEM-PRIN-0011',
            'unit_of_issue' => 'Piece',
            'stock' => 50,
            'unit_cost' => 12.00,
            'created_by' => $this->user->id,
        ]);

        // Unbatched item with no batches and no supplier_stock_no
        // 1. RPCI
        $rpciDataset = $this->dataService->getRpciRecords(['supplier_id' => null]);
        $rpciItem = collect($rpciDataset['items'])->firstWhere('article', 'Blue Ballpoint Pen 0.5mm');
        $this->assertNotNull($rpciItem);
        $this->assertEquals('-', $rpciItem['stock_no']);
        $this->assertNull($rpciItem['supplier_stock_no']);
        $this->assertNotEquals('ITEM-PRIN-0011', $rpciItem['stock_no']);

        // 2. Stock Card
        $stockCardDataset = $this->dataService->getStockCardRecords([
            'itemName' => 'Blue Ballpoint Pen 0.5mm',
        ]);
        $this->assertEquals('-', $stockCardDataset['stock_no']);
        $this->assertNull($stockCardDataset['supplier_stock_no']);
        $this->assertNotEquals('ITEM-PRIN-0011', $stockCardDataset['stock_no']);
    }

    /**
     * Requirement: MOR preserves physical asset serial number when present.
     */
    public function test_mor_preserves_actual_serial_number_when_available(): void
    {
        \App\Models\Compliance\MemorandumReceiptMigratedRecord::create([
            'date_received' => '2026-09-06',
            'received_by' => 'Maria Santos',
            'received_for' => 'Dean',
            'received_from' => 'Supply Office',
            'memorial_no' => 'MR-2026-001',
            'remarks' => 'Laser Printer Pro M404n',
            'raw_data' => [
                'serial_no' => 'SN-HPLJ-2026-0088',
                'item_name' => 'Laser Printer Pro M404n',
                'supplier_stock_no' => 'COS-26-09-099-0001',
                'stock_no' => 'COS-26-09-099-0001',
                'unit_cost' => 15000.00,
                'quantity' => 1,
            ],
        ]);

        $morDataset = $this->dataService->getMemorandumReceiptRecords([
            'endUser' => 'Maria Santos',
        ]);
        $morItem = collect($morDataset['items'])->firstWhere('description', 'Laser Printer Pro M404n');
        $this->assertNotNull($morItem);
        // Physical serial number must be preserved
        $this->assertEquals('SN-HPLJ-2026-0088', $morItem['propertyNo']);
        // Supplier Stock No must still be tracked
        $this->assertEquals('COS-26-09-099-0001', $morItem['supplier_stock_no']);
    }

    /**
     * Requirement: Saved report snapshots preserve Supplier Stock No immutably.
     */
    public function test_saved_report_preserves_supplier_stock_number_in_snapshot(): void
    {
        $item = Item::create([
            'name' => 'Filing Folder Long',
            'sku' => 'ITEM-FOLD-0017',
            'unit_of_issue' => 'Piece',
            'stock' => 0,
            'created_by' => $this->user->id,
        ]);

        $this->receivingService->record([
            'item_id' => $item->id,
            'supplier_id' => $this->supplier->id,
            'supplier_stock_no' => 'COS-26-09-004-0001',
            'quantity' => 200,
            'unit_cost' => 15.00,
            'date_received' => '2026-09-03',
        ], $this->user->id);

        // Fetch dataset via preview API
        $response = $this->postJson(route('compliance.reports.preview_dataset'), [
            'type' => 'STOCK_CARD',
            'itemName' => 'Filing Folder Long',
            'periodType' => 'all',
        ]);

        $response->assertOk();
        $previewData = $response->json();
        $this->assertEquals('COS-26-09-004-0001', $previewData['stockCard']['stock_no']);
        $this->assertEquals('COS-26-09-004-0001', $previewData['stockCard']['supplier_stock_no']);
        $this->assertEquals('ITEM-FOLD-0017', $previewData['stockCard']['item_no']);

        // Save report
        $saveResponse = $this->post(route('compliance.reports.store'), [
            'title' => 'Stock Card - Filing Folder Long',
            'type' => 'STOCK_CARD',
            'itemName' => 'Filing Folder Long',
            'periodType' => 'all',
            'snapshot' => $previewData,
            'payload' => array_merge($previewData, [
                'stock_no' => 'COS-26-09-004-0001',
                'supplier_stock_no' => 'COS-26-09-004-0001',
                'item_no' => 'ITEM-FOLD-0017',
            ]),
        ]);

        $saveResponse->assertRedirect();
        $report = ComplianceReport::where('type', 'STOCK_CARD')->latest()->first();
        $this->assertNotNull($report);
        $this->assertEquals('COS-26-09-004-0001', data_get($report->payload, 'stockCard.stock_no'));
        $this->assertEquals('COS-26-09-004-0001', data_get($report->payload, 'stockCard.supplier_stock_no'));
        $this->assertEquals('ITEM-FOLD-0017', data_get($report->payload, 'stockCard.item_no'));
    }
}
