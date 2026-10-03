<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_password_link_screen_can_be_rendered(): void
    {
        $response = $this->get('/forgot-password');

        $response->assertStatus(200);
    }

    public function test_reset_password_link_can_be_requested(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_reset_password_screen_can_be_rendered(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $response = $this->get(route('password.reset', ['token' => $notification->token, 'email' => $user->email]));

            $response->assertStatus(200);

            return true;
        });
    }

    public function test_password_can_be_reset_with_valid_token(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $response = $this->post('/reset-password', [
                'token' => $notification->token,
                'email' => $user->email,
                'password' => 'password1234',
                'password_confirmation' => 'password1234',
            ]);

            $response
                ->assertSessionHasNoErrors()
                ->assertRedirect(route('login'));

            return true;
        });
    }

    public function test_expired_reset_link_cannot_be_opened_or_submitted(): void
    {
        $user = User::factory()->create();
        $token = \Illuminate\Support\Facades\Password::broker('users')->createToken($user);

        $this->travel(61)->minutes();

        $this->get(route('password.reset', ['token' => $token, 'email' => $user->email]))
            ->assertStatus(410)
            ->assertSee('Request a new reset email');
        $this->post(route('password.store'), [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password1234',
            'password_confirmation' => 'new-password1234',
        ])->assertSessionHasErrors('email');
    }

    public function test_reset_link_is_one_time_only(): void
    {
        $user = User::factory()->create();
        $token = \Illuminate\Support\Facades\Password::broker('users')->createToken($user);
        $url = route('password.reset', ['token' => $token, 'email' => $user->email]);

        $this->get($url)->assertOk();
        $this->post(route('password.store'), [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password1234',
            'password_confirmation' => 'new-password1234',
        ])->assertRedirect(route('login'));

        $this->get($url)->assertStatus(410);
        $this->post(route('password.store'), [
            'token' => $token,
            'email' => $user->email,
            'password' => 'another-password1234',
            'password_confirmation' => 'another-password1234',
        ])->assertSessionHasErrors('email');
    }

    public function test_password_reset_cannot_activate_an_inactive_account(): void
    {
        $user = User::factory()->create(['is_active' => false]);
        $token = \Illuminate\Support\Facades\Password::broker('users')->createToken($user);

        $this->get(route('password.reset', ['token' => $token, 'email' => $user->email]))->assertStatus(410);
        $this->post(route('password.store'), [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password1234',
            'password_confirmation' => 'new-password1234',
        ])->assertSessionHasErrors('email');

        $this->assertFalse($user->fresh()->is_active);
    }
}
