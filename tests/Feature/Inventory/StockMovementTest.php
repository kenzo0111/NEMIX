<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StockMovementTest extends TestCase
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
            'name' => 'Gov Supplies Direct Inc.',
            'tin' => '999-888-777-000',
            'address' => 'Daet, Camarines Norte',
            'reg_number' => 'REG-99999',
            'category' => 'General Merchandise',
            'status' => 'active',
            'created_by' => $this->adminUser->id,
        ]);

        $this->item = Item::create([
            'name' => 'Correction Tape 5mm x 6m',
            'supplier_id' => $this->supplier->id,
            'sku' => 'COR-TP-001',
            'stock' => 50,
            'unit_cost' => 35.00,
            'amount' => 1750.00,
            'status' => 'Available',
            'unit_of_issue' => 'Piece',
            'created_by' => $this->adminUser->id,
        ]);
    }

    public function test_receiving_stock_increments_item_inventory(): void
    {
        $response = $this->actingAs($this->adminUser)->post(route('inventory.receiving.store'), [
            'item_id' => $this->item->id,
            'supplier_id' => $this->supplier->id,
            'quantity' => 25,
            'date_received' => now()->toDateString(),
        ]);

        $response->assertRedirect(route('inventory.receiving'));

        $this->assertDatabaseHas('receivings', [
            'item_id' => $this->item->id,
            'quantity' => 25,
        ]);

        $this->item->refresh();
        $this->assertEquals(75, $this->item->stock);
        $this->assertEquals(2625.00, $this->item->amount);
    }

    public function test_issuance_stock_deducts_item_inventory(): void
    {
        $response = $this->actingAs($this->adminUser)->post(route('inventory.issuance.store'), [
            'issuances' => [
                [
                    'item_id' => $this->item->id,
                    'quantity' => 20,
                ],
            ],
            'recipient' => 'Dr. Juan Dela Cruz',
            'department' => 'College of Engineering',
            'fund_cluster' => 'Fund 101',
            'date_issued' => now()->toDateString(),
        ]);

        $response->assertRedirect(route('inventory.issuance'));

        $this->assertDatabaseHas('issuances', [
            'item_id' => $this->item->id,
            'quantity' => 20,
            'recipient' => 'Dr. Juan Dela Cruz',
        ]);

        $this->item->refresh();
        $this->assertEquals(30, $this->item->stock);
    }

    public function test_over_issuance_is_prevented_when_stock_is_insufficient(): void
    {
        $response = $this->actingAs($this->adminUser)->post(route('inventory.issuance.store'), [
            'issuances' => [
                [
                    'item_id' => $this->item->id,
                    'quantity' => 100, // Stock is only 50
                ],
            ],
            'recipient' => 'Maria Santos',
            'department' => 'HR Office',
            'date_issued' => now()->toDateString(),
        ]);

        $response->assertSessionHasErrors(['issuances']);

        $this->item->refresh();
        $this->assertEquals(50, $this->item->stock);
    }

    public function test_voiding_issuance_reverts_stock_to_inventory(): void
    {
        $issuance = Issuance::create([
            'item_id' => $this->item->id,
            'quantity' => 15,
            'recipient' => 'Pedro Penduko',
            'department' => 'Registrar',
            'date_issued' => now()->toDateString(),
            'status' => 'Issued',
            'issued_by' => $this->adminUser->id,
        ]);

        // Simulate deduction at issuance
        $this->item->stock -= 15;
        $this->item->save();

        $response = $this->actingAs($this->adminUser)->delete(route('inventory.issuance.destroy', $issuance));
        $response->assertRedirect(route('inventory.issuance'));

        $this->item->refresh();
        $this->assertEquals(50, $this->item->stock);
        $this->assertSoftDeleted('issuances', ['id' => $issuance->id]);
    }
}
