<?php

namespace Tests\Feature;

use App\Models\Compliance\MemorandumReceiptMigratedRecord;
use App\Models\Compliance\RpcIMigratedRecord;
use App\Models\Compliance\RsmiMigratedRecord;
use App\Models\Compliance\StockCardMigratedRecord;
use App\Models\ComplianceReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComplianceReportSnapshotPersistenceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();
    }

    public function test_rsmi_report_persists_populated_snapshot_and_preserves_historical_data(): void
    {
        $user = User::factory()->create();

        // 1. Seed migrated RSMI records
        $record = RsmiMigratedRecord::create([
            'ris_no' => 'RIS-2026-001',
            'date' => '2026-08-15',
            'item' => 'Heavy Duty Stapler',
            'stock_no' => 'STAP-01',
            'unit' => 'pc',
            'quantity_issued' => 5,
            'unit_cost' => 350.00,
            'amount' => 1750.00,
            'center_code' => 'COE-01',
            'entity_name' => 'University of Camarines Norte',
            'fund_cluster' => '01 - Regular Agency Fund',
        ]);

        // 2. Request preview dataset
        $previewResponse = $this->actingAs($user)->post(route('compliance.reports.preview_dataset'), [
            'type' => 'RSMI',
            'title' => 'RSMI - Supplies and Materials Issued',
            'periodType' => 'all',
            'generatedDate' => '2026-08-20',
        ]);

        $previewResponse->assertOk();
        $dataset = $previewResponse->json();

        $this->assertNotEmpty($dataset['rsmi']['issuedItems']);
        $this->assertSame('Heavy Duty Stapler', $dataset['rsmi']['issuedItems'][0]['itemDescription']);
        $this->assertSame(5, $dataset['rsmi']['issuedItems'][0]['quantityIssued']);

        // 3. Save report with snapshot
        $saveResponse = $this->actingAs($user)->post(route('compliance.reports.store'), [
            'title' => 'RSMI - August 2026',
            'type' => 'RSMI',
            'reference' => '2026-08-20-0001',
            'periodType' => 'all',
            'generatedDate' => '2026-08-20',
            'coverageLabel' => 'August 2026',
            'snapshot' => $dataset,
            'payload' => array_merge($dataset, [
                'generatedDate' => '2026-08-20',
                'coverageLabel' => 'August 2026',
            ]),
        ]);

        $saveResponse->assertRedirect(route('compliance.reports'));

        // 4. Verify report stored in database with snapshot
        $savedReport = ComplianceReport::where('reference', '2026-08-20-0001')->first();
        $this->assertNotNull($savedReport);
        $this->assertNotEmpty(data_get($savedReport->payload, 'issuedItems'));
        $this->assertSame('Heavy Duty Stapler', data_get($savedReport->payload, 'issuedItems.0.itemDescription'));
        $this->assertSame(5, data_get($savedReport->payload, 'issuedItems.0.quantityIssued'));
        $this->assertNotEmpty(data_get($savedReport->payload, 'recapitulationItems'));

        // 5. Historical isolation check: Delete live / migrated record
        $record->delete();
        $this->assertSame(0, RsmiMigratedRecord::count());

        // Reload report from database and verify historical snapshot remains completely intact
        $reloaded = ComplianceReport::where('reference', '2026-08-20-0001')->first();
        $this->assertSame('Heavy Duty Stapler', data_get($reloaded->payload, 'issuedItems.0.itemDescription'));
        $this->assertSame(5, data_get($reloaded->payload, 'issuedItems.0.quantityIssued'));
        $this->assertSame('STAP-01', data_get($reloaded->payload, 'recapitulationItems.0.stockNo'));
    }

    public function test_rpci_report_persists_populated_snapshot(): void
    {
        $user = User::factory()->create();

        RpcIMigratedRecord::create([
            'serial_no' => 'RPCI-2026-001',
            'date' => '2026-08-10',
            'item' => 'Desktop Computer i7',
            'stock_no' => 'COMP-01',
            'unit' => 'unit',
            'quantity_per_books' => 10,
            'physical_count' => 10,
            'unit_cost' => 45000.00,
            'total_value' => 450000.00,
            'location' => 'MIS Department',
            'entity_name' => 'University of Camarines Norte',
            'fund_cluster' => '01 - Regular Agency Fund',
        ]);

        $previewResponse = $this->actingAs($user)->post(route('compliance.reports.preview_dataset'), [
            'type' => 'RPCI',
            'title' => 'RPCI - Physical Count',
            'periodType' => 'all',
            'generatedDate' => '2026-08-20',
        ]);

        $previewResponse->assertOk();
        $dataset = $previewResponse->json();
        $this->assertNotEmpty($dataset['rpci']['items']);

        $saveResponse = $this->actingAs($user)->post(route('compliance.reports.store'), [
            'title' => 'RPCI Report Physical Count',
            'type' => 'RPCI',
            'reference' => 'RPCI-2026-0001',
            'periodType' => 'all',
            'generatedDate' => '2026-08-20',
            'snapshot' => $dataset,
            'payload' => $dataset,
        ]);

        $saveResponse->assertRedirect(route('compliance.reports'));

        $savedReport = ComplianceReport::where('reference', 'RPCI-2026-0001')->first();
        $this->assertNotNull($savedReport);
        $this->assertNotEmpty(data_get($savedReport->payload, 'items'));
        $this->assertSame('Desktop Computer i7', data_get($savedReport->payload, 'items.0.article'));
        $this->assertEquals(10, data_get($savedReport->payload, 'items.0.balance_per_card'));
    }

    public function test_stock_card_report_persists_populated_snapshot(): void
    {
        $user = User::factory()->create();

        StockCardMigratedRecord::create([
            'reference_no' => 'SC-2026-001',
            'date' => '2026-08-01',
            'item' => 'A4 Bond Paper',
            'stock_no' => 'PAP-A4',
            'unit' => 'reams',
            'receipt_quantity' => 100,
            'issue_quantity' => 0,
            'balance' => 100,
            'unit_cost' => 250.00,
            'total_cost' => 25000.00,
            'supplier_source' => 'Office Warehouse Inc.',
        ]);

        $previewResponse = $this->actingAs($user)->post(route('compliance.reports.preview_dataset'), [
            'type' => 'STOCK_CARD',
            'title' => 'Stock Card - A4 Bond Paper',
            'itemName' => 'A4 Bond Paper',
            'periodType' => 'all',
            'generatedDate' => '2026-08-20',
        ]);

        $previewResponse->assertOk();
        $dataset = $previewResponse->json();
        $this->assertNotEmpty($dataset['stockCard']['entries']);

        $saveResponse = $this->actingAs($user)->post(route('compliance.reports.store'), [
            'title' => 'Stock Card - A4 Bond Paper',
            'type' => 'STOCK_CARD',
            'reference' => 'SC-2026-0001',
            'itemName' => 'A4 Bond Paper',
            'periodType' => 'all',
            'generatedDate' => '2026-08-20',
            'snapshot' => $dataset,
            'payload' => $dataset,
        ]);

        $saveResponse->assertRedirect(route('compliance.reports'));

        $savedReport = ComplianceReport::where('reference', 'SC-2026-0001')->first();
        $this->assertNotNull($savedReport);
        $this->assertNotEmpty(data_get($savedReport->payload, 'entries'));
        $this->assertSame('A4 Bond Paper', data_get($savedReport->payload, 'item'));
    }

    public function test_mr_report_persists_populated_snapshot(): void
    {
        $user = User::factory()->create();

        MemorandumReceiptMigratedRecord::create([
            'memorial_no' => 'MR-2026-001',
            'date_received' => '2026-08-05',
            'item' => 'Epson Projector EB-X49',
            'received_by' => 'Dr. Maria Santos',
            'received_from' => 'Supply & Property Division',
            'received_for' => 'Dean - College of Education',
            'raw_data' => [
                'item_name' => 'Epson Projector EB-X49',
                'quantity' => 2,
                'unit' => 'units',
                'unit_cost' => 28000.00,
                'amount' => 56000.00,
                'recipient' => 'Dr. Maria Santos',
                'department' => 'College of Education',
                'position' => 'Dean',
            ],
        ]);

        $previewResponse = $this->actingAs($user)->post(route('compliance.reports.preview_dataset'), [
            'type' => 'MR',
            'title' => 'Memorandum Receipt - Dr. Maria Santos',
            'endUser' => 'Dr. Maria Santos',
            'periodType' => 'all',
            'generatedDate' => '2026-08-20',
        ]);

        $previewResponse->assertOk();
        $dataset = $previewResponse->json();
        $this->assertNotEmpty($dataset['mr']['items']);

        $saveResponse = $this->actingAs($user)->post(route('compliance.reports.store'), [
            'title' => 'MR - Dr. Maria Santos',
            'type' => 'MR',
            'reference' => 'MR-2026-0001',
            'endUser' => 'Dr. Maria Santos',
            'periodType' => 'all',
            'generatedDate' => '2026-08-20',
            'snapshot' => $dataset,
            'payload' => $dataset,
        ]);

        $saveResponse->assertRedirect(route('compliance.reports'));

        $savedReport = ComplianceReport::where('reference', 'MR-2026-0001')->first();
        $this->assertNotNull($savedReport);
        $this->assertNotEmpty(data_get($savedReport->payload, 'items'));
        $this->assertSame('Dr. Maria Santos', data_get($savedReport->payload, 'receivedByName'));
        $this->assertSame('Epson Projector EB-X49', data_get($savedReport->payload, 'items.0.description'));
    }

    public function test_store_synthesizes_snapshot_if_client_omits_snapshot(): void
    {
        $user = User::factory()->create();

        RsmiMigratedRecord::create([
            'ris_no' => 'RIS-AUTOSYNTH-01',
            'date' => '2026-08-15',
            'item' => 'Correction Tape',
            'stock_no' => 'TAPE-01',
            'unit' => 'pc',
            'quantity_issued' => 20,
            'unit_cost' => 45.00,
            'amount' => 900.00,
            'center_code' => 'ADMIN',
            'entity_name' => 'University of Camarines Norte',
            'fund_cluster' => '01 - Regular Agency Fund',
        ]);

        // Post without snapshot or payload items (e.g. direct API invocation)
        $response = $this->actingAs($user)->post(route('compliance.reports.store'), [
            'title' => 'Auto Synthesized Report',
            'type' => 'RSMI',
            'reference' => '2026-08-20-9999',
            'periodType' => 'all',
            'date' => '2026-08-20',
        ]);

        $response->assertRedirect(route('compliance.reports'));

        $savedReport = ComplianceReport::where('reference', '2026-08-20-9999')->first();
        $this->assertNotNull($savedReport);
        // Verify backend automatically synthesized and persisted the items
        $this->assertNotEmpty(data_get($savedReport->payload, 'issuedItems'));
        $this->assertSame('Correction Tape', data_get($savedReport->payload, 'issuedItems.0.itemDescription'));
    }

    public function test_index_endpoint_returns_populated_payload(): void
    {
        $user = User::factory()->create();

        $today = now()->format('Y-m-d');
        ComplianceReport::create([
            'title' => 'Populated Payload Report',
            'type' => 'RSMI',
            'reference' => '2026-08-20-7777',
            'period_type' => 'specific',
            'date' => $today,
            'created_by' => $user->id,
            'payload' => [
                'issuedItems' => [
                    ['itemDescription' => 'Test Item', 'quantityIssued' => 12],
                ],
                'recapitulationItems' => [
                    ['stockNo' => 'SKU-TEST', 'quantity' => 12],
                ],
                'generatedDate' => $today,
            ],
        ]);

        $response = $this->actingAs($user)->get(route('compliance.reports'));
        $response->assertOk();

        $page = $response->viewData('page');
        $reports = $page['props']['reports'];

        $found = collect($reports)->firstWhere('reference', '2026-08-20-7777');
        $this->assertNotNull($found);
        $this->assertNotEmpty(data_get($found, 'payload.issuedItems'));
        $this->assertSame('Test Item', data_get($found, 'payload.issuedItems.0.itemDescription'));
    }
}
