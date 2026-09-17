<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\StaffRegistrationInvitation;
use App\Services\AccessControl\PermissionResolver;
use Illuminate\Auth\Passwords\PasswordBroker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class ManageStaffController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('users.view');

        $currentUser = $request->user();

        $staffs = User::query()
            ->with('roles:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->isSystemAdmin() ? 'System Admin' : ($user->roles->first()?->name ?? 'No Role'),
                'status' => $user->is_active ? 'Active' : 'Disabled',
                'email_verified' => ! is_null($user->email_verified_at),
                'is_system_admin' => $user->isSystemAdmin(),
            ]);

        // Server-side filtering: Non-System Admins never receive protected roles
        $roles = PermissionResolver::getAssignableRolesQuery($currentUser)
            ->pluck('name')
            ->values();

        return Inertia::render('AccessControl/ManageStaffs', [
            'staffs' => $staffs,
            'roles' => $roles,
            'capabilities' => [
                'canCreate' => $currentUser->can('users.create'),
                'canUpdate' => $currentUser->can('users.update'),
                'canToggleStatus' => $currentUser->can('users.manage-status'),
                'canResendInvitation' => $currentUser->can('users.create'),
                'canAssignRole' => $currentUser->can('users.assign-role'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('users.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        // Prevent assigning protected System Admin role by lower-privileged users
        if (PermissionResolver::isProtectedRole($validated['role']) && ! $request->user()->isSystemAdmin()) {
            abort(403, 'Unauthorized action. You cannot assign administrative privileges.');
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make(Str::random(24)),
            'is_active' => false,
        ]);

        $user->syncRoles([$validated['role']]);
        PermissionResolver::clearPermissionCache();

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

    public function resendInvitation(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('users.create');

        // Prevent privileged invitation tampering
        if ($user->isSystemAdmin() && ! $request->user()->isSystemAdmin()) {
            abort(403, 'Unauthorized action. You cannot resend invitations for System Administrator accounts.');
        }

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
        Gate::authorize('users.update');

        $currentUser = $request->user();

        // Non-System Admin cannot modify a System Admin account
        if ($user->isSystemAdmin() && ! $currentUser->isSystemAdmin()) {
            abort(403, 'Unauthorized action. You cannot modify a System Administrator account.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $currentRole = $user->roles->first()?->name ?? '';

        // Non-System Admin cannot assign protected System Admin role
        if (PermissionResolver::isProtectedRole($validated['role']) && ! $currentUser->isSystemAdmin()) {
            abort(403, 'Unauthorized action. You cannot assign administrative privileges.');
        }

        // Prohibit modifying own role unless System Admin
        if ($user->id === $currentUser->id && $validated['role'] !== $currentRole && ! $currentUser->isSystemAdmin()) {
            abort(403, 'Unauthorized action. You cannot modify your own role.');
        }

        // Modifying target role requires users.assign-role permission
        if ($validated['role'] !== $currentRole && ! $currentUser->isSystemAdmin() && ! $currentUser->can('users.assign-role')) {
            abort(403, 'Unauthorized action. Permission users.assign-role required to modify staff roles.');
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $user->syncRoles([$validated['role']]);
        PermissionResolver::clearPermissionCache();

        return back()->with('success', 'Staff account updated successfully.');
    }

    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('users.manage-status');

        $currentUser = $request->user();

        if ($user->id === $currentUser->id) {
            return back()->with('error', 'You cannot disable your own account.');
        }

        // Non-System Admin cannot deactivate a System Admin account
        if ($user->isSystemAdmin() && ! $currentUser->isSystemAdmin()) {
            abort(403, 'Unauthorized action. You cannot deactivate a System Administrator account.');
        }

        $user->update([
            'is_active' => ! $user->is_active,
        ]);

        if (! $user->is_active) {
            if (\Illuminate\Support\Facades\Schema::hasTable('sessions')) {
                \Illuminate\Support\Facades\DB::table('sessions')
                    ->where('user_id', $user->id)
                    ->delete();
            }

            if (\Illuminate\Support\Facades\Schema::hasTable('personal_access_tokens')) {
                \Illuminate\Support\Facades\DB::table('personal_access_tokens')
                    ->where('tokenable_type', $user->getMorphClass())
                    ->where('tokenable_id', $user->id)
                    ->delete();
            }
        }

        PermissionResolver::clearPermissionCache();

        $action = $user->is_active ? 'enabled' : 'disabled';
        return back()->with('success', "User account {$action} successfully.");
    }
}
