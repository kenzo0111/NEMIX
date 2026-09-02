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
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class PasswordChangeOtpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('password-otp-request:*');
    }

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

        // Verify request record in database with 5-minute expiry
        $record = PasswordChangeRequest::where('user_id', $user->id)->first();
        $this->assertNotNull($record);
        $this->assertFalse($record->is_used);
        $this->assertSame(0, $record->attempts);
        $this->assertTrue($record->expires_at->diffInMinutes(now()) <= 5);

        // Verify password is NOT plaintext in database
        $this->assertNotEquals('NewSecurePassword456!', $record->pending_password);
        $this->assertSame('NewSecurePassword456!', Crypt::decryptString($record->pending_password));

        // Verify user's actual password was NOT yet changed
        $this->assertTrue(Hash::check('CurrentPassword123!', $user->fresh()->password));

        // Verify OTP email notification was dispatched with 5-minute expiry note
        Notification::assertSentTo($user, PasswordChangeOtpNotification::class, function ($notification) use ($record) {
            return Hash::check($notification->otp, $record->otp_hash) && $notification->expiresInMinutes === 5;
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
            'expires_at' => now()->addMinutes(5),
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
            'message' => 'OTP verified successfully. Updating your password...',
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

    public function test_incorrect_otp_fails_and_increments_attempts_without_revealing_partial_match(): void
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
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
            'max_attempts' => 5,
            'is_used' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.verify'), [
                'token' => $token,
                'otp' => '654000', // Matches first 3 digits, but message must not reveal partial match
            ]);

        $response->assertStatus(422);
        $response->assertJsonStructure(['remaining_attempts', 'errors' => ['otp']]);
        $this->assertSame(4, $response->json('remaining_attempts'));
        $this->assertStringContainsString('The verification code entered is incorrect', $response->json('message'));

        // Password not updated
        $this->assertTrue(Hash::check('OldPassword123!', $user->fresh()->password));

        // Attempt counter incremented
        $this->assertSame(1, $record->fresh()->attempts);
    }

    public function test_five_failed_attempts_invalidates_otp_and_user_can_resend_new_code(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = 'test-token-lockout';

        $record = PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make('123456'),
            'pending_password' => Crypt::encryptString('NewPassword789!'),
            'expires_at' => now()->addMinutes(5),
            'attempts' => 4, // 1 attempt remaining
            'max_attempts' => 5,
            'is_used' => false,
        ]);

        // 5th failed attempt
        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.verify'), [
                'token' => $token,
                'otp' => '000000',
            ]);

        $response->assertStatus(422);
        $this->assertSame('Too many incorrect attempts. This code has been invalidated. Please request a new code.', $response->json('message'));

        $record->refresh();
        $this->assertSame(5, $record->attempts);
        $this->assertFalse($record->is_used); // Request not destroyed, pending password intact for resend
        $this->assertNotNull($record->pending_password);

        // Further attempt to verify the invalidated OTP fails immediately
        $responseAgain = $this
            ->actingAs($user)
            ->postJson(route('password.otp.verify'), [
                'token' => $token,
                'otp' => '123456',
            ]);
        $responseAgain->assertStatus(422);
        $this->assertSame('Too many incorrect attempts. This code has been invalidated. Please request a new code.', $responseAgain->json('message'));

        // User can resend new OTP without restarting the entire password-change process!
        $record->update(['resend_available_at' => now()->subSecond()]);

        $resendResponse = $this
            ->actingAs($user)
            ->postJson(route('password.otp.resend'), [
                'token' => $token,
            ]);

        $resendResponse->assertOk();
        $record->refresh();
        $this->assertSame(0, $record->attempts); // Counter reset
        $this->assertFalse(Hash::check('123456', $record->otp_hash)); // New OTP generated
    }

    public function test_expired_otp_cannot_be_verified_and_allows_resend_without_restarting(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = 'test-token-expired';

        $record = PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make('123456'),
            'pending_password' => Crypt::encryptString('NewPassword789!'),
            'expires_at' => now()->subMinute(), // Already expired
            'attempts' => 0,
            'max_attempts' => 5,
            'is_used' => false,
        ]);

        // Attempting to verify expired code
        $response = $this
            ->actingAs($user)
            ->postJson(route('password.otp.verify'), [
                'token' => $token,
                'otp' => '123456',
            ]);

        $response->assertStatus(422);
        $this->assertSame('This code has expired. Please request a new code.', $response->json('message'));
        $this->assertTrue(Hash::check('OldPassword123!', $user->fresh()->password));

        // User can request a new OTP without restarting the entire password-change process!
        $record->update(['resend_available_at' => now()->subSecond()]);

        $resendResponse = $this
            ->actingAs($user)
            ->postJson(route('password.otp.resend'), [
                'token' => $token,
            ]);

        $resendResponse->assertOk();
        $record->refresh();
        $this->assertTrue($record->expires_at->isFuture());
        $this->assertTrue($record->expires_at->diffInMinutes(now()) <= 5);
        $this->assertSame(0, $record->attempts);
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
            'expires_at' => now()->addMinutes(5),
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

    public function test_only_latest_generated_otp_is_valid(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = 'test-token-latest-only';
        $otp1 = '111111';

        $record = PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make($otp1),
            'pending_password' => Crypt::encryptString('BrandNewPass999!'),
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
            'max_attempts' => 5,
            'resend_available_at' => now()->subSecond(),
            'is_used' => false,
        ]);

        // User clicks Resend OTP -> OTP #2 is generated and OTP #1 is immediately invalidated
        $resendResponse = $this
            ->actingAs($user)
            ->postJson(route('password.otp.resend'), [
                'token' => $token,
            ]);

        $resendResponse->assertOk();

        // Retrieve OTP #2 from the dispatched notification
        $otp2 = null;
        Notification::assertSentTo($user, PasswordChangeOtpNotification::class, function ($notification) use (&$otp2) {
            $otp2 = $notification->otp;
            return true;
        });

        $this->assertNotNull($otp2);
        $this->assertNotEquals($otp1, $otp2);

        // Attempting to verify with OTP #1 must FAIL, even though 5 minutes have not passed
        $verify1 = $this
            ->actingAs($user)
            ->postJson(route('password.otp.verify'), [
                'token' => $token,
                'otp' => $otp1,
            ]);
        $verify1->assertStatus(422);
        $this->assertTrue(Hash::check('OldPassword123!', $user->fresh()->password));

        // Attempting to verify with OTP #2 must SUCCEED
        $verify2 = $this
            ->actingAs($user)
            ->postJson(route('password.otp.verify'), [
                'token' => $token,
                'otp' => $otp2,
            ]);
        $verify2->assertOk();
        $this->assertTrue(Hash::check('BrandNewPass999!', $user->fresh()->password));
    }

    public function test_user_cannot_resend_otp_during_60_second_cooldown(): void
    {
        $user = User::factory()->create();
        $token = 'test-token-cooldown';

        PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make('111111'),
            'pending_password' => Crypt::encryptString('NewPassword789!'),
            'expires_at' => now()->addMinutes(5),
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

    public function test_maximum_5_otp_requests_within_15_minutes_blocks_further_requests(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'password' => Hash::make('CurrentPassword123!'),
        ]);

        $rateLimitKey = 'password-otp-request:' . $user->id;
        RateLimiter::clear($rateLimitKey);

        // 1st request via requestOtp
        $r1 = $this->actingAs($user)->postJson(route('password.otp.request'), [
            'current_password' => 'CurrentPassword123!',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
        ]);
        $r1->assertOk();
        $token = $r1->json('token');

        // Requests 2, 3, 4, 5 via resendOtp (with cooldown cleared between requests)
        for ($i = 2; $i <= 5; $i++) {
            PasswordChangeRequest::where('token', $token)->update(['resend_available_at' => now()->subSecond()]);
            $resend = $this->actingAs($user)->postJson(route('password.otp.resend'), ['token' => $token]);
            $resend->assertOk();
        }

        // 6th request within 15 minutes must be blocked with HTTP 429
        PasswordChangeRequest::where('token', $token)->update(['resend_available_at' => now()->subSecond()]);
        $blocked = $this->actingAs($user)->postJson(route('password.otp.resend'), ['token' => $token]);

        $blocked->assertStatus(429);
        $this->assertSame('You have requested too many verification codes. Please wait before trying again.', $blocked->json('message'));

        // Attempting a new initial request is also blocked by the 15-minute rate limit
        $blockedNew = $this->actingAs($user)->postJson(route('password.otp.request'), [
            'current_password' => 'CurrentPassword123!',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
        ]);
        $blockedNew->assertStatus(429);
        $this->assertSame('You have requested too many verification codes. Please wait before trying again.', $blockedNew->json('message'));
    }

    public function test_password_is_never_changed_under_invalid_conditions(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('OriginalPassword123!'),
        ]);

        $token = 'test-token-never-change';

        $record = PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make('123456'),
            'pending_password' => Crypt::encryptString('AttackerNewPass!'),
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
            'max_attempts' => 5,
            'is_used' => false,
        ]);

        // 1. Incorrect OTP
        $this->actingAs($user)->postJson(route('password.otp.verify'), ['token' => $token, 'otp' => '999999']);
        $this->assertTrue(Hash::check('OriginalPassword123!', $user->fresh()->password));

        // 2. Expired OTP (even if code is otherwise correct)
        $record->update(['expires_at' => now()->subSecond()]);
        $this->actingAs($user)->postJson(route('password.otp.verify'), ['token' => $token, 'otp' => '123456']);
        $this->assertTrue(Hash::check('OriginalPassword123!', $user->fresh()->password));

        // 3. Max attempts exceeded
        $record->update(['expires_at' => now()->addMinutes(5), 'attempts' => 5]);
        $this->actingAs($user)->postJson(route('password.otp.verify'), ['token' => $token, 'otp' => '123456']);
        $this->assertTrue(Hash::check('OriginalPassword123!', $user->fresh()->password));

        // 4. Used OTP
        $record->update(['is_used' => true, 'attempts' => 0]);
        $this->actingAs($user)->postJson(route('password.otp.verify'), ['token' => $token, 'otp' => '123456']);
        $this->assertTrue(Hash::check('OriginalPassword123!', $user->fresh()->password));
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
