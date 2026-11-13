<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\AuditLogs\Models\LoginTrail;
use Modules\AuditLogs\Models\TransactionTrail;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        // Verify LoginTrail
        $this->assertDatabaseHas('login_trails', [
            'user_id' => $user->id,
            'email' => $user->email,
            'status' => 'Success',
        ]);

        // Verify TransactionTrail (Audit Ledger)
        $this->assertDatabaseHas('transaction_trails', [
            'user_id' => $user->id,
            'action' => 'User Login',
            'status' => 'Verified',
        ]);
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();

        // Verify LoginTrail
        $this->assertDatabaseHas('login_trails', [
            'email' => $user->email,
            'status' => 'Failed',
        ]);

        // Verify TransactionTrail (Audit Ledger)
        $this->assertDatabaseHas('transaction_trails', [
            'action' => 'Failed Login Attempt',
            'status' => 'Flagged',
        ]);
    }

    public function test_demo_supply_coordinator_login_flashes_the_demo_notice(): void
    {
        $user = User::factory()->create(['is_demo_account' => true]);
        $user->assignRole(Role::firstOrCreate(['name' => 'Supply Coordinator', 'guard_name' => 'web']));

        $response = $this->post('/login', ['email' => $user->email, 'password' => 'password']);

        $response->assertRedirect(route('dashboard', absolute: false));
        $response->assertSessionHas('show_demo_account_notice', true);
    }

    public function test_demo_authorized_personnel_login_flashes_the_demo_notice(): void
    {
        $user = User::factory()->create(['is_demo_account' => true]);
        $user->assignRole(Role::firstOrCreate(['name' => 'Authorized Personnel', 'guard_name' => 'web']));

        $response = $this->post('/login', ['email' => $user->email, 'password' => 'password']);

        $response->assertRedirect(route('dashboard', absolute: false));
        $response->assertSessionHas('show_demo_account_notice', true);
    }

    public function test_dedicated_requester_account_does_not_flash_the_demo_notice(): void
    {
        $user = User::factory()->create(['is_demo_account' => false]);
        $user->assignRole(Role::firstOrCreate(['name' => 'Supply Coordinator', 'guard_name' => 'web']));

        $response = $this->post('/login', ['email' => $user->email, 'password' => 'password']);

        $response->assertSessionHas('show_demo_account_notice', false);
    }

    public function test_demo_backfill_never_marks_an_institutional_requester_account(): void
    {
        $role = Role::firstOrCreate(['name' => 'Supply Coordinator', 'guard_name' => 'web']);
        $institutionalUser = User::factory()->create([
            'email' => 'dedicated.office@ucn.edu.ph',
            'is_demo_account' => false,
        ]);
        $institutionalUser->assignRole($role);
        $demoUser = User::factory()->create([
            'email' => 'supply.coordinator@example.com',
            'is_demo_account' => false,
        ]);
        $demoUser->assignRole($role);

        $migration = require database_path('migrations/2026_11_13_000001_add_demo_account_flag_to_users.php');
        $migration->up();

        $this->assertFalse($institutionalUser->refresh()->is_demo_account);
        $this->assertTrue($demoUser->refresh()->is_demo_account);
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');

        // Verify LoginTrail
        $this->assertDatabaseHas('login_trails', [
            'user_id' => $user->id,
            'email' => $user->email,
            'status' => 'Logged Out',
        ]);

        // Verify TransactionTrail (Audit Ledger)
        $this->assertDatabaseHas('transaction_trails', [
            'user_id' => $user->id,
            'action' => 'User Logout',
            'status' => 'Verified',
        ]);
    }
}
