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

    public function test_saved_manage_reports_export_with_dompdf_even_when_display_date_is_not_machine_parseable(): void
    {
        $cases = [
            'RSMI' => [
                'snapshot' => [
                    'entityName' => 'University of Camarines Norte',
                    'fundCluster' => '01 - Regular Agency Fund',
                    'rsmi' => [
                        'issuedItems' => [],
                        'recapitulationItems' => [],
                    ],
                ],
            ],
            'RPCI' => [
                'snapshot' => [
                    'entity_name' => 'University of Camarines Norte',
                    'fund_cluster' => '01 - Regular Agency Fund',
                    'rpci' => ['items' => []],
                ],
            ],
            'STOCK_CARD' => [
                'snapshot' => [
                    'entity_name' => 'University of Camarines Norte',
                    'fund_cluster' => '01 - Regular Agency Fund',
                    'stockCard' => ['entries' => []],
                ],
            ],
            'MR' => [
                'snapshot' => [
                    'entityName' => 'University of Camarines Norte',
                    'fundCluster' => '01 - Regular Agency Fund',
                    'mr' => ['items' => []],
                ],
            ],
        ];

        foreach ($cases as $type => $payload) {
            $report = ComplianceReport::create([
                'title' => "{$type} saved export regression",
                'type' => $type,
                'reference' => "{$type}-2026-TEST",
                'period_type' => 'range',
                'date' => '2026-10-01',
                'start_date' => '2026-10-01',
                'end_date' => '2026-10-31',
                'coverage_label' => 'October 1–31, 2026',
                'payload' => $payload,
            ]);

            $response = $this->postJson(route('compliance.reports.export_pdf'), [
                'report_id' => $report->id,
                // Older cached clients may still submit this display-only value.
                'date' => $report->coverage_label,
            ]);

            $response->assertOk();
            $response->assertHeader('content-type', 'application/pdf');
            $this->assertStringStartsWith('%PDF-', $response->getContent());
            $pdfContent = $response->getContent();
            $this->assertTrue(
                str_contains(strtolower($pdfContent), 'dompdf')
                    || str_contains($pdfContent, "\x00d\x00o\x00m\x00p\x00d\x00f"),
                "{$type} saved report did not use the server PDF renderer.",
            );
        }
    }

    public function test_rsmi_pdf_preserves_the_full_official_ris_number()
    {
        $form = [
            'issuedItems' => [
                [
                    'risNo' => 'RIS-2026-09-0028',
                    'responsibilityCenterCode' => 'CCMS',
                    'stockNo' => 'NBS-26-09-032-0010',
                    'itemDescription' => 'Toner Cartridge',
                    'unit' => 'piece',
                    'quantityIssued' => 2,
                    'unitCost' => 350,
                    'amount' => 700,
                ],
            ],
            'recapitulationItems' => [],
        ];

        $html = view('compliance.pdf.rsmi', ['forms' => [$form]])->render();

        $this->assertStringContainsString('RIS-2026-09-0028', $html);
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
        \App\Models\SystemSetting::set('signatories.rpci_accountable_officer_name', 'ARSENIO GEM A. GARCILLANOSA');
        \App\Models\SystemSetting::set('signatories.rpci_accountable_officer_designation', 'SUPPLY OFFICER III / ADMIN OFFICER V');
        \App\Models\SystemSetting::set('institution.name', 'UNIVERSITY OF CAMARINES NORTE');

        $response = $this->postJson(route('compliance.reports.export_pdf'), [
            'type' => 'RPCI',
            'periodType' => 'yearly',
            'selectedYear' => 2026,
            'title' => 'RPCI Report 2026',
            'reference' => 'RPCI-2026-0001',
            'payload' => [
                'rpci' => [
                    'accountable_officer' => 'ARSENIO GEM A. GARCILLANOSA',
                    'designation' => 'SUPPLY OFFICER III / ADMIN OFFICER V',
                    'entity_name' => 'UNIVERSITY OF CAMARINES NORTE',
                    'fund_cluster' => '01 - REGULAR AGENCY FUND',
                ]
            ]
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
