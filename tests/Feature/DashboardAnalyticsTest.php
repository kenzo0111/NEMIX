<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DashboardAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Supplier $supplier;
    protected Item $item;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'System Admin']);

        $this->admin = User::factory()->create(['is_active' => true]);
        $this->admin->assignRole('System Admin');

        $this->supplier = Supplier::create([
            'name' => 'Test Supplier Inc.',
            'tin' => '123-456-789-000',
            'address' => 'Daet, Camarines Norte',
            'reg_number' => 'REG-12345',
            'category' => 'Office Supplies',
            'status' => 'active',
            'created_by' => $this->admin->id,
        ]);

        $this->item = Item::create([
            'name' => 'Ballpen Black 0.5mm',
            'supplier_id' => $this->supplier->id,
            'sku' => 'PEN-BLK-001',
            'stock' => 100,
            'unit_cost' => 12.50,
            'amount' => 1250.00,
            'status' => 'Available',
            'unit_of_issue' => 'Piece',
            'created_by' => $this->admin->id,
        ]);
    }

    public function test_dashboard_returns_chart_data_and_filters_in_inertia_props(): void
    {
        $response = $this->actingAs($this->admin)->get(route('dashboard'));

        $response->assertStatus(200);

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('chartData')
            ->has('chartData.monthly')
            ->has('chartData.yearly')
            ->has('chartData.custom')
            ->has('filters')
            ->where('filters.chartFilter', 'monthly')
            ->has('stats')
            ->has('lowStockAlerts')
            ->has('auditLogs')
        );
    }

    public function test_dashboard_calculates_monthly_movement_with_receivings_and_issuances(): void
    {
        // Add receiving this month
        Receiving::create([
            'item_id' => $this->item->id,
            'supplier_id' => $this->supplier->id,
            'quantity' => 40,
            'date_received' => now()->toDateString(),
            'created_by' => $this->admin->id,
        ]);

        // Add issuance this month
        Issuance::create([
            'item_id' => $this->item->id,
            'quantity' => 15,
            'recipient' => 'Juan Dela Cruz',
            'department' => 'SPMO',
            'date_issued' => now()->toDateString(),
            'status' => 'Issued',
            'issued_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->get(route('dashboard'));

        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) {
            $page->component('Dashboard')
                ->has('chartData.monthly', 6);

            $monthly = $page->toArray()['props']['chartData']['monthly'];
            $currentMonth = end($monthly);

            $this->assertEquals(now()->format('M Y'), $currentMonth['label']);
            $this->assertEquals(40, $currentMonth['stockIn']);
            $this->assertEquals(15, $currentMonth['risIssued']);
        });
    }

    public function test_dashboard_custom_range_movement_filter(): void
    {
        $startDate = now()->subDays(10)->toDateString();
        $endDate = now()->toDateString();

        Receiving::create([
            'item_id' => $this->item->id,
            'supplier_id' => $this->supplier->id,
            'quantity' => 20,
            'date_received' => now()->subDays(2)->toDateString(),
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->get(route('dashboard', [
            'chart_filter' => 'custom',
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]));

        $response->assertStatus(200);

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('filters.chartFilter', 'custom')
            ->where('filters.customStartDate', $startDate)
            ->where('filters.customEndDate', $endDate)
            ->has('chartData.custom')
        );
    }
}
