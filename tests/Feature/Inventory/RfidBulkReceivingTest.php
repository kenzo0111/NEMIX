<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
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
            'submission_key' => (string) Str::uuid(),
            'date_received' => '2026-09-19',
            'items' => array_map(fn ($tag) => [
                'tag' => $tag, 'supplier_id' => $this->supplier->id, 'unit_cost' => 14.75,
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
            $this->assertDatabaseHas('receivings', ['item_id' => $item->id, 'quantity' => 1, 'supplier_id' => $this->supplier->id, 'scanned_rfid_tag' => $item->rfid_tag]);
            $this->assertSame('14.75', InventoryBatch::where('item_id', $item->id)->whereNotNull('receiving_id')->firstOrFail()->unit_cost);
            $this->assertSame(1, (int) $item->fresh()->stock);
        }
    }

    public function test_retry_or_double_submission_does_not_add_stock_again(): void
    {
        $payload = $this->payload(['TAG-ONE', 'TAG-TWO']);
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $payload)->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $payload)->assertSessionHasNoErrors();
        $this->assertSame(2, Receiving::count());
        $this->assertSame(1, $this->first->fresh()->stock);
        $payload['items'][0]['unit_cost'] = 99;
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $payload)->assertSessionHasErrors(['submission_key']);
        $this->assertSame(2, Receiving::count());
    }

    public function test_scanned_receipt_cannot_be_reassigned_to_another_item(): void
    {
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $this->payload(['TAG-ONE']))->assertSessionHasNoErrors();
        $receipt = Receiving::firstOrFail();
        $this->actingAs($this->admin)->put(route('inventory.receiving.update', $receipt), [
            'item_id' => $this->second->id, 'supplier_id' => $this->supplier->id,
            'quantity' => 1, 'unit_cost' => 14.75, 'date_received' => '2026-09-19',
        ])->assertSessionHasErrors(['item_id']);
        $this->assertSame($this->first->id, $receipt->fresh()->item_id);
        $this->assertSame('TAG-ONE', $receipt->fresh()->scanned_rfid_tag);
    }

    public function test_invalid_cost_or_supplier_rolls_back_all_lines(): void
    {
        $payload = $this->payload(['TAG-ONE', 'TAG-TWO']);
        $payload['items'][1]['unit_cost'] = -1;
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $payload)->assertSessionHasErrors(['items.1.unit_cost']);
        $payload['items'][1]['unit_cost'] = 14.75;
        $payload['items'][1]['supplier_id'] = 999999;
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $payload)->assertSessionHasErrors(['items.1.supplier_id']);
        $this->assertSame(0, Receiving::count());
        $this->assertSame(0, DB::table('rfid_receiving_submissions')->count());
    }

    public function test_inactive_supplier_is_rejected_and_zero_cost_is_retained(): void
    {
        $this->supplier->update(['status' => 'inactive']);
        $payload = $this->payload(['TAG-ONE']);
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $payload)
            ->assertSessionHasErrors(['items.0.supplier_id']);
        $this->supplier->update(['status' => 'active']);
        $payload['items'][0]['unit_cost'] = 0;
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $payload)->assertSessionHasNoErrors();
        $this->assertSame('0.00', Receiving::firstOrFail()->batch->unit_cost);
    }

    public function test_foreign_owned_item_is_forbidden_without_partial_receipt(): void
    {
        $other = User::factory()->create(['is_active' => true]);
        $this->second->update(['created_by' => $other->id]);
        $staff = User::factory()->create(['is_active' => true]);
        $this->first->update(['created_by' => $staff->id]);
        $this->supplier->update(['created_by' => $staff->id]);
        $this->actingAs($staff)->post(route('inventory.receiving.rfid.store'), $this->payload(['TAG-ONE', 'TAG-TWO']))->assertForbidden();
        $this->assertSame(0, Receiving::count());
    }

    public function test_foreign_owned_supplier_is_forbidden(): void
    {
        $staff = User::factory()->create(['is_active' => true]);
        $this->first->update(['created_by' => $staff->id]);
        $this->actingAs($staff)->post(route('inventory.receiving.rfid.store'), $this->payload(['TAG-ONE']))->assertForbidden();
        $this->assertSame(0, Receiving::count());
    }

    public function test_hardware_feed_returns_ordered_scans_and_manual_lookup_does_not_echo_into_it(): void
    {
        DB::table('rfid_scan_events')->insert([
            ['tag' => 'TAG-ONE', 'occurred_at' => 100, 'created_at' => now()],
            ['tag' => 'TAG-TWO', 'occurred_at' => 101, 'created_at' => now()],
        ]);
        $response = $this->actingAs($this->admin)->getJson(route('rfid-scanner.live-feed'));
        $response->assertOk()->assertJsonCount(2, 'events');
        $cursor = $response->json('events.0.id');
        $this->actingAs($this->admin)->getJson(route('rfid-scanner.lookup', 'TAG-ONE'))->assertOk();
        $this->actingAs($this->admin)->getJson(route('rfid-scanner.live-feed', ['since' => $cursor]))
            ->assertJsonCount(1, 'events')->assertJsonPath('events.0.tag', 'TAG-TWO');
    }

    public function test_single_item_receiving_form_still_creates_a_batch(): void
    {
        $this->actingAs($this->admin)->post(route('inventory.receiving.store'), [
            'item_id' => $this->first->id, 'supplier_id' => $this->supplier->id,
            'quantity' => 3, 'unit_cost' => 8.25, 'date_received' => '2026-09-19',
        ])->assertSessionHasNoErrors();
        $receipt = Receiving::firstOrFail();
        $this->assertNull($receipt->scanned_rfid_tag);
        $this->assertSame('8.25', $receipt->batch->unit_cost);
        $this->assertSame(3, $this->first->fresh()->stock);
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
