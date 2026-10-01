<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class SupplyRequestWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function user(string $role): User
    {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole($role);
        return $user;
    }

    private function item(int $stock = 50): Item
    {
        return Item::create([
            'name' => 'Office Paper', 'sku' => 'PAPER-001', 'stock' => $stock,
            'unit_cost' => 10, 'amount' => $stock * 10, 'status' => 'Available',
            'unit_of_issue' => 'ream',
        ]);
    }

    private function submit(User $coordinator, Item $item, int $quantity): SupplyRequest
    {
        $this->actingAs($coordinator)->post(route('inventory.requests.store'), [
            'department' => 'Registrar', 'purpose' => 'Office operations',
            'items' => [['item_id' => $item->id, 'quantity' => $quantity]],
        ])->assertRedirect(route('inventory.requests.index'));
        return SupplyRequest::latest('id')->firstOrFail();
    }

    public function test_approval_reserves_stock_and_release_creates_one_issuance(): void
    {
        $coordinator = $this->user('Supply Coordinator');
        $custodian = $this->user('Property Custodian');
        $admin = $this->user('System Admin');
        $item = $this->item();
        $request = $this->submit($coordinator, $item, 10);
        $line = $request->items()->firstOrFail();

        $this->assertSame(50, $item->fresh()->stock);
        $this->actingAs($coordinator)->post(route('inventory.requests.approve', $request), [
            'approved_quantities' => [$line->id => 10],
        ])->assertForbidden();
        $this->actingAs($custodian)->post(route('inventory.requests.approve', $request), [
            'approved_quantities' => [$line->id => 10],
        ])->assertRedirect();
        $this->assertSame('Approved', $request->fresh()->status);
        $this->assertSame(50, $item->fresh()->stock);
        $this->assertSame(0, Issuance::count());
        $this->actingAs($custodian)->get(route('inventory.issuance'))
            ->assertOk()->assertInertia(fn ($page) => $page->component('Inventory/Issuance')->has('supplyRequests', 1));

        $this->actingAs($admin)->post(route('inventory.issuance.store'), [
            'issuances' => [['item_id' => $item->id, 'quantity' => 45]],
            'recipient' => 'Other office', 'date_issued' => now()->toDateString(),
        ])->assertSessionHasErrors('issuances');

        $this->actingAs($custodian)->post(route('inventory.requests.release', $request), [])
            ->assertSessionHasErrors('signed_ris_presented');
        $this->actingAs($custodian)->post(route('inventory.requests.release', $request), ['signed_ris_presented' => true])
            ->assertRedirect();
        $this->assertSame('Issued', $request->fresh()->status);
        $this->assertSame(40, $item->fresh()->stock);
        $this->assertSame(1, Issuance::count());
        $this->assertSame($request->fresh()->ris_number, $request->fresh()->issuance->ris_number);
        $this->actingAs($admin)->delete(route('inventory.issuance.destroy', $request->fresh()->issuance))
            ->assertSessionHasErrors('issuance');

        $this->actingAs($custodian)->post(route('inventory.requests.release', $request), ['signed_ris_presented' => true])
            ->assertSessionHasErrors('request');
        $this->assertSame(40, $item->fresh()->stock);
    }

    public function test_coordinator_sees_only_own_requests_and_cannot_edit_after_approval(): void
    {
        $first = $this->user('Supply Coordinator');
        $second = $this->user('Supply Coordinator');
        $custodian = $this->user('Property Custodian');
        $item = $this->item();
        $request = $this->submit($first, $item, 5);

        $this->actingAs($second)->get(route('inventory.requests.index'))
            ->assertOk()->assertInertia(fn ($page) => $page->component('Inventory/Requests/Index')->has('requests', 0));
        $this->actingAs($second)->put(route('inventory.requests.update', $request), [
            'department' => 'Other', 'purpose' => 'Other', 'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertForbidden();

        $line = $request->items()->firstOrFail();
        $this->actingAs($custodian)->post(route('inventory.requests.approve', $request), [
            'approved_quantities' => [$line->id => 5],
        ])->assertRedirect();
        $this->actingAs($first)->put(route('inventory.requests.update', $request), [
            'department' => 'Changed', 'purpose' => 'Changed', 'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('request');
        $this->assertSame('Registrar', $request->fresh()->department);
    }

    public function test_approval_cannot_overbook_and_cancellation_frees_reservation(): void
    {
        $coordinator = $this->user('Supply Coordinator');
        $custodian = $this->user('Property Custodian');
        $item = $this->item(10);
        $first = $this->submit($coordinator, $item, 8);
        $second = $this->submit($coordinator, $item, 5);
        $firstLine = $first->items()->firstOrFail();
        $secondLine = $second->items()->firstOrFail();

        $this->actingAs($custodian)->post(route('inventory.requests.approve', $first), [
            'approved_quantities' => [$firstLine->id => 8],
        ])->assertRedirect();
        $this->actingAs($custodian)->post(route('inventory.requests.approve', $second), [
            'approved_quantities' => [$secondLine->id => 5],
        ])->assertSessionHasErrors('approved_quantities');
        $this->assertSame('Pending', $second->fresh()->status);

        $this->actingAs($coordinator)->post(route('inventory.requests.cancel', $first))->assertRedirect();
        $this->actingAs($custodian)->post(route('inventory.requests.approve', $second), [
            'approved_quantities' => [$secondLine->id => 5],
        ])->assertRedirect();
        $this->assertSame(10, $item->fresh()->stock);
        $this->assertSame('Approved', $second->fresh()->status);

        $this->actingAs($custodian)->post(route('inventory.requests.approve', $second), [
            'approved_quantities' => [$secondLine->id => 3],
        ])->assertRedirect();
        $this->assertSame(3, $secondLine->fresh()->approved_quantity);
    }

    public function test_reserved_stock_cannot_be_removed_through_item_edit(): void
    {
        $coordinator = $this->user('Supply Coordinator');
        $custodian = $this->user('Property Custodian');
        $admin = $this->user('System Admin');
        $item = $this->item(10);
        $request = $this->submit($coordinator, $item, 8);
        $line = $request->items()->firstOrFail();
        $this->actingAs($custodian)->post(route('inventory.requests.approve', $request), [
            'approved_quantities' => [$line->id => 8],
        ])->assertRedirect();

        $this->actingAs($admin)->put(route('inventory.update', $item), [
            'name' => $item->name, 'sku' => $item->sku, 'stock' => 5,
        ])->assertSessionHasErrors('stock');
        $this->assertSame(10, $item->fresh()->stock);
    }

    public function test_only_owner_can_download_approved_ris_pdf(): void
    {
        $coordinator = $this->user('Supply Coordinator');
        $other = $this->user('Supply Coordinator');
        $custodian = $this->user('Property Custodian');
        Permission::firstOrCreate(['name' => 'route:inventory.requests.index', 'guard_name' => 'web']);
        $coordinator->givePermissionTo('route:inventory.requests.index');
        $other->givePermissionTo('route:inventory.requests.index');
        $request = $this->submit($coordinator, $this->item(), 3);
        $this->assertSame($coordinator->id, $request->requested_by);
        $url = route('inventory.requests.ris-pdf', $request);

        $this->actingAs($coordinator)->get($url)->assertNotFound();
        $this->actingAs($other)->get($url)->assertForbidden();

        $line = $request->items()->firstOrFail();
        $this->actingAs($custodian)->post(route('inventory.requests.approve', $request), [
            'approved_quantities' => [$line->id => 3],
        ])->assertRedirect();

        $pdf = $this->actingAs($coordinator)->get($url);
        $pdf->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $pdf->getContent());
        $this->actingAs($other)->get($url)->assertForbidden();
        $this->actingAs($coordinator)->get($url . '?inline=1')
            ->assertOk()->assertHeader('content-type', 'application/pdf');

        $this->actingAs($custodian)->post(route('inventory.requests.release', $request), [
            'signed_ris_presented' => true,
        ])->assertRedirect();
        $this->actingAs($coordinator)->get($url)->assertOk()->assertHeader('content-type', 'application/pdf');
    }
}
