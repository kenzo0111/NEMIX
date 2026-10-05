<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Models\SupplyRequestAlert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SupplyRequestAlertTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function user(string $role, bool $active = true): User
    {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $user = User::factory()->create(['is_active' => $active]);
        $user->assignRole($role);
        return $user;
    }

    public function test_submission_alerts_active_approvers_and_read_state_is_private(): void
    {
        $coordinator = $this->user('Supply Coordinator');
        $first = $this->user('Property Custodian');
        $second = $this->user('Property Custodian');
        $inactive = $this->user('Property Custodian', false);
        $item = Item::create([
            'name' => 'Paper', 'sku' => 'PAPER-ALERT', 'stock' => 10,
            'unit_cost' => 5, 'amount' => 50, 'status' => 'Available', 'unit_of_issue' => 'ream',
        ]);

        $this->actingAs($coordinator)->post(route('inventory.requests.store'), [
            'department' => 'Registrar', 'purpose' => 'Office work',
            'items' => [['item_id' => $item->id, 'quantity' => 2]],
        ])->assertRedirect();
        $request = SupplyRequest::latest('id')->firstOrFail();

        $this->assertDatabaseHas('supply_request_alerts', ['user_id' => $first->id, 'supply_request_id' => $request->id]);
        $this->assertDatabaseHas('supply_request_alerts', ['user_id' => $second->id, 'supply_request_id' => $request->id]);
        $this->assertDatabaseMissing('supply_request_alerts', ['user_id' => $inactive->id, 'supply_request_id' => $request->id]);
        $this->assertDatabaseMissing('supply_request_alerts', ['user_id' => $coordinator->id, 'supply_request_id' => $request->id]);

        $firstAlert = SupplyRequestAlert::where('user_id', $first->id)->firstOrFail();
        $secondAlert = SupplyRequestAlert::where('user_id', $second->id)->firstOrFail();
        $this->actingAs($first)->get(route('inventory.request-alerts.index'))
            ->assertOk()->assertJsonPath('unread_count', 1)->assertJsonPath('pending_count', 1)
            ->assertJsonPath('alerts.0.request_id', $request->id);
        $this->actingAs($coordinator)->get(route('inventory.request-alerts.index'))->assertForbidden();
        $this->actingAs($first)->post(route('inventory.request-alerts.read', $secondAlert))->assertForbidden();
        $this->actingAs($first)->post(route('inventory.request-alerts.read', $firstAlert))->assertOk();
        $this->actingAs($first)->get(route('inventory.request-alerts.index'))
            ->assertJsonPath('unread_count', 0)->assertJsonPath('pending_count', 1);
        $this->actingAs($second)->get(route('inventory.request-alerts.index'))
            ->assertJsonPath('unread_count', 1);
    }

    public function test_pending_count_changes_after_approval_but_alert_remains_readable(): void
    {
        $coordinator = $this->user('Supply Coordinator');
        $custodian = $this->user('Property Custodian');
        $item = Item::create([
            'name' => 'Pens', 'sku' => 'PEN-ALERT', 'stock' => 10,
            'unit_cost' => 2, 'amount' => 20, 'status' => 'Available', 'unit_of_issue' => 'box',
        ]);
        $this->actingAs($coordinator)->post(route('inventory.requests.store'), [
            'department' => 'Registrar', 'purpose' => 'Office work',
            'items' => [['item_id' => $item->id, 'quantity' => 2]],
        ])->assertRedirect();
        $request = SupplyRequest::latest('id')->firstOrFail();
        $line = $request->items()->firstOrFail();

        $this->actingAs($custodian)->post(route('inventory.requests.approve', $request), [
            'approved_quantities' => [$line->id => 2],
        ])->assertRedirect();
        $this->actingAs($custodian)->get(route('inventory.request-alerts.index'))
            ->assertOk()->assertJsonPath('pending_count', 0)->assertJsonPath('alerts.0.status', 'Approved');
    }

    public function test_older_unread_alerts_can_be_loaded_and_read(): void
    {
        $custodian = $this->user('Property Custodian');
        $coordinator = $this->user('Supply Coordinator');

        for ($number = 1; $number <= 12; $number++) {
            $request = SupplyRequest::create([
                'ris_number' => 'RIS-ALERT-'.$number,
                'requested_by' => $coordinator->id,
                'department' => 'Registrar',
                'purpose' => 'Office work',
                'date_requested' => now()->toDateString(),
                'status' => 'Pending',
            ]);
            SupplyRequestAlert::create(['user_id' => $custodian->id, 'supply_request_id' => $request->id]);
        }

        $firstPage = $this->actingAs($custodian)->getJson(route('inventory.request-alerts.index'))
            ->assertOk()->assertJsonPath('unread_count', 12)->assertJsonPath('has_more', true)
            ->assertJsonCount(10, 'alerts')->json();

        $oldestVisibleId = $firstPage['alerts'][9]['id'];
        $older = $this->actingAs($custodian)->getJson(route('inventory.request-alerts.index', ['before' => $oldestVisibleId]))
            ->assertOk()->assertJsonPath('has_more', false)->assertJsonCount(2, 'alerts')->json();

        $this->actingAs($custodian)->postJson(route('inventory.request-alerts.read', $older['alerts'][1]['id']))->assertOk();
        $this->actingAs($custodian)->getJson(route('inventory.request-alerts.index'))
            ->assertJsonPath('unread_count', 11);
    }
}
