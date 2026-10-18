<?php

namespace Tests\Feature;

use App\Http\Controllers\Compliance\ComplianceReportController;
use App\Models\ComplianceReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComplianceReportAutomationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();
    }

    public function test_reference_preview_starts_with_year_and_uses_existing_maximum(): void
    {
        $today = now()->format('Y-m-d');
        $month = now()->format('Y-m');

        // First report for today should have sequence 0001
        $ref1 = ComplianceReportController::generateReference($today);
        $this->assertSame("{$month}-001", $ref1);

        // Create a report with that reference
        $user = User::factory()->create();
        ComplianceReport::create([
            'title' => 'Test Report 1',
            'type' => 'RSMI',
            'reference' => $ref1,
            'period_type' => 'specific',
            'date' => $today,
            'created_by' => $user->id,
        ]);

        // Second report for same date should have sequence 0002
        $ref2 = ComplianceReportController::generateReference($today);
        $this->assertSame("{$month}-002", $ref2);

        // Create another report
        ComplianceReport::create([
            'title' => 'Test Report 2',
            'type' => 'RSMI',
            'reference' => $ref2,
            'period_type' => 'specific',
            'date' => $today,
            'created_by' => $user->id,
        ]);

        // Third report for same date should have sequence 0003
        $ref3 = ComplianceReportController::generateReference($today);
        $this->assertSame("{$month}-003", $ref3);
    }

    public function test_store_endpoint_automatically_generates_reference_when_omitted(): void
    {
        $user = User::factory()->create();
        $date = '2026-08-24';

        $response = $this->actingAs($user)->post(route('compliance.reports.store'), [
            'title' => 'Automated Reference Report',
            'type' => 'RSMI',
            'periodType' => 'specific',
            'date' => $date,
        ]);

        $response->assertRedirect(route('compliance.reports'));

        $this->assertDatabaseHas('compliance_reports', [
            'title' => 'Automated Reference Report',
            'type' => 'RSMI',
            'reference' => '2026-08-001',
        ]);
    }

    public function test_store_endpoint_uses_independent_document_series(): void
    {
        $user = User::factory()->create();
        $date = '2026-08-24';

        // 1st store
        $this->actingAs($user)->post(route('compliance.reports.store'), [
            'title' => 'Report 1',
            'type' => 'RSMI',
            'periodType' => 'specific',
            'date' => $date,
        ]);

        // 2nd store
        $this->actingAs($user)->post(route('compliance.reports.store'), [
            'title' => 'Report 2',
            'type' => 'STOCK_CARD',
            'periodType' => 'specific',
            'date' => $date,
        ]);

        $this->assertDatabaseHas('compliance_reports', [
            'title' => 'Report 1',
            'reference' => '2026-08-001',
        ]);

        $this->assertDatabaseHas('compliance_reports', [
            'title' => 'Report 2',
            'reference' => '2026-00001',
        ]);
    }

    public function test_store_endpoint_replaces_a_word_prefixed_reference_with_a_year_first_number(): void
    {
        $user = User::factory()->create();
        $date = '2026-08-24';

        $response = $this->actingAs($user)->post(route('compliance.reports.store'), [
            'title' => 'Custom Ref Report',
            'type' => 'MR',
            'reference' => 'CUSTOM-REF-999',
            'periodType' => 'specific',
            'date' => $date,
        ]);

        $response->assertRedirect(route('compliance.reports'));

        $this->assertDatabaseHas('compliance_reports', [
            'title' => 'Custom Ref Report',
            'reference' => '2026-0001',
        ]);
    }
}
