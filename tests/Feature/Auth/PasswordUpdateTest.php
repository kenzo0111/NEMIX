<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_cannot_be_updated_without_otp(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->put('/password', [
                'current_password' => 'password',
                'password' => 'new-password123',
                'password_confirmation' => 'new-password123',
            ]);

        $response
            ->assertSessionHasErrors('current_password')
            ->assertRedirect('/profile');

        $this->assertFalse(Hash::check('new-password123', $user->refresh()->password));
    }

    public function test_password_can_be_updated_with_valid_otp(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('password'),
        ]);

        $record = \App\Models\PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => 'test-put-token',
            'otp_hash' => Hash::make('123456'),
            'pending_password' => \Illuminate\Support\Facades\Crypt::encryptString('new-password123'),
            'expires_at' => now()->addMinutes(10),
            'is_used' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->put('/password', [
                'token' => 'test-put-token',
                'otp' => '123456',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertTrue(Hash::check('new-password123', $user->refresh()->password));
        $this->assertTrue($record->fresh()->is_used);
    }

    public function test_correct_password_must_be_provided_to_update_password(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->put('/password', [
                'current_password' => 'wrong-password',
                'password' => 'new-password123',
                'password_confirmation' => 'new-password123',
            ]);

        $response
            ->assertSessionHasErrors('current_password')
            ->assertRedirect('/profile');
    }
}
