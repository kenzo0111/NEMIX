<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ConsumableSupplyAnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ConsumableSupplyAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Item $paper;

    private Item $pen;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['university.divisions' => [['options' => [['value' => 'Finance'], ['value' => 'Library'], ['value' => 'No activity']]]]]);
        Role::firstOrCreate(['name' => 'System Admin', 'guard_name' => 'web']);
        $this->admin = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
        $this->admin->assignRole('System Admin');
        $this->paper = Item::create(['name' => 'Paper', 'sku' => 'PAPER', 'stock' => 100, 'status' => 'Available']);
        $this->pen = Item::create(['name' => 'Pen', 'sku' => 'PEN', 'stock' => 100, 'status' => 'Available']);
    }

    private function requisition(string $department, string $date, array $items, string $status = 'Pending', ?int $issuance = null): SupplyRequest
    {
        $request = SupplyRequest::create(['requested_by' => $this->admin->id, 'department' => $department, 'date_requested' => $date, 'purpose' => 'Office supplies', 'status' => $status, 'issuance_id' => $issuance]);
        foreach ($items as [$item, $quantity]) {
            $request->items()->create(['item_id' => $item->id, 'quantity' => $quantity]);
        }

        return $request;
    }

    private function release(string $department, string $date, int $quantity, string $status = 'Issued', bool $children = true): Issuance
    {
        $release = Issuance::create(['item_id' => $this->paper->id, 'quantity' => $quantity, 'department' => $department, 'recipient' => 'Office head', 'date_issued' => $date, 'status' => $status, 'issued_by' => $this->admin->id]);
        if ($children) {
            $release->items()->create(['item_id' => $this->paper->id, 'quantity' => $quantity, 'unit_cost' => 1, 'amount' => $quantity]);
        }

        return $release;
    }

    private function analytics(array $filters = []): array
    {
        return app(ConsumableSupplyAnalyticsService::class)->build(Request::create('/', 'GET', $filters + ['start_date' => '2026-10-01', 'end_date' => '2026-10-31']));
    }

    public function test_unique_requisitions_and_item_frequency_are_separate_from_quantity(): void
    {
        $this->requisition('Finance', '2026-10-02', [[$this->paper, 15], [$this->pen, 100]]);
        $this->requisition('Library', '2026-10-03', [[$this->paper, 2]]);
        $data = $this->analytics();
        $this->assertEquals(2, $data['stats']['totalRequisitions']);
        $this->assertEquals('Paper', $data['stats']['mostRequestedItem']);
        $paper = collect($data['items'])->firstWhere('id', $this->paper->id);
        $this->assertSame(2, $paper['frequency']);
        $this->assertSame(17, $paper['requested']);
        $this->assertSame(2, $paper['offices']);
        $this->assertSame(0, $paper['issued']);
        $finance = collect($data['departments'])->firstWhere('name', 'Finance');
        $this->assertSame(1, $finance['requisitions']);
        $this->assertSame(2, $finance['distinctItems']);
        $this->assertSame(0, collect($data['departments'])->firstWhere('name', 'No activity')['requested']);
    }

    public function test_only_confirmed_releases_count_and_parent_child_mirrors_are_not_added_twice(): void
    {
        $first = $this->release('Finance', '2026-10-02', 3);
        $this->requisition('Finance', '2026-09-15', [[$this->paper, 20]], 'Issued', $first->id);
        $this->release('Finance', '2026-10-03', 2); // another official partial release
        $this->release('Finance', '2026-10-04', 4, 'Issued', false); // legacy parent
        $this->release('Finance', '2026-10-05', 40, 'Pending');
        $this->release('Finance', '2026-10-06', 40, 'Cancelled');
        $this->release('Finance', '2026-10-07', 40)->delete();
        $this->release('Finance', '2026-09-30', 40);
        $data = $this->analytics();
        $this->assertEquals(9, $data['stats']['totalIssued']);
        $this->assertEquals(0, $data['stats']['totalRequisitions']);
        $this->assertEquals(9, $data['trends'][0]['issued']);
        $this->assertEquals(9, $data['items'][0]['issued']);
    }

    public function test_filters_apply_to_all_aggregates_without_duplicate_release_lines(): void
    {
        $release = $this->release('Finance', '2026-10-02', 4);
        $this->requisition('Finance', '2026-10-02', [[$this->paper, 8], [$this->pen, 10]], 'Issued', $release->id);
        $this->requisition('Finance', '2026-10-03', [[$this->paper, 50]], 'Rejected');
        $this->requisition('Library', '2026-10-03', [[$this->paper, 60]]);
        $data = $this->analytics(['department' => 'Finance', 'item_id' => $this->paper->id, 'status' => 'Issued']);
        $this->assertEquals(1, $data['stats']['totalRequisitions']);
        $this->assertCount(1, $data['departments']);
        $this->assertCount(1, $data['items']);
        $this->assertSame(8, $data['items'][0]['requested']);
        $this->assertSame(4, $data['items'][0]['issued']);
        $this->assertSame(0, $this->analytics(['status' => 'Rejected'])['stats']['totalIssued']);
    }

    public function test_supplier_category_and_calendar_filters_use_existing_records(): void
    {
        $supplierId = DB::table('suppliers')->insertGetId(['name' => 'Paper supplier', 'tin' => '123-456', 'address' => 'Daet', 'reg_number' => 'REG-1', 'category' => 'Office Supplies', 'status' => 'active']);
        $this->paper->update(['supplier_id' => $supplierId]);
        $this->requisition('Finance', '2026-10-31', [[$this->paper, 8], [$this->pen, 40]]);
        $this->requisition('Finance', '2026-11-01', [[$this->paper, 90]]);
        $data = app(ConsumableSupplyAnalyticsService::class)->build(Request::create('/', 'GET', ['year' => 2026, 'month' => 10, 'category' => 'Office Supplies']));
        $this->assertEquals('2026-10-31', $data['filters']['end_date']);
        $this->assertCount(1, $data['items']);
        $this->assertEquals(8, $data['items'][0]['requested']);
    }

    public function test_previous_period_and_zero_filled_history_are_consistent(): void
    {
        $this->requisition('Finance', '2026-09-15', [[$this->paper, 5]]);
        $this->requisition('Finance', '2026-10-15', [[$this->paper, 8]]);
        $data = $this->analytics();
        $this->assertEquals(1, $data['comparison']['stats']['totalRequisitions']);
        $this->assertEquals(5, collect($data['departments'])->firstWhere('name', 'Finance')['previousRequested']);
        $this->assertSame(3, collect($data['departments'])->firstWhere('name', 'Finance')['demandChange']);
        $this->assertCount(3, $data['departmentTrends']);
        $this->assertSame(0, collect($data['departmentTrends'])->firstWhere('department', 'No activity')['requisitions']);
        $this->assertCount(1, $data['demandHistory']);
        $this->assertSame('2026-10', $data['demandHistory'][0]['month']);
        $this->assertSame(8, $data['demandHistory'][0]['requested']);
    }

    public function test_multi_month_frequency_history_and_archived_items_remain_accurate(): void
    {
        $this->requisition('Finance', '2026-09-30', [[$this->paper, 2], [$this->pen, 5]]);
        $this->requisition('Finance', '2026-10-01', [[$this->paper, 3]]);
        $this->release('Finance', '2026-10-02', 1);
        $this->paper->delete();
        $data = $this->analytics(['start_date' => '2026-09-01']);
        $paper = collect($data['items'])->firstWhere('id', $this->paper->id);
        $this->assertSame(2, $paper['frequency']);
        $this->assertSame(1, $paper['offices']);
        $this->assertSame(5, $paper['requested']);
        $this->assertSame(1, $paper['issued']);
        $this->assertCount(2, $data['trends']);
        $this->assertEquals([1, 1], array_column($data['trends'], 'requisitions'));
        $this->assertEquals([7, 3], array_column($data['trends'], 'requested'));
        $this->assertEquals([0, 1], array_column($data['trends'], 'issued'));
        $this->assertCount(3, $data['demandHistory']);
    }

    public function test_admin_receives_dashboard_and_invalid_ranges_are_rejected(): void
    {
        $this->actingAs($this->admin)->get(route('compliance.analytics', ['year' => 2026]))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Compliance/ManageAnalytics')->has('supplyAnalytics.stats')->has('analytics.stats'));
        $this->getJson(route('compliance.analytics', ['start_date' => '2026-10-31', 'end_date' => '2026-10-01']))->assertUnprocessable();
    }

    public function test_coordinators_and_authorized_personnel_cannot_access_university_analytics_even_with_route_permission(): void
    {
        $permission = Permission::firstOrCreate(['name' => 'route:compliance.analytics', 'guard_name' => 'web']);
        foreach (['Supply Coordinator', 'Authorized Personnel'] as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->givePermissionTo($permission);
            $user = User::factory()->create(['is_active' => true, 'email_verified_at' => now(), 'department' => 'Finance']);
            $user->assignRole($role);
            $this->actingAs($user)->get(route('compliance.analytics'))->assertForbidden();
        }
    }

    public function test_staff_need_existing_analytics_permission(): void
    {
        $role = Role::firstOrCreate(['name' => 'Supply Officer', 'guard_name' => 'web']);
        $user = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
        $user->assignRole($role);
        $this->actingAs($user)->get(route('compliance.analytics'))->assertForbidden();
        $role->givePermissionTo(Permission::firstOrCreate(['name' => 'route:compliance.analytics', 'guard_name' => 'web']));
        $this->actingAs($user->fresh())->get(route('compliance.analytics'))->assertOk();
    }
}
