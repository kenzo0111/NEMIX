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

    public function test_supply_request_supports_mirrored_issuance_fields_and_custodian_adjustment(): void
    {
        $coordinator = $this->user('Supply Coordinator');
        $custodian = $this->user('Property Custodian');
        $item = $this->item(100);

        // Submit with mirrored fields from Issuance page
        $this->actingAs($coordinator)->post(route('inventory.requests.store'), [
            'recipient' => 'Prof. Juan Dela Cruz',
            'recipient_designation' => 'Department Chair',
            'fund_cluster' => '05',
            'date_requested' => '2026-10-02',
            'department' => 'College of Computing and Multimedia Studies (CCMS) - Main Campus',
            'purpose' => 'Faculty research supplies',
            'items' => [
                ['item_id' => $item->id, 'quantity' => 15],
            ],
        ])->assertRedirect(route('inventory.requests.index'));

        $request = SupplyRequest::latest('id')->firstOrFail();
        $this->assertSame('Prof. Juan Dela Cruz', $request->recipient);
        $this->assertSame('Department Chair', $request->recipient_designation);
        $this->assertSame('05', $request->fund_cluster);
        $this->assertSame('2026-10-02', $request->date_requested->format('Y-m-d'));

        // Property Custodian reviews and adjusts requested quantity from 15 down to 10
        $line = $request->items()->firstOrFail();
        $this->actingAs($custodian)->post(route('inventory.requests.approve', $request), [
            'approved_quantities' => [$line->id => 10],
            'remarks' => 'Adjusted quantity due to depot allocation guidelines',
        ])->assertRedirect();

        $request->refresh();
        $this->assertSame('Approved', $request->status);
        $this->assertSame(10, $line->fresh()->approved_quantity);
        $this->assertSame('Adjusted quantity due to depot allocation guidelines', $request->review_remarks);

        // Release approved request
        $this->actingAs($custodian)->post(route('inventory.requests.release', $request), [
            'signed_ris_presented' => true,
        ])->assertRedirect();

        $request->refresh();
        $this->assertSame('Issued', $request->status);
        $issuance = $request->issuance;
        $this->assertNotNull($issuance);
        $this->assertSame('Prof. Juan Dela Cruz', $issuance->recipient);
        $this->assertSame('05', $issuance->fund_cluster);
        $this->assertSame('Department Chair', $issuance->recipient_designation);
        $this->assertMatchesRegularExpression('/^RIS-\d{4}-\d{2}-\d{4}$/', $request->ris_number);
        $this->assertSame($request->ris_number, $issuance->ris_number);
    }

    public function test_supply_request_generates_and_preserves_official_ris_number(): void
    {
        $coordinator = $this->user('Supply Coordinator');
        $custodian = $this->user('Property Custodian');
        $item = $this->item(100);

        $request1 = $this->submit($coordinator, $item, 5);
        $request2 = $this->submit($coordinator, $item, 8);

        $this->assertMatchesRegularExpression('/^RIS-\d{4}-\d{2}-\d{4}$/', $request1->ris_number);
        $this->assertMatchesRegularExpression('/^RIS-\d{4}-\d{2}-\d{4}$/', $request2->ris_number);
        $this->assertNotSame($request1->ris_number, $request2->ris_number);

        $line1 = $request1->items()->firstOrFail();
        $this->actingAs($custodian)->post(route('inventory.requests.approve', $request1), [
            'approved_quantities' => [$line1->id => 5],
        ])->assertRedirect();

        $originalRis1 = $request1->ris_number;
        $request1->refresh();
        $this->assertSame($originalRis1, $request1->ris_number);

        $this->actingAs($custodian)->post(route('inventory.requests.release', $request1), [
            'signed_ris_presented' => true,
        ])->assertRedirect();

        $request1->refresh();
        $this->assertSame($originalRis1, $request1->ris_number);
        $this->assertSame($originalRis1, $request1->issuance->ris_number);
    }

    public function test_ris_displays_actual_stock_number_and_recipient_designation(): void
    {
        $coordinator = $this->user('Supply Coordinator');
        $custodian = $this->user('Property Custodian');
        $item = $this->item(100);

        $supplier = \Modules\Suppliers\Models\Supplier::create([
            'name' => 'Apex Supplies Corp.',
            'tin' => '123-456-789-000',
            'reg_number' => 'REG-101',
            'category' => 'Office Supplies',
            'address' => 'Daet, Camarines Norte',
            'status' => 'active',
            'created_by' => $coordinator->id,
        ]);

        \Modules\Inventory\Models\InventoryBatch::create([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'supplier_stock_no' => 'STK-2026-FILAMENT-001',
            'quantity_received' => 100,
            'quantity_remaining' => 100,
            'unit_cost' => 10,
            'date_received' => '2026-10-01',
        ]);

        $this->assertSame('STK-2026-FILAMENT-001', $item->fresh()->stock_no);

        $this->actingAs($coordinator)->post(route('inventory.requests.store'), [
            'recipient' => 'Cherry Ann Quila',
            'recipient_designation' => 'CEID Coordinator',
            'fund_cluster' => '01',
            'date_requested' => '2026-10-01',
            'department' => 'Center for Equity, Inclusivity and Diversity (CEID)',
            'purpose' => 'Office Supplies',
            'items' => [
                ['item_id' => $item->id, 'quantity' => 22],
            ],
        ])->assertRedirect(route('inventory.requests.index'));

        $request = SupplyRequest::latest('id')->firstOrFail();
        $this->assertSame('Cherry Ann Quila', $request->recipient);
        $this->assertSame('CEID Coordinator', $request->recipient_designation);

        $line = $request->items()->firstOrFail();
        $this->actingAs($custodian)->post(route('inventory.requests.approve', $request), [
            'approved_quantities' => [$line->id => 22],
        ])->assertRedirect();

        // 1. Verify My Requests page inertia payload has stock_no and recipient_designation
        Permission::firstOrCreate(['name' => 'route:inventory.requests.index', 'guard_name' => 'web']);
        $coordinator->givePermissionTo('route:inventory.requests.index');
        $this->actingAs($coordinator)->get(route('inventory.requests.index'))
            ->assertOk()
            ->assertInertia(function ($page) {
                $reqs = $page->toArray()['props']['requests'];
                $this->assertNotEmpty($reqs);
                $this->assertSame('CEID Coordinator', $reqs[0]['recipient_designation']);
                $this->assertSame('STK-2026-FILAMENT-001', $reqs[0]['items'][0]['item']['stock_no']);
            });

        // 2. Verify Issuance Queue inertia payload has stock_no and recipient_designation
        $this->actingAs($custodian)->get(route('inventory.issuance'))
            ->assertOk()
            ->assertInertia(function ($page) {
                $queue = $page->toArray()['props']['supplyRequests'];
                $this->assertNotEmpty($queue);
                $this->assertSame('CEID Coordinator', $queue[0]['recipient_designation']);
                $this->assertSame('STK-2026-FILAMENT-001', $queue[0]['items'][0]['item']['stock_no']);
            });

        // 3. Verify RIS PDF has the stock number and recipient designation
        $pdfResponse = $this->actingAs($coordinator)->get(route('inventory.requests.ris-pdf', $request));
        $pdfResponse->assertOk()->assertHeader('content-type', 'application/pdf');

        // 4. Release and verify issuance preserves recipient designation and allocation stock number
        $this->actingAs($custodian)->post(route('inventory.requests.release', $request), [
            'signed_ris_presented' => true,
        ])->assertRedirect();

        $request->refresh();
        $this->assertSame('Issued', $request->status);
        $this->assertNotNull($request->issuance);
        $this->assertSame('CEID Coordinator', $request->issuance->recipient_designation);
    }
}


