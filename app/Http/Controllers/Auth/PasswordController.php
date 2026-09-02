<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PasswordChangeRequest;
use App\Notifications\PasswordChangedSecurityNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        // If OTP token and code are provided, verify and update
        if ($request->filled(['token', 'otp'])) {
            $user = $request->user();
            $record = PasswordChangeRequest::where('user_id', $user->id)
                ->where('token', $request->token)
                ->where('is_used', false)
                ->first();

            if (! $record || $record->isExpired() || ! Hash::check($request->otp, $record->otp_hash)) {
                return back()->withErrors(['otp' => 'Invalid or expired OTP verification code.']);
            }

            $rawNewPassword = Crypt::decryptString($record->pending_password);
            $user->update([
                'password' => Hash::make($rawNewPassword),
            ]);

            $record->update([
                'is_used' => true,
                'used_at' => now(),
                'pending_password' => null,
            ]);

            try {
                $user->notify(new PasswordChangedSecurityNotification($request->ip()));
            } catch (\Throwable $e) {
                Log::warning('Failed to send password changed notification: ' . $e->getMessage());
            }

            return back()->with('status', 'password-updated');
        }

        // Direct password updates without OTP are prohibited
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        return back()->withErrors([
            'current_password' => 'Password updates require email OTP verification before changes take effect.',
        ]);
    }
}
