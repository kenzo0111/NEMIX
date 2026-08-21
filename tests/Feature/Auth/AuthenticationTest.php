<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\AuditLogs\Models\LoginTrail;
use Modules\AuditLogs\Models\TransactionTrail;
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
