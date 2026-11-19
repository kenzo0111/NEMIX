<?php

namespace Tests\Feature\Inventory;

use App\Models\CoordinatorStock;
use App\Models\Signatory;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Services\SupplyRequestService;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SupplyRequestMinimumStockTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Storage::fake('local');
        SystemSetting::set('inventory.low_stock_threshold', 10);
        SystemSetting::set('mail.low_stock_email_alerts', false);
    }

    public static function requesterRoles(): array
    {
        return [
            'supply coordinator' => ['Supply Coordinator'],
            'authorized personnel' => ['Authorized Personnel'],
        ];
    }

    private function user(string $role): User
    {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole($role);
        if ($user->usesCoordinatorInventory()) {
            $head = Signatory::firstOrCreate(['name' => 'Office Head'], ['designation' => 'Office Head', 'is_active' => true]);
            $user->update(['department' => 'Registrar', 'office_head_id' => $head->id]);
        }

        return $user;
    }

    private function item(int $stock): Item
    {
        return Item::create(['weekly_request_limit' => 1000000,
            'name' => 'Office Pens', 'sku' => 'MINIMUM-'.Item::count(), 'stock' => $stock,
            'unit_of_issue' => 'piece', 'unit_cost' => 1, 'amount' => $stock, 'status' => 'Available',
        ]);
    }

    private function payload(User $user, Item $item, int $quantity): array
    {
        $payload = [
            'department' => 'Registrar', 'purpose' => 'Office operations',
            'items' => [['item_id' => $item->id, 'quantity' => $quantity]],
        ];
        if ($user->requiresSupportingDocument()) {
            $payload += [
                'supporting_document_type' => 'Approved Letter',
                'supporting_document' => UploadedFile::fake()->createWithContent(
                    'approved-letter.pdf', "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF"
                ),
            ];
        }

        return $payload;
    }

    private function submit(User $user, Item $item, int $quantity): SupplyRequest
    {
        $this->actingAs($user)->post(route('inventory.requests.store'), $this->payload($user, $item, $quantity))
            ->assertSessionHasNoErrors()->assertRedirect(route('inventory.requests.index'));

        return SupplyRequest::latest('id')->firstOrFail();
    }

    private function approve(SupplyRequest $request, User $custodian, int $quantity): void
    {
        $this->actingAs($custodian);
        if ($request->requires_supporting_document) {
            $this->post(route('inventory.requests.verify-document', $request), ['decision' => 'verified'])
                ->assertSessionHasNoErrors()->assertRedirect();
        }
        $line = $request->items()->firstOrFail();
        $this->post(route('inventory.requests.approve', $request), ['approved_quantities' => [$line->id => $quantity]])
            ->assertSessionHasNoErrors()->assertRedirect();
        if ($request->requires_supporting_document) {
            $this->post(route('inventory.requests.ready', $request))
                ->assertSessionHasNoErrors()->assertRedirect();
        }
    }

    #[DataProvider('requesterRoles')]
    public function test_requests_below_the_remaining_stock_minimum_are_rejected(string $role): void
    {
        $user = $this->user($role);
        $item = $this->item(1500);
        SystemSetting::set('inventory.strict_stock_enforcement', false);

        foreach ([1491, 1499, 1501] as $quantity) {
            $this->actingAs($user)->post(route('inventory.requests.store'), $this->payload($user, $item, $quantity))
                ->assertSessionHasErrors('items.0.quantity');
            $this->assertDatabaseCount('supply_requests', 0);
            $this->assertDatabaseCount('supply_request_items', 0);
            $this->assertSame(1500, $item->fresh()->stock);
            $this->assertSame([], Storage::disk('local')->allFiles());
        }
    }

    #[DataProvider('requesterRoles')]
    public function test_request_at_the_limit_can_be_released_leaving_exactly_the_minimum(string $role): void
    {
        $user = $this->user($role);
        $custodian = $this->user('Property Custodian');
        $item = $this->item(1500);
        $request = $this->submit($user, $item, 1490);
        $this->approve($request, $custodian, 1490);
        $this->assertSame(10, $item->fresh()->stock);
        $this->assertSame(0, SupplyRequestService::reservedQuantity($item->id));

        $this->post(route('inventory.requests.release', $request), ['signed_ris_presented' => true])
            ->assertSessionHasNoErrors()->assertRedirect();

        $this->assertSame(10, $item->fresh()->stock);
        $this->assertSame($user->requiresSupportingDocument() ? 'Released' : 'Issued', $request->fresh()->status);
        $this->assertSame(1490, CoordinatorStock::where('coordinator_id', $user->id)->value('quantity'));
        $this->assertSame(0, SupplyRequestService::reservedQuantity($item->id));
        $this->assertDatabaseCount('issuances', 1);
    }

    #[DataProvider('requesterRoles')]
    public function test_edits_and_document_corrections_must_preserve_the_minimum(string $role): void
    {
        $user = $this->user($role);
        $item = $this->item(100);
        $request = $this->submit($user, $item, 20);
        if ($user->requiresSupportingDocument()) {
            $this->actingAs($this->user('Property Custodian'))->post(route('inventory.requests.verify-document', $request), [
                'decision' => 'correction', 'remarks' => 'Replace the letter.',
            ])->assertSessionHasNoErrors()->assertRedirect();
        }
        $original = $request->fresh();
        $payload = $this->payload($user, $item, 91);
        $payload['purpose'] = 'Changed purpose';
        $this->actingAs($user)->put(route('inventory.requests.update', $request), $payload)
            ->assertSessionHasErrors('items.0.quantity');

        $this->assertSame(20, $request->items()->firstOrFail()->quantity);
        $this->assertSame($original->status, $request->fresh()->status);
        $this->assertSame($original->purpose, $request->fresh()->purpose);
        $this->assertSame($original->supporting_document_path, $request->fresh()->supporting_document_path);
        $this->assertCount($user->requiresSupportingDocument() ? 1 : 0, Storage::disk('local')->allFiles());

        $this->put(route('inventory.requests.update', $request), $this->payload($user, $item, 90))
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->assertSame(90, $request->items()->firstOrFail()->quantity);
        $this->assertSame(100, $item->fresh()->stock);
    }

    #[DataProvider('requesterRoles')]
    public function test_request_limits_and_catalog_account_for_approved_reservations(string $role): void
    {
        $user = $this->user($role);
        $item = $this->item(1500);
        foreach (['Approved' => 1000, 'Ready for Pickup' => 400, 'Pending' => 300, 'Cancelled' => 400] as $status => $quantity) {
            $reserved = SupplyRequest::create([
                'requested_by' => $user->id, 'department' => 'Registrar', 'purpose' => 'Existing request', 'status' => $status,
            ]);
            $reserved->items()->create(['item_id' => $item->id, 'quantity' => $quantity, 'approved_quantity' => $quantity]);
        }

        $this->actingAs($user)->get(route('inventory.requests.index', ['item_id' => $item->id]))
            ->assertInertia(fn ($page) => $page->has('items', 1)->where('items.0.stock', 1500)
                ->where('items.0.max_request_quantity', 90)->where('minimumStockThreshold', 10)
                ->where('initialItemId', $item->id));
        $this->get(route('coordinator.catalog.index'))
            ->assertInertia(fn ($page) => $page->where('items.data.0.on_hand', 1500)->where('items.data.0.available_quantity', 90));
        $this->post(route('inventory.requests.store'), $this->payload($user, $item, 91))
            ->assertSessionHasErrors('items.0.quantity');
        $this->assertDatabaseCount('supply_requests', 4);
        $this->submit($user, $item, 90);
        $this->assertSame(1500, $item->fresh()->stock);
    }

    #[DataProvider('requesterRoles')]
    public function test_stock_at_or_below_the_minimum_is_unavailable_for_requests(string $role): void
    {
        $user = $this->user($role);
        foreach ([0, 5, 10] as $stock) {
            $item = $this->item($stock);
            $this->actingAs($user)->post(route('inventory.requests.store'), $this->payload($user, $item, 1))
                ->assertSessionHasErrors($stock === 0 ? 'items.0.item_id' : 'items.0.quantity');
            $this->get(route('inventory.requests.index', ['item_id' => $item->id]))
                ->assertInertia(fn ($page) => $page->has('items', 0)->where('initialItemId', null));
            $this->assertSame($stock, $item->fresh()->stock);
        }
        $this->get(route('coordinator.catalog.index', ['availability' => 'available']))
            ->assertInertia(fn ($page) => $page->where('items.total', 0));
        $this->get(route('coordinator.catalog.index', ['availability' => 'unavailable']))
            ->assertInertia(fn ($page) => $page->where('items.total', 3));
        $this->assertDatabaseCount('supply_requests', 0);
    }

    #[DataProvider('requesterRoles')]
    public function test_minimum_stock_uses_the_configured_threshold(string $role): void
    {
        $user = $this->user($role);
        $item = $this->item(100);
        SystemSetting::set('inventory.low_stock_threshold', 25);
        $this->actingAs($user)->get(route('inventory.requests.index'))
            ->assertInertia(fn ($page) => $page->where('minimumStockThreshold', 25)->where('items.0.max_request_quantity', 75));
        $this->post(route('inventory.requests.store'), $this->payload($user, $item, 76))
            ->assertSessionHasErrors('items.0.quantity');
        $this->assertDatabaseCount('supply_requests', 0);
        $this->submit($user, $item, 75);
    }

    #[DataProvider('requesterRoles')]
    public function test_release_uses_saved_allocation_when_threshold_changes(string $role): void
    {
        $user = $this->user($role);
        $custodian = $this->user('Property Custodian');
        $item = $this->item(100);
        SystemSetting::set('inventory.strict_stock_enforcement', false);
        $request = $this->submit($user, $item, 90);
        $this->approve($request, $custodian, 90);
        $this->assertSame(10, $item->fresh()->stock);
        SystemSetting::set('inventory.low_stock_threshold', 20);
        $this->post(route('inventory.requests.release', $request), ['signed_ris_presented' => true])
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->assertSame(10, $item->fresh()->stock);
        $this->assertSame(90, CoordinatorStock::where('coordinator_id', $user->id)->value('quantity'));
        $this->assertDatabaseCount('issuances', 1);
    }

    public function test_approval_rolls_back_all_lines_when_other_requests_reserve_stock(): void
    {
        $user = $this->user('Supply Coordinator');
        $custodian = $this->user('Property Custodian');
        $firstItem = $this->item(100);
        $secondItem = $this->item(100);
        $payload = $this->payload($user, $firstItem, 10);
        $payload['items'][] = ['item_id' => $secondItem->id, 'quantity' => 90];
        $this->actingAs($user)->post(route('inventory.requests.store'), $payload)
            ->assertSessionHasNoErrors()->assertRedirect();
        $request = SupplyRequest::latest('id')->firstOrFail();
        $reserved = SupplyRequest::create([
            'requested_by' => $user->id, 'department' => 'Registrar', 'purpose' => 'Other approval', 'status' => 'Approved',
        ]);
        $reserved->items()->create(['item_id' => $secondItem->id, 'quantity' => 85, 'approved_quantity' => 85]);
        SystemSetting::set('inventory.strict_stock_enforcement', false);

        $this->actingAs($custodian)->post(route('inventory.requests.approve', $request), [
            'approved_quantities' => $request->items->mapWithKeys(fn ($line) => [$line->id => $line->quantity])->all(),
        ])->assertSessionHasErrors('approved_quantities');
        $this->assertSame('Pending', $request->fresh()->status);
        $this->assertTrue($request->items()->get()->every(fn ($line) => $line->approved_quantity === null));
        $this->assertSame(100, $firstItem->fresh()->stock);
        $this->assertSame(100, $secondItem->fresh()->stock);
        $this->assertSame(85, SupplyRequestService::reservedQuantity($secondItem->id));
    }
}
