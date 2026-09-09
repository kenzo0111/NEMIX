<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Item;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SuppliersManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'System Admin']);

        $this->adminUser = User::factory()->create(['is_active' => true]);
        $this->adminUser->assignRole('System Admin');
    }

    public function test_supplier_amount_is_automatically_calculated_from_item_prices(): void
    {
        $supplier = Supplier::create([
            'name' => 'ABC Trading',
            'tin' => '111-222-333',
            'address' => 'Daet',
            'reg_number' => 'REG-001',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        // Create an item with 0 stock but listed unit_cost price of 150.00
        Item::create([
            'name' => 'Item 1',
            'supplier_id' => $supplier->id,
            'sku' => 'SKU-001',
            'stock' => 0,
            'unit_cost' => 150.00,
            'amount' => 0.00,
            'status' => 'Out of Stock',
            'created_by' => $this->adminUser->id,
        ]);

        // Create Item 2 with 10 stock, 50.00 unit_cost, and 500.00 amount
        Item::create([
            'name' => 'Item 2',
            'supplier_id' => $supplier->id,
            'sku' => 'SKU-002',
            'stock' => 10,
            'unit_cost' => 50.00,
            'amount' => 500.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('suppliers.index'));
        $response->assertOk();

        $pageProps = $response->original->getData()['page']['props'];
        $suppliers = $pageProps['suppliers'];

        $this->assertCount(1, $suppliers);
        $firstSupplier = $suppliers[0];

        // 150.00 (Item 1 price) + 500.00 (Item 2 price/total) = 650.00
        $this->assertEquals(650.00, (float) $firstSupplier['amount']);
        $this->assertEquals(650.00, (float) $firstSupplier['items_total']);
        $this->assertCount(2, $pageProps['items']);
    }

    public function test_supplier_without_items_defaults_to_zero(): void
    {
        $supplier = Supplier::create([
            'name' => 'XYZ Stationery',
            'tin' => '444-555-666',
            'address' => 'Naga City',
            'reg_number' => 'REG-002',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('suppliers.index'));
        $response->assertOk();

        $pageProps = $response->original->getData()['page']['props'];
        $suppliers = collect($pageProps['suppliers']);
        $xyzSupplier = $suppliers->firstWhere('name', 'XYZ Stationery');

        $this->assertNotNull($xyzSupplier);
        $this->assertEquals(0.00, (float) $xyzSupplier['amount']);
        $this->assertEquals(0.00, (float) $xyzSupplier['items_total']);
    }
}
