<?php

namespace Tests\Feature\Suppliers;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SupplierContractSuppliesValueTest extends TestCase
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

    public function test_contract_supplies_value_is_dynamically_calculated_for_single_and_multiple_items(): void
    {
        $supplierA = Supplier::create([
            'name' => 'ABC Trading',
            'tin' => '111-222-333-000',
            'address' => '123 Rizal St, Manila',
            'reg_number' => 'REG-1001',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $supplierB = Supplier::create([
            'name' => 'XYZ Enterprises',
            'tin' => '444-555-666-000',
            'address' => '456 Quezon Ave, Quezon City',
            'reg_number' => 'REG-1002',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        // Supplier A: Bond Paper (10 * 250 = 2,500)
        Item::create([
            'name' => 'Bond Paper',
            'supplier_id' => $supplierA->id,
            'sku' => 'ITM-BND-01',
            'stock' => 10,
            'unit_cost' => 250.00,
            'amount' => 2500.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        // Supplier A: Printer Ink (5 * 600 = 3,000)
        Item::create([
            'name' => 'Printer Ink',
            'supplier_id' => $supplierA->id,
            'sku' => 'ITM-INK-01',
            'stock' => 5,
            'unit_cost' => 600.00,
            'amount' => 3000.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        // Supplier A: Folder (20 * 25 = 500)
        Item::create([
            'name' => 'Folder',
            'supplier_id' => $supplierA->id,
            'sku' => 'ITM-FLD-01',
            'stock' => 20,
            'unit_cost' => 25.00,
            'amount' => 500.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        // Supplier B: Single Item (4 * 150 = 600)
        Item::create([
            'name' => 'Stapler',
            'supplier_id' => $supplierB->id,
            'sku' => 'ITM-STP-01',
            'stock' => 4,
            'unit_cost' => 150.00,
            'amount' => 600.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('suppliers.index'));
        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Suppliers/ManageSupplier')
            ->has('suppliers', 2)
            ->where('suppliers', fn ($suppliers) => 
                collect($suppliers)->firstWhere('id', $supplierA->id)['contract_supplies_value'] == 6000.00 &&
                collect($suppliers)->firstWhere('id', $supplierB->id)['contract_supplies_value'] == 600.00
            )
        );
    }

    public function test_receiving_item_automatically_increases_supplier_contract_supplies_value(): void
    {
        $supplier = Supplier::create([
            'name' => 'Office Depot PH',
            'tin' => '777-888-999-000',
            'address' => 'Makati City',
            'reg_number' => 'REG-2001',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $item = Item::create([
            'name' => 'Item X',
            'supplier_id' => $supplier->id,
            'sku' => 'ITM-X-001',
            'stock' => 10,
            'unit_cost' => 500.00,
            'amount' => 5000.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        // Prior to receiving: 10 * 500 = 5,000.00
        $response = $this->actingAs($this->adminUser)->get(route('suppliers.index'));
        $response->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.0.contract_supplies_value', fn ($val) => (float) $val == 5000.00)
        );

        // Receive 5 additional units through the Receiving endpoint
        $receiveResponse = $this->actingAs($this->adminUser)->post(route('inventory.receiving.store'), [
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 5,
            'date_received' => now()->toDateString(),
        ]);
        $receiveResponse->assertRedirect(route('inventory.receiving'));

        // Post-receiving: (10 + 5) * 500 = 7,500.00
        $response = $this->actingAs($this->adminUser)->get(route('suppliers.index'));
        $response->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.0.contract_supplies_value', fn ($val) => (float) $val == 7500.00)
        );
    }

    public function test_issuing_item_automatically_decreases_supplier_contract_supplies_value(): void
    {
        $supplier = Supplier::create([
            'name' => 'Gov Mart Central',
            'tin' => '121-232-343-000',
            'address' => 'Pasig City',
            'reg_number' => 'REG-3001',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $item = Item::create([
            'name' => 'Item Y',
            'supplier_id' => $supplier->id,
            'sku' => 'ITM-Y-001',
            'stock' => 15,
            'unit_cost' => 500.00,
            'amount' => 7500.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        // Prior to issuance: 15 * 500 = 7,500.00
        $response = $this->actingAs($this->adminUser)->get(route('suppliers.index'));
        $response->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.0.contract_supplies_value', fn ($val) => (float) $val == 7500.00)
        );

        // Issue 3 units through the Issuance endpoint
        $issuanceResponse = $this->actingAs($this->adminUser)->post(route('inventory.issuance.store'), [
            'issuances' => [
                [
                    'item_id' => $item->id,
                    'quantity' => 3,
                ],
            ],
            'recipient' => 'Engr. Pedro Santos',
            'department' => 'Operations',
            'date_issued' => now()->toDateString(),
        ]);
        $issuanceResponse->assertRedirect(route('inventory.issuance'));

        // Post-issuance: (15 - 3) * 500 = 6,000.00 (decrease of 1,500.00)
        $response = $this->actingAs($this->adminUser)->get(route('suppliers.index'));
        $response->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.0.contract_supplies_value', fn ($val) => (float) $val == 6000.00)
        );
    }

    public function test_supplier_with_no_remaining_stock_returns_zero_contract_supplies_value(): void
    {
        $supplier = Supplier::create([
            'name' => 'Zero Stock Supplier',
            'tin' => '999-000-111-222',
            'address' => 'Taguig City',
            'reg_number' => 'REG-4001',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        // Item with 0 stock
        Item::create([
            'name' => 'Depleted Item',
            'supplier_id' => $supplier->id,
            'sku' => 'ITM-DEP-01',
            'stock' => 0,
            'unit_cost' => 1000.00,
            'amount' => 0.00,
            'status' => 'Out of Stock',
            'created_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('suppliers.index'));
        $response->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.0.contract_supplies_value', fn ($val) => (float) $val == 0.00)
        );
    }

    public function test_supplier_creation_does_not_persist_manual_amount(): void
    {
        $response = $this->actingAs($this->adminUser)->post(route('suppliers.store'), [
            'name' => 'New Clean Supplier',
            'tin' => '888-777-666-555',
            'address' => 'Quezon City',
            'reg_number' => 'REG-5001',
            'category' => 'goods',
            'status' => 'active',
            'amount' => 12345.67, // Even if passed, must not be stored
        ]);

        $response->assertRedirect(route('suppliers.index'));

        $supplier = Supplier::where('reg_number', 'REG-5001')->firstOrFail();
        // Contract supplies value should be 0 because no items are associated
        $this->assertEquals(0.00, $supplier->contract_supplies_value);

        // ManageSupplier page should show 0.00
        $response = $this->actingAs($this->adminUser)->get(route('suppliers.index'));
        $response->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.0.contract_supplies_value', fn ($val) => (float) $val == 0.00)
        );
    }

    public function test_voiding_transactions_adjusts_supplier_contract_supplies_value(): void
    {
        $supplier = Supplier::create([
            'name' => 'Adjustment Test Supplier',
            'tin' => '333-222-111-000',
            'address' => 'Mandaluyong City',
            'reg_number' => 'REG-6001',
            'category' => 'goods',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $item = Item::create([
            'name' => 'Adjustment Item',
            'supplier_id' => $supplier->id,
            'sku' => 'ITM-ADJ-01',
            'stock' => 10,
            'unit_cost' => 100.00,
            'amount' => 1000.00,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        // 1. Receive 10 units
        $receiving = Receiving::create([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 10,
            'date_received' => now()->toDateString(),
            'created_by' => $this->adminUser->id,
        ]);
        $item->stock += 10;
        $item->amount = 2000.00;
        $item->save();

        $this->actingAs($this->adminUser)->get(route('suppliers.index'))
            ->assertInertia(fn (Assert $page) => $page->where('suppliers.0.contract_supplies_value', fn ($val) => (float) $val == 2000.00));

        // 2. Void Receiving: stock reverts by -10 -> value becomes 1,000.00
        $this->actingAs($this->adminUser)->delete(route('inventory.receiving.destroy', $receiving));
        $this->actingAs($this->adminUser)->get(route('suppliers.index'))
            ->assertInertia(fn (Assert $page) => $page->where('suppliers.0.contract_supplies_value', fn ($val) => (float) $val == 1000.00));

        // 3. Issue 4 units
        $item->refresh();
        $issuance = Issuance::create([
            'item_id' => $item->id,
            'quantity' => 4,
            'recipient' => 'Staff Member',
            'date_issued' => now()->toDateString(),
            'status' => 'Issued',
            'issued_by' => $this->adminUser->id,
        ]);
        $item->stock -= 4;
        $item->amount = 600.00;
        $item->save();

        $this->actingAs($this->adminUser)->get(route('suppliers.index'))
            ->assertInertia(fn (Assert $page) => $page->where('suppliers.0.contract_supplies_value', fn ($val) => (float) $val == 600.00));

        // 4. Void Issuance: stock reverts by +4 -> value becomes 1,000.00
        $this->actingAs($this->adminUser)->delete(route('inventory.issuance.destroy', $issuance));
        $this->actingAs($this->adminUser)->get(route('suppliers.index'))
            ->assertInertia(fn (Assert $page) => $page->where('suppliers.0.contract_supplies_value', fn ($val) => (float) $val == 1000.00));
    }
}
