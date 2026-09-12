<?php

namespace Tests\Feature;

use App\Models\Compliance\RsmiMigratedRecord;
use App\Models\ComplianceReport;
use App\Models\User;
use App\Services\Compliance\ComplianceReportDataService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\IssuanceItem;
use Modules\Inventory\Models\Item;
use Modules\Suppliers\Models\Supplier;
use Tests\TestCase;

class RsmiResponsibilityCenterCodeTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Supplier $supplier;
    protected ComplianceReportDataService $dataService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();

        $this->user = User::factory()->create();
        $this->supplier = Supplier::create([
            'name' => 'General Supply Corp',
            'tin' => '123-456-789-000',
            'reg_number' => 'REG-2026-SUP1',
            'category' => 'Office Supplies',
            'contact_person' => 'Juan Dela Cruz',
            'email' => 'supplier@test.com',
            'phone' => '09123456789',
            'address' => 'Daet, Camarines Norte',
            'status' => 'active',
            'created_by' => $this->user->id,
        ]);
        $this->dataService = app(ComplianceReportDataService::class);
    }

    public function test_extract_acronym_method_handles_all_prescribed_patterns(): void
    {
        // 1. Target examples from user specifications
        $this->assertSame('CoTT', $this->dataService->extractAcronym('College of Trades and Technology (CoTT) - Jose Panganiban Campus'));
        $this->assertSame('CCMS', $this->dataService->extractAcronym('College of Computing and Multimedia Studies (CCMS) - Main Campus'));
        $this->assertSame('SPMO', $this->dataService->extractAcronym('Supply and Property Management Office (SPMO)'));
        $this->assertSame('CBPA', $this->dataService->extractAcronym('College of Business and Public Administration (CBPA) - Main Campus'));

        // 2. Previously overflowing offices without parentheses
        $this->assertSame('OVPAF', $this->dataService->extractAcronym('Office of the Vice President for Administration and Finance'));
        $this->assertSame('CE', $this->dataService->extractAcronym('College of Engineering - Main Campus'));
        $this->assertSame('CE', $this->dataService->extractAcronym('College of Engineering'));
        $this->assertSame('ASD', $this->dataService->extractAcronym('Academic Services Division'));
        $this->assertSame('ITSO', $this->dataService->extractAcronym('Information Technology Services Office'));

        // 3. Already only an acronym or RCC numerical code
        $this->assertSame('CCMS', $this->dataService->extractAcronym('CCMS'));
        $this->assertSame('SPMO', $this->dataService->extractAcronym('SPMO'));
        $this->assertSame('OVPAF', $this->dataService->extractAcronym('OVPAF'));
        $this->assertSame('CE', $this->dataService->extractAcronym('CE'));
        $this->assertSame('01-101-00', $this->dataService->extractAcronym('01-101-00'));

        // 4. Single-word office names
        $this->assertSame('LIB', $this->dataService->extractAcronym('Library'));

        // 5. Null / empty / dash values
        $this->assertSame('-', $this->dataService->extractAcronym(null));
        $this->assertSame('-', $this->dataService->extractAcronym(''));
        $this->assertSame('-', $this->dataService->extractAcronym('   '));
        $this->assertSame('-', $this->dataService->extractAcronym('-'));
    }

    public function test_rsmi_generates_acronym_responsibility_center_codes_for_live_issuances(): void
    {
        $item = Item::create([
            'name' => 'A4 Copy Paper',
            'sku' => 'PAP-A4-001',
            'supplier_id' => $this->supplier->id,
            'stock' => 500,
            'unit_cost' => 250.00,
            'unit_of_issue' => 'ream',
            'status' => 'Available',
            'created_by' => $this->user->id,
        ]);

        $departments = [
            'RIS-2026-09-0009' => 'College of Trades and Technology (CoTT) - Jose Panganiban Campus',
            'RIS-2026-09-0008' => 'College of Computing and Multimedia Studies (CCMS) - Main Campus',
            'RIS-2026-09-0007' => 'Supply and Property Management Office (SPMO)',
            'RIS-2026-09-0027' => 'College of Business and Public Administration (CBPA) - Main Campus',
            'RIS-2026-09-0011' => 'Office of the Vice President for Administration and Finance',
            'RIS-2026-09-0012' => 'College of Engineering - Main Campus',
            'RIS-2026-09-0013' => 'Academic Services Division',
            'RIS-2026-09-0014' => 'Information Technology Services Office',
            'RIS-2026-09-0030' => 'Library',
        ];

        foreach ($departments as $risNo => $deptName) {
            $issuance = Issuance::create([
                'ris_number' => $risNo,
                'item_id' => $item->id,
                'quantity' => 2,
                'recipient' => 'Authorized Staff',
                'department' => $deptName,
                'date_issued' => '2026-09-10',
                'status' => 'Issued',
                'issued_by' => $this->user->id,
            ]);

            IssuanceItem::create([
                'issuance_id' => $issuance->id,
                'item_id' => $item->id,
                'quantity' => 2,
                'unit_cost' => 250.00,
                'amount' => 500.00,
            ]);
        }

        // Preview dataset
        $previewResponse = $this->actingAs($this->user)->post(route('compliance.reports.preview_dataset'), [
            'type' => 'RSMI',
            'title' => 'RSMI - Supplies and Materials Issued',
            'periodType' => 'all',
            'generatedDate' => '2026-09-12',
        ]);

        $previewResponse->assertOk();
        $dataset = $previewResponse->json();
        $issuedItems = $dataset['rsmi']['issuedItems'];

        $this->assertCount(9, $issuedItems);

        // Map by RIS No.
        $itemMap = [];
        foreach ($issuedItems as $it) {
            $itemMap[$it['risNo']] = $it;
        }

        $this->assertSame('CoTT', $itemMap['RIS-2026-09-0009']['responsibilityCenterCode']);
        $this->assertSame('College of Trades and Technology (CoTT) - Jose Panganiban Campus', $itemMap['RIS-2026-09-0009']['responsibility_center']['name']);
        $this->assertSame('CoTT', $itemMap['RIS-2026-09-0009']['responsibility_center']['code']);

        $this->assertSame('CCMS', $itemMap['RIS-2026-09-0008']['responsibilityCenterCode']);
        $this->assertSame('College of Computing and Multimedia Studies (CCMS) - Main Campus', $itemMap['RIS-2026-09-0008']['responsibility_center']['name']);
        $this->assertSame('CCMS', $itemMap['RIS-2026-09-0008']['responsibility_center']['code']);

        $this->assertSame('SPMO', $itemMap['RIS-2026-09-0007']['responsibilityCenterCode']);
        $this->assertSame('Supply and Property Management Office (SPMO)', $itemMap['RIS-2026-09-0007']['responsibility_center']['name']);
        $this->assertSame('SPMO', $itemMap['RIS-2026-09-0007']['responsibility_center']['code']);

        $this->assertSame('CBPA', $itemMap['RIS-2026-09-0027']['responsibilityCenterCode']);
        $this->assertSame('College of Business and Public Administration (CBPA) - Main Campus', $itemMap['RIS-2026-09-0027']['responsibility_center']['name']);
        $this->assertSame('CBPA', $itemMap['RIS-2026-09-0027']['responsibility_center']['code']);

        // Check the newly added departments without parentheses
        $this->assertSame('OVPAF', $itemMap['RIS-2026-09-0011']['responsibilityCenterCode']);
        $this->assertSame('Office of the Vice President for Administration and Finance', $itemMap['RIS-2026-09-0011']['responsibility_center']['name']);
        $this->assertSame('OVPAF', $itemMap['RIS-2026-09-0011']['responsibility_center']['code']);

        $this->assertSame('CE', $itemMap['RIS-2026-09-0012']['responsibilityCenterCode']);
        $this->assertSame('College of Engineering - Main Campus', $itemMap['RIS-2026-09-0012']['responsibility_center']['name']);
        $this->assertSame('CE', $itemMap['RIS-2026-09-0012']['responsibility_center']['code']);

        $this->assertSame('ASD', $itemMap['RIS-2026-09-0013']['responsibilityCenterCode']);
        $this->assertSame('Academic Services Division', $itemMap['RIS-2026-09-0013']['responsibility_center']['name']);
        $this->assertSame('ASD', $itemMap['RIS-2026-09-0013']['responsibility_center']['code']);

        $this->assertSame('ITSO', $itemMap['RIS-2026-09-0014']['responsibilityCenterCode']);
        $this->assertSame('Information Technology Services Office', $itemMap['RIS-2026-09-0014']['responsibility_center']['name']);
        $this->assertSame('ITSO', $itemMap['RIS-2026-09-0014']['responsibility_center']['code']);

        $this->assertSame('LIB', $itemMap['RIS-2026-09-0030']['responsibilityCenterCode']);
        $this->assertSame('Library', $itemMap['RIS-2026-09-0030']['responsibility_center']['name']);
        $this->assertSame('LIB', $itemMap['RIS-2026-09-0030']['responsibility_center']['code']);

        // Verify underlying database Issuances still retain original complete department names
        $storedIssuance = Issuance::where('ris_number', 'RIS-2026-09-0011')->first();
        $this->assertSame('Office of the Vice President for Administration and Finance', $storedIssuance->department);
    }

    public function test_rsmi_saved_report_stores_both_full_name_and_acronym_code(): void
    {
        $item = Item::create([
            'name' => 'Correction Tape',
            'sku' => 'TAPE-COR-01',
            'supplier_id' => $this->supplier->id,
            'stock' => 100,
            'unit_cost' => 30.00,
            'unit_of_issue' => 'pc',
            'status' => 'Available',
            'created_by' => $this->user->id,
        ]);

        $issuance = Issuance::create([
            'ris_number' => 'RIS-2026-09-0088',
            'item_id' => $item->id,
            'quantity' => 10,
            'recipient' => 'Prof. Santos',
            'department' => 'College of Computing and Multimedia Studies (CCMS) - Main Campus',
            'date_issued' => '2026-09-11',
            'status' => 'Issued',
            'issued_by' => $this->user->id,
        ]);

        IssuanceItem::create([
            'issuance_id' => $issuance->id,
            'item_id' => $item->id,
            'quantity' => 10,
            'unit_cost' => 30.00,
            'amount' => 300.00,
        ]);

        // Save report
        $saveResponse = $this->actingAs($this->user)->post(route('compliance.reports.store'), [
            'title' => 'RSMI - September 2026',
            'type' => 'RSMI',
            'periodType' => 'all',
            'reference' => 'RSMI-2026-09-TEST',
            'generatedDate' => '2026-09-12',
        ]);

        $saveResponse->assertRedirect();

        $savedReport = ComplianceReport::where('reference', 'RSMI-2026-09-TEST')->first();
        $savedItems = data_get($savedReport->payload, 'issuedItems')
            ?? data_get($savedReport->payload, 'rsmi.issuedItems')
            ?? data_get($savedReport->snapshot_data, 'rsmi.issuedItems');

        $this->assertNotEmpty($savedItems);
        $firstSaved = $savedItems[0];

        $this->assertSame('CCMS', $firstSaved['responsibilityCenterCode']);
        $this->assertSame('College of Computing and Multimedia Studies (CCMS) - Main Campus', $firstSaved['responsibility_center']['name']);
        $this->assertSame('CCMS', $firstSaved['responsibility_center']['code']);
    }

    public function test_migrated_rsmi_records_extract_acronym(): void
    {
        RsmiMigratedRecord::create([
            'ris_no' => 'RIS-2026-HIST-01',
            'date' => '2026-08-10',
            'item' => 'Staple Wire #35',
            'stock_no' => 'STAP-W-35',
            'unit' => 'box',
            'quantity_issued' => 4,
            'unit_cost' => 45.00,
            'amount' => 180.00,
            'center_code' => 'Supply and Property Management Office (SPMO)',
            'entity_name' => 'University of Camarines Norte',
            'fund_cluster' => '01 - Regular Agency Fund',
        ]);

        $dataset = $this->dataService->getRsmiRecords(['periodType' => 'all']);
        $item = $dataset['issuedItems'][0];

        $this->assertSame('SPMO', $item['responsibilityCenterCode']);
        $this->assertSame('Supply and Property Management Office (SPMO)', $item['responsibility_center']['name']);
        $this->assertSame('SPMO', $item['responsibility_center']['code']);
    }
}
