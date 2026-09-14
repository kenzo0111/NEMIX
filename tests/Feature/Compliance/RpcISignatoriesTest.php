<?php

namespace Tests\Feature\Compliance;

use App\Http\Requests\Admin\UpdateSystemSettingsRequest;
use App\Models\ComplianceReport;
use App\Models\Compliance\RpcIMigratedRecord;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class RpcISignatoriesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();

        // Ensure baseline system settings exist
        SystemSetting::set('institution.name', 'Camarines Norte State College', 'string', 'institution');
        SystemSetting::set('institution.default_fund_cluster', '01 - Regular Agency Fund', 'string', 'institution');

        // Existing Accountable Officer
        SystemSetting::set('signatories.rpci_accountable_officer_name', 'ARSENIO GEM A. GARCILLANOSA', 'string', 'signatories');
        SystemSetting::set('signatories.rpci_accountable_officer_designation', 'SUPPLY OFFICER III/ADMIN OFFICER V', 'string', 'signatories');
        SystemSetting::set('signatories.rpci_committee_chair', 'Inspection Committee Chairman', 'string', 'signatories');

        // New RPCI Certified and Verified signatories
        SystemSetting::set('signatories.rpci_certified_by_name', 'PROF. MARIA SANTOS', 'string', 'signatories');
        SystemSetting::set('signatories.rpci_certified_by_position', 'Inventory Committee Chair and Members', 'string', 'signatories');
        SystemSetting::set('signatories.rpci_verified_by_name', 'ATTY. JUAN REYES', 'string', 'signatories');
        SystemSetting::set('signatories.rpci_verified_by_position', 'COA Representative', 'string', 'signatories');
    }

    public function test_no_duplicate_rpci_approved_by_settings_exist(): void
    {
        $this->assertFalse(SystemSetting::where('key', 'signatories.rpci_approved_by_name')->exists());
        $this->assertFalse(SystemSetting::where('key', 'signatories.rpci_approved_by_position')->exists());
        $this->assertFalse(SystemSetting::where('key', 'signatories.rpci_approved_by_designation')->exists());
    }

    public function test_public_settings_expose_rpci_signatories_and_aliases(): void
    {
        $publicSettings = SystemSetting::getPublicSettings();

        // Existing Accountable Officer
        $this->assertSame('ARSENIO GEM A. GARCILLANOSA', $publicSettings['signatories_rpci_accountable_officer_name']);
        $this->assertSame('SUPPLY OFFICER III/ADMIN OFFICER V', $publicSettings['signatories_rpci_accountable_officer_designation']);
        $this->assertSame('ARSENIO GEM A. GARCILLANOSA', $publicSettings['rpci_accountable_officer_name']);
        $this->assertSame('SUPPLY OFFICER III/ADMIN OFFICER V', $publicSettings['rpci_accountable_officer_designation']);

        // Committee chair and new Certified / Verified signatories
        $this->assertSame('Inspection Committee Chairman', $publicSettings['signatories_rpci_committee_chair']);
        $this->assertSame('PROF. MARIA SANTOS', $publicSettings['signatories_rpci_certified_by_name']);
        $this->assertSame('Inventory Committee Chair and Members', $publicSettings['signatories_rpci_certified_by_position']);
        $this->assertSame('ATTY. JUAN REYES', $publicSettings['signatories_rpci_verified_by_name']);
        $this->assertSame('COA Representative', $publicSettings['signatories_rpci_verified_by_position']);

        // Convenient aliases
        $this->assertSame('PROF. MARIA SANTOS', $publicSettings['rpci_certified_by_name']);
        $this->assertSame('Inventory Committee Chair and Members', $publicSettings['rpci_certified_by_position']);
        $this->assertSame('ATTY. JUAN REYES', $publicSettings['rpci_verified_by_name']);
        $this->assertSame('COA Representative', $publicSettings['rpci_verified_by_position']);
    }

    public function test_saving_rpci_report_stores_resolved_signatories_snapshot(): void
    {
        $user = User::factory()->create();

        RpcIMigratedRecord::create([
            'serial_no' => 'RPCI-2026-TEST-001',
            'date' => '2026-09-10',
            'item' => 'Heavy Duty Stapler',
            'stock_no' => 'STAP-01',
            'unit' => 'piece',
            'quantity_per_books' => 25,
            'physical_count' => 25,
            'unit_cost' => 350.00,
            'total_value' => 8750.00,
            'location' => 'SPMO Warehouse',
            'entity_name' => 'Camarines Norte State College',
            'fund_cluster' => '01 - Regular Agency Fund',
        ]);

        $previewResponse = $this->actingAs($user)->post(route('compliance.reports.preview_dataset'), [
            'type' => 'RPCI',
            'title' => 'RPCI - Physical Count of Inventories',
            'periodType' => 'all',
            'generatedDate' => '2026-09-14',
        ]);
        $previewResponse->assertOk();
        $dataset = $previewResponse->json();

        // Submit to store
        $saveResponse = $this->actingAs($user)->post(route('compliance.reports.store'), [
            'title' => 'RPCI - Physical Count of Inventories',
            'type' => 'RPCI',
            'reference' => 'RPCI-2026-09-001',
            'periodType' => 'all',
            'generatedDate' => '2026-09-14',
            'snapshot' => $dataset,
            'payload' => $dataset,
        ]);
        $saveResponse->assertRedirect(route('compliance.reports'));

        $report = ComplianceReport::where('reference', 'RPCI-2026-09-001')->first();
        $this->assertNotNull($report);

        $signatories = data_get($report->payload, 'signatories');
        $this->assertNotNull($signatories);

        // Approved by MUST be mapped to Accountable Officer Name and Designation
        $this->assertSame('ARSENIO GEM A. GARCILLANOSA', data_get($signatories, 'approved_by.name'));
        $this->assertSame('SUPPLY OFFICER III/ADMIN OFFICER V', data_get($signatories, 'approved_by.position'));

        // Certified by and Verified by
        $this->assertSame('PROF. MARIA SANTOS', data_get($signatories, 'certified_by.name'));
        $this->assertSame('Inventory Committee Chair and Members', data_get($signatories, 'certified_by.position'));
        $this->assertSame('ATTY. JUAN REYES', data_get($signatories, 'verified_by.name'));
        $this->assertSame('COA Representative', data_get($signatories, 'verified_by.position'));
    }

    public function test_changing_accountable_officer_later_preserves_historical_saved_rpci_snapshot(): void
    {
        $user = User::factory()->create();

        // 1. Create a saved report with initial Accountable Officer
        $initialSignatories = [
            'certified_by' => [
                'name' => 'PROF. MARIA SANTOS',
                'position' => 'Inventory Committee Chair and Members',
            ],
            'approved_by' => [
                'name' => 'ARSENIO GEM A. GARCILLANOSA',
                'position' => 'SUPPLY OFFICER III/ADMIN OFFICER V',
            ],
            'verified_by' => [
                'name' => 'ATTY. JUAN REYES',
                'position' => 'COA Representative',
            ],
        ];

        $report = ComplianceReport::create([
            'title' => 'Historical RPCI 2025',
            'type' => 'RPCI',
            'reference' => 'RPCI-HIST-2025-01',
            'period_type' => 'all',
            'date' => '2025-12-31',
            'generated_date' => '2025-12-31',
            'payload' => [
                'type' => 'RPCI',
                'reference' => 'RPCI-HIST-2025-01',
                'signatories' => $initialSignatories,
                'snapshot' => [
                    'signatories' => $initialSignatories,
                ],
                'rpci' => [
                    'signatories' => $initialSignatories,
                    'items' => [],
                ],
            ],
        ]);

        // 2. Change Accountable Officer in SystemSettings
        SystemSetting::set('signatories.rpci_accountable_officer_name', 'DR. NEW OFFICER', 'string', 'signatories');
        SystemSetting::set('signatories.rpci_accountable_officer_designation', 'DIRECTOR GENERAL', 'string', 'signatories');

        // 3. Re-read the saved report and verify the snapshot signatories remain untouched
        $saved = ComplianceReport::find($report->id);
        $this->assertSame('ARSENIO GEM A. GARCILLANOSA', data_get($saved->payload, 'signatories.approved_by.name'));
        $this->assertSame('SUPPLY OFFICER III/ADMIN OFFICER V', data_get($saved->payload, 'signatories.approved_by.position'));
        $this->assertNotSame('DR. NEW OFFICER', data_get($saved->payload, 'signatories.approved_by.name'));
    }

    public function test_system_settings_request_validates_new_rpci_signatory_limits(): void
    {
        $validRequest = UpdateSystemSettingsRequest::create('/admin/system-settings', 'PUT', [
            'settings' => [
                'signatories.rpci_certified_by_name' => 'Prof. Valid Certifier',
                'signatories.rpci_certified_by_position' => 'Committee Chair',
                'signatories.rpci_verified_by_name' => 'State Auditor IV',
                'signatories.rpci_verified_by_position' => 'COA Representative',
            ],
        ]);
        $validValidator = Validator::make($validRequest->all(), $validRequest->rules());
        $validRequest->withValidator($validValidator);

        $this->assertFalse($validValidator->fails());

        // Over-limit payload
        $overLimitRequest = UpdateSystemSettingsRequest::create('/admin/system-settings', 'PUT', [
            'settings' => [
                'signatories.rpci_certified_by_name' => str_repeat('A', 256),
                'signatories.rpci_verified_by_name' => str_repeat('B', 256),
            ],
        ]);
        $overLimitValidator = Validator::make($overLimitRequest->all(), $overLimitRequest->rules());
        $overLimitRequest->withValidator($overLimitValidator);

        $this->assertTrue($overLimitValidator->fails());
        $this->assertArrayHasKey('settings.signatories.rpci_certified_by_name', $overLimitValidator->errors()->toArray());
        $this->assertArrayHasKey('settings.signatories.rpci_verified_by_name', $overLimitValidator->errors()->toArray());
    }
}
