<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        try {
            $request->user()->sendEmailVerificationNotification();
        } catch (\Throwable $e) {
            Log::error('Failed to send email verification notification: '.$e->getMessage(), [
                'user_id' => $request->user()->id,
                'email' => $request->user()->email,
                'exception' => $e,
            ]);

            return back()->with('error', 'Unable to send verification email. Please check server mailer configuration or try again later.');
        }

        return back()->with('status', 'verification-link-sent');
    }
}
