<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    /**
     * Display the password reset view.
     */
    public function create(Request $request): Response
    {
        $this->ensureValidLink($request, false);

        return Inertia::render('Auth/ResetPassword', [
            'email' => $request->email,
            'token' => $request->route('token'),
            'mode' => 'reset',
        ]);
    }

    /**
     * Display the invitation registration view.
     */
    public function createFromInvitation(Request $request): Response
    {
        $this->ensureValidLink($request, true);

        return Inertia::render('Auth/Register', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Handle an incoming new password request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        return $this->handlePasswordSetup($request, false);
    }

    /**
     * Handle an invitation-based registration password setup request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function storeFromInvitation(Request $request): RedirectResponse
    {
        return $this->handlePasswordSetup($request, true);
    }

    /**
     * Handle password setup for both reset and invitation registration flows.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    private function handlePasswordSetup(Request $request, bool $isInvitationFlow): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::where('email', $request->email)->first();
        if (! $user || ($isInvitationFlow ? $user->is_active : ! $user->is_active)) {
            throw ValidationException::withMessages([
                'email' => ['This link is invalid or no longer available. Please request a new one.'],
            ]);
        }

        // Here we will attempt to reset the user's password. If it is successful we
        // will update the password on an actual user model and persist it to the
        // database. Otherwise we will parse the error and return the response.
        $status = Password::broker($isInvitationFlow ? 'staff_invitations' : null)->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user) use ($request, $isInvitationFlow) {
                $userData = [
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ];

                if ($isInvitationFlow) {
                    $userData['is_active'] = true;
                }

                if ($request->filled('name')) {
                    $userData['name'] = $request->string('name')->trim()->value();
                }

                if ($isInvitationFlow && is_null($user->email_verified_at)) {
                    $userData['email_verified_at'] = now();
                }

                $user->forceFill($userData)->save();

                event(new PasswordReset($user));
            }
        );

        // If the password was successfully reset, we will redirect the user back to
        // the application's home authenticated view. If there is an error we can
        // redirect them back to where they came from with their error message.
        if ($status == Password::PASSWORD_RESET) {
            $successMessage = $isInvitationFlow
                ? 'Successfully registered, please proceed to login.'
                : 'Your password has been reset.';

            return redirect()->route('login')->with('status', $successMessage);
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }

    private function ensureValidLink(Request $request, bool $isInvitationFlow): void
    {
        $email = $request->query('email');
        $token = $request->route('token');
        $user = is_string($email) ? User::where('email', $email)->first() : null;

        if (! $user || ! is_string($token)
            || ($isInvitationFlow ? $user->is_active : ! $user->is_active)
            || ! Password::broker($isInvitationFlow ? 'staff_invitations' : null)->tokenExists($user, $token)) {
            abort(410, $isInvitationFlow
                ? 'This invitation has expired or has already been used. Ask an administrator to resend it.'
                : 'This password reset link has expired or has already been used. Request a new reset email.');
        }
    }
}
