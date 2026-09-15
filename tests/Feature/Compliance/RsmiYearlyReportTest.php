<?php

namespace Tests\Feature\Compliance;

use App\Models\Compliance\RsmiMigratedRecord;
use App\Models\ComplianceReport;
use App\Models\User;
use App\Services\Compliance\ComplianceReportDataService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RsmiYearlyReportTest extends TestCase
{
    use RefreshDatabase;

    protected ComplianceReportDataService $dataService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();
        $this->dataService = app(ComplianceReportDataService::class);
    }

    public function test_rsmi_monthly_period_type_returns_single_month_dataset(): void
    {
        RsmiMigratedRecord::create([
            'serial_no' => 'RSMI-2024-01-001',
            'ris_no' => 'RIS-2024-001',
            'entity_name' => 'University of Camarines Norte',
            'fund_cluster' => '01 - Regular Agency Fund',
            'center_code' => 'CCMS',
            'stock_no' => 'SUP-101',
            'item' => 'Paper A4',
            'unit' => 'ream',
            'quantity_issued' => 10,
            'unit_cost' => 250.00,
            'amount' => 2500.00,
            'date' => '2024-01-15',
        ]);

        $dataset = $this->dataService->getReportDataset([
            'type' => 'RSMI',
            'periodType' => 'monthly',
            'selectedMonth' => 1,
            'selectedYear' => 2024,
        ]);

        $this->assertEquals('RSMI', $dataset['type']);
        $this->assertEquals('monthly', $dataset['periodType']);
        $this->assertArrayHasKey('monthly', $dataset);
        $this->assertArrayHasKey('forms', $dataset);
        $this->assertCount(1, $dataset['forms']);
        $this->assertEquals('2024-01-001', $dataset['forms'][0]['serialNo']);
        $this->assertEquals('January 1–31, 2024', $dataset['forms'][0]['periodLabel']);
    }

    public function test_rsmi_yearly_period_type_returns_12_monthly_report_datasets(): void
    {
        // Jan record
        RsmiMigratedRecord::create([
            'serial_no' => 'RIS-JAN',
            'ris_no' => 'RIS-JAN-01',
            'stock_no' => 'SUP-JAN',
            'item' => 'January Item',
            'quantity_issued' => 5,
            'unit_cost' => 100.00,
            'amount' => 500.00,
            'date' => '2024-01-10',
        ]);

        // Feb record (Leap year 2024)
        RsmiMigratedRecord::create([
            'serial_no' => 'RIS-FEB',
            'ris_no' => 'RIS-FEB-01',
            'stock_no' => 'SUP-FEB',
            'item' => 'February Item',
            'quantity_issued' => 8,
            'unit_cost' => 150.00,
            'amount' => 1200.00,
            'date' => '2024-02-29',
        ]);

        // Dec record
        RsmiMigratedRecord::create([
            'serial_no' => 'RIS-DEC',
            'ris_no' => 'RIS-DEC-01',
            'stock_no' => 'SUP-DEC',
            'item' => 'December Item',
            'quantity_issued' => 12,
            'unit_cost' => 200.00,
            'amount' => 2400.00,
            'date' => '2024-12-31',
        ]);

        $dataset = $this->dataService->getReportDataset([
            'type' => 'RSMI',
            'periodType' => 'yearly',
            'selectedYear' => 2024,
        ]);

        $this->assertEquals('RSMI', $dataset['type']);
        $this->assertEquals('yearly', $dataset['periodType']);
        $this->assertArrayHasKey('yearly', $dataset);

        $yearly = $dataset['yearly'];
        $this->assertEquals(2024, $yearly['year']);
        $this->assertCount(12, $yearly['months']);
        $this->assertEquals(3, $yearly['active_months']);

        // Check January month
        $jan = $yearly['months'][0];
        $this->assertEquals(1, $jan['month']);
        $this->assertEquals('January', $jan['month_name']);
        $this->assertEquals('January 1–31, 2024', $jan['period_label']);
        $this->assertTrue($jan['has_records']);
        $this->assertCount(1, $jan['forms']);
        $this->assertEquals('2024-01-001', $jan['forms'][0]['serialNo']);

        // Check February month (leap year 2024 should be Feb 1–29, 2024)
        $feb = $yearly['months'][1];
        $this->assertEquals(2, $feb['month']);
        $this->assertEquals('February', $feb['month_name']);
        $this->assertEquals('February 1–29, 2024', $feb['period_label']);
        $this->assertTrue($feb['has_records']);

        // Check March (empty month)
        $mar = $yearly['months'][2];
        $this->assertEquals(3, $mar['month']);
        $this->assertFalse($mar['has_records']);
        $this->assertEmpty($mar['forms']);

        // Check December
        $dec = $yearly['months'][11];
        $this->assertEquals(12, $dec['month']);
        $this->assertEquals('December 1–31, 2024', $dec['period_label']);
        $this->assertTrue($dec['has_records']);
    }

    public function test_rsmi_month_with_over_10_items_paginates_into_multiple_forms(): void
    {
        // Create 25 records in December 2024
        for ($i = 1; $i <= 25; $i++) {
            RsmiMigratedRecord::create([
                'serial_no' => "RIS-2024-12-{$i}",
                'ris_no' => "RIS-2024-12-{$i}",
                'stock_no' => "ITEM-{$i}",
                'item' => "December Item {$i}",
                'quantity_issued' => 1,
                'unit_cost' => 50.00,
                'amount' => 50.00,
                'date' => '2024-12-15',
            ]);
        }

        $mDataset = $this->dataService->buildMonthlyRsmiDataset(2024, 12);

        $this->assertTrue($mDataset['has_records']);
        $this->assertEquals(25, $mDataset['record_count']);
        // 25 items chunked into 10 items max per form page = 3 forms
        $this->assertCount(3, $mDataset['forms']);

        $this->assertEquals('2024-12-001', $mDataset['forms'][0]['serialNo']);
        $this->assertCount(10, $mDataset['forms'][0]['issuedItems']);

        $this->assertEquals('2024-12-002', $mDataset['forms'][1]['serialNo']);
        $this->assertCount(10, $mDataset['forms'][1]['issuedItems']);

        $this->assertEquals('2024-12-003', $mDataset['forms'][2]['serialNo']);
        $this->assertCount(5, $mDataset['forms'][2]['issuedItems']);
    }

    public function test_storing_yearly_rsmi_saves_single_report_record_with_package_snapshot(): void
    {
        $user = User::factory()->create();

        RsmiMigratedRecord::create([
            'serial_no' => 'RIS-2024-001',
            'ris_no' => 'RIS-2024-001',
            'stock_no' => 'SUP-999',
            'item' => 'Test Paper',
            'quantity_issued' => 10,
            'unit_cost' => 100.00,
            'amount' => 1000.00,
            'date' => '2024-05-10',
        ]);

        $response = $this->actingAs($user)->post(route('compliance.reports.store'), [
            'title' => 'RSMI Yearly Report 2024',
            'type' => 'RSMI',
            'periodType' => 'yearly',
            'selectedYear' => 2024,
            'generatedDate' => '2026-09-16',
        ]);

        $response->assertRedirect(route('compliance.reports'));

        $this->assertDatabaseHas('compliance_reports', [
            'type' => 'RSMI',
            'period_type' => 'yearly',
            'selected_year' => 2024,
            'coverage_label' => 'Year 2024',
        ]);

        $report = ComplianceReport::where('period_type', 'yearly')->first();
        $this->assertNotNull($report);
        $this->assertArrayHasKey('yearly', $report->payload['snapshot']);
        $this->assertEquals(2024, $report->payload['snapshot']['yearly']['year']);
        $this->assertCount(12, $report->payload['snapshot']['yearly']['months']);
    }
}
