<?php

namespace Tests\Feature\Compliance;

use App\Models\ComplianceReport;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompliancePdfExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();
    }

    public function test_can_export_rsmi_pdf_report()
    {
        $response = $this->postJson(route('compliance.reports.export_pdf'), [
            'type' => 'RSMI',
            'periodType' => 'monthly',
            'selectedMonth' => 9,
            'selectedYear' => 2026,
            'title' => 'RSMI Test Report',
            'reference' => 'RSMI-2026-09-0001',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_can_export_yearly_rsmi_pdf_report()
    {
        $response = $this->postJson(route('compliance.reports.export_pdf'), [
            'type' => 'RSMI',
            'periodType' => 'yearly',
            'selectedYear' => 2026,
            'title' => 'Yearly RSMI 2026',
            'reference' => 'RSMI-2026-YEARLY',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_can_export_rpci_pdf_report()
    {
        $response = $this->postJson(route('compliance.reports.export_pdf'), [
            'type' => 'RPCI',
            'periodType' => 'yearly',
            'selectedYear' => 2026,
            'title' => 'RPCI Report 2026',
            'reference' => 'RPCI-2026-0001',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_can_export_stock_card_pdf_report()
    {
        $response = $this->postJson(route('compliance.reports.export_pdf'), [
            'type' => 'STOCK_CARD',
            'periodType' => 'all',
            'itemName' => 'Paper A4',
            'title' => 'Stock Card - Paper A4',
            'reference' => 'SC-PAPER-A4',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_can_export_memorandum_receipt_pdf_report()
    {
        $response = $this->postJson(route('compliance.reports.export_pdf'), [
            'type' => 'MR',
            'periodType' => 'all',
            'endUser' => 'Juan Dela Cruz',
            'title' => 'MR - Juan Dela Cruz',
            'reference' => 'MR-2026-0001',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_can_export_inventory_custodian_slip_pdf_report()
    {
        $response = $this->postJson(route('compliance.reports.export_pdf'), [
            'type' => 'ICS',
            'periodType' => 'all',
            'title' => 'ICS Test Report',
            'reference' => 'ICS-2026-0001',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_can_export_property_acknowledgement_receipt_pdf_report()
    {
        $response = $this->postJson(route('compliance.reports.export_pdf'), [
            'type' => 'PAR',
            'periodType' => 'all',
            'title' => 'PAR Test Report',
            'reference' => 'PAR-2026-0001',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_can_export_requisition_issue_slip_pdf_report()
    {
        $response = $this->postJson(route('compliance.reports.export_pdf'), [
            'type' => 'RIS',
            'periodType' => 'all',
            'title' => 'RIS Test Report',
            'reference' => 'RIS-2026-0001',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_can_export_inspection_acceptance_report_pdf_report()
    {
        $response = $this->postJson(route('compliance.reports.export_pdf'), [
            'type' => 'IAR',
            'periodType' => 'all',
            'title' => 'IAR Test Report',
            'reference' => 'IAR-2026-0001',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_can_export_purchase_order_pdf_report()
    {
        $response = $this->postJson(route('compliance.reports.export_pdf'), [
            'type' => 'PO',
            'periodType' => 'all',
            'title' => 'PO Test Report',
            'reference' => 'PO-2026-0001',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }
}
