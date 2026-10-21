<?php

namespace Tests\Feature\Inventory;

use App\Models\CoordinatorMovement;
use App\Models\CoordinatorStock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CentralSupplyCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function user(string $role = 'Supply Coordinator'): User
    {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole($role);
        return $user;
    }

    private function item(string $name = 'Bond Paper A4', int $stock = 10): Item
    {
        return Item::create(['name' => $name, 'sku' => 'SKU-'.uniqid(), 'stock' => $stock,
            'unit_of_issue' => 'ream', 'unit_cost' => 99, 'amount' => $stock * 99,
            'rfid_tag' => 'TAG-'.uniqid(), 'description' => 'Office consumable', 'status' => 'Available']);
    }

    private function reserve(User $user, Item $item, int $quantity, string $status = 'Approved'): void
    {
        $request = SupplyRequest::create(['requested_by' => $user->id, 'department' => 'Private Other Office',
            'purpose' => 'Private request purpose', 'status' => $status]);
        $request->items()->create(['item_id' => $item->id, 'quantity' => $quantity, 'approved_quantity' => $quantity]);
    }

    public function test_catalog_shows_central_stock_minus_approved_reservations_without_other_office_details(): void
    {
        $coordinator = $this->user();
        $other = $this->user();
        $item = $this->item();
        $this->reserve($other, $item, 4);
        $this->reserve($other, $item, 2, 'Pending');
        $this->reserve($other, $item, 2, 'Issued');
        $requestCount = SupplyRequest::count();
        $this->actingAs($coordinator)->get(route('coordinator.catalog.index'))->assertOk()
            ->assertInertia(fn ($page) => $page->component('Inventory/Coordinator/Catalog')
                ->where('items.total', 1)->where('items.data.0.id', $item->id)
                ->where('items.data.0.on_hand', 10)->where('items.data.0.available_quantity', 6)
                ->missing('items.data.0.rfid_tag')->missing('items.data.0.unit_cost')
                ->missing('items.data.0.created_by')->missing('requests')->missing('movements'));
        $this->assertSame($requestCount, SupplyRequest::count());
        $this->assertSame(10, $item->fresh()->stock);
        $this->assertSame(0, CoordinatorStock::count());
        $this->assertSame(0, CoordinatorMovement::count());
    }

    public function test_search_availability_filters_and_archived_stock_are_handled_correctly(): void
    {
        $coordinator = $this->user();
        $available = $this->item('A Bond Paper');
        $out = $this->item('B Paper Clips', 0);
        $reserved = $this->item('C Envelopes', 3);
        $this->reserve($coordinator, $reserved, 3);
        $archived = $this->item('Archived Item');
        $archived->delete();
        $this->actingAs($coordinator)->get(route('coordinator.catalog.index', ['search' => 'BOND']))
            ->assertInertia(fn ($page) => $page->where('items.total', 1)->where('items.data.0.id', $available->id));
        $this->actingAs($coordinator)->get(route('coordinator.catalog.index', ['search' => $available->sku]))
            ->assertInertia(fn ($page) => $page->where('items.total', 1)->where('items.data.0.id', $available->id));
        $this->actingAs($coordinator)->get(route('coordinator.catalog.index', ['availability' => 'available']))
            ->assertInertia(fn ($page) => $page->where('items.total', 1)->where('items.data.0.available_quantity', 10));
        $this->actingAs($coordinator)->get(route('coordinator.catalog.index', ['availability' => 'unavailable']))
            ->assertInertia(fn ($page) => $page->where('items.total', 2)
                ->where('items.data.0.id', $out->id)->where('items.data.1.id', $reserved->id)
                ->where('items.data.1.on_hand', 3)->where('items.data.1.available_quantity', 0));
        $this->actingAs($coordinator)->getJson(route('coordinator.catalog.index', ['availability' => 'invalid']))
            ->assertUnprocessable();
    }

    public function test_catalog_is_read_only_and_does_not_grant_central_inventory_management_access(): void
    {
        $coordinator = $this->user();
        $item = $this->item();
        $coordinator->givePermissionTo(Permission::firstOrCreate(['name' => 'route:inventory.update', 'guard_name' => 'web']));
        $this->actingAs($coordinator)->put(route('inventory.update', $item), ['stock' => 999])->assertForbidden();
        $this->actingAs($coordinator)->get(route('inventory.index'))->assertForbidden();
        $this->actingAs($coordinator)->post(route('coordinator.catalog.index'), ['stock' => 999])->assertStatus(405);
        $this->assertSame(10, $item->fresh()->stock);
        $staff = $this->user('Property Staff');
        $staff->givePermissionTo(Permission::findByName('route:coordinator.catalog.index', 'web'));
        $this->actingAs($staff)->get(route('coordinator.catalog.index'))->assertForbidden();
        $this->get(route('coordinator.catalog.index'))->assertForbidden();
        $this->post(route('logout'));
        $this->get(route('coordinator.catalog.index'))->assertRedirect(route('login'));
    }

    public function test_request_prefill_accepts_stocked_items_and_ignores_unavailable_or_archived_items(): void
    {
        $coordinator = $this->user();
        $item = $this->item();
        $out = $this->item('Out of stock', 0);
        $archived = $this->item('Archived');
        $archived->delete();
        $this->actingAs($coordinator)->get(route('inventory.requests.index', ['create' => 1, 'item_id' => $item->id]))
            ->assertInertia(fn ($page) => $page->where('initialItemId', $item->id));
        foreach ([$out->id, $archived->id, 999999] as $unavailableId) {
            $this->actingAs($coordinator)->get(route('inventory.requests.index', ['create' => 1, 'item_id' => $unavailableId]))
                ->assertInertia(fn ($page) => $page->where('initialItemId', null));
        }
        $this->assertSame(0, SupplyRequest::count());
    }
}
