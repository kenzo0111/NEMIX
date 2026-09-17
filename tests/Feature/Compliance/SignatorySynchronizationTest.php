<?php

namespace Tests\Feature\Compliance;

use App\Models\ComplianceReport;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\SystemSettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SignatorySynchronizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();
    }

    public function test_system_settings_changes_immediately_update_rsmi_signatories_in_preview_and_pdf(): void
    {
        // 1. Initial State
        SystemSetting::set('signatories.rsmi_certified_by_name', 'JUAN DELA CRUZ');
        SystemSetting::set('signatories.rsmi_certified_by_designation', 'Supply Custodian I');
        SystemSetting::set('signatories.rsmi_posted_by_name', 'PEDRO PENDUKO');
        SystemSetting::set('signatories.rsmi_posted_by_designation', 'Accountant I');

        // Check initial preview
        $previewRes1 = $this->postJson(route('compliance.reports.preview_dataset'), [
            'type' => 'RSMI',
            'periodType' => 'monthly',
            'selectedMonth' => 9,
            'selectedYear' => 2026,
            'title' => 'RSMI Initial Test',
        ]);
        $previewRes1->assertStatus(200);
        $this->assertSame('JUAN DELA CRUZ', $previewRes1->json('rsmi.supplyCustodianName'));
        $this->assertSame('PEDRO PENDUKO', $previewRes1->json('rsmi.accountingStaffName'));

        // 2. Admin Changes Signatories in System Settings
        SystemSetting::set('signatories.rsmi_certified_by_name', 'MARIA SANTOS');
        SystemSetting::set('signatories.rsmi_certified_by_designation', 'Supervising Supply Custodian');
        SystemSetting::set('signatories.rsmi_posted_by_name', 'CRISOSTOMO IBARRA');
        SystemSetting::set('signatories.rsmi_posted_by_designation', 'Chief Accountant');

        // 3. Verify Preview reflects the new signatories without server restart
        $previewRes2 = $this->postJson(route('compliance.reports.preview_dataset'), [
            'type' => 'RSMI',
            'periodType' => 'monthly',
            'selectedMonth' => 9,
            'selectedYear' => 2026,
            'title' => 'RSMI Updated Test',
        ]);
        $previewRes2->assertStatus(200);
        $this->assertSame('MARIA SANTOS', $previewRes2->json('rsmi.supplyCustodianName'));
        $this->assertSame('Supervising Supply Custodian', $previewRes2->json('rsmi.supplyCustodianDesignation'));
        $this->assertSame('CRISOSTOMO IBARRA', $previewRes2->json('rsmi.accountingStaffName'));
        $this->assertSame('Chief Accountant', $previewRes2->json('rsmi.accountingStaffDesignation'));

        // 4. Verify PDF Output reflects the new signatories
        $pdfRes = $this->postJson(route('compliance.reports.export_pdf'), [
            'type' => 'RSMI',
            'periodType' => 'monthly',
            'selectedMonth' => 9,
            'selectedYear' => 2026,
            'title' => 'RSMI PDF Export Test',
            'reference' => 'RSMI-2026-09-0001',
        ]);
        $pdfRes->assertStatus(200);
        $pdfRes->assertHeader('content-type', 'application/pdf');

        // Verify HTML template render contains new names and not old names
        $form = [
            'supplyCustodianName' => SystemSetting::get('signatories.rsmi_certified_by_name'),
            'accountingStaffName' => SystemSetting::get('signatories.rsmi_posted_by_name'),
            'issuedItems' => [],
            'recapitulationItems' => [],
        ];
        $html = view('compliance.pdf.rsmi', ['forms' => [$form]])->render();
        $this->assertStringContainsString('MARIA SANTOS', $html);
        $this->assertStringContainsString('CRISOSTOMO IBARRA', $html);
        $this->assertStringNotContainsString('JUAN DELA CRUZ', $html);
        $this->assertStringNotContainsString('ALBERTO DE VERA JR', $html);
    }

    public function test_system_settings_changes_immediately_update_rpci_signatories(): void
    {
        // 1. Initial State
        SystemSetting::set('signatories.rpci_accountable_officer_name', 'JUAN ACCOUNTABLE');
        SystemSetting::set('signatories.rpci_accountable_officer_designation', 'Supply Officer II');
        SystemSetting::set('signatories.rpci_certified_by_name', 'PEDRO CERTIFIED');
        SystemSetting::set('signatories.rpci_certified_by_position', 'Committee Chairman');
        SystemSetting::set('signatories.rpci_verified_by_name', 'LUCIA VERIFIED');
        SystemSetting::set('signatories.rpci_verified_by_position', 'State Auditor');

        $preview1 = $this->postJson(route('compliance.reports.preview_dataset'), [
            'type' => 'RPCI',
            'periodType' => 'all',
            'title' => 'RPCI Initial Test',
        ]);
        $preview1->assertStatus(200);
        $this->assertSame('JUAN ACCOUNTABLE', $preview1->json('rpci.accountable_officer'));
        $this->assertSame('PEDRO CERTIFIED', $preview1->json('rpci.certified_by_name'));
        $this->assertSame('LUCIA VERIFIED', $preview1->json('rpci.verified_by_name'));

        // 2. Admin Changes Signatories
        SystemSetting::set('signatories.rpci_accountable_officer_name', 'NEW ACCOUNTABLE OFFICER');
        SystemSetting::set('signatories.rpci_certified_by_name', 'NEW CERTIFIED CHAIR');
        SystemSetting::set('signatories.rpci_verified_by_name', 'NEW COA AUDITOR');

        // 3. Verify Preview reflects updated values immediately
        $preview2 = $this->postJson(route('compliance.reports.preview_dataset'), [
            'type' => 'RPCI',
            'periodType' => 'all',
            'title' => 'RPCI Updated Test',
        ]);
        $preview2->assertStatus(200);
        $this->assertSame('NEW ACCOUNTABLE OFFICER', $preview2->json('rpci.accountable_officer'));
        $this->assertSame('NEW CERTIFIED CHAIR', $preview2->json('rpci.certified_by_name'));
        $this->assertSame('NEW COA AUDITOR', $preview2->json('rpci.verified_by_name'));

        // 4. Verify PDF Output reflects the updated values
        $html = view('compliance.pdf.rpci', [
            'rpciData' => $preview2->json('rpci'),
        ])->render();
        $this->assertStringContainsString('NEW ACCOUNTABLE OFFICER', $html);
        $this->assertStringContainsString('NEW CERTIFIED CHAIR', $html);
        $this->assertStringContainsString('NEW COA AUDITOR', $html);
        $this->assertStringNotContainsString('JUAN ACCOUNTABLE', $html);
    }

    public function test_system_settings_changes_immediately_update_mor_signatories(): void
    {
        // 1. Initial State
        SystemSetting::set('signatories.mor_issued_by_name', 'INITIAL OFFICER');
        SystemSetting::set('signatories.mor_issued_by_designation', 'Initial Property Head');
        SystemSetting::set('signatories.mor_issued_by_office', 'Old Office');
        SystemSetting::set('compliance.mor_appendix_number', 'Appendix 59-A');

        $preview1 = $this->postJson(route('compliance.reports.preview_dataset'), [
            'type' => 'MOR',
            'periodType' => 'all',
            'title' => 'MOR Initial Test',
        ]);
        $preview1->assertStatus(200);
        $this->assertSame('INITIAL OFFICER', $preview1->json('mr.issuedByName'));

        // 2. Admin Updates MOR Signatories
        SystemSetting::set('signatories.mor_issued_by_name', 'MARIA CLARA MOR');
        SystemSetting::set('signatories.mor_issued_by_designation', 'Director of Property');
        SystemSetting::set('signatories.mor_issued_by_office', 'Property Custodial Section');
        SystemSetting::set('compliance.mor_appendix_number', 'Appendix 59-REVISED');

        // 3. Verify Preview
        $preview2 = $this->postJson(route('compliance.reports.preview_dataset'), [
            'type' => 'MOR',
            'periodType' => 'all',
            'title' => 'MOR Updated Test',
        ]);
        $preview2->assertStatus(200);
        $this->assertSame('MARIA CLARA MOR', $preview2->json('mr.issuedByName'));
        $this->assertSame('Director of Property', $preview2->json('mr.issuedByPosition'));
        $this->assertSame('Property Custodial Section', $preview2->json('mr.issuedByOffice'));
        $this->assertSame('Appendix 59-REVISED', $preview2->json('mr.appendixNumber'));

        // 4. Verify PDF Output
        $html = view('compliance.pdf.memorandum_receipt', [
            'mrData' => $preview2->json('mr'),
            'dataset' => $preview2->json(),
        ])->render();
        $this->assertStringContainsString('MARIA CLARA MOR', $html);
        $this->assertStringContainsString('DIRECTOR OF PROPERTY', strtoupper($html));
        $this->assertStringNotContainsString('INITIAL OFFICER', $html);
        $this->assertStringNotContainsString('ARSENIO GEM A. GARCILLANOSA', $html);
    }

    public function test_system_settings_changes_immediately_update_stock_card_custodian(): void
    {
        SystemSetting::set('signatories.stock_card_custodian', 'ROBERTO CUSTODIAN');

        $preview = $this->postJson(route('compliance.reports.preview_dataset'), [
            'type' => 'STOCK_CARD',
            'itemName' => 'Test Item',
            'periodType' => 'all',
        ]);
        $preview->assertStatus(200);
        $this->assertSame('ROBERTO CUSTODIAN', $preview->json('stockCard.custodian'));

        SystemSetting::set('signatories.stock_card_custodian', 'TERESA CUSTODIAN');

        $preview2 = $this->postJson(route('compliance.reports.preview_dataset'), [
            'type' => 'STOCK_CARD',
            'itemName' => 'Test Item',
            'periodType' => 'all',
        ]);
        $preview2->assertStatus(200);
        $this->assertSame('TERESA CUSTODIAN', $preview2->json('stockCard.custodian'));
    }

    public function test_saved_compliance_report_preserves_historical_signatory_snapshot(): void
    {
        // 1. Set current signatories
        SystemSetting::set('signatories.rsmi_certified_by_name', 'HISTORICAL CUSTODIAN');
        SystemSetting::set('signatories.rsmi_posted_by_name', 'HISTORICAL ACCOUNTANT');

        // 2. Save a report
        $saveRes = $this->post(route('compliance.reports.store'), [
            'title' => 'Historical RSMI Report',
            'type' => 'RSMI',
            'reference' => 'RSMI-HIST-001',
            'periodType' => 'monthly',
            'selectedMonth' => 9,
            'selectedYear' => 2026,
            'payload' => [
                'supplyCustodianName' => 'HISTORICAL CUSTODIAN',
                'accountingStaffName' => 'HISTORICAL ACCOUNTANT',
            ],
        ]);
        $saveRes->assertRedirect(route('compliance.reports'));

        $report = ComplianceReport::where('reference', 'RSMI-HIST-001')->firstOrFail();
        $this->assertSame('HISTORICAL CUSTODIAN', data_get($report->payload, 'supplyCustodianName'));
        $this->assertSame('HISTORICAL ACCOUNTANT', data_get($report->payload, 'accountingStaffName'));

        // 3. Admin Changes System Settings
        SystemSetting::set('signatories.rsmi_certified_by_name', 'NEW MODERN CUSTODIAN');
        SystemSetting::set('signatories.rsmi_posted_by_name', 'NEW MODERN ACCOUNTANT');

        // 4. Reload saved report from database and verify it still preserves the historical snapshot
        $report->refresh();
        $this->assertSame('HISTORICAL CUSTODIAN', data_get($report->payload, 'supplyCustodianName'));
        $this->assertSame('HISTORICAL ACCOUNTANT', data_get($report->payload, 'accountingStaffName'));

        // 5. Newly generated preview must use the new modern names
        $preview = $this->postJson(route('compliance.reports.preview_dataset'), [
            'type' => 'RSMI',
            'periodType' => 'monthly',
            'selectedMonth' => 9,
            'selectedYear' => 2026,
        ]);
        $this->assertSame('NEW MODERN CUSTODIAN', $preview->json('rsmi.supplyCustodianName'));
        $this->assertSame('NEW MODERN ACCOUNTANT', $preview->json('rsmi.accountingStaffName'));
    }

    public function test_centralized_signatories_service_resolves_all_forms_correctly(): void
    {
        SystemSetting::set('signatories.rsmi_certified_by_name', 'RSMI CUSTODIAN');
        SystemSetting::set('signatories.rpci_accountable_officer_name', 'RPCI OFFICER');
        SystemSetting::set('signatories.mor_issued_by_name', 'MOR ISSUER');
        SystemSetting::set('signatories.stock_card_custodian', 'SC CUSTODIAN');

        $service = app(SystemSettingsService::class);

        $rsmi = $service->getSignatoriesForForm('RSMI');
        $this->assertSame('RSMI CUSTODIAN', $rsmi['supplyCustodianName']);

        $rpci = $service->getSignatoriesForForm('RPCI');
        $this->assertSame('RPCI OFFICER', $rpci['accountable_officer']);
        $this->assertSame('RPCI OFFICER', $rpci['approved_by_name']);

        $mor = $service->getSignatoriesForForm('MOR');
        $this->assertSame('MOR ISSUER', $mor['issuedByName']);

        $sc = $service->getSignatoriesForForm('STOCK_CARD');
        $this->assertSame('SC CUSTODIAN', $sc['custodian']);
    }
}
