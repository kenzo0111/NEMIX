<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
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

        // Here we will attempt to reset the user's password. If it is successful we
        // will update the password on an actual user model and persist it to the
        // database. Otherwise we will parse the error and return the response.
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user) use ($request) {
                $user->forceFill([
                    'password' => Hash::make($request->password),
                    'is_active' => true,
                    'remember_token' => Str::random(60),
                ])->save();

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
}
