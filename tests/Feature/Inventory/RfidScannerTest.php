<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Item;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RfidScannerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Supplier $supplier;
    protected Item $item;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'System Admin']);

        $this->adminUser = User::factory()->create(['is_active' => true]);
        $this->adminUser->assignRole('System Admin');

        $this->supplier = Supplier::create([
            'name' => 'Tech Supply Solutions',
            'tin' => '111-222-333-000',
            'address' => 'Daet, Camarines Norte',
            'reg_number' => 'REG-RFID-01',
            'category' => 'IT Equipment',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $this->item = Item::create([
            'name' => 'Desktop Computer i7 16GB',
            'supplier_id' => $this->supplier->id,
            'sku' => 'PC-DESK-001',
            'stock' => 5,
            'unit_cost' => 45000.00,
            'amount' => 225000.00,
            'status' => 'Available',
            'unit_of_issue' => 'Unit',
            'created_by' => $this->adminUser->id,
        ]);
    }

    public function test_rfid_index_page_can_be_rendered(): void
    {
        $response = $this->actingAs($this->adminUser)->get(route('rfid-scanner.index'));
        $response->assertOk();
    }

    public function test_rfid_tag_can_be_assigned_to_item(): void
    {
        $response = $this->actingAs($this->adminUser)->post(route('rfid-scanner.assign'), [
            'item_id' => $this->item->id,
            'rfid_tag' => 'RFID-TAG-998877',
        ]);

        $response->assertRedirect(route('rfid-scanner.index', ['item_id' => $this->item->id]));

        $this->item->refresh();
        $this->assertEquals('RFID-TAG-998877', $this->item->rfid_tag);
    }

    public function test_duplicate_rfid_tag_assignment_fails(): void
    {
        // First item with tag
        $this->item->update(['rfid_tag' => 'RFID-DUP-123']);

        // Second item
        $secondItem = Item::create([
            'name' => 'Laser Printer Pro',
            'supplier_id' => $this->supplier->id,
            'sku' => 'PRN-LSR-002',
            'stock' => 2,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        // Attempt assigning same tag to second item
        $response = $this->actingAs($this->adminUser)->post(route('rfid-scanner.assign'), [
            'item_id' => $secondItem->id,
            'rfid_tag' => 'RFID-DUP-123',
        ]);

        $response->assertSessionHasErrors(['rfid_tag']);
        $secondItem->refresh();
        $this->assertNull($secondItem->rfid_tag);
    }

    public function test_rfid_tag_can_be_unassigned(): void
    {
        $this->item->update(['rfid_tag' => 'RFID-TAG-TO-REMOVE']);

        $response = $this->actingAs($this->adminUser)->post(route('rfid-scanner.unassign'), [
            'item_id' => $this->item->id,
        ]);

        $response->assertRedirect(route('rfid-scanner.index', ['item_id' => $this->item->id]));

        $this->item->refresh();
        $this->assertNull($this->item->rfid_tag);
    }

    public function test_rfid_tag_lookup_endpoint_returns_json_data(): void
    {
        $this->item->update(['rfid_tag' => 'TAG-LOOKUP-101']);

        $response = $this->actingAs($this->adminUser)->get(route('rfid-scanner.lookup', ['tag' => 'TAG-LOOKUP-101']));

        $response->assertOk();
        $response->assertJson([
            'found' => true,
            'item' => [
                'id' => $this->item->id,
                'name' => 'Desktop Computer i7 16GB',
                'sku' => 'PC-DESK-001',
                'rfid_tag' => 'TAG-LOOKUP-101',
            ],
        ]);
    }
}
