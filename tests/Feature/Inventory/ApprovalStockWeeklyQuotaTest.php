<?php

namespace Tests\Feature\Inventory;

use App\Models\CoordinatorStock;
use App\Models\Signatory;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\Compliance\ComplianceReportDataService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\RequestBatchAllocation;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Services\InventoryBalanceService;
use Modules\Inventory\Services\InventoryIssuanceService;
use Modules\Inventory\Services\RequestStockAllocation;
use Modules\Inventory\Services\SupplyRequestService;
use Modules\Inventory\Services\WeeklyRequestQuota;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ApprovalStockWeeklyQuotaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Storage::fake('local');
        SystemSetting::set('mail.low_stock_email_alerts', false);
        SystemSetting::set('inventory.low_stock_threshold', 10);
        Carbon::setTestNow(Carbon::parse('2026-11-19 12:00', config('app.timezone')));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public static function roles(): array
    {
        return [['Authorized Personnel'], ['Supply Coordinator'], ['Inventory Staff']];
    }

    private function user(string $role): User
    {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $user = User::factory()->create(['is_active' => true, 'department' => 'Registrar']);
        $user->assignRole($role);
        $head = Signatory::firstOrCreate(['name' => 'Unit Head'], ['designation' => 'Head', 'is_active' => true]);
        $user->update(['office_head_id' => $head->id]);
        if ($role === 'Inventory Staff') {
            foreach (['index', 'store', 'update', 'cancel', 'approve', 'reject', 'release', 'verify-document', 'ready'] as $action) {
                $user->givePermissionTo(Permission::firstOrCreate(['name' => 'route:inventory.requests.'.$action, 'guard_name' => 'web']));
            }
        }

        return $user;
    }

    private function item(?int $cap = 20, int $stock = 100): Item
    {
        return Item::create(['name' => 'Pens '.Item::count(), 'sku' => 'QUOTA-'.Item::count(), 'stock' => $stock,
            'unit_of_issue' => 'piece', 'unit_cost' => 2, 'amount' => $stock * 2, 'weekly_request_limit' => $cap]);
    }

    private function payload(User $user, Item $item, int $quantity): array
    {
        $data = ['department' => 'Registrar', 'purpose' => 'Office work', 'items' => [['item_id' => $item->id, 'quantity' => $quantity]]];
        if ($user->requiresSupportingDocument()) {
            $data += ['supporting_document_type' => 'Approved Letter', 'supporting_document' => UploadedFile::fake()->createWithContent('approved.pdf', "%PDF-1.4\n%%EOF")];
        }

        return $data;
    }

    private function submit(User $user, Item $item, int $quantity): SupplyRequest
    {
        $this->actingAs($user)->post(route('inventory.requests.store'), $this->payload($user, $item, $quantity))->assertSessionHasNoErrors();

        return SupplyRequest::latest('id')->firstOrFail();
    }

    private function approve(User $staff, SupplyRequest $request, int $quantity): void
    {
        $this->actingAs($staff);
        if ($request->fresh()->status === 'Pending Verification') {
            $this->post(route('inventory.requests.verify-document', $request), ['decision' => 'verified'])->assertSessionHasNoErrors();
        }
        $this->post(route('inventory.requests.approve', $request), ['approved_quantities' => [$request->items()->firstOrFail()->id => $quantity]])->assertSessionHasNoErrors();
    }

    #[DataProvider('roles')]
    public function test_approval_deducts_once_and_signed_release_only_credits_recipient(string $role): void
    {
        $user = $this->user($role);
        $staff = $this->user('Inventory Staff');
        $item = $this->item();
        $request = $this->submit($user, $item, 15);
        $this->assertSame(100, $item->fresh()->stock);
        $this->approve($staff, $request, 15);
        $this->assertSame(85, $item->fresh()->stock);
        $this->assertSame(15, (int) RequestBatchAllocation::where('state', 'allocated')->sum('quantity'));
        $this->assertSame(0, SupplyRequestService::reservedQuantity($item->id));
        $this->assertTrue(app(InventoryBalanceService::class)->verifyConsistency($item->fresh()));
        $this->assertDatabaseCount('coordinator_stocks', 0);
        if ($request->requires_supporting_document) {
            $this->post(route('inventory.requests.ready', $request))->assertSessionHasNoErrors();
        }
        $this->post(route('inventory.requests.release', $request), ['signed_ris_presented' => true])->assertSessionHasNoErrors();
        $this->assertSame(85, $item->fresh()->stock);
        $this->assertSame(15, WeeklyRequestQuota::usage($user->id)[$item->id]);
        $this->assertSame(0, WeeklyRequestQuota::usage($staff->id)[$item->id] ?? 0);
        if ($user->usesCoordinatorInventory()) {
            $this->assertSame(15, CoordinatorStock::where('coordinator_id', $user->id)->value('quantity'));
        }
        $this->post(route('inventory.requests.release', $request), ['signed_ris_presented' => true])->assertSessionHasErrors('request');
        $this->assertSame(85, $item->fresh()->stock);
        $this->assertDatabaseCount('issuances', 1);
    }

    #[DataProvider('roles')]
    public function test_split_pending_requests_share_each_items_weekly_allowance(string $role): void
    {
        $user = $this->user($role);
        $item = $this->item(20);
        $otherItem = $this->item(5);
        $request = $this->submit($user, $item, 15);
        $this->actingAs($user)->post(route('inventory.requests.store'), $this->payload($user, $item, 6))->assertSessionHasErrors('items.0.quantity');
        $this->submit($user, $otherItem, 5);
        $this->actingAs($user)->post(route('inventory.requests.store'), $this->payload($user, $otherItem, 1))->assertSessionHasErrors('items.0.quantity');
        $this->post(route('inventory.requests.cancel', $request))->assertSessionHasNoErrors();
        $this->submit($user, $item, 20);
        $this->assertSame(100, $item->fresh()->stock);
    }

    #[DataProvider('roles')]
    public function test_partial_approval_locks_quantities_and_cancellation_restores_exact_balances(string $role): void
    {
        $user = $this->user($role);
        $staff = $this->user('Inventory Staff');
        $item = $this->item();
        $request = $this->submit($user, $item, 20);
        $this->approve($staff, $request, 10);
        $line = $request->items()->firstOrFail();
        $approval = $request->fresh()->only(['ris_number', 'reviewed_at', 'reviewed_by', 'review_remarks', 'stock_allocated_at']);
        $allocations = RequestBatchAllocation::orderBy('id')->get()->toArray();
        $statuses = $request->requires_supporting_document ? ['Approved', 'Ready for Pickup'] : ['Approved'];
        foreach ($statuses as $status) {
            if ($status === 'Ready for Pickup') {
                $this->post(route('inventory.requests.ready', $request))->assertSessionHasNoErrors();
            }
            foreach ([10, 15, 8, 0] as $quantity) {
                $this->post(route('inventory.requests.approve', $request), [
                    'approved_quantities' => [$line->id => $quantity], 'remarks' => 'Attempted revision',
                ])->assertSessionHasErrors('request');
                $this->assertSame($status, $request->fresh()->status);
                $this->assertSame(10, $line->fresh()->approved_quantity);
                $this->assertEquals($approval, $request->fresh()->only(array_keys($approval)));
                $this->assertSame(90, $item->fresh()->stock);
                $this->assertSame($allocations, RequestBatchAllocation::orderBy('id')->get()->toArray());
                $this->assertSame(10, WeeklyRequestQuota::usage($user->id)[$item->id]);
            }
        }
        $this->actingAs($user)->post(route('inventory.requests.cancel', $request))->assertSessionHasNoErrors();
        $this->assertSame(100, $item->fresh()->stock);
        $this->post(route('inventory.requests.cancel', $request))->assertSessionHasNoErrors();
        $this->assertSame(100, $item->fresh()->stock);
        $this->assertSame([], WeeklyRequestQuota::usage($user->id));
    }

    public function test_edit_keeps_original_week_and_does_not_count_itself_twice(): void
    {
        $user = $this->user('Supply Coordinator');
        $item = $this->item();
        $request = $this->submit($user, $item, 20);
        $week = $request->quota_week_start;
        $payload = $this->payload($user, $item, 20) + ['date_requested' => '2026-12-25'];
        $this->put(route('inventory.requests.update', $request), $payload)->assertSessionHasNoErrors();
        $this->assertSame($week, $request->fresh()->quota_week_start);
        $this->assertSame(20, WeeklyRequestQuota::usage($user->id)[$item->id]);
        Carbon::setTestNow(Carbon::parse('2026-11-23 00:00', config('app.timezone')));
        $new = $this->submit($user, $item, 20);
        $this->assertNotSame($week, $new->quota_week_start);
        $this->post(route('inventory.requests.cancel', $request))->assertSessionHasNoErrors();
        $this->assertSame(20, WeeklyRequestQuota::usage($user->id)[$item->id]);
    }

    public function test_missing_limit_and_zero_limit_block_submission_and_retries_do_not_duplicate(): void
    {
        $user = $this->user('Supply Coordinator');
        foreach ([null, 0] as $cap) {
            $item = $this->item($cap);
            $this->actingAs($user)->post(route('inventory.requests.store'), $this->payload($user, $item, 1))->assertSessionHasErrors('items.0.quantity');
        }
        $item = $this->item();
        $data = $this->payload($user, $item, 15) + ['submission_key' => '11111111-1111-4111-8111-111111111111'];
        $this->post(route('inventory.requests.store'), $data)->assertSessionHasNoErrors();
        $this->post(route('inventory.requests.store'), $data)->assertSessionHasNoErrors();
        $this->assertDatabaseCount('supply_requests', 1);
        $this->assertSame(15, WeeklyRequestQuota::usage($user->id)[$item->id]);
    }

    public function test_pending_edit_can_increase_quantity_within_its_remaining_allowance(): void
    {
        $user = $this->user('Supply Coordinator');
        $item = $this->item(30);
        $request = $this->submit($user, $item, 20);
        $review = RequestStockAllocation::decorateReview($request->load('items.item'));
        $this->assertSame(30, $review->items->first()->max_request_quantity);
        $this->assertSame(20, $review->items->first()->max_approval_quantity);
        $this->put(route('inventory.requests.update', $request), $this->payload($user, $item, 25))->assertSessionHasNoErrors();
        $this->assertSame(25, WeeklyRequestQuota::usage($user->id)[$item->id]);
        $this->assertSame(100, $item->fresh()->stock);
    }

    public function test_reports_keep_approved_supplies_in_physical_custody_until_release(): void
    {
        $user = $this->user('Supply Coordinator');
        $staff = $this->user('Inventory Staff');
        $item = $this->item();
        $request = $this->submit($user, $item, 15);
        $this->approve($staff, $request, 15);
        $reports = app(ComplianceReportDataService::class);
        $rpc = $reports->getRpciRecords([]);
        $this->assertSame(100, $rpc['items'][0]['balance_per_card']);
        $card = $reports->getStockCardRecords(['itemName' => $item->name]);
        $this->assertSame(100, $card['summary']['currentBalance']);
        $this->post(route('inventory.requests.release', $request), ['signed_ris_presented' => true])->assertSessionHasNoErrors();
        $this->assertSame(85, $reports->getRpciRecords([])['items'][0]['balance_per_card']);
    }

    public function test_legacy_conversion_is_dry_runnable_repeatable_and_reversible(): void
    {
        $user = $this->user('Supply Coordinator');
        $item = $this->item();
        $request = SupplyRequest::create(['requested_by' => $user->id, 'department' => 'Registrar', 'purpose' => 'Legacy approval', 'status' => 'Approved']);
        $request->items()->create(['item_id' => $item->id, 'quantity' => 15, 'approved_quantity' => 15]);
        $this->artisan('inventory:convert-approval-stock', ['--dry-run' => true])->assertExitCode(0);
        $this->assertSame(100, $item->fresh()->stock);
        $this->assertDatabaseCount('request_batch_allocations', 0);
        $this->artisan('inventory:convert-approval-stock')->assertExitCode(0);
        $this->assertSame(85, $item->fresh()->stock);
        $this->assertSame(0, SupplyRequestService::reservedQuantity($item->id));
        $this->artisan('inventory:convert-approval-stock')->assertExitCode(0);
        $this->assertSame(85, $item->fresh()->stock);
        $this->artisan('inventory:convert-approval-stock', ['--restore' => true])->assertExitCode(0);
        $this->assertSame(100, $item->fresh()->stock);
        $this->assertSame(15, SupplyRequestService::reservedQuantity($item->id));
    }

    public function test_failed_conversion_rolls_back_every_prior_allocation(): void
    {
        $user = $this->user('Supply Coordinator');
        foreach ([100 => 15, 10 => 20] as $stock => $quantity) {
            $item = $this->item(100, $stock);
            $request = SupplyRequest::create(['requested_by' => $user->id, 'department' => 'Registrar', 'purpose' => 'Legacy approval', 'status' => 'Approved']);
            $request->items()->create(['item_id' => $item->id, 'quantity' => $quantity, 'approved_quantity' => $quantity]);
        }
        $this->artisan('inventory:convert-approval-stock')->assertExitCode(1);
        $this->assertDatabaseCount('request_batch_allocations', 0);
        $this->assertSame([100, 10], Item::orderBy('id')->pluck('stock')->all());
        $this->assertSame(0, SupplyRequest::whereNotNull('stock_allocated_at')->count());
    }

    public function test_conversion_honors_existing_approvals_below_current_minimum_stock(): void
    {
        $user = $this->user('Supply Coordinator');
        $request = SupplyRequest::create(['requested_by' => $user->id, 'department' => 'Registrar', 'purpose' => 'Existing commitment', 'status' => 'Approved']);
        foreach ([8 => 2, 29 => 20] as $stock => $quantity) {
            $item = $this->item(100, $stock);
            $request->items()->create(['item_id' => $item->id, 'quantity' => $quantity, 'approved_quantity' => $quantity]);
        }
        $this->artisan('inventory:convert-approval-stock', ['--dry-run' => true])->assertExitCode(0);
        $this->assertSame([8, 29], Item::orderBy('id')->pluck('stock')->all());
        $this->artisan('inventory:convert-approval-stock')->assertExitCode(0);
        $this->assertSame([6, 9], Item::orderBy('id')->pluck('stock')->all());
        $this->assertSame(22, (int) RequestBatchAllocation::where('state', 'allocated')->sum('quantity'));
        $this->assertSame('Approved', $request->fresh()->status);
        foreach (Item::all() as $item) {
            $this->assertSame(0, SupplyRequestService::requestableQuantity($item->stock, 0));
        }
    }

    public function test_item_maintainer_can_configure_weekly_limit(): void
    {
        $staff = $this->user('Inventory Staff');
        $staff->givePermissionTo(Permission::firstOrCreate(['name' => 'route:inventory.update', 'guard_name' => 'web']));
        $item = $this->item(null);
        $item->update(['created_by' => $staff->id]);
        $this->actingAs($staff)->put(route('inventory.update', $item), ['name' => $item->name, 'sku' => $item->sku, 'unit_of_issue' => 'piece', 'weekly_request_limit' => 7])->assertSessionHasNoErrors();
        $this->assertSame(7, $item->fresh()->weekly_request_limit);
        $this->put(route('inventory.update', $item), ['name' => $item->name, 'weekly_request_limit' => -1])->assertSessionHasErrors('weekly_request_limit');
        $this->assertSame(7, $item->fresh()->weekly_request_limit);
    }

    public function test_direct_issuance_cannot_bypass_registered_requester_quota(): void
    {
        $user = $this->user('Authorized Personnel');
        $item = $this->item();
        try {
            app(InventoryIssuanceService::class)->issue(['recipient' => $user->name, 'date_issued' => now()->toDateString()], [['item_id' => $item->id, 'quantity' => 10]], $this->user('Inventory Staff')->id);
            $this->fail('Registered requester requires a requisition.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('recipient', $error->errors());
        }
        $this->assertSame(100, $item->fresh()->stock);
        $this->assertDatabaseCount('issuances', 0);
    }

    public function test_release_service_checks_linked_state_and_quantities_without_a_supplied_ris_number(): void
    {
        $user = $this->user('Supply Coordinator');
        $staff = $this->user('Inventory Staff');
        $item = $this->item();
        $request = $this->submit($user, $item, 15);
        $this->approve($staff, $request, 15);
        $service = app(InventoryIssuanceService::class);
        $data = ['recipient' => $user->name, 'date_issued' => now()->toDateString(), 'supply_request_id' => $request->id];
        try {
            $service->issue($data, [['item_id' => $item->id, 'quantity' => 14]], $staff->id);
            $this->fail('Release must match the saved approval.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('request', $error->errors());
        }
        $this->assertSame(85, $item->fresh()->stock);
        $this->actingAs($user)->post(route('inventory.requests.cancel', $request))->assertSessionHasNoErrors();
        try {
            $service->issue($data, [['item_id' => $item->id, 'quantity' => 15]], $staff->id);
            $this->fail('Cancelled requests cannot be released.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('request', $error->errors());
        }
        $this->assertSame(100, $item->fresh()->stock);
        $this->assertDatabaseCount('issuances', 0);
    }
}
