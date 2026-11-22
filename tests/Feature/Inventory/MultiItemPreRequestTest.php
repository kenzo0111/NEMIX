<?php

namespace Tests\Feature\Inventory;

use App\Models\Signatory;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Models\SupplyRequestAlert;
use Modules\Inventory\Services\InventoryReceivingService;
use Modules\Suppliers\Models\Supplier;
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
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
        Storage::fake('local');

        SystemSetting::set('inventory.low_stock_threshold', 10);
        SystemSetting::set('mail.low_stock_email_alerts', false);

        // Core permissions for supply requests
        $permissions = [
            'route:inventory.requests.index',
            'route:inventory.requests.store',
            'route:inventory.requests.update',
            'route:coordinator.catalog.index',
        ];

        foreach ($permissions as $permName) {
            Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
        }

        $scRole = Role::firstOrCreate(['name' => 'Supply Coordinator', 'guard_name' => 'web']);
        $scRole->syncPermissions($permissions);

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

    public function test_coordinator_can_convert_stock_restocked_request_to_official_requisition(): void
    {
        $coordinator = $this->coordinator();
        $item = $this->item('Wireless Optical Mouse', 15);

        $preRequest = SupplyRequest::create([
            'requested_by' => $coordinator->id,
            'status' => 'Stock Restocked',
            'request_type' => 'pre_request',
            'recipient' => $coordinator->name,
            'date_requested' => now()->toDateString(),
            'department' => 'College of Engineering',
            'fund_cluster' => '01',
            'purpose' => 'Computer laboratory peripherals',
        ]);
        $preRequest->items()->create([
            'item_id' => $item->id,
            'quantity' => 10,
        ]);

        $updatePayload = [
            'request_type' => 'requisition',
            'recipient' => $coordinator->name,
            'date_requested' => now()->toDateString(),
            'department' => 'College of Engineering',
            'recipient_designation' => 'Unit Coordinator',
            'fund_cluster' => '01',
            'purpose' => 'Computer laboratory peripherals - Ready for issue',
            'items' => [
                ['item_id' => $item->id, 'quantity' => 10],
            ],
        ];

        $response = $this->actingAs($coordinator)->put(
            route('inventory.requests.update', $preRequest),
            $updatePayload
        );

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $fresh = $preRequest->fresh();
        $this->assertEquals('Pending', $fresh->status);
        $this->assertEquals('requisition', $fresh->request_type);
    }
}
