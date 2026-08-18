<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use App\Notifications\StaffRegistrationInvitation;
use App\Models\User;
use Illuminate\Auth\Passwords\PasswordBroker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class ManageStaffController extends Controller
{
    public function index(): Response
    {
        $staffs = User::query()
            ->with('roles:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name ?? 'Unassigned',
                'status' => $user->is_active ? 'Active' : 'Inactive',
                'email_verified' => ! is_null($user->email_verified_at),
            ]);

        $roles = Role::query()
            ->orderBy('name')
            ->pluck('name')
            ->values();

        return Inertia::render('AccessControl/ManageStaffs', [
            'staffs' => $staffs,
            'roles' => $roles,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make(Str::random(24)),
            'is_active' => false,
        ]);

        $user->assignRole($validated['role']);

        $mailSent = true;
        try {
            /** @var PasswordBroker $passwordBroker */
            $passwordBroker = Password::broker();
            $token = $passwordBroker->createToken($user);
            $user->notify(new StaffRegistrationInvitation($token));
        } catch (\Throwable $e) {
            Log::error('Failed to send staff invitation email: '.$e->getMessage(), [
                'user_id' => $user->id,
                'email' => $user->email,
                'exception' => $e,
            ]);
            $mailSent = false;
        }

        if (! $mailSent) {
            return back()->with('warning', 'Staff account created for '.$user->email.', but the invitation email could not be sent due to a mail server configuration error. You can resend the invitation once mailer settings are configured.');
        }

        return back()->with('success', 'Staff invitation sent to '.$user->email.'.');
    }

    public function resendInvitation(User $user): RedirectResponse
    {
        try {
            /** @var PasswordBroker $passwordBroker */
            $passwordBroker = Password::broker();
            $token = $passwordBroker->createToken($user);
            $user->notify(new StaffRegistrationInvitation($token));
        } catch (\Throwable $e) {
            Log::error('Failed to resend staff invitation email: '.$e->getMessage(), [
                'user_id' => $user->id,
                'email' => $user->email,
                'exception' => $e,
            ]);

            return back()->with('error', 'Could not send invitation email. Please check server mailer configuration settings.');
        }

        return back()->with('success', 'Invitation email resent to '.$user->email.'.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $user->syncRoles([$validated['role']]);

        return back();
    }

    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot deactivate your own logged-in account.');
        }

        $user->update([
            'is_active' => ! $user->is_active,
        ]);

        return back()->with('success', 'User account status updated.');
    }
}
