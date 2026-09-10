<?php

namespace Tests\Feature;

use App\Models\ComplianceReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SystemOverviewDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Supplier $supplier;
    protected Item $item;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'System Admin', 'guard_name' => 'web']);

        $this->admin = User::factory()->create([
            'email' => 'spmo.admin@ucn.edu.ph',
            'is_active' => true,
        ]);
        $this->admin->assignRole('System Admin');

        $this->supplier = Supplier::create([
            'name' => 'Advance Paper Corp',
            'tin' => '123-456-789',
            'address' => 'Daet, Camarines Norte',
            'reg_number' => 'REG-2026-001',
            'category' => 'Office Supplies',
            'status' => 'active',
            'created_by' => $this->admin->id,
        ]);

        $this->item = Item::create([
            'name' => 'Bond Paper A4 70gsm',
            'sku' => 'PAP-A4-70G',
            'supplier_id' => $this->supplier->id,
            'stock' => 12,
            'unit_cost' => 250.00,
            'status' => 'Low Stock',
            'unit_of_issue' => 'Ream',
            'rfid_tag' => 'E280116060000204',
            'created_by' => $this->admin->id,
        ]);
    }

    public function test_dashboard_provides_system_overview_props(): void
    {
        $response = $this->actingAs($this->admin)->get(route('dashboard'));

        $response->assertStatus(200);

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('summary')
            ->has('summary.total_inventory_value')
            ->has('summary.available_items')
            ->has('summary.issued_this_month')
            ->has('summary.critical_stock')
            ->has('movement')
            ->has('movementSummary')
            ->has('recentReceiving')
            ->has('recentIssuance')
            ->has('criticalStock')
            ->has('rfidSummary')
            ->has('supplierSummary')
            ->has('complianceSummary')
            ->has('recentActivity')
        );
    }

    public function test_dashboard_authoritatively_reflects_rfid_coverage(): void
    {
        // 1 tagged item exists from setUp
        // Add 1 untagged item
        Item::create([
            'name' => 'Ballpen Black',
            'sku' => 'PEN-BLK-01',
            'supplier_id' => $this->supplier->id,
            'stock' => 50,
            'unit_cost' => 15.00,
            'status' => 'Available',
            'unit_of_issue' => 'Piece',
            'rfid_tag' => null,
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->get(route('dashboard'));

        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) {
            $page->component('Dashboard');
            $rfid = $page->toArray()['props']['rfidSummary'];

            $this->assertEquals(2, $rfid['total']);
            $this->assertEquals(1, $rfid['tagged']);
            $this->assertEquals(1, $rfid['untagged']);
            $this->assertEquals(50, $rfid['percentage']);
        });
    }

    public function test_dashboard_authoritatively_surfaces_operational_activity(): void
    {
        Receiving::create([
            'item_id' => $this->item->id,
            'supplier_id' => $this->supplier->id,
            'quantity' => 50,
            'date_received' => now()->toDateString(),
            'created_by' => $this->admin->id,
        ]);

        Issuance::create([
            'item_id' => $this->item->id,
            'quantity' => 24,
            'recipient' => 'CCMS Dean',
            'department' => 'CCMS',
            'ris_number' => 'RIS-2026-0042',
            'date_issued' => now()->toDateString(),
            'status' => 'Issued',
            'issued_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->get(route('dashboard'));

        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) {
            $page->component('Dashboard');
            $props = $page->toArray()['props'];

            $this->assertNotEmpty($props['recentReceiving']);
            $this->assertEquals('Bond Paper A4 70gsm', $props['recentReceiving'][0]['item_name']);
            $this->assertEquals(50, $props['recentReceiving'][0]['quantity']);

            $this->assertNotEmpty($props['recentIssuance']);
            $this->assertEquals('RIS-2026-0042', $props['recentIssuance'][0]['ris_number']);
            $this->assertEquals('CCMS', $props['recentIssuance'][0]['department']);
            $this->assertEquals(24, $props['recentIssuance'][0]['total_items']);
        });
    }

    public function test_dashboard_handles_empty_records_gracefully(): void
    {
        Item::query()->forceDelete();
        Supplier::query()->forceDelete();

        $response = $this->actingAs($this->admin)->get(route('dashboard'));

        $response->assertStatus(200);

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('summary.total_inventory_value', 0)
            ->where('summary.available_items', 0)
            ->where('summary.critical_stock', 0)
            ->where('recentReceiving', [])
            ->where('recentIssuance', [])
            ->where('criticalStock', [])
            ->where('rfidSummary.total', 0)
        );
    }
}
