<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\ItemPreOrder;
use Modules\Inventory\Services\InventoryReceivingService;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ItemPreOrderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

        // Seed core permissions
        $storePerm = Permission::firstOrCreate(['name' => 'route:inventory.pre-orders.store', 'guard_name' => 'web']);
        $destroyPerm = Permission::firstOrCreate(['name' => 'route:inventory.pre-orders.destroy', 'guard_name' => 'web']);
        $catalogPerm = Permission::firstOrCreate(['name' => 'route:coordinator.catalog.index', 'guard_name' => 'web']);
        $indexPerm = Permission::firstOrCreate(['name' => 'route:inventory.pre-orders.index', 'guard_name' => 'web']);

        $scRole = Role::firstOrCreate(['name' => 'Supply Coordinator', 'guard_name' => 'web']);
        $scRole->givePermissionTo([$storePerm, $destroyPerm, $catalogPerm]);

        $apRole = Role::firstOrCreate(['name' => 'Authorized Personnel', 'guard_name' => 'web']);
        $apRole->givePermissionTo([$storePerm, $destroyPerm, $catalogPerm]);

        $staffRole = Role::firstOrCreate(['name' => 'Inventory Staff', 'guard_name' => 'web']);
        $staffRole->givePermissionTo($indexPerm);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function user(string $role = 'Supply Coordinator', string $department = 'College of Engineering'): User
    {
        $user = User::factory()->create([
            'is_active' => true,
            'department' => $department,
            'designation' => 'Unit Coordinator',
        ]);
        $user->assignRole($role);

        return $user;
    }

    private function item(string $name = 'Staple Wire #35', int $stock = 0): Item
    {
        return Item::create([
            'weekly_request_limit' => 50,
            'name' => $name,
            'sku' => 'SKU-'.uniqid(),
            'stock' => $stock,
            'unit_of_issue' => 'box',
            'unit_cost' => 45,
            'amount' => $stock * 45,
            'rfid_tag' => 'TAG-'.uniqid(),
            'description' => 'Office consumable',
            'status' => $stock <= 0 ? 'Out of Stock' : 'Available',
        ]);
    }

    public function test_supply_coordinator_can_submit_pre_order_for_out_of_stock_item(): void
    {
        $coordinator = $this->user('Supply Coordinator', 'College of Arts and Sciences');
        $item = $this->item('Heavy Duty Stapler', 0);

        $response = $this->actingAs($coordinator)->post(route('inventory.pre-orders.store'), [
            'item_id' => $item->id,
            'quantity_requested' => 15,
            'urgency' => 'urgent',
            'purpose' => 'Urgent for mid-year department accreditation documentation',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('item_pre_orders', [
            'item_id' => $item->id,
            'user_id' => $coordinator->id,
            'delivery_unit' => 'College of Arts and Sciences',
            'quantity_requested' => 15,
            'urgency' => 'urgent',
            'status' => 'pending',
        ]);
    }

    public function test_authorized_personnel_can_submit_pre_order_for_out_of_stock_item(): void
    {
        $authorized = $this->user('Authorized Personnel', 'Registrar Office');
        $item = $this->item('Certificate Paper Gold Border', 0);

        $response = $this->actingAs($authorized)->post(route('inventory.pre-orders.store'), [
            'item_id' => $item->id,
            'quantity_requested' => 50,
            'urgency' => 'normal',
            'purpose' => 'Diploma and transcript printing replenishment',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('item_pre_orders', [
            'item_id' => $item->id,
            'user_id' => $authorized->id,
            'delivery_unit' => 'Registrar Office',
            'quantity_requested' => 50,
            'urgency' => 'normal',
            'status' => 'pending',
        ]);
    }

    public function test_in_stock_item_cannot_be_pre_ordered(): void
    {
        $coordinator = $this->user();
        $inStockItem = $this->item('In Stock Bond Paper', 100);

        $response = $this->actingAs($coordinator)->post(route('inventory.pre-orders.store'), [
            'item_id' => $inStockItem->id,
            'quantity_requested' => 10,
            'urgency' => 'normal',
        ]);

        $response->assertSessionHasErrors(['item_id']);
        $this->assertDatabaseMissing('item_pre_orders', [
            'item_id' => $inStockItem->id,
        ]);
    }

    public function test_central_catalog_includes_user_pre_order_payload(): void
    {
        $coordinator = $this->user();
        $item = $this->item('Flash Drive 64GB', 0);

        ItemPreOrder::create([
            'item_id' => $item->id,
            'user_id' => $coordinator->id,
            'delivery_unit' => 'College of Engineering',
            'quantity_requested' => 12,
            'urgency' => 'urgent',
            'purpose' => 'Backup keys for faculty records',
            'status' => 'pending',
        ]);

        $this->actingAs($coordinator)->get(route('coordinator.catalog.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Inventory/Coordinator/Catalog')
                ->where('items.data.0.id', $item->id)
                ->where('items.data.0.user_pre_order.quantity', 12)
                ->where('items.data.0.user_pre_order.urgency', 'urgent')
            );
    }

    public function test_user_can_cancel_their_own_pending_pre_order(): void
    {
        $coordinator = $this->user();
        $item = $this->item('Tape Dispenser', 0);

        $preOrder = ItemPreOrder::create([
            'item_id' => $item->id,
            'user_id' => $coordinator->id,
            'delivery_unit' => 'College of Engineering',
            'quantity_requested' => 5,
            'urgency' => 'normal',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($coordinator)->delete(route('inventory.pre-orders.destroy', $preOrder));

        $response->assertRedirect();
        $this->assertSame('cancelled', $preOrder->fresh()->status);
    }

    public function test_supply_office_can_access_dedicated_pre_orders_portal(): void
    {
        $staff = $this->user('Inventory Staff', 'Supply Office');
        $item = $this->item('Archival Boxes', 0);

        ItemPreOrder::create([
            'item_id' => $item->id,
            'user_id' => User::factory()->create(['department' => 'HR Office'])->id,
            'delivery_unit' => 'HR Office',
            'quantity_requested' => 30,
            'urgency' => 'urgent',
            'purpose' => 'Personnel 201 file records storage',
            'status' => 'pending',
        ]);

        $this->actingAs($staff)->get(route('inventory.pre-orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Inventory/PreOrders/Index')
                ->where('stats.total_pending_orders', 1)
                ->where('stats.total_units_demanded', 30)
                ->where('stats.items_with_demand', 1)
                ->where('stats.urgent_demands', 1)
                ->where('consolidatedItems.0.item_id', $item->id)
                ->where('consolidatedItems.0.total_quantity_demanded', 30)
            );
    }

    public function test_coordinator_cannot_access_supply_office_pre_orders_portal(): void
    {
        $coordinator = $this->user('Supply Coordinator');

        $this->actingAs($coordinator)->get(route('inventory.pre-orders.index'))
            ->assertForbidden();
    }

    public function test_receiving_stock_notifies_pending_pre_orders(): void
    {
        $staff = $this->user('Inventory Staff', 'Supply Office');
        $item = $this->item('Special Marker Blue', 0);
        $supplier = Supplier::create([
            'name' => 'National Book Supplier',
            'tin' => '123-456-789',
            'reg_number' => 'REG-2026-001',
            'address' => 'Daet, Camarines Norte',
            'category' => 'Office Supplies',
            'status' => 'active',
        ]);

        $preOrder = ItemPreOrder::create([
            'item_id' => $item->id,
            'user_id' => User::factory()->create(['department' => 'Science Lab'])->id,
            'delivery_unit' => 'Science Lab',
            'quantity_requested' => 40,
            'urgency' => 'normal',
            'status' => 'pending',
        ]);

        $this->assertSame('pending', $preOrder->status);
        $this->assertNull($preOrder->notified_at);

        // Receive stock for the item
        app(InventoryReceivingService::class)->receive([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 100,
            'unit_cost' => 25,
            'date_received' => now()->toDateString(),
        ], $staff->id);

        $freshOrder = $preOrder->fresh();
        $this->assertSame('notified', $freshOrder->status);
        $this->assertNotNull($freshOrder->notified_at);
        $this->assertSame(100, $item->fresh()->stock);
    }
}
