<?php

namespace Tests\Feature\AuditLogs;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\AuditLogs\Models\TransactionTrail;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TransactionAuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create System Admin role and admin user
        $adminRole = Role::firstOrCreate(['name' => 'System Admin', 'guard_name' => 'web']);
        $this->adminUser = User::factory()->create([
            'name' => 'System Administrator',
            'email' => 'sysadmin@test.edu.ph',
        ]);
        $this->adminUser->assignRole($adminRole);
    }

    public function test_guests_cannot_view_transaction_audit_logs(): void
    {
        $response = $this->get('/audit-logs/transaction-trails');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_transaction_audit_logs(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('AuditLogs/ManageTransaction')
                ->has('logs')
                ->has('summary')
                ->has('filters')
                ->has('availableModules')
                ->has('availableActions')
        );
    }

    public function test_returns_empty_when_no_records_exist_without_fakes(): void
    {
        TransactionTrail::query()->delete();

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('AuditLogs/ManageTransaction')
                ->where('logs.data', [])
                ->where('logs.total', 0)
                ->where('summary.total', 0)
                ->where('summary.verified', 0)
                ->where('summary.flagged', 0)
                ->where('summary.modules', 0)
        );
    }

    public function test_maps_records_to_canonical_status_and_iso_timestamps(): void
    {
        TransactionTrail::query()->delete();

        $user = User::factory()->create(['name' => 'Vince Balce', 'email' => 'vince@test.edu.ph']);
        $role = Role::firstOrCreate(['name' => 'Supply Officer', 'guard_name' => 'web']);
        $user->assignRole($role);

        TransactionTrail::query()->delete();

        TransactionTrail::create([
            'user_id' => $user->id,
            'module' => 'Issuance',
            'action' => 'Inventory Issuance Recorded',
            'resource_ref' => 'RIS-2026-0042',
            'details' => '24 items issued to CCMS',
            'status' => 'Verified',
        ]);

        TransactionTrail::create([
            'user_id' => null,
            'module' => 'System Configuration',
            'action' => 'System Mode Switched',
            'resource_ref' => 'MODE-MAINTENANCE',
            'details' => 'Switched to Maintenance Mode',
            'status' => 'Flagged',
        ]);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails');

        $response->assertStatus(200);
        $logs = $response->viewData('page')['props']['logs'];
        $items = isset($logs['data']) ? $logs['data'] : $logs;

        $this->assertCount(2, $items);

        $issuance = collect($items)->firstWhere('resource_ref', 'RIS-2026-0042');
        $this->assertNotNull($issuance);
        $this->assertEquals('Vince Balce', $issuance['user_name']);
        $this->assertEquals('Supply Officer', $issuance['role']);
        $this->assertEquals('verified', $issuance['audit_status']);
        $this->assertEquals('success', $issuance['result']);
        $this->assertNotNull($issuance['occurred_at']);

        $sysConfig = collect($items)->firstWhere('resource_ref', 'MODE-MAINTENANCE');
        $this->assertNotNull($sysConfig);
        $this->assertEquals('System Administrator', $sysConfig['user_name']);
        $this->assertNull($sysConfig['role']);
        $this->assertEquals('flagged', $sysConfig['audit_status']);
        $this->assertNotNull($sysConfig['occurred_at']);
    }

    public function test_server_side_search_filtering(): void
    {
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Compliance',
            'action' => 'Generated RSMI Report',
            'resource_ref' => 'REP-RSMI-001',
            'details' => 'Monthly RSMI report for September',
            'status' => 'Logged',
        ]);

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Stock In Requisition',
            'resource_ref' => 'RCV-2026-01',
            'details' => 'Received 50 reams paper',
            'status' => 'Verified',
        ]);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?search=RSMI');
        $response->assertStatus(200);

        $logs = $response->viewData('page')['props']['logs'];
        $items = isset($logs['data']) ? $logs['data'] : $logs;

        $this->assertCount(1, $items);
        $this->assertEquals('REP-RSMI-001', $items[0]['resource_ref']);
    }

    public function test_server_side_module_filtering(): void
    {
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Compliance',
            'action' => 'Report Generated',
            'resource_ref' => 'REP-1',
            'status' => 'Verified',
        ]);

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Item Created',
            'resource_ref' => 'ITEM-1',
            'status' => 'Verified',
        ]);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?module=Compliance');
        $response->assertStatus(200);

        $logs = $response->viewData('page')['props']['logs'];
        $items = isset($logs['data']) ? $logs['data'] : $logs;

        $this->assertCount(1, $items);
        $this->assertEquals('Compliance', $items[0]['module']);
    }

    public function test_server_side_action_filtering(): void
    {
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Adjusted Item Stock',
            'resource_ref' => 'ITEM-ADJ-1',
            'status' => 'Verified',
        ]);

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Added Inventory Item',
            'resource_ref' => 'ITEM-ADD-1',
            'status' => 'Verified',
        ]);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?action=Adjusted+Item+Stock');
        $response->assertStatus(200);

        $logs = $response->viewData('page')['props']['logs'];
        $items = isset($logs['data']) ? $logs['data'] : $logs;

        $this->assertCount(1, $items);
        $this->assertEquals('Adjusted Item Stock', $items[0]['action']);
    }

    public function test_server_side_date_filtering(): void
    {
        TransactionTrail::query()->delete();

        $oldTrail = TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Old Action',
            'status' => 'Verified',
        ]);
        $oldTrail->created_at = now()->subDays(10);
        $oldTrail->save();

        $recentTrail = TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Recent Action',
            'status' => 'Verified',
        ]);
        $recentTrail->created_at = now();
        $recentTrail->save();

        $today = now()->format('Y-m-d');
        $response = $this->actingAs($this->adminUser)->get("/audit-logs/transaction-trails?date_from={$today}&date_to={$today}");
        $response->assertStatus(200);

        $logs = $response->viewData('page')['props']['logs'];
        $items = isset($logs['data']) ? $logs['data'] : $logs;

        $this->assertCount(1, $items);
        $this->assertEquals('Recent Action', $items[0]['action']);
    }

    public function test_summary_counts_reflect_filtered_scope(): void
    {
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Compliance',
            'action' => 'Generated RSMI',
            'status' => 'Verified',
        ]);

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Compliance',
            'action' => 'Failed Report',
            'status' => 'Flagged',
        ]);

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Added Item',
            'status' => 'Verified',
        ]);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?module=Compliance');
        $response->assertStatus(200);

        $summary = $response->viewData('page')['props']['summary'];
        $this->assertEquals(2, $summary['total']);
        $this->assertEquals(1, $summary['verified']);
        $this->assertEquals(1, $summary['flagged']);
        $this->assertEquals(1, $summary['modules']);
    }
}
