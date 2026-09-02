<?php

namespace Tests\Feature\Auth;

use App\Models\PasswordChangeRequest;
use App\Models\User;
use App\Notifications\PasswordChangeOtpNotification;
use App\Notifications\PasswordChangedSecurityNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordChangeOtpTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_request_otp_with_valid_current_password(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'officer@ucn.edu.ph',
            'password' => Hash::make('CurrentPassword123!'),
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.request'), [
                'current_password' => 'CurrentPassword123!',
                'password' => 'NewSecurePassword456!',
                'password_confirmation' => 'NewSecurePassword456!',
            ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
        ]);
        $this->assertNotEmpty($response->json('token'));
        $this->assertStringContainsString('@ucn.edu.ph', $response->json('masked_email'));

        // Verify request record in database
        $record = PasswordChangeRequest::where('user_id', $user->id)->first();
        $this->assertNotNull($record);
        $this->assertFalse($record->is_used);
        $this->assertSame(0, $record->attempts);

        // Verify password is NOT plaintext in database
        $this->assertNotEquals('NewSecurePassword456!', $record->pending_password);
        $this->assertSame('NewSecurePassword456!', Crypt::decryptString($record->pending_password));

        // Verify user's actual password was NOT yet changed
        $this->assertTrue(Hash::check('CurrentPassword123!', $user->fresh()->password));

        // Verify OTP email notification was dispatched
        Notification::assertSentTo($user, PasswordChangeOtpNotification::class, function ($notification) use ($record) {
            return Hash::check($notification->otp, $record->otp_hash);
        });
    }

    public function test_user_cannot_request_otp_with_incorrect_current_password(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'password' => Hash::make('CorrectPassword123!'),
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.request'), [
                'current_password' => 'WrongPassword123!',
                'password' => 'NewSecurePassword456!',
                'password_confirmation' => 'NewSecurePassword456!',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['current_password']);

        // Verify no request record created and no notification sent
        $this->assertSame(0, PasswordChangeRequest::count());
        Notification::assertNothingSent();
    }

    public function test_user_cannot_request_otp_with_mismatched_password_confirmation(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'password' => Hash::make('CurrentPassword123!'),
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.request'), [
                'current_password' => 'CurrentPassword123!',
                'password' => 'NewSecurePassword456!',
                'password_confirmation' => 'DifferentPassword789!',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
        Notification::assertNothingSent();
    }

    public function test_requesting_new_otp_invalidates_previous_requests(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'password' => Hash::make('CurrentPassword123!'),
        ]);

        // First request
        $this->actingAs($user)->postJson(route('password.otp.request'), [
            'current_password' => 'CurrentPassword123!',
            'password' => 'NewPasswordFirst1!',
            'password_confirmation' => 'NewPasswordFirst1!',
        ]);

        $firstToken = PasswordChangeRequest::where('user_id', $user->id)->value('token');

        // Second request
        $response2 = $this->actingAs($user)->postJson(route('password.otp.request'), [
            'current_password' => 'CurrentPassword123!',
            'password' => 'NewPasswordSecond2!',
            'password_confirmation' => 'NewPasswordSecond2!',
        ]);

        $response2->assertOk();
        $secondToken = $response2->json('token');

        // First token must no longer exist or be unverified
        $this->assertNotEquals($firstToken, $secondToken);
        $this->assertNull(PasswordChangeRequest::where('token', $firstToken)->first());
        $this->assertSame(1, PasswordChangeRequest::where('user_id', $user->id)->count());
    }

    public function test_user_can_verify_otp_and_password_is_updated_in_database(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123!'),
        ]);

        $otp = '654321';
        $token = 'test-verification-token-abc';

        $record = PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make($otp),
            'pending_password' => Crypt::encryptString('BrandNewPassword789!'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'max_attempts' => 5,
            'is_used' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.verify'), [
                'token' => $token,
                'otp' => $otp,
            ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
        ]);

        // User's password in users table is now updated!
        $this->assertTrue(Hash::check('BrandNewPassword789!', $user->fresh()->password));

        // Record is marked as used and pending password is wiped
        $record->refresh();
        $this->assertTrue($record->is_used);
        $this->assertNotNull($record->used_at);
        $this->assertNull($record->pending_password);

        // Security notification was dispatched
        Notification::assertSentTo($user, PasswordChangedSecurityNotification::class);
    }

    public function test_incorrect_otp_fails_and_increments_attempts(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123!'),
        ]);

        $otp = '654321';
        $token = 'test-token-attempts';

        $record = PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make($otp),
            'pending_password' => Crypt::encryptString('NewPassword789!'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'max_attempts' => 5,
            'is_used' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.verify'), [
                'token' => $token,
                'otp' => '999999', // Incorrect OTP
            ]);

        $response->assertStatus(422);
        $response->assertJsonStructure(['remaining_attempts', 'errors' => ['otp']]);
        $this->assertSame(4, $response->json('remaining_attempts'));

        // Password not updated
        $this->assertTrue(Hash::check('OldPassword123!', $user->fresh()->password));

        // Attempt counter incremented
        $this->assertSame(1, $record->fresh()->attempts);
    }

    public function test_too_many_failed_otp_attempts_locks_and_cancels_request(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = 'test-token-lockout';

        $record = PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make('123456'),
            'pending_password' => Crypt::encryptString('NewPassword789!'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 4, // 1 away from max
            'max_attempts' => 5,
            'is_used' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.verify'), [
                'token' => $token,
                'otp' => '000000',
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Too many invalid OTP attempts', $response->json('message'));

        $record->refresh();
        $this->assertTrue($record->is_used);
        $this->assertNull($record->pending_password);
    }

    public function test_expired_otp_cannot_be_verified(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = 'test-token-expired';

        PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make('123456'),
            'pending_password' => Crypt::encryptString('NewPassword789!'),
            'expires_at' => now()->subMinute(), // Already expired
            'attempts' => 0,
            'max_attempts' => 5,
            'is_used' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.verify'), [
                'token' => $token,
                'otp' => '123456',
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('expired', strtolower($response->json('message')));
        $this->assertTrue(Hash::check('OldPassword123!', $user->fresh()->password));
    }

    public function test_used_otp_cannot_be_reused(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = 'test-token-already-used';

        PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make('123456'),
            'pending_password' => null,
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'max_attempts' => 5,
            'is_used' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.verify'), [
                'token' => $token,
                'otp' => '123456',
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('already been used', $response->json('message'));
    }

    public function test_user_can_resend_otp_after_cooldown(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $token = 'test-token-resend';

        $record = PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make('111111'),
            'pending_password' => Crypt::encryptString('NewPassword789!'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 2,
            'resend_count' => 0,
            'resend_available_at' => now()->subSecond(), // Cooldown elapsed
            'is_used' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.resend'), [
                'token' => $token,
            ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'resend_available_in' => 60,
        ]);

        $record->refresh();
        $this->assertSame(1, $record->resend_count);
        $this->assertSame(0, $record->attempts); // Attempts reset upon resend
        $this->assertFalse(Hash::check('111111', $record->otp_hash)); // New OTP generated

        Notification::assertSentTo($user, PasswordChangeOtpNotification::class);
    }

    public function test_user_cannot_resend_otp_during_cooldown(): void
    {
        $user = User::factory()->create();
        $token = 'test-token-cooldown';

        PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make('111111'),
            'pending_password' => Crypt::encryptString('NewPassword789!'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'resend_count' => 0,
            'resend_available_at' => now()->addSeconds(45), // 45 seconds remaining
            'is_used' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.resend'), [
                'token' => $token,
            ]);

        $response->assertStatus(429);
        $this->assertStringContainsString('wait', strtolower($response->json('message')));
    }

    public function test_user_cannot_exceed_max_resend_limit(): void
    {
        $user = User::factory()->create();
        $token = 'test-token-max-resends';

        PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make('111111'),
            'pending_password' => Crypt::encryptString('NewPassword789!'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'resend_count' => 3, // Max 3 resends reached
            'resend_available_at' => now()->subSecond(),
            'is_used' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.resend'), [
                'token' => $token,
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('limit reached', strtolower($response->json('message')));
    }

    public function test_email_delivery_failure_is_handled_gracefully(): void
    {
        Notification::shouldReceive('send')
            ->andThrow(new \Exception('SMTP connection timeout'));

        $user = User::factory()->create([
            'password' => Hash::make('CurrentPassword123!'),
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.request'), [
                'current_password' => 'CurrentPassword123!',
                'password' => 'NewSecurePassword456!',
                'password_confirmation' => 'NewSecurePassword456!',
            ]);

        $response->assertStatus(500);
        $this->assertStringContainsString('delivery failure', strtolower($response->json('message')));

        // Ensure temporary record was deleted on mail failure
        $this->assertSame(0, PasswordChangeRequest::where('user_id', $user->id)->count());
    }
}
