<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PasswordChangeRequest;
use App\Notifications\PasswordChangedSecurityNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
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

            if (! $record || $record->isExpired() || $record->isMaxAttemptsExceeded()) {
                return back()->withErrors(['otp' => 'Invalid or expired OTP verification code.']);
            }
            if (! Hash::check($request->otp, $record->otp_hash)) {
                $record->increment('attempts');
                return back()->withErrors(['otp' => 'Invalid or expired OTP verification code.']);
            }
            $validated = $request->validate(['password' => ['required', Password::defaults(), 'confirmed']]);
            $changed = DB::transaction(function () use ($record, $user, $validated): bool {
                $claimed = PasswordChangeRequest::whereKey($record->id)
                    ->where('is_used', false)
                    ->where('attempts', '<', $record->max_attempts)
                    ->where('expires_at', '>', now())
                    ->delete();
                if ($claimed !== 1) {
                    return false;
                }
                $user->update(['password' => Hash::make($validated['password'])]);
                return true;
            });
            if (! $changed) {
                return back()->withErrors(['otp' => 'Invalid or expired OTP verification code.']);
            }

            try {
                $user->notify(new PasswordChangedSecurityNotification($request->ip()));
            } catch (\Throwable $e) {
                Log::warning('Failed to send password changed notification', ['exception_type' => get_class($e)]);
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
