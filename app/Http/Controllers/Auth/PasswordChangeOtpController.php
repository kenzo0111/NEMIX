<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PasswordChangeRequest;
use App\Notifications\PasswordChangeOtpNotification;
use App\Notifications\PasswordChangedSecurityNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class PasswordChangeOtpController extends Controller
{
    /**
     * Request an OTP to change the authenticated user's password.
     */
    public function requestOtp(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Session expired or unauthenticated. Please log in again.',
            ], 401);
        }

        // Validate current password and new password rules
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        // Invalidate any existing unverified OTP requests for this user
        PasswordChangeRequest::where('user_id', $user->id)
            ->where('is_used', false)
            ->delete();

        // Generate cryptographically secure 6-digit OTP and request token
        $otp = sprintf('%06d', random_int(100000, 999999));
        $token = Str::random(40);
        $expiresAt = now()->addMinutes(10);
        $resendAvailableAt = now()->addSeconds(60);

        // Store encrypted pending password (never plaintext) and hashed OTP
        $changeRequest = PasswordChangeRequest::create([
            'user_id' => $user->id,
            'token' => $token,
            'otp_hash' => Hash::make($otp),
            'pending_password' => Crypt::encryptString($validated['password']),
            'expires_at' => $expiresAt,
            'attempts' => 0,
            'max_attempts' => 5,
            'resend_count' => 0,
            'resend_available_at' => $resendAvailableAt,
            'is_used' => false,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Dispatch OTP notification with delivery failure handling
        try {
            $user->notify(new PasswordChangeOtpNotification($otp, 10));
        } catch (\Throwable $e) {
            Log::error('Failed to send password change OTP: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'email' => $user->email,
                'exception' => $e,
            ]);

            // Clean up request so invalid state is not persisted
            $changeRequest->delete();

            return response()->json([
                'message' => 'Email delivery failure. Unable to send verification code to your registered email. Please check mail settings or contact your administrator.',
                'errors' => [
                    'current_password' => ['Email delivery failure. Could not dispatch verification code.'],
                ],
            ], 500);
        }

        $maskedEmail = $this->maskEmail($user->email);

        return response()->json([
            'success' => true,
            'token' => $token,
            'expires_at' => $expiresAt->toISOString(),
            'resend_available_in' => 60,
            'masked_email' => $maskedEmail,
            'message' => "A 6-digit verification code has been sent to {$maskedEmail}.",
        ]);
    }

    /**
     * Verify the OTP and update the user's password.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Session expired or unauthenticated. Please log in again.',
            ], 401);
        }

        $request->validate([
            'token' => ['required', 'string'],
            'otp' => ['required', 'string', 'size:6'],
        ]);

        /** @var PasswordChangeRequest|null $changeRequest */
        $changeRequest = PasswordChangeRequest::where('user_id', $user->id)
            ->where('token', $request->token)
            ->first();

        if (! $changeRequest || $changeRequest->is_used) {
            return response()->json([
                'message' => 'Verification request not found or has already been used. Please start over.',
                'errors' => [
                    'otp' => ['Verification request not found or has already been used.'],
                ],
            ], 422);
        }

        if ($changeRequest->isExpired()) {
            return response()->json([
                'message' => 'The verification code has expired. Please request a new code.',
                'errors' => [
                    'otp' => ['The verification code has expired. Please request a new code.'],
                ],
            ], 422);
        }

        if ($changeRequest->isMaxAttemptsExceeded()) {
            $changeRequest->update([
                'is_used' => true,
                'pending_password' => null,
            ]);

            return response()->json([
                'message' => 'Too many invalid OTP attempts. For security reasons, this request has been cancelled. Please start a new password change request.',
                'errors' => [
                    'otp' => ['Too many invalid OTP attempts. Request has been cancelled.'],
                ],
            ], 422);
        }

        // Verify the OTP against the stored hash
        if (! Hash::check($request->otp, $changeRequest->otp_hash)) {
            $changeRequest->increment('attempts');
            $remaining = max(0, $changeRequest->max_attempts - $changeRequest->attempts);

            if ($remaining === 0) {
                $changeRequest->update([
                    'is_used' => true,
                    'pending_password' => null,
                ]);

                return response()->json([
                    'message' => 'Too many invalid OTP attempts. For security reasons, this request has been cancelled. Please start a new password change request.',
                    'errors' => [
                        'otp' => ['Too many invalid OTP attempts. Request has been cancelled.'],
                    ],
                ], 422);
            }

            return response()->json([
                'message' => "The verification code entered is incorrect. You have {$remaining} attempt(s) remaining.",
                'remaining_attempts' => $remaining,
                'errors' => [
                    'otp' => ["Invalid verification code. You have {$remaining} attempt(s) remaining."],
                ],
            ], 422);
        }

        // OTP is valid! Decrypt and apply the new password
        $rawNewPassword = Crypt::decryptString($changeRequest->pending_password);

        $user->update([
            'password' => Hash::make($rawNewPassword),
        ]);

        // Invalidate the request and wipe temporary encrypted storage
        $changeRequest->update([
            'is_used' => true,
            'used_at' => now(),
            'pending_password' => null,
        ]);

        // Send security notification alert
        try {
            $user->notify(new PasswordChangedSecurityNotification($request->ip()));
        } catch (\Throwable $e) {
            Log::warning('Failed to send password changed notification email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Your password has been changed successfully.',
        ]);
    }

    /**
     * Resend a new OTP for an active verification request.
     */
    public function resendOtp(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Session expired or unauthenticated. Please log in again.',
            ], 401);
        }

        $request->validate([
            'token' => ['required', 'string'],
        ]);

        /** @var PasswordChangeRequest|null $changeRequest */
        $changeRequest = PasswordChangeRequest::where('user_id', $user->id)
            ->where('token', $request->token)
            ->where('is_used', false)
            ->first();

        if (! $changeRequest) {
            return response()->json([
                'message' => 'Active verification request not found. Please initiate a new password change.',
                'errors' => [
                    'otp' => ['Active verification request not found.'],
                ],
            ], 422);
        }

        if ($changeRequest->isExpired()) {
            return response()->json([
                'message' => 'The verification request has expired. Please initiate a new password change.',
                'errors' => [
                    'otp' => ['The verification request has expired.'],
                ],
            ], 422);
        }

        if ($changeRequest->resend_count >= 3) {
            return response()->json([
                'message' => 'OTP resend limit reached. For security purposes, please start a new password change request.',
                'errors' => [
                    'otp' => ['OTP resend limit reached. Please start a new request.'],
                ],
            ], 422);
        }

        if ($changeRequest->resend_available_at && $changeRequest->resend_available_at->isFuture()) {
            $seconds = (int) now()->diffInSeconds($changeRequest->resend_available_at, false);
            return response()->json([
                'message' => "Please wait {$seconds} seconds before requesting a new code.",
                'resend_available_in' => $seconds,
                'errors' => [
                    'otp' => ["Please wait {$seconds} seconds before requesting another code."],
                ],
            ], 429);
        }

        // Generate fresh OTP, invalidate previous OTP, reset attempt counter
        $newOtp = sprintf('%06d', random_int(100000, 999999));
        $newExpiresAt = now()->addMinutes(10);
        $newResendAvailableAt = now()->addSeconds(60);

        $changeRequest->update([
            'otp_hash' => Hash::make($newOtp),
            'attempts' => 0,
            'expires_at' => $newExpiresAt,
            'resend_count' => $changeRequest->resend_count + 1,
            'resend_available_at' => $newResendAvailableAt,
        ]);

        try {
            $user->notify(new PasswordChangeOtpNotification($newOtp, 10));
        } catch (\Throwable $e) {
            Log::error('Failed to resend password change OTP: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'email' => $user->email,
                'exception' => $e,
            ]);

            return response()->json([
                'message' => 'Email delivery failure. Unable to resend verification code. Please try again later.',
                'errors' => [
                    'otp' => ['Email delivery failure. Unable to resend verification code.'],
                ],
            ], 500);
        }

        return response()->json([
            'success' => true,
            'resend_available_in' => 60,
            'expires_at' => $newExpiresAt->toISOString(),
            'message' => 'A new 6-digit verification code has been sent to your registered email.',
        ]);
    }

    /**
     * Mask an email address for safe frontend presentation.
     */
    protected function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return $email;
        }

        $name = $parts[0];
        $domain = $parts[1];

        if (strlen($name) <= 2) {
            $maskedName = substr($name, 0, 1) . '***';
        } else {
            $maskedName = substr($name, 0, 1) . str_repeat('*', min(5, max(2, strlen($name) - 2))) . substr($name, -1);
        }

        return $maskedName . '@' . $domain;
    }
}
