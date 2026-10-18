<?php

namespace Tests\Feature;

use App\Models\ComplianceReport;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\DocumentNumberService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Services\InventoryIssuanceService;
use Modules\Inventory\Services\SupplyRequestService;
use Tests\TestCase;

class DocumentNumberingTest extends TestCase
{
    use RefreshDatabase;

    public function test_legacy_prefix_settings_do_not_override_year_first_numbers_or_suggestions(): void
    {
        $this->withoutMiddleware();
        $this->withoutVite();
        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'System Admin']);
        $user = User::factory()->create();
        $user->assignRole($role);
        $settings = [];
        foreach (['ris', 'rsmi', 'rpci', 'stock_card', 'mor'] as $key) {
            $settings['numbering.'.$key.'_prefix'] = strtoupper($key).'-CUSTOM-';
        }
        $this->actingAs($user)->post('/admin/system-settings', ['settings' => $settings])
            ->assertSessionHasNoErrors()->assertRedirect();
        foreach (['RSMI' => '2026-10-001', 'RPCI' => '2026-001', 'MR' => '2026-0001', 'STOCK_CARD' => '2026-00001'] as $type => $expected) {
            $this->post(route('compliance.reports.store'), [
                'title' => $type, 'type' => $type, 'periodType' => 'all', 'generatedDate' => '2026-10-01',
            ])->assertSessionHasNoErrors()->assertRedirect();
            $this->assertDatabaseHas('compliance_reports', ['type' => $type, 'reference' => $expected]);
        }
        $this->assertSame('2026-10-0001', SupplyRequestService::generateOfficialRisNumber('2026-10-01'));
        $this->travelTo(\Carbon\Carbon::parse('2026-10-19 12:00:00'));
        $this->get('/admin/system-settings')->assertInertia(fn ($page) => $page
            ->where('numberingPreviews', fn ($values) => $values['RIS'] === '2026-10-0002' && $values['RPCI'] === '2026-002')
            ->has('numberingPreviews', 5));
        $this->assertDatabaseCount('document_number_reservations', 5);
    }

    public function test_previews_do_not_reserve_and_all_types_follow_their_reset_rules(): void
    {
        $numbers = app(DocumentNumberService::class);
        foreach (['RIS' => '2026-10-0001', 'RSMI' => '2026-10-001', 'RPCI' => '2026-001', 'MR' => '2026-0001', 'STOCK_CARD' => '2026-00001'] as $type => $expected) {
            $this->assertSame($expected, $numbers->preview($type, '2026-10-01'));
            $this->assertSame($expected, $numbers->preview($type, '2026-10-01'));
            $this->assertSame($expected, $numbers->reserve($type, '2026-10-01'));
        }
        $this->assertDatabaseCount('document_number_reservations', 5);
        $this->assertSame('2026-11-0001', $numbers->reserve('RIS', '2026-11-01'));
        $this->assertSame('2026-11-001', $numbers->reserve('RSMI', '2026-11-01'));
        $this->assertSame('2026-002', $numbers->reserve('RPCI', '2026-11-01'));
        $this->assertSame('2026-0002', $numbers->reserve('MOR', '2026-11-01'));
        $this->assertSame('2027-001', $numbers->reserve('RPCI', '2027-01-01'));
        $this->assertSame('2027-0001', $numbers->reserve('MR', '2027-01-01'));
        $this->assertSame('2027-00002', $numbers->reserve('STOCKCARD', '2027-01-01'));
    }

    public function test_legacy_prefix_changes_cannot_override_year_first_numbers_or_rewrite_reports(): void
    {
        $user = User::factory()->create();
        $numbers = app(DocumentNumberService::class);
        $reference = $numbers->reserve('MR', '2026-10-01');
        $report = ComplianceReport::create(['title' => 'Saved MR', 'type' => 'MR', 'reference' => $reference, 'period_type' => 'all', 'created_by' => $user->id]);
        SystemSetting::set('numbering.mor_prefix', 'NEW-MR-');
        $this->assertSame('2026-0002', $numbers->reserve('MOR', '2026-10-01'));
        $this->assertSame('2026-0001', $report->fresh()->reference);
    }

    public function test_existing_high_numbers_and_deleted_documents_are_not_reused(): void
    {
        $user = User::factory()->create();
        $report = ComplianceReport::create(['title' => 'Legacy', 'type' => 'RPCI', 'reference' => 'RPCI-2026-042', 'period_type' => 'all', 'created_by' => $user->id]);
        $numbers = app(DocumentNumberService::class);
        $this->assertSame('2026-043', $numbers->reserve('RPCI', '2026-10-01'));
        $this->assertSame('RPCI-2026-042', $report->fresh()->reference);
        $report->delete();
        $this->assertSame('2026-044', $numbers->reserve('RPCI', '2026-10-01'));
    }

    public function test_failed_transaction_rolls_back_its_counter_and_reservation(): void
    {
        DB::beginTransaction();
        app(DocumentNumberService::class)->reserve('MR', '2026-10-01');
        DB::rollBack();
        $this->assertSame('2026-0001', app(DocumentNumberService::class)->reserve('MR', '2026-10-01'));
    }

    public function test_different_types_cannot_reserve_the_same_year_first_number(): void
    {
        SystemSetting::set('numbering.mor_prefix', 'SAME-');
        SystemSetting::set('numbering.rpci_prefix', 'SAME-');
        $numbers = app(DocumentNumberService::class);
        // Both series eventually format four-digit sequences, even though RPCI starts at width 3.
        $numbers->reserve('MR', '2026-10-01', '2026-1000');
        DB::table('document_number_sequences')->insert(['series' => 'RPCI:2026', 'last_number' => 999]);
        $this->assertSame('2026-1001', $numbers->reserve('RPCI', '2026-10-01'));
    }

    public function test_stale_preview_is_replaced_at_save_and_all_snapshot_headers_follow_it(): void
    {
        $this->withoutMiddleware();
        $user = User::factory()->create();
        $numbers = app(DocumentNumberService::class);
        $preview = $numbers->preview('RSMI', '2026-10-01');
        $numbers->reserve('RSMI', '2026-10-01');
        SystemSetting::set('numbering.rsmi_prefix', 'UPDATED-');
        $this->actingAs($user)->post(route('compliance.reports.store'), [
            'title' => 'Stale preview', 'type' => 'RSMI', 'periodType' => 'all',
            'generatedDate' => '2026-10-01', 'reference' => $preview, 'automaticReference' => true,
            'snapshot' => ['reference' => $preview, 'rsmi' => ['forms' => [['serialNo' => $preview], ['serialNo' => 'OLD']]]],
        ])->assertSessionHasNoErrors()->assertRedirect();
        $report = ComplianceReport::where('title', 'Stale preview')->firstOrFail();
        $this->assertSame('2026-10-002', $report->reference);
        $this->assertSame($report->reference, data_get($report->payload, 'snapshot.reference'));
        $this->assertSame($report->reference, data_get($report->payload, 'rsmi.forms.0.serialNo'));
        $this->assertSame($report->reference.'-P2', data_get($report->payload, 'rsmi.forms.1.serialNo'));
    }

    public function test_direct_issuance_skips_pending_ris_and_release_keeps_its_original_number(): void
    {
        $user = User::factory()->create();
        $item = Item::create(['name' => 'Paper', 'sku' => 'NUM-PAPER', 'stock' => 10, 'unit_cost' => 10, 'amount' => 100, 'status' => 'Available', 'unit_of_issue' => 'ream']);
        $reserved = SupplyRequestService::generateOfficialRisNumber('2026-10-01');
        $request = SupplyRequest::create(['ris_number' => $reserved, 'requested_by' => $user->id, 'department' => 'Office', 'purpose' => 'Test', 'status' => 'Approved', 'date_requested' => '2026-10-01']);
        $service = app(InventoryIssuanceService::class);
        $data = ['date_issued' => '2026-10-01', 'recipient' => 'Office'];
        $lines = [['item_id' => $item->id, 'quantity' => 1]];
        $direct = $service->issue($data, $lines, $user->id);
        $this->assertSame('2026-10-0002', $direct->ris_number);
        SystemSetting::set('numbering.ris_prefix', 'NEW-RIS-');
        $released = $service->issue($data + ['ris_number' => $reserved, 'supply_request_id' => $request->id], $lines, $user->id);
        $this->assertSame($reserved, $released->ris_number);
        $this->assertSame('2026-10-0003', app(DocumentNumberService::class)->preview('RIS', '2026-10-01'));
        $this->assertSame(2, Issuance::count());
    }
}
