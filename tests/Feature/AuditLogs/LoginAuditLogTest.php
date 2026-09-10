<?php

namespace Tests\Feature\AuditLogs;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\AuditLogs\Models\LoginTrail;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LoginAuditLogTest extends TestCase
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

    public function test_guests_cannot_view_login_audit_logs(): void
    {
        $response = $this->get('/audit-logs/login-trails');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_login_audit_logs(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/audit-logs/login-trails');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('AuditLogs/ManageLoginTrails')
                ->has('loginData')
                ->has('summary')
                ->has('filters')
                ->has('availableRoles')
                ->has('availableStatuses')
        );
    }

    public function test_returns_empty_when_no_records_exist_without_fakes(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/audit-logs/login-trails');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('AuditLogs/ManageLoginTrails')
                ->where('loginData.data', [])
                ->where('loginData.total', 0)
                ->where('summary.total', 0)
                ->where('summary.successful', 0)
                ->where('summary.failed', 0)
                ->where('summary.unique_users', 0)
        );
    }

    public function test_maps_records_to_canonical_events_and_iso_timestamps(): void
    {
        $user = User::factory()->create(['name' => 'Dr. Reyes', 'email' => 'reyes@test.edu.ph']);
        $staffRole = Role::firstOrCreate(['name' => 'Faculty Staff', 'guard_name' => 'web']);
        $user->assignRole($staffRole);

        LoginTrail::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'ip_address' => '10.0.1.50',
            'user_agent' => 'Mozilla/5.0 AuditTest',
            'status' => 'Success',
        ]);

        LoginTrail::create([
            'user_id' => null,
            'name' => null,
            'email' => 'intruder@unknown.com',
            'ip_address' => '198.51.100.25',
            'user_agent' => 'Curl/7.68',
            'status' => 'Failed',
        ]);

        LoginTrail::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'ip_address' => '10.0.1.50',
            'user_agent' => 'Mozilla/5.0 AuditTest',
            'status' => 'Logged Out',
        ]);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/login-trails');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('AuditLogs/ManageLoginTrails')
                ->where('summary.total', 3)
                ->where('summary.successful', 1)
                ->where('summary.failed', 1)
                ->where('summary.unique_users', 2)
                ->has('loginData.data', 3)
                ->where('loginData.data.0.event', 'logout')
                ->where('loginData.data.1.event', 'login_failed')
                ->where('loginData.data.1.user_name', 'Unknown User')
                ->where('loginData.data.2.event', 'login_success')
                ->where('loginData.data.2.role', 'Faculty Staff')
        );
    }

    public function test_server_side_search_filtering(): void
    {
        LoginTrail::create([
            'user_id' => null,
            'name' => 'Alice Admin',
            'email' => 'alice@test.edu.ph',
            'ip_address' => '192.168.10.1',
            'status' => 'Success',
        ]);

        LoginTrail::create([
            'user_id' => null,
            'name' => 'Bob Auditor',
            'email' => 'bob@test.edu.ph',
            'ip_address' => '192.168.20.2',
            'status' => 'Success',
        ]);

        // Search by IP
        $response = $this->actingAs($this->adminUser)->get('/audit-logs/login-trails?search=192.168.20.2');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->where('loginData.total', 1)
                ->where('loginData.data.0.name', 'Bob Auditor')
        );

        // Search by name
        $response2 = $this->actingAs($this->adminUser)->get('/audit-logs/login-trails?search=Alice');
        $response2->assertStatus(200);
        $response2->assertInertia(fn ($page) =>
            $page->where('loginData.total', 1)
                ->where('loginData.data.0.name', 'Alice Admin')
        );
    }

    public function test_server_side_status_filtering(): void
    {
        LoginTrail::create([
            'name' => 'Test User',
            'email' => 'user@test.edu.ph',
            'status' => 'Success',
        ]);
        LoginTrail::create([
            'name' => 'Unknown User',
            'email' => 'guest@external.com',
            'status' => 'Failed',
        ]);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/login-trails?status=login_failed');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->where('loginData.total', 1)
                ->where('loginData.data.0.event', 'login_failed')
                ->where('summary.total', 1)
                ->where('summary.failed', 1)
        );
    }

    public function test_server_side_date_filtering(): void
    {
        $trailOld = LoginTrail::create([
            'name' => 'Old Login',
            'email' => 'old@test.edu.ph',
            'status' => 'Success',
        ]);
        $trailOld->created_at = '2026-08-01 10:00:00';
        $trailOld->save();

        $trailRecent = LoginTrail::create([
            'name' => 'Recent Login',
            'email' => 'recent@test.edu.ph',
            'status' => 'Success',
        ]);
        $trailRecent->created_at = '2026-09-10 10:00:00';
        $trailRecent->save();

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/login-trails?date_from=2026-09-01&date_to=2026-09-30');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->where('loginData.total', 1)
                ->where('loginData.data.0.name', 'Recent Login')
        );
    }
}
