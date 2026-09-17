<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Passwords\PasswordBroker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'System Admin']);
        Role::create(['name' => 'Property Staff']);
    }

    public function test_public_registration_screen_is_unavailable_and_returns_404(): void
    {
        $response = $this->get('/register');

        $response->assertNotFound();
    }

    public function test_public_post_registration_endpoint_is_unavailable_and_returns_404(): void
    {
        $response = $this->post('/register', [
            'name' => 'Attacker',
            'email' => 'attacker@example.com',
            'password' => 'password1234',
            'password_confirmation' => 'password1234',
        ]);

        $response->assertNotFound();
        $this->assertDatabaseMissing('users', ['email' => 'attacker@example.com']);
    }

    public function test_valid_invitation_registration_succeeds_and_activates_account(): void
    {
        $user = User::factory()->create([
            'email' => 'invited.staff@example.com',
            'is_active' => false,
        ]);
        $user->assignRole('Property Staff');

        /** @var PasswordBroker $broker */
        $broker = Password::broker();
        $token = $broker->createToken($user);

        // GET invitation screen
        $screenResponse = $this->get(route('register.invitation', [
            'token' => $token,
            'email' => $user->email,
        ]));
        $screenResponse->assertOk();

        // POST invitation setup
        $response = $this->post(route('register.invitation.store'), [
            'token' => $token,
            'email' => $user->email,
            'name' => 'Activated Staff Name',
            'password' => 'new-secure-pass1234',
            'password_confirmation' => 'new-secure-pass1234',
        ]);

        $response->assertRedirect(route('login'));
        $response->assertSessionHas('status', 'Successfully registered, please proceed to login.');

        $user->refresh();
        $this->assertTrue($user->is_active);
        $this->assertEquals('Activated Staff Name', $user->name);
        $this->assertTrue(Hash::check('new-secure-pass1234', $user->password));

        // Account can now authenticate
        $loginResponse = $this->post('/login', [
            'email' => $user->email,
            'password' => 'new-secure-pass1234',
        ]);
        $loginResponse->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_invalid_invitation_token_is_rejected(): void
    {
        $user = User::factory()->create([
            'email' => 'staff2@example.com',
            'is_active' => false,
        ]);

        $response = $this->from(route('register.invitation', ['token' => 'invalid-token', 'email' => $user->email]))
            ->post(route('register.invitation.store'), [
                'token' => 'invalid-token',
                'email' => $user->email,
                'password' => 'new-password123',
                'password_confirmation' => 'new-password123',
            ]);

        $response->assertRedirect(route('register.invitation', ['token' => 'invalid-token', 'email' => $user->email]));
        $response->assertSessionHasErrors('email');

        $user->refresh();
        $this->assertFalse($user->is_active);
    }

    public function test_expired_invitation_token_is_rejected(): void
    {
        $user = User::factory()->create([
            'email' => 'expired@example.com',
            'is_active' => false,
        ]);

        /** @var PasswordBroker $broker */
        $broker = Password::broker();
        $token = $broker->createToken($user);

        // Travel 61 minutes into the future (default password reset timeout is 60 minutes)
        $this->travel(61)->minutes();

        $response = $this->from(route('register.invitation', ['token' => $token, 'email' => $user->email]))
            ->post(route('register.invitation.store'), [
                'token' => $token,
                'email' => $user->email,
                'password' => 'new-password123',
                'password_confirmation' => 'new-password123',
            ]);

        $response->assertSessionHasErrors('email');

        $user->refresh();
        $this->assertFalse($user->is_active);
    }
}
