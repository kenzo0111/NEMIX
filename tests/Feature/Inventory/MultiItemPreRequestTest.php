<?php

namespace Tests\Feature\Inventory;

use App\Models\Signatory;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Services\InventoryReceivingService;
use Modules\Suppliers\Models\Supplier;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class MultiItemPreRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->withoutMiddleware(ValidateCsrfToken::class);
        Storage::fake('local');

        SystemSetting::set('inventory.low_stock_threshold', 10);
        SystemSetting::set('mail.low_stock_email_alerts', false);

        // Core permissions for supply requests
        $permissions = [
            'route:inventory.requests.index',
            'route:inventory.requests.store',
            'route:inventory.requests.update',
            'route:inventory.requests.cancel',
            'route:coordinator.catalog.index',
            'route:inventory.issuance',
            'route:inventory.pre-orders.index',
            'route:inventory.index',
        ];

        foreach ($permissions as $permName) {
            Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
        }

        $scRole = Role::firstOrCreate(['name' => 'Supply Coordinator', 'guard_name' => 'web']);
        $scRole->syncPermissions([
            'route:inventory.requests.index',
            'route:inventory.requests.store',
            'route:inventory.requests.update',
            'route:inventory.requests.cancel',
            'route:coordinator.catalog.index',
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function coordinator(): User
    {
        $user = User::factory()->create([
            'is_active' => true,
            'department' => 'College of Engineering',
            'designation' => 'Unit Coordinator',
        ]);
        $user->assignRole('Supply Coordinator');

        $head = Signatory::firstOrCreate(['name' => 'Eng Head'], ['designation' => 'Dean', 'is_active' => true]);
        $user->update(['office_head_id' => $head->id]);

        return $user;
    }

    private function item(string $name, int $stock = 0): Item
    {
        return Item::create([
            'weekly_request_limit' => 100,
            'name' => $name,
            'sku' => 'SKU-'.strtoupper(substr(md5($name), 0, 8)),
            'stock' => $stock,
            'unit_of_issue' => 'box',
            'unit_cost' => 50,
            'amount' => $stock * 50,
            'status' => $stock > 0 ? 'Available' : 'Out of Stock',
        ]);
    }

    public function test_coordinator_can_create_multi_item_pre_request_for_out_of_stock_items(): void
    {
        $coordinator = $this->coordinator();
        $item1 = $this->item('Thermal Paper Rolls', 0);
        $item2 = $this->item('Printer Ribbon #8750', 0);

        $payload = [
            'request_type' => 'pre_request',
            'recipient' => $coordinator->name,
            'date_requested' => now()->toDateString(),
            'department' => 'College of Engineering',
            'recipient_designation' => 'Unit Coordinator',
            'fund_cluster' => '01',
            'purpose' => 'Urgent replenishment for departmental printers',
            'items' => [
                ['item_id' => $item1->id, 'quantity' => 15],
                ['item_id' => $item2->id, 'quantity' => 5],
            ],
        ];

        $response = $this->actingAs($coordinator)->post(route('inventory.requests.store'), $payload);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('supply_requests', [
            'requested_by' => $coordinator->id,
            'status' => 'Pre-Requested',
            'request_type' => 'pre_request',
            'department' => 'College of Engineering',
        ]);

        $request = SupplyRequest::where('requested_by', $coordinator->id)->firstOrFail();
        $this->assertCount(2, $request->items);
        $this->assertEquals(15, $request->items()->where('item_id', $item1->id)->first()->quantity);
        $this->assertEquals(5, $request->items()->where('item_id', $item2->id)->first()->quantity);
    }

    public function test_pre_requests_appear_under_my_requests_index(): void
    {
        $coordinator = $this->coordinator();
        $item = $this->item('Out of Stock Markers', 0);

        $preRequest = SupplyRequest::create([
            'requested_by' => $coordinator->id,
            'status' => 'Pre-Requested',
            'request_type' => 'pre_request',
            'recipient' => $coordinator->name,
            'date_requested' => now()->toDateString(),
            'department' => 'College of Engineering',
            'fund_cluster' => '01',
            'purpose' => 'Markers pre-request',
        ]);
        $preRequest->items()->create([
            'item_id' => $item->id,
            'quantity' => 20,
        ]);

        $response = $this->actingAs($coordinator)->get(route('inventory.requests.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Inventory/Requests/Index')
            ->has('requests.data', 1)
            ->where('requests.data.0.status', 'Pre-Requested')
            ->where('requests.data.0.request_type', 'pre_request')
        );
    }

    public function test_receiving_all_items_automatically_transitions_pre_request_to_stock_restocked_and_alerts_requester(): void
    {
        $coordinator = $this->coordinator();
        $item1 = $this->item('A4 Multicopy Paper', 0);
        $item2 = $this->item('Correction Tape', 0);

        $preRequest = SupplyRequest::create([
            'requested_by' => $coordinator->id,
            'status' => 'Pre-Requested',
            'request_type' => 'pre_request',
            'recipient' => $coordinator->name,
            'date_requested' => now()->toDateString(),
            'department' => 'College of Engineering',
            'fund_cluster' => '01',
            'purpose' => 'Semester opening supplies',
        ]);
        $preRequest->items()->createMany([
            ['item_id' => $item1->id, 'quantity' => 50],
            ['item_id' => $item2->id, 'quantity' => 20],
        ]);

        $supplier = Supplier::create([
            'name' => 'Metro Supply Depot',
            'tin' => '123-456-789',
            'reg_number' => 'REG-2026-001',
            'address' => 'Daet, Camarines Norte',
            'category' => 'Office Supplies',
            'status' => 'active',
            'contact_person' => 'Juan Dela Cruz',
        ]);

        $receivingService = app(InventoryReceivingService::class);

        // Receive only item1 first
        $receivingService->record([
            'item_id' => $item1->id,
            'supplier_id' => $supplier->id,
            'quantity' => 100,
            'unit_cost' => 200,
            'date_received' => now()->toDateString(),
            'fund_cluster' => '01',
        ]);

        // Status should still be Pre-Requested because item2 is still 0 stock
        $this->assertEquals('Pre-Requested', $preRequest->fresh()->status);

        // Now receive item2
        $receivingService->record([
            'item_id' => $item2->id,
            'supplier_id' => $supplier->id,
            'quantity' => 50,
            'unit_cost' => 35,
            'date_received' => now()->toDateString(),
            'fund_cluster' => '01',
        ]);

        // Now all items are restocked -> status should automatically be 'Stock Restocked'
        $this->assertEquals('Stock Restocked', $preRequest->fresh()->status);

        // Requester should have an alert
        $this->assertDatabaseHas('supply_request_alerts', [
            'user_id' => $coordinator->id,
            'supply_request_id' => $preRequest->id,
        ]);
    }

    public static function restockedAllowances(): array
    {
        return [
            'unused allowance' => [0, 150],
            'partially used allowance' => [115, 35],
            'exhausted allowance' => [150, 0],
        ];
    }

    #[DataProvider('restockedAllowances')]
    public function test_restocked_requisition_displays_and_enforces_remaining_weekly_allowance(int $used, int $remaining): void
    {
        $coordinator = $this->coordinator();
        $item = $this->item('Floor Cleaner', 250);
        $item->update(['weekly_request_limit' => 150, 'unit_of_issue' => 'bottle']);

        if ($used > 0) {
            $pending = SupplyRequest::create([
                'requested_by' => $coordinator->id,
                'status' => 'Pending',
                'request_type' => 'requisition',
                'department' => 'College of Engineering',
                'purpose' => 'Earlier weekly request',
            ]);
            $pending->items()->create(['item_id' => $item->id, 'quantity' => $used]);
        }

        $preRequest = SupplyRequest::create([
            'requested_by' => $coordinator->id,
            'status' => 'Stock Restocked',
            'request_type' => 'pre_request',
            'recipient' => $coordinator->name,
            'date_requested' => now()->toDateString(),
            'department' => 'College of Engineering',
            'fund_cluster' => '01',
            'purpose' => 'Cleaning supplies',
        ]);
        $preRequest->items()->create([
            'item_id' => $item->id,
            'quantity' => 35,
        ]);

        $this->actingAs($coordinator)->get(route('inventory.requests.index', [
            'status' => 'Stock Restocked',
            'request_id' => $preRequest->id,
        ]))->assertOk()->assertInertia(fn ($page) => $page
            ->component('Inventory/Requests/Index')
            ->has('requests.data', 1)
            ->where('items.0.stock', 250)
            ->where('items.0.quota_remaining', $remaining)
            ->where('requests.data.0.items.0.item.weekly_request_limit', 150)
            ->where('requests.data.0.items.0.quota_remaining', $remaining)
            ->where('requests.data.0.items.0.max_request_quantity', $remaining)
            ->where('requests.data.0.items.0.max_approval_quantity', min(35, $remaining))
            ->where('focusedRequest.items.0.item.weekly_request_limit', 150)
            ->where('focusedRequest.items.0.quota_remaining', $remaining)
            ->where('focusedRequest.items.0.max_request_quantity', $remaining)
        );

        $updatePayload = [
            'request_type' => 'requisition',
            'recipient' => $coordinator->name,
            'date_requested' => now()->toDateString(),
            'department' => 'College of Engineering',
            'recipient_designation' => 'Unit Coordinator',
            'fund_cluster' => '01',
            'purpose' => 'Cleaning supplies - Ready for issue',
            'items' => [
                ['item_id' => $item->id, 'quantity' => 35],
            ],
        ];

        $response = $this->actingAs($coordinator)->put(
            route('inventory.requests.update', $preRequest),
            $updatePayload
        );

        $fresh = $preRequest->fresh();
        if ($remaining < 35) {
            $response->assertSessionHasErrors('items.0.quantity');
            $this->assertSame('Stock Restocked', $fresh->status);
            $this->assertSame('pre_request', $fresh->request_type);
        } else {
            $response->assertSessionHasNoErrors();
            $response->assertRedirect();
            $this->assertSame('Pending', $fresh->status);
            $this->assertSame('requisition', $fresh->request_type);
        }
        $this->assertSame(250, $item->fresh()->stock);
    }

    public function test_pre_request_submission_routes_to_unit_demand_and_not_to_issuance(): void
    {
        $coordinator = $this->coordinator();
        $item = $this->item('Heavy Duty Tape Dispenser', 0);

        $payload = [
            'request_type' => 'pre_request',
            'recipient' => $coordinator->name,
            'date_requested' => now()->toDateString(),
            'department' => 'College of Engineering',
            'recipient_designation' => 'Unit Coordinator',
            'fund_cluster' => '01',
            'purpose' => 'Office packaging supplies demand',
            'items' => [
                ['item_id' => $item->id, 'quantity' => 8],
            ],
        ];

        $response = $this->actingAs($coordinator)->post(route('inventory.requests.store'), $payload);
        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // 1. Assert routed to unit demand (ItemPreOrder record created)
        $this->assertDatabaseHas('item_pre_orders', [
            'item_id' => $item->id,
            'user_id' => $coordinator->id,
            'delivery_unit' => 'College of Engineering',
            'quantity_requested' => 8,
            'status' => 'pending',
        ]);

        // 2. Staff views Pre-Requests / Unit Demand portal
        $staff = User::factory()->create(['is_active' => true]);
        $staff->givePermissionTo(['route:inventory.pre-orders.index', 'route:inventory.index']);
        $unitDemandResponse = $this->actingAs($staff)->get(route('inventory.pre-orders.index'));
        $unitDemandResponse->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Inventory/PreOrders/Index')
                ->where('stats.total_units_demanded', 8)
                ->where('consolidatedItems.0.item_id', $item->id)
                ->where('consolidatedItems.0.total_quantity_demanded', 8)
            );

        // 3. Staff views Issuance workspace -> pre-request must NOT be in supplyRequests
        $staff->givePermissionTo(['route:inventory.issuance', 'route:inventory.requests.approve']);
        $issuanceResponse = $this->actingAs($staff)->get(route('inventory.issuance'));
        $issuanceResponse->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Inventory/Issuance')
                ->where('supplyRequests', [])
            );
    }

    public function test_cancelling_pre_request_cancels_corresponding_item_pre_orders(): void
    {
        $coordinator = $this->coordinator();
        $item = $this->item('Permanent Markers Red', 0);

        $payload = [
            'request_type' => 'pre_request',
            'recipient' => $coordinator->name,
            'date_requested' => now()->toDateString(),
            'department' => 'College of Engineering',
            'recipient_designation' => 'Unit Coordinator',
            'fund_cluster' => '01',
            'purpose' => 'Color coding markers',
            'items' => [
                ['item_id' => $item->id, 'quantity' => 12],
            ],
        ];

        $this->actingAs($coordinator)->post(route('inventory.requests.store'), $payload);
        $preRequest = SupplyRequest::where('requested_by', $coordinator->id)->firstOrFail();

        $this->assertDatabaseHas('item_pre_orders', [
            'item_id' => $item->id,
            'user_id' => $coordinator->id,
            'status' => 'pending',
        ]);

        // Cancel the pre-request
        $response = $this->actingAs($coordinator)->post(route('inventory.requests.cancel', $preRequest));
        $response->assertSessionHasNoErrors();

        $this->assertEquals('Cancelled', $preRequest->fresh()->status);
        $this->assertDatabaseHas('item_pre_orders', [
            'item_id' => $item->id,
            'user_id' => $coordinator->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_supply_catalog_pre_request_prefills_item_and_mode(): void
    {
        $coordinator = $this->coordinator();
        $outOfStockItem = $this->item('A4 Glossy Photo Paper', 0);

        $response = $this->actingAs($coordinator)->get(route('inventory.requests.index', [
            'create' => 1,
            'mode' => 'pre_request',
            'item_id' => $outOfStockItem->id,
        ]));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Inventory/Requests/Index')
                ->where('initialItemId', $outOfStockItem->id)
                ->where('initialMode', 'pre_request')
            );
    }
}
