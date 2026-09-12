<?php

namespace Tests\Feature;

use App\Models\Compliance\MemorandumReceiptMigratedRecord;
use App\Models\Compliance\RpcIMigratedRecord;
use App\Models\Compliance\RsmiMigratedRecord;
use App\Models\Compliance\StockCardMigratedRecord;
use App\Models\ComplianceReport;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ComplianceEntityNameCentralizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();

        $adminRole = Role::firstOrCreate(['name' => 'System Admin']);
        $this->adminUser = User::factory()->create([
            'name' => 'System Administrator',
            'email' => 'admin@ucn.edu.ph',
        ]);
        $this->adminUser->assignRole($adminRole);
    }

    public function test_system_settings_centralizes_entity_name_and_mor_configurations(): void
    {
        // 1. Update settings via Admin endpoint
        $response = $this->actingAs($this->adminUser)
            ->from('/admin/system-settings')
            ->post('/admin/system-settings', [
            'settings' => [
                'institution.name' => 'Bicol State Polytechnic University',
                'institution.default_fund_cluster' => '05 - Internally Generated Income',
                'signatories.mor_issued_by_name' => 'JUAN DELA CRUZ',
                'signatories.mor_issued_by_designation' => 'DIRECTOR OF ASSET MANAGEMENT',
                'signatories.mor_issued_by_office' => 'Asset & Logistics Office',
                'numbering.mor_prefix' => 'MR-BSPU-',
                'compliance.mor_appendix_number' => 'Appendix 59-B',
            ],
        ]);

        $response->assertRedirect('/admin/system-settings');
        $response->assertSessionHas('success');

        // 2. Verify SystemSetting accessors & aliases
        $this->assertSame('Bicol State Polytechnic University', SystemSetting::get('institution.name'));
        $this->assertSame('Bicol State Polytechnic University', SystemSetting::get('entity_name'));
        $this->assertSame('Bicol State Polytechnic University', SystemSetting::get('entity.name'));

        $publicSettings = SystemSetting::getPublicSettings();
        $this->assertSame('Bicol State Polytechnic University', $publicSettings['institution_name']);
        $this->assertSame('Bicol State Polytechnic University', $publicSettings['entity_name']);
        $this->assertSame('05 - Internally Generated Income', $publicSettings['default_fund_cluster']);
        $this->assertSame('JUAN DELA CRUZ', $publicSettings['signatories_mor_issued_by_name']);
        $this->assertSame('DIRECTOR OF ASSET MANAGEMENT', $publicSettings['signatories_mor_issued_by_designation']);
        $this->assertSame('Asset & Logistics Office', $publicSettings['signatories_mor_issued_by_office']);
        $this->assertSame('Appendix 59-B', $publicSettings['compliance_mor_appendix_number']);
    }

    public function test_compliance_report_previews_dynamically_use_updated_entity_name_across_all_forms(): void
    {
        SystemSetting::set('institution.name', 'Central Bicol State University');
        SystemSetting::set('institution.default_fund_cluster', '01 - Regular Agency Fund');
        SystemSetting::set('signatories.mor_issued_by_name', 'MARIA CLARA');
        SystemSetting::set('signatories.mor_issued_by_designation', 'CHIEF PROPERTY OFFICER');
        SystemSetting::set('signatories.mor_issued_by_office', 'SPMO Central');
        SystemSetting::set('compliance.mor_appendix_number', 'Appendix 59-A');

        // Seed sample migrated records for each form
        RsmiMigratedRecord::create([
            'ris_no' => 'RIS-2026-001',
            'date' => '2026-08-15',
            'item' => 'Bond Paper A4',
            'stock_no' => 'PAP-01',
            'unit' => 'ream',
            'quantity_issued' => 10,
            'unit_cost' => 250.00,
            'amount' => 2500.00,
            'center_code' => 'COE-01',
            'entity_name' => 'Old Entity Seed',
            'fund_cluster' => '01 - Regular Agency Fund',
        ]);

        RpcIMigratedRecord::create([
            'article' => 'Desktop Computer',
            'description' => 'Intel Core i7 16GB RAM',
            'property_number' => 'PROP-2026-001',
            'unit_of_measure' => 'unit',
            'unit_value' => 45000.00,
            'quantity_per_property_card' => 5,
            'quantity_per_physical_count' => 5,
            'balance_per_card_quantity' => 5,
            'balance_per_card_unit_value' => 45000.00,
            'balance_per_card_total_value' => 225000.00,
            'on_hand_per_count_quantity' => 5,
            'on_hand_per_count_unit_value' => 45000.00,
            'on_hand_per_count_total_value' => 225000.00,
            'date_acquired' => '2026-01-10',
            'accountable_officer' => 'John Custodian',
            'designation' => 'Property Custodian',
            'entity_name' => 'Old Entity Seed',
            'fund_cluster' => '01 - Regular Agency Fund',
        ]);

        StockCardMigratedRecord::create([
            'stock_number' => 'SC-2026-001',
            'item_description' => 'Ballpen Black',
            'unit_of_measurement' => 'piece',
            'date' => '2026-08-01',
            'reference' => 'PO-001',
            'receipt_quantity' => 100,
            'balance_quantity' => 100,
            'entity_name' => 'Old Entity Seed',
            'fund_cluster' => '01 - Regular Agency Fund',
        ]);

        MemorandumReceiptMigratedRecord::create([
            'mr_no' => 'MR-2026-001',
            'date' => '2026-08-10',
            'purpose' => 'Office equipment issuance',
            'quantity' => 1,
            'unit' => 'unit',
            'item_description' => 'LaserJet Printer',
            'property_no' => 'PRN-2026-001',
            'date_acquired' => '2026-08-05',
            'unit_value' => 12000.00,
            'total_value' => 12000.00,
            'received_by_name' => 'Recipient Employee',
            'received_by_position' => 'Faculty',
            'received_by_office' => 'College of Engineering',
            'received_by_date' => '2026-08-10',
            'issued_by_name' => 'Old Signatory',
            'issued_by_position' => 'Old Position',
            'issued_by_office' => 'Old Office',
            'issued_by_date' => '2026-08-10',
            'entity_name' => 'Old Entity Seed',
            'fund_cluster' => '01 - Regular Agency Fund',
        ]);

        // 1. Preview RSMI
        $rsmiRes = $this->actingAs($this->adminUser)->post(route('compliance.reports.preview_dataset'), [
            'type' => 'RSMI',
            'periodType' => 'all',
        ])->assertOk()->json();
        $this->assertSame('Central Bicol State University', $rsmiRes['rsmi']['entity_name']);
        $this->assertSame('Central Bicol State University', $rsmiRes['rsmi']['entityName']);

        // 2. Preview RPCI
        $rpciRes = $this->actingAs($this->adminUser)->post(route('compliance.reports.preview_dataset'), [
            'type' => 'RPCI',
            'periodType' => 'all',
        ])->assertOk()->json();
        $this->assertSame('Central Bicol State University', $rpciRes['rpci']['entity_name']);
        $this->assertSame('Central Bicol State University', $rpciRes['rpci']['entityName']);

        // 3. Preview Stock Card
        $scRes = $this->actingAs($this->adminUser)->post(route('compliance.reports.preview_dataset'), [
            'type' => 'STOCK_CARD',
            'itemName' => 'Ballpen Black',
            'stockCardStockNo' => 'SC-2026-001',
        ])->assertOk()->json();
        $this->assertSame('Central Bicol State University', $scRes['stockCard']['entity_name']);
        $this->assertSame('Central Bicol State University', $scRes['stockCard']['entityName']);

        // 4. Preview MOR / Memorandum Receipt
        $mrRes = $this->actingAs($this->adminUser)->post(route('compliance.reports.preview_dataset'), [
            'type' => 'MEMORANDUM_RECEIPT',
            'memorandumReceiptNo' => 'MR-2026-001',
        ])->assertOk()->json();
        $this->assertSame('Central Bicol State University', $mrRes['mr']['entity_name']);
        $this->assertSame('Central Bicol State University', $mrRes['mr']['entityName']);
        $this->assertSame('MARIA CLARA', $mrRes['mr']['issuedByName']);
        $this->assertSame('CHIEF PROPERTY OFFICER', $mrRes['mr']['issuedByPosition']);
        $this->assertSame('SPMO Central', $mrRes['mr']['issuedByOffice']);
    }

    public function test_saved_compliance_report_preserves_historical_entity_name_snapshot(): void
    {
        // 1. Set first entity name
        SystemSetting::set('institution.name', 'Original University Name');

        // 2. Save a report with snapshotted entity name
        $saveResponse = $this->actingAs($this->adminUser)->post(route('compliance.reports.store'), [
            'title' => 'RPCI - Physical Inventory Q1',
            'report_type' => 'RPCI',
            'type' => 'RPCI',
            'periodType' => 'all',
            'generated_date' => '2026-03-31',
            'entity_name' => 'Original University Name',
            'fund_cluster' => '01 - Regular Agency Fund',
            'snapshot' => [
                'metadata' => [
                    'entity_name' => 'Original University Name',
                    'fund_cluster' => '01 - Regular Agency Fund',
                ],
                'rpci' => [
                    'entity_name' => 'Original University Name',
                    'inventoryItems' => [
                        [
                            'article' => 'Office Chair',
                            'propertyNumber' => 'CHAIR-001',
                        ],
                    ],
                ],
            ],
            'rpci' => [
                'entity_name' => 'Original University Name',
                'inventoryItems' => [
                    [
                        'article' => 'Office Chair',
                        'propertyNumber' => 'CHAIR-001',
                    ],
                ],
            ],
        ]);

        $saveResponse->assertRedirect(route('compliance.reports'));
        $createdReport = ComplianceReport::where('title', 'RPCI - Physical Inventory Q1')->firstOrFail();
        $this->assertSame('Original University Name', $createdReport->entity_name);
        $this->assertSame('Original University Name', $createdReport->snapshot_data['entity_name']);
        $this->assertSame('Original University Name', $createdReport->snapshot_data['rpci']['entity_name']);

        // 3. Admin changes Entity Name in System Settings
        SystemSetting::set('institution.name', 'New Reformed University Name');

        // 4. Saved historical report MUST PRESERVE the original snapshotted Entity Name
        $savedRecord = ComplianceReport::find($createdReport->id);
        $this->assertSame('Original University Name', $savedRecord->entity_name);
        $this->assertSame('Original University Name', $savedRecord->snapshot_data['entity_name']);
        $this->assertSame('Original University Name', $savedRecord->snapshot_data['rpci']['entity_name']);

        // 5. Index page payload preserves the historical snapshot
        $indexResponse = $this->actingAs($this->adminUser)->get(route('compliance.reports'));
        $indexResponse->assertOk();
        $reportsProp = $indexResponse->original->getData()['page']['props']['reports'];
        $matched = collect($reportsProp)->firstWhere('id', $createdReport->id);
        $this->assertNotNull($matched);
        $this->assertSame('Original University Name', $matched['entity_name']);

        // 6. But newly generated previews immediately use the new Entity Name
        $newPreviewRes = $this->actingAs($this->adminUser)->post(route('compliance.reports.preview_dataset'), [
            'type' => 'RPCI',
            'periodType' => 'all',
        ])->assertOk()->json();
        $this->assertSame('New Reformed University Name', $newPreviewRes['rpci']['entity_name']);
    }
}
