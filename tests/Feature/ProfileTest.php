<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }

    public function test_account_settings_route_renders_successfully(): void
    {
        $user = User::factory()->create([
            'name' => 'Institutional Officer',
            'email' => 'officer@ucn.edu.ph',
            'is_active' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->get('/account-settings');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Profile/Edit')
            ->has('profile')
            ->where('profile.name', 'Institutional Officer')
            ->where('profile.username', 'officer')
            ->where('profile.email', 'officer@ucn.edu.ph')
            ->where('profile.account_status', 'Active')
        );
    }

    public function test_user_cannot_self_deactivate_or_modify_own_account_status(): void
    {
        $user = User::factory()->create([
            'name' => 'Active Officer',
            'email' => 'active@ucn.edu.ph',
            'is_active' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Active Officer',
                'email' => 'active@ucn.edu.ph',
                'is_active' => false,
            ]);

        $response->assertSessionHas('error', 'You cannot disable, deactivate, or lock your own account.');
        $this->assertTrue($user->fresh()->is_active);
    }

    public function test_user_cannot_disable_account_via_status_string(): void
    {
        $user = User::factory()->create([
            'name' => 'Active Officer',
            'email' => 'active2@ucn.edu.ph',
            'is_active' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Active Officer',
                'email' => 'active2@ucn.edu.ph',
                'status' => 'disabled',
            ]);

        $response->assertSessionHas('error', 'You cannot disable, deactivate, or lock your own account.');
        $this->assertTrue($user->fresh()->is_active);
    }

    public function test_password_cannot_be_updated_without_email_otp(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('old-password-123'),
        ]);

        $response = $this
            ->actingAs($user)
            ->put('/password', [
                'current_password' => 'old-password-123',
                'password' => 'new-secure-password-456',
                'password_confirmation' => 'new-secure-password-456',
            ]);

        $response->assertSessionHasErrors('current_password');
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('old-password-123', $user->fresh()->password));
    }

    public function test_password_can_be_updated_with_verified_email_otp(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('old-password-123'),
        ]);

        $record = \App\Models\PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => 'profile-test-otp-token',
            'otp_hash' => \Illuminate\Support\Facades\Hash::make('654321'),
            'pending_password' => \Illuminate\Support\Facades\Crypt::encryptString('new-secure-password-456'),
            'expires_at' => now()->addMinutes(10),
            'is_used' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->put('/password', [
                'token' => 'profile-test-otp-token',
                'otp' => '654321',
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('new-secure-password-456', $user->fresh()->password));
        $this->assertTrue($record->fresh()->is_used);
    }

    public function test_password_cannot_be_updated_with_incorrect_current_password(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('old-password-123'),
        ]);

        $response = $this
            ->actingAs($user)
            ->put('/password', [
                'current_password' => 'wrong-current-password',
                'password' => 'new-secure-password-456',
                'password_confirmation' => 'new-secure-password-456',
            ]);

        $response->assertSessionHasErrors('current_password');
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('old-password-123', $user->fresh()->password));
    }
}
