<?php

namespace Tests\Feature\Inventory;

use App\Models\CoordinatorMovement;
use App\Models\CoordinatorStock;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\CoordinatorInventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Services\SupplyRequestService;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CoordinatorInventoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function user(string $role = 'Supply Coordinator'): User
    {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole($role);

        return $user;
    }

    private function requestFor(User $user): SupplyRequest
    {
        $item = Item::create(['name' => 'Paper', 'sku' => 'PAPER-'.uniqid(), 'stock' => 50,
            'unit_cost' => 10, 'amount' => 500, 'unit_of_issue' => 'ream', 'status' => 'Available']);
        $request = SupplyRequest::create(['requested_by' => $user->id, 'department' => 'Delivery Unit A',
            'purpose' => 'Operations', 'status' => 'Pending', 'date_requested' => now()->toDateString()]);
        $request->items()->create(['item_id' => $item->id, 'quantity' => 10]);

        return $request;
    }

    private function release(SupplyRequest $request, User $custodian): void
    {
        $line = $request->items()->first();
        app(SupplyRequestService::class)->approve($request, [$line->id => 7], $custodian->id, null);
        app(SupplyRequestService::class)->release($request, $custodian->id);
    }

    public function test_only_released_approved_quantities_enter_the_coordinators_inventory_once(): void
    {
        $owner = $this->user();
        $other = $this->user();
        $custodian = $this->user('Property Custodian');
        $request = $this->requestFor($owner);
        $item = $request->items()->first()->item;
        $this->assertSame(0, CoordinatorStock::count());
        $line = $request->items()->first();
        app(SupplyRequestService::class)->approve($request, [$line->id => 7], $custodian->id, null);
        $this->assertSame(0, CoordinatorStock::count());
        app(SupplyRequestService::class)->release($request, $custodian->id);

        $stock = CoordinatorStock::firstOrFail();
        $this->assertSame($owner->id, $stock->coordinator_id);
        $this->assertSame(7, $stock->quantity);
        $this->assertEquals(70, $stock->value);
        $this->assertSame(43, $item->fresh()->stock);
        app(CoordinatorInventoryService::class)->receiveRelease($request->fresh(), $custodian->id);
        $this->assertSame(7, $stock->fresh()->quantity);
        $this->assertSame(1, CoordinatorMovement::count());

        $this->actingAs($owner)->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->component('Dashboard')->where('inventoryScope', 'coordinator')->where('summary.available_items', 1)
            ->where('summary.total_inventory_value', 70)->where('summary.total_inventory', 7)
            ->where('summary.total_received', 7)->where('recentReceiving.0.quantity', 7)
            ->missing('supplierSummary')->missing('rfidSummary'));
        $this->actingAs($other)->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('summary.total_inventory_value', 0)->where('summary.available_items', 0)
            ->where('summary.total_inventory', 0)->where('summary.total_received', 0)->has('recentReceiving', 0));
        $this->actingAs($other)->get(route('coordinator.inventory.index'))->assertInertia(fn ($page) => $page->has('stocks', 0)->has('movements.data', 0));
    }

    public function test_unit_issues_and_stock_cards_are_scoped_and_do_not_change_main_stock(): void
    {
        $owner = $this->user();
        $other = $this->user();
        $request = $this->requestFor($owner);
        $this->release($request, $this->user('Property Custodian'));
        $stock = CoordinatorStock::firstOrFail();
        $item = $request->items()->first()->item;
        $this->actingAs($other)->post(route('coordinator.inventory.issue'), [
            'stock_id' => $stock->id, 'quantity' => 1, 'recipient' => 'Faculty',
        ])->assertNotFound();
        $this->actingAs($other)->getJson(route('coordinator.inventory.stock-card', $stock->id))->assertNotFound();
        $this->actingAs($owner)->post(route('coordinator.inventory.issue'), [
            'stock_id' => $stock->id, 'quantity' => 8, 'recipient' => 'Faculty',
        ])->assertSessionHasErrors('quantity');
        $this->assertSame(1, CoordinatorMovement::count());
        $this->actingAs($owner)->post(route('coordinator.inventory.issue'), [
            'stock_id' => $stock->id, 'quantity' => 2, 'recipient' => 'Faculty',
        ])->assertRedirect();
        $this->assertSame(5, $stock->fresh()->quantity);
        $this->assertEquals(50, $stock->fresh()->value);
        $this->assertSame(43, $item->fresh()->stock);
        $this->actingAs($owner)->getJson(route('coordinator.inventory.stock-card', $stock->id))
            ->assertOk()->assertJsonPath('ending_balance', 5)->assertJsonPath('entries.0.receipt_qty', 7)
            ->assertJsonPath('entries.1.issue_qty', 2)->assertJsonPath('entries.1.issue_office', 'Faculty');
        $this->actingAs($owner)->get(route('coordinator.inventory.stock-card', $stock->id))
            ->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->actingAs($owner)->get(route('inventory.index'))->assertForbidden();
        $this->actingAs($owner)->get(route('compliance.reports'))->assertForbidden();
        $owner->givePermissionTo(Permission::firstOrCreate(['name' => 'route:compliance.reports', 'guard_name' => 'web']));
        $this->actingAs($owner)->get(route('compliance.reports'))->assertForbidden();
    }

    public function test_stock_card_date_range_carries_opening_balance_and_excludes_later_movements(): void
    {
        $owner = $this->user();
        $this->travelTo(now()->setDate(2026, 9, 1)->startOfDay());
        $this->release($this->requestFor($owner), $this->user('Property Custodian'));
        $stock = CoordinatorStock::firstOrFail();
        $this->travelTo(now()->setDate(2026, 10, 1));
        app(CoordinatorInventoryService::class)->issue($owner, $stock->id, 2, 'Faculty');
        $this->travelTo(now()->setDate(2026, 10, 20));
        app(CoordinatorInventoryService::class)->issue($owner, $stock->id, 1, 'Library');
        $this->actingAs($owner)->getJson(route('coordinator.inventory.stock-card', [
            'stock' => $stock->id, 'start_date' => '2026-10-01', 'end_date' => '2026-10-15',
        ]))->assertOk()->assertJsonPath('opening_balance', 7)->assertJsonPath('ending_balance', 5)
            ->assertJsonCount(2, 'entries')->assertJsonPath('entries.0.balance_qty', 7);
        $this->actingAs($owner)->getJson(route('coordinator.inventory.stock-card', [
            'stock' => $stock->id, 'end_date' => '2026-10-15',
        ]))->assertOk()->assertJsonPath('ending_balance', 5);
        $this->actingAs($owner)->getJson(route('coordinator.inventory.stock-card', [
            'stock' => $stock->id, 'start_date' => '2026-10-01',
        ]))->assertOk()->assertJsonPath('opening_balance', 7)->assertJsonPath('ending_balance', 4);
        $this->actingAs($owner)->getJson(route('coordinator.inventory.stock-card', [
            'stock' => $stock->id, 'start_date' => '2026-10-15', 'end_date' => '2026-10-01',
        ]))->assertUnprocessable();
        $this->actingAs($owner)->get(route('dashboard', ['chart_filter' => 'monthly']))->assertInertia(fn ($page) => $page
            ->where('movementSummary.received', 7)->where('movementSummary.issued', 3)->where('movementSummary.ending_balance', 4));
        $this->actingAs($owner)->get(route('dashboard', [
            'chart_filter' => 'custom', 'start_date' => '2026-10-01', 'end_date' => '2026-10-15',
        ]))->assertInertia(fn ($page) => $page
            ->where('movementSummary.received', 0)->where('summary.total_inventory', 4)->where('summary.total_received', 7));
    }

    public function test_dashboard_attention_includes_low_and_depleted_unit_stock_in_severity_order(): void
    {
        SystemSetting::set('inventory.low_stock_threshold', 8);
        SystemSetting::set('inventory.critical_stock_threshold', 1);
        $owner = $this->user();
        $other = $this->user();
        $stocks = [];
        foreach ([9, 8, 4, 1, 0] as $quantity) {
            $item = $this->requestFor($owner)->items()->first()->item;
            $stocks[$quantity] = CoordinatorStock::create([
                'coordinator_id' => $owner->id, 'item_id' => $item->id,
                'name' => $item->name, 'sku' => $item->sku, 'unit' => 'ream',
                'quantity' => $quantity, 'value' => $quantity * 10,
            ]);
        }
        CoordinatorStock::create([
            'coordinator_id' => $other->id, 'item_id' => $stocks[0]->item_id,
            'name' => 'Other unit stock', 'sku' => 'OTHER', 'unit' => 'ream', 'quantity' => 0, 'value' => 0,
        ]);

        $this->actingAs($owner)->get(route('dashboard'))->assertOk()->assertInertia(fn ($page) => $page
            ->where('summary.total_inventory', 22)->where('summary.total_received', 0)
            ->where('summary.critical_stock', 4)->where('summary.unserviceable', 1)
            ->has('criticalStock', 4)
            ->where('criticalStock.0.id', $stocks[0]->id)->where('criticalStock.0.status', 'Out of Stock')
            ->where('criticalStock.1.id', $stocks[1]->id)->where('criticalStock.1.priority', 'Critical')
            ->where('criticalStock.2.id', $stocks[4]->id)->where('criticalStock.2.priority', 'Low')
            ->where('criticalStock.3.id', $stocks[8]->id)->where('criticalStock.3.status', 'Low Stock')
            ->where('criticalStock.3.min', 8));
    }

    public function test_credit_failure_rolls_back_main_office_release(): void
    {
        $owner = $this->user();
        $request = $this->requestFor($owner);
        $custodian = $this->user('Property Custodian');
        app(SupplyRequestService::class)->approve($request, [$request->items()->first()->id => 7], $custodian->id, null);
        $this->mock(CoordinatorInventoryService::class)->shouldReceive('receiveRelease')->once()->andThrow(new \RuntimeException('Credit failed'));
        try {
            app(SupplyRequestService::class)->release($request, $custodian->id);
            $this->fail('Expected credit failure');
        } catch (\RuntimeException $e) {
            $this->assertSame('Credit failed', $e->getMessage());
        }
        $this->assertSame('Approved', $request->fresh()->status);
        $this->assertNull($request->fresh()->issuance_id);
        $this->assertSame(50, $request->items()->first()->item->stock);
        $this->assertSame(0, Issuance::count());
    }

    public function test_migration_imports_existing_releases_without_deducting_central_stock_again(): void
    {
        $owner = $this->user();
        $request = $this->requestFor($owner);
        $custodian = $this->user('Property Custodian');
        $this->release($request, $custodian);
        $migration = require database_path('migrations/2026_10_21_000001_create_coordinator_inventory.php');
        $migration->down();
        $migration->up();
        $stock = CoordinatorStock::firstOrFail();
        $this->assertSame(7, $stock->quantity);
        $this->assertSame(43, $request->items()->first()->item->stock);
        $this->assertSame($request->fresh()->ris_number, $stock->movements()->first()->reference);
        $this->assertSame($custodian->id, $stock->movements()->first()->actor_id);
    }

    public function test_transaction_history_and_pagination_never_include_another_coordinators_office(): void
    {
        $owner = $this->user();
        $other = $this->user();
        $custodian = $this->user('Property Custodian');
        $ownRequest = $this->requestFor($owner);
        $otherRequest = $this->requestFor($other);
        // Office labels are not an ownership boundary: even matching labels must stay isolated.
        $this->release($ownRequest, $custodian);
        $this->release($otherRequest, $custodian);
        $ownStock = CoordinatorStock::where('coordinator_id', $owner->id)->firstOrFail();
        $otherStock = CoordinatorStock::where('coordinator_id', $other->id)->firstOrFail();
        for ($i = 1; $i <= 21; $i++) {
            $ownStock->movements()->create([
                'actor_id' => $owner->id, 'date' => now()->toDateString(), 'type' => 'issue',
                'quantity' => 1, 'unit_cost' => 10, 'reference' => 'OWN-'.$i, 'office' => 'Own unit faculty',
            ]);
        }
        $otherStock->movements()->create([
            'actor_id' => $owner->id, 'date' => now()->toDateString(), 'type' => 'issue',
            'quantity' => 1, 'unit_cost' => 10, 'reference' => 'OTHER-OFFICE', 'office' => 'Other Delivery Unit',
        ]);
        foreach ([1 => 20, 2 => 2] as $pageNumber => $expectedCount) {
            $this->actingAs($owner)->get(route('coordinator.inventory.index', [
                'page' => $pageNumber, 'coordinator_id' => $other->id, 'office' => 'Other Delivery Unit',
            ]))->assertOk()->assertInertia(fn ($page) => $page
                ->where('movements.total', 22)->has('movements.data', $expectedCount)
                ->where('movements.data', fn ($rows) => collect($rows)->every(fn ($row) =>
                    data_get($row, 'stock.id') === $ownStock->id
                    && data_get($row, 'reference') !== 'OTHER-OFFICE'
                    && data_get($row, 'office') !== 'Other Delivery Unit')));
        }
        $this->actingAs($other)->get(route('coordinator.inventory.index'))->assertInertia(fn ($page) => $page
            ->where('movements.total', 2)->where('movements.data.0.reference', 'OTHER-OFFICE')
            ->where('movements.data.1.office', 'Supply Office')->missing('movements.data.1.actor_id'));
    }

    public function test_shared_transaction_audit_redirects_coordinators_to_their_private_history_even_with_global_permissions(): void
    {
        $owner = $this->user();
        foreach (['audit-logs.view-global', 'route:audit-logs.transaction-trails'] as $permission) {
            $owner->givePermissionTo(Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']));
        }
        $this->actingAs($owner)->get(route('audit-logs.transaction-trails', ['view_mode' => 'technical']))
            ->assertRedirect(route('coordinator.inventory.index', ['tab' => 'history']));
        $this->actingAs($owner)->get(route('coordinator.inventory.index'))->assertInertia(fn ($page) => $page
            ->where('auth.capabilities.audit.transactions', false)->has('movements.data', 0));
        $this->actingAs($this->user('System Admin'))->get(route('audit-logs.transaction-trails'))->assertOk();
    }

    public function test_coordinator_dashboard_renders_with_isolated_unit_metrics_and_request_pipeline(): void
    {
        $owner = $this->user();
        $other = $this->user();
        $custodian = $this->user('Property Custodian');
        $ownRequest = $this->requestFor($owner);
        $otherRequest = $this->requestFor($other);
        $this->release($ownRequest, $custodian);
        $this->release($otherRequest, $custodian);

        $this->actingAs($owner)->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('inventoryScope', 'coordinator')
                ->where('coordinatorName', $owner->name)
                ->has('summary')
                ->has('movement')
                ->has('movementSummary')
                ->has('requestSummary')
                ->has('recentReceiving')
                ->has('recentIssuance')
                ->has('criticalStock')
                ->has('recentActivity')
            );
    }
}
