<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Item;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InventoryManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'System Admin']);

        $this->adminUser = User::factory()->create(['is_active' => true]);
        $this->adminUser->assignRole('System Admin');

        $this->supplier = Supplier::create([
            'name' => 'Test Supplier Co.',
            'tin' => '123-456-789-000',
            'address' => 'Daet, Camarines Norte',
            'reg_number' => 'REG-12345',
            'category' => 'Office Supplies',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);
    }

    public function test_inventory_list_page_can_be_rendered(): void
    {
        $response = $this->actingAs($this->adminUser)->get(route('inventory.index'));
        $response->assertOk();
    }

    public function test_inventory_item_can_be_created(): void
    {
        $response = $this->actingAs($this->adminUser)->post(route('inventory.store'), [
            'name' => 'Bond Paper A4 80gsm',
            'supplier_id' => $this->supplier->id,
            'sku' => 'PAP-A4-80G-001',
            'stock' => 100,
            'unit_cost' => 250.00,
            'amount' => 25000.00,
            'status' => 'Available',
            'description' => 'Substance 20 copy paper',
            'unit_of_issue' => 'Ream',
        ]);

        $response->assertRedirect(route('inventory.index'));
        $this->assertDatabaseHas('items', [
            'name' => 'Bond Paper A4 80gsm',
            'sku' => 'PAP-A4-80G-001',
            'stock' => 100,
        ]);
    }

    public function test_item_can_be_updated(): void
    {
        $item = Item::create([
            'name' => 'Ballpen Black',
            'supplier_id' => $this->supplier->id,
            'sku' => 'PEN-BLK-001',
            'stock' => 50,
            'unit_cost' => 15.00,
            'amount' => 750.00,
            'status' => 'Available',
            'unit_of_issue' => 'Piece',
            'created_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)->put(route('inventory.update', $item), [
            'name' => 'Ballpen Black (Gel 0.5mm)',
            'supplier_id' => $this->supplier->id,
            'sku' => 'PEN-BLK-001',
            'stock' => 75,
            'unit_cost' => 18.00,
            'amount' => 1350.00,
            'status' => 'Available',
            'unit_of_issue' => 'Piece',
        ]);

        $response->assertRedirect(route('inventory.index'));
        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'name' => 'Ballpen Black (Gel 0.5mm)',
            'stock' => 75,
        ]);
    }

    public function test_item_can_be_soft_deleted(): void
    {
        $item = Item::create([
            'name' => 'Stapler No. 35',
            'supplier_id' => $this->supplier->id,
            'sku' => 'STP-35-001',
            'stock' => 10,
            'unit_cost' => 120.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)->delete(route('inventory.destroy', $item));

        $response->assertRedirect(route('inventory.index'));
        $this->assertSoftDeleted('items', ['id' => $item->id]);
    }
}
