<?php

namespace Tests\Feature\Inventory;

use App\Models\SystemSetting;
use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Services\InventoryBalanceService;
use Modules\Inventory\Services\InventoryIssuanceService;
use Modules\Inventory\Services\InventoryReceivingService;
use Modules\Inventory\Services\InventoryValuationService;
use Modules\Inventory\Services\SupplyRequestService;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InventoryPolicySettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'System Admin']);
        $this->admin = User::factory()->create();
        $this->admin->assignRole('System Admin');
        $this->actingAs($this->admin);
        $this->supplier = Supplier::create([
            'name' => 'Policy Test Supplier', 'tin' => 'POLICY-01', 'reg_number' => 'POLICY-01',
            'category' => 'Office Supplies', 'status' => 'active', 'address' => 'Daet', 'created_by' => $this->admin->id,
        ]);
        SystemSetting::set('mail.low_stock_email_alerts', false);
    }

    private function item(int $stock = 10): Item
    {
        return Item::create([
            'name' => 'Policy Paper', 'sku' => 'POLICY-'.Item::count(), 'stock' => $stock,
            'unit_cost' => 5, 'amount' => $stock * 5, 'status' => 'Available',
            'supplier_id' => $this->supplier->id, 'unit_of_issue' => 'ream', 'created_by' => $this->admin->id,
        ]);
    }

    private function issue(Item $item, int $quantity)
    {
        return app(InventoryIssuanceService::class)->issue([
            'recipient' => 'Test Office', 'date_issued' => now()->toDateString(),
        ], [['item_id' => $item->id, 'quantity' => $quantity]], $this->admin->id);
    }

    public function test_threshold_save_reclassifies_existing_items_and_dashboard_priority(): void
    {
        $critical = $this->item(5);
        $low = $this->item(12);
        $available = $this->item(21);
        $empty = $this->item(0);
        $this->post(route('system.settings.update'), ['settings' => [
            'inventory.low_stock_threshold' => 20, 'inventory.critical_stock_threshold' => 5,
        ]])->assertSessionHasNoErrors();

        $this->assertSame('Critical Stock', $critical->fresh()->status);
        $this->assertSame('Low Stock', $low->fresh()->status);
        $this->assertSame('Available', $available->fresh()->status);
        $this->assertSame('Out of Stock', $empty->fresh()->status);
        $dashboard = app(DashboardService::class);
        $this->assertSame(1, $dashboard->getSummaryStats()['summary']['critical_stock']);
        $priorities = collect($dashboard->getCriticalStock())->keyBy('id');
        $this->assertSame('Critical', $priorities[$critical->id]['priority']);
        $this->assertSame('Low', $priorities[$low->id]['priority']);
        $this->get(route('inventory.index', ['status' => 'Critical Stock']))->assertInertia(fn ($page) => $page
            ->has('items', 1)->where('items.0.id', $critical->id)->where('criticalStockThreshold', 5));
    }

    public function test_zero_critical_threshold_keeps_positive_stock_low(): void
    {
        SystemSetting::set('inventory.critical_stock_threshold', 0);
        $this->assertSame('Low Stock', app(InventoryBalanceService::class)->determineStatus(1));
        $this->assertSame('Out of Stock', app(InventoryBalanceService::class)->determineStatus(0));
    }

    public function test_configured_units_reach_form_and_reject_unrecognized_units(): void
    {
        $this->post(route('system.settings.update'), ['settings' => [
            'inventory.units_of_issue' => ['carton', 'bundle'],
        ]])->assertSessionHasNoErrors();
        $this->get(route('inventory.index'))->assertInertia(fn ($page) => $page->where('unitsOfIssue', ['carton', 'bundle']));
        $this->post(route('inventory.store'), ['name' => 'Carton Item', 'unit_of_issue' => 'Carton'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('items', ['name' => 'Carton Item', 'unit_of_issue' => 'Carton']);
        $this->post(route('inventory.store'), ['name' => 'Unknown Item', 'unit_of_issue' => 'ream'])->assertSessionHasErrors('unit_of_issue');
    }

    public function test_retired_unit_can_stay_on_existing_item_but_cannot_be_changed_to_another_retired_unit(): void
    {
        $item = $this->item();
        SystemSetting::set('inventory.units_of_issue', ['carton']);
        $this->put(route('inventory.update', $item), ['name' => $item->name, 'unit_of_issue' => 'ream'])->assertSessionHasNoErrors();
        $this->put(route('inventory.update', $item), ['name' => $item->name, 'unit_of_issue' => 'box'])->assertSessionHasErrors('unit_of_issue');
    }

    public function test_invalid_units_and_stock_toggle_are_rejected(): void
    {
        foreach ([[], [''], ['ream', ' REAM '], [['bad']], [str_repeat('a', 51)]] as $units) {
            $this->post(route('system.settings.update'), ['settings' => ['inventory.units_of_issue' => $units]])
                ->assertSessionHasErrors('settings.inventory.units_of_issue');
        }
        $this->post(route('system.settings.update'), ['settings' => ['inventory.strict_stock_enforcement' => 'invalid']])
            ->assertSessionHasErrors('settings.inventory.strict_stock_enforcement');
    }

    public function test_enabled_safeguard_rolls_back_overissuance(): void
    {
        $item = $this->item();
        SystemSetting::set('inventory.strict_stock_enforcement', true);
        try {
            $this->issue($item, 15);
            $this->fail('Overissuance should be rejected.');
        } catch (ValidationException) {
            $this->assertSame(10, $item->fresh()->stock);
            $this->assertDatabaseCount('issuances', 0);
        }
    }

    public function test_disabled_safeguard_preserves_deficit_across_receiving_and_void(): void
    {
        $item = $this->item();
        SystemSetting::set('inventory.strict_stock_enforcement', false);
        $issuance = $this->issue($item, 15);
        $this->assertSame(-5, $item->fresh()->stock);
        $this->assertSame(15, (int) $issuance->items->first()->allocations()->sum('quantity'));
        $this->assertSame(0.0, $item->fresh()->inventory_value);
        $this->assertSame(0.0, app(InventoryValuationService::class)->getCurrentInventoryValue());
        app(InventoryReceivingService::class)->receive([
            'item_id' => $item->id, 'supplier_id' => $this->supplier->id, 'quantity' => 8,
            'unit_cost' => 5, 'date_received' => now()->toDateString(),
        ], $this->admin->id);
        $this->assertSame(3, $item->fresh()->stock);
        $this->assertSame(15.0, $item->fresh()->inventory_value);
        app(InventoryIssuanceService::class)->destroy($issuance, $this->admin->id);
        $this->assertSame(18, $item->fresh()->stock);
        $this->assertSame(90.0, $item->fresh()->inventory_value);
        $this->assertTrue(app(InventoryBalanceService::class)->verifyConsistency($item->fresh()));
    }

    public function test_overissuance_without_stock_can_be_edited_and_cancelled(): void
    {
        $item = $this->item(0);
        SystemSetting::set('inventory.strict_stock_enforcement', false);
        $issuance = $this->issue($item, 4);
        $this->assertSame(-4, $item->fresh()->stock);
        app(InventoryIssuanceService::class)->update($issuance, [
            'recipient' => 'Test Office', 'date_issued' => now()->toDateString(), 'status' => 'Issued',
        ], [['item_id' => $item->id, 'quantity' => 2]], $this->admin->id);
        $this->assertSame(-2, $item->fresh()->stock);
        app(InventoryIssuanceService::class)->destroy($issuance->fresh(), $this->admin->id);
        $this->assertSame(0, $item->fresh()->stock);
    }

    public function test_approval_and_release_honor_disabled_safeguard(): void
    {
        $item = $this->item(2);
        $request = SupplyRequest::create([
            'requested_by' => $this->admin->id, 'department' => 'Test Office', 'purpose' => 'Policy test', 'status' => 'Pending',
        ]);
        $line = $request->items()->create(['item_id' => $item->id, 'quantity' => 6]);
        SystemSetting::set('inventory.strict_stock_enforcement', false);
        $service = app(SupplyRequestService::class);
        $service->approve($request, [$line->id => 6], $this->admin->id, null);
        $service->release($request->fresh(), $this->admin->id);
        $this->assertSame('Issued', $request->fresh()->status);
        $this->assertSame(-4, $item->fresh()->stock);
    }
}
