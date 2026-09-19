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
                'tag' => $tag, 'supplier_id' => $this->supplier->id, 'quantity' => 1, 'unit_cost' => 14.75,
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

    public function test_scanned_item_type_receives_the_inspected_batch_quantity(): void
    {
        $payload = $this->payload(['TAG-ONE', 'TAG-TWO']);
        $payload['items'][0]['quantity'] = 20;
        $payload['items'][1]['quantity'] = 5;
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $payload)->assertSessionHasNoErrors();

        $this->assertDatabaseHas('receivings', ['item_id' => $this->first->id, 'quantity' => 20, 'scanned_rfid_tag' => 'TAG-ONE']);
        $this->assertDatabaseHas('receivings', ['item_id' => $this->second->id, 'quantity' => 5, 'scanned_rfid_tag' => 'TAG-TWO']);
        $this->assertSame(20, (int) $this->first->fresh()->stock);
        $this->assertSame(5, (int) $this->second->fresh()->stock);
    }

    public function test_retry_or_double_submission_does_not_add_stock_again(): void
    {
        $payload = $this->payload(['TAG-ONE', 'TAG-TWO']);
        $payload['items'][0]['quantity'] = 20;
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $payload)->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $payload)->assertSessionHasNoErrors();
        $this->assertSame(2, Receiving::count());
        $this->assertSame(20, $this->first->fresh()->stock);
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

    public function test_invalid_inspected_quantity_rejects_all_lines(): void
    {
        $payload = $this->payload(['TAG-ONE', 'TAG-TWO']);
        $payload['items'][1]['quantity'] = 0;
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $payload)
            ->assertSessionHasErrors(['items.1.quantity']);
        $this->assertSame(0, Receiving::count());
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

    public function test_concurrent_stations_receive_only_their_scoped_device_scans(): void
    {
        DB::table('rfid_scan_events')->insert([
            ['tag' => 'TAG-STATION-A', 'device_uuid' => 'DEVICE-A', 'station_id' => 'STATION-1', 'occurred_at' => 200, 'created_at' => now()],
            ['tag' => 'TAG-STATION-B', 'device_uuid' => 'DEVICE-B', 'station_id' => 'STATION-2', 'occurred_at' => 201, 'created_at' => now()],
        ]);

        // Station 1 listening to DEVICE-A
        $resA = $this->actingAs($this->admin)->getJson(route('rfid-scanner.live-feed', ['device_uuid' => 'DEVICE-A']));
        $resA->assertOk()->assertJsonCount(1, 'events')->assertJsonPath('events.0.tag', 'TAG-STATION-A');

        // Station 2 listening to DEVICE-B
        $resB = $this->actingAs($this->admin)->getJson(route('rfid-scanner.live-feed', ['device_uuid' => 'DEVICE-B']));
        $resB->assertOk()->assertJsonCount(1, 'events')->assertJsonPath('events.0.tag', 'TAG-STATION-B');
    }

    public function test_server_defined_session_cursor_advances_without_client_clock_comparison(): void
    {
        DB::table('rfid_scan_events')->insert([
            ['tag' => 'TAG-HIST-1', 'device_uuid' => 'DEV-CURSOR', 'occurred_at' => 100, 'created_at' => now()],
        ]);

        $initial = $this->actingAs($this->admin)->getJson(route('rfid-scanner.live-feed', ['device_uuid' => 'DEV-CURSOR']));
        $initial->assertOk()->assertJsonCount(1, 'events');
        $latestEventId = $initial->json('latest_event_id');

        // Same cursor returns 0 events
        $subsequent = $this->actingAs($this->admin)->getJson(route('rfid-scanner.live-feed', [
            'device_uuid' => 'DEV-CURSOR',
            'since' => $latestEventId,
        ]));
        $subsequent->assertOk()->assertJsonCount(0, 'events');

        // New event arrives
        DB::table('rfid_scan_events')->insert([
            ['tag' => 'TAG-HIST-2', 'device_uuid' => 'DEV-CURSOR', 'occurred_at' => 105, 'created_at' => now()],
        ]);

        $polled = $this->actingAs($this->admin)->getJson(route('rfid-scanner.live-feed', [
            'device_uuid' => 'DEV-CURSOR',
            'since' => $latestEventId,
        ]));
        $polled->assertOk()->assertJsonCount(1, 'events')->assertJsonPath('events.0.tag', 'TAG-HIST-2');
    }

    public function test_initializing_a_device_session_skips_earlier_scans_and_captures_new_ones(): void
    {
        DB::table('rfid_scan_events')->insert([
            'tag' => 'TAG-ONE', 'device_uuid' => 'DEV-SESSION', 'station_id' => 'A',
            'occurred_at' => microtime(true), 'created_at' => now(),
        ]);

        $initial = $this->actingAs($this->admin)->getJson(route('rfid-scanner.live-feed', [
            'device_uuid' => 'DEV-SESSION', 'station' => 'A', 'initialize' => 1,
        ]));
        $initial->assertOk()->assertJsonCount(0, 'events');
        $cursor = $initial->json('latest_event_id');
        $this->assertGreaterThan(0, $cursor);

        DB::table('rfid_scan_events')->insert([
            'tag' => 'TAG-TWO', 'device_uuid' => 'DEV-SESSION', 'station_id' => 'A',
            'occurred_at' => microtime(true), 'created_at' => now(),
        ]);
        $this->actingAs($this->admin)->getJson(route('rfid-scanner.live-feed', [
            'device_uuid' => 'DEV-SESSION', 'station' => 'A', 'since' => $cursor,
        ]))->assertJsonCount(1, 'events')->assertJsonPath('events.0.tag', 'TAG-TWO');
    }

    public function test_station_filter_excludes_unassigned_hardware_events(): void
    {
        DB::table('rfid_scan_events')->insert([
            'tag' => 'TAG-ONE', 'device_uuid' => 'DEV-SESSION', 'station_id' => null,
            'occurred_at' => microtime(true), 'created_at' => now(),
        ]);
        $this->actingAs($this->admin)->getJson(route('rfid-scanner.live-feed', [
            'device_uuid' => 'DEV-SESSION', 'station' => 'A', 'since' => 0,
        ]))->assertJsonCount(0, 'events');
    }

    public function test_rfid_receipt_quantity_can_be_corrected_from_inspection_record(): void
    {
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $this->payload(['TAG-ONE']))->assertSessionHasNoErrors();
        $receipt = Receiving::firstOrFail();

        // Quantity can be corrected while the scanned item identity stays fixed.
        $this->actingAs($this->admin)->put(route('inventory.receiving.update', $receipt), [
            'item_id' => $this->first->id,
            'supplier_id' => $this->supplier->id,
            'quantity' => 5,
            'unit_cost' => 14.75,
            'date_received' => '2026-09-19',
        ])->assertSessionHasNoErrors();

        // Cost and date corrections also remain available.
        $this->actingAs($this->admin)->put(route('inventory.receiving.update', $receipt), [
            'item_id' => $this->first->id,
            'supplier_id' => $this->supplier->id,
            'quantity' => 5,
            'unit_cost' => 20.00,
            'date_received' => '2026-09-20',
        ])->assertSessionHasNoErrors();

        $this->assertSame(5, (int) $receipt->fresh()->quantity);
        $this->assertSame('20.00', $receipt->fresh()->batch->unit_cost);
    }

    public function test_hundred_item_bulk_limit_enforced_on_submission(): void
    {
        $tags101 = [];
        for ($i = 1; $i <= 101; $i++) {
            $tag = "TAG-BULK-{$i}";
            $this->makeItem($tag, "Bulk Item {$i}");
            $tags101[] = $tag;
        }

        // 101 items exceeds max:100 validation
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $this->payload($tags101))
            ->assertSessionHasErrors(['items']);

        // Exactly 100 items is accepted
        $tags100 = array_slice($tags101, 0, 100);
        $this->actingAs($this->admin)->post(route('inventory.receiving.rfid.store'), $this->payload($tags100))
            ->assertSessionHasNoErrors();

        $this->assertSame(100, Receiving::count());
    }

    public function test_staff_with_receiving_permission_can_access_lookup_and_live_feed_without_rfid_admin(): void
    {
        $staff = User::factory()->create(['is_active' => true]);
        \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'inventory.receiving', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'inventory.receiving.store', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'rfid.view', 'guard_name' => 'web']);
        $staff->givePermissionTo(['inventory.receiving', 'inventory.receiving.store']);
        $this->first->update(['created_by' => $staff->id]);

        // Receiving staff CAN access scanner status, lookup, and live-feed
        $this->actingAs($staff)->getJson(route('rfid-scanner.status'))->assertOk();
        $this->actingAs($staff)->getJson(route('rfid-scanner.lookup', 'TAG-ONE'))->assertOk();
        $this->actingAs($staff)->getJson(route('rfid-scanner.live-feed'))->assertOk();

        // Receiving staff CANNOT access RFID administrative page or assignment endpoints
        $this->actingAs($staff)->get(route('rfid-scanner.index'))->assertForbidden();
        $this->actingAs($staff)->post(route('rfid-scanner.assign'), ['item_id' => $this->first->id, 'rfid_tag' => 'TAG-NEW'])->assertForbidden();
        $this->actingAs($staff)->post(route('rfid-scanner.unassign'), ['item_id' => $this->first->id])->assertForbidden();
    }
}
