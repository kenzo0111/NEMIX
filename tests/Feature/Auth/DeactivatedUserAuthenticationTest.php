<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DeactivatedUserAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'System Admin']);
        Role::create(['name' => 'Property Staff']);
    }

    public function test_active_account_with_correct_credentials_login_succeeds(): void
    {
        $user = User::factory()->create([
            'email' => 'active@example.com',
            'password' => bcrypt('password1234'),
            'is_active' => true,
        ]);
        $user->assignRole('Property Staff');

        $response = $this->post('/login', [
            'email' => 'active@example.com',
            'password' => 'password1234',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect('/dashboard');
    }

    public function test_inactive_account_with_correct_credentials_login_fails_with_generic_message(): void
    {
        $user = User::factory()->create([
            'email' => 'inactive@example.com',
            'password' => bcrypt('password1234'),
            'is_active' => false,
        ]);
        $user->assignRole('Property Staff');

        $response = $this->from('/login')->post('/login', [
            'email' => 'inactive@example.com',
            'password' => 'password1234',
        ]);

        $this->assertGuest();
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors(['email' => trans('auth.failed')]);
    }

    public function test_inactive_account_with_wrong_credentials_returns_same_generic_failure(): void
    {
        $user = User::factory()->create([
            'email' => 'inactive2@example.com',
            'password' => bcrypt('correct-password'),
            'is_active' => false,
        ]);

        $response = $this->from('/login')->post('/login', [
            'email' => 'inactive2@example.com',
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors(['email' => trans('auth.failed')]);
    }

    public function test_already_authenticated_user_becomes_inactive_terminates_session_on_next_request(): void
    {
        $user = User::factory()->create([
            'email' => 'staff@example.com',
            'is_active' => true,
        ]);
        $user->assignRole('Property Staff');

        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertOk();

        // User is now deactivated
        $user->update(['is_active' => false]);

        // Next protected request should log out and redirect to login
        $nextResponse = $this->actingAs($user)->get('/dashboard');
        $nextResponse->assertRedirect(route('login'));
        $nextResponse->assertSessionHasErrors(['email' => 'Your account is no longer active.']);
        $this->assertGuest();
    }

    public function test_inactive_user_cannot_reach_dashboard(): void
    {
        $user = User::factory()->create([
            'is_active' => false,
        ]);

        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_inactive_user_cannot_issue_inventory(): void
    {
        $user = User::factory()->create([
            'is_active' => false,
        ]);
        $user->assignRole('Property Staff');

        $response = $this->actingAs($user)->get('/inventory/issuance');
        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_inactive_user_cannot_access_compliance_reports(): void
    {
        $user = User::factory()->create([
            'is_active' => false,
        ]);
        $user->assignRole('Property Staff');

        $response = $this->actingAs($user)->get('/compliance/reports');
        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_reactivating_user_restores_normal_authentication(): void
    {
        $user = User::factory()->create([
            'email' => 'reactivated@example.com',
            'password' => bcrypt('password1234'),
            'is_active' => false,
        ]);
        $user->assignRole('Property Staff');

        // Initially fails
        $this->post('/login', [
            'email' => 'reactivated@example.com',
            'password' => 'password1234',
        ])->assertSessionHasErrors('email');
        $this->assertGuest();

        // Reactivate user
        $user->update(['is_active' => true]);

        // Now login succeeds
        $this->post('/login', [
            'email' => 'reactivated@example.com',
            'password' => 'password1234',
        ])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_deactivating_user_via_admin_controller_purges_sessions(): void
    {
        $admin = User::factory()->create([
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $admin->assignRole('System Admin');

        $staff = User::factory()->create([
            'is_active' => true,
        ]);
        $staff->assignRole('Property Staff');

        // Simulate session record if sessions table exists
        if (Schema::hasTable('sessions')) {
            DB::table('sessions')->insert([
                'id' => 'test_session_id_123',
                'user_id' => $staff->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PHPUnit',
                'payload' => 'dummy',
                'last_activity' => time(),
            ]);

            $this->assertDatabaseHas('sessions', ['user_id' => $staff->id]);
        }

        $response = $this->actingAs($admin)->patch(route('access-control.staffs.toggle-status', $staff->id));
        $response->assertRedirect();

        $staff->refresh();
        $this->assertFalse($staff->is_active);

        if (Schema::hasTable('sessions')) {
            $this->assertDatabaseMissing('sessions', ['user_id' => $staff->id]);
        }
    }
}
