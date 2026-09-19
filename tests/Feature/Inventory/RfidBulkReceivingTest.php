<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RfidBulkReceivingTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Supplier $supplier;
    private Item $first;
    private Item $second;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'System Admin']);
        $this->admin = User::factory()->create(['is_active' => true]);
        $this->admin->assignRole('System Admin');
        $this->supplier = Supplier::create([
            'name' => 'RFID Supply', 'tin' => '111-222-333-000', 'address' => 'Daet',
            'reg_number' => 'RFID-BULK', 'category' => 'Office Supplies',
            'status' => 'active', 'created_by' => $this->admin->id,
        ]);
        $this->first = $this->makeItem('TAG-ONE', 'First item');
        $this->second = $this->makeItem('TAG-TWO', 'Second item');
    }

    private function makeItem(string $tag, string $name): Item
    {
        return Item::create([
            'name' => $name, 'sku' => $tag, 'rfid_tag' => $tag,
            'supplier_id' => $this->supplier->id, 'stock' => 0,
            'unit_cost' => 12.5, 'status' => 'Available',
            'created_by' => $this->admin->id,
        ]);
    }

    private function payload(array $tags): array
    {
        return [
            'date_received' => '2026-09-19',
            'items' => array_map(fn ($tag) => [
                'tag' => $tag, 'supplier_id' => $this->supplier->id,
            ], $tags),
        ];
    }

    public function test_multiple_tags_create_one_receipt_and_batch_per_item(): void
    {
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $this->payload(['TAG-ONE', 'TAG-TWO']))
            ->assertRedirect(route('inventory.receiving'));

        $this->assertSame(2, Receiving::count());
        $this->assertSame(2, InventoryBatch::whereNotNull('receiving_id')->count());
        foreach ([$this->first, $this->second] as $item) {
            $this->assertDatabaseHas('receivings', ['item_id' => $item->id, 'quantity' => 1, 'supplier_id' => $this->supplier->id]);
            $this->assertSame(1, (int) $item->fresh()->stock);
        }
    }

    public function test_duplicate_tags_reject_the_entire_receipt(): void
    {
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $this->payload(['TAG-ONE', 'tag-one']))
            ->assertSessionHasErrors(['items.1.tag']);

        $this->assertSame(0, Receiving::count());
        $this->assertSame(0, InventoryBatch::whereNotNull('receiving_id')->count());
    }

    public function test_unknown_or_invalid_tag_rejects_the_entire_receipt(): void
    {
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $this->payload(['TAG-ONE', 'MISSING']))
            ->assertSessionHasErrors(['items.1.tag']);
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $this->payload(['TAG-ONE', 'BAD!TAG']))
            ->assertSessionHasErrors(['items.1.tag']);

        $this->assertSame(0, Receiving::count());
    }
}
