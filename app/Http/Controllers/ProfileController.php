<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $user->loadMissing('roles');

        $roleName = $user->roles->first()?->name ?? ($user->role ?? 'Supply Officer');
        $rolesList = $user->getRoleNames()->toArray();

        // Retrieve last login & login history from AuditLogs module if available
        $lastLogin = null;
        $loginHistory = [];
        if (class_exists(\Modules\AuditLogs\Models\LoginTrail::class)) {
            try {
                $lastLoginRecord = \Modules\AuditLogs\Models\LoginTrail::where('user_id', $user->id)
                    ->where('status', 'Success')
                    ->latest('created_at')
                    ->first();

                if ($lastLoginRecord) {
                    $lastLogin = [
                        'time_ago' => $lastLoginRecord->created_at ? $lastLoginRecord->created_at->diffForHumans() : 'Recently',
                        'timestamp' => $lastLoginRecord->created_at ? $lastLoginRecord->created_at->format('M d, Y h:i A') : '',
                        'ip_address' => $lastLoginRecord->ip_address ?? '127.0.0.1',
                        'user_agent' => $lastLoginRecord->user_agent ?? 'Unknown browser',
                    ];
                }

                $loginHistory = \Modules\AuditLogs\Models\LoginTrail::where('user_id', $user->id)
                    ->latest('created_at')
                    ->take(5)
                    ->get()
                    ->map(function ($trail) {
                        return [
                            'id' => $trail->id,
                            'status' => $trail->status,
                            'ip_address' => $trail->ip_address ?? '127.0.0.1',
                            'user_agent' => $trail->user_agent ?? 'Browser session',
                            'time_ago' => $trail->created_at ? $trail->created_at->diffForHumans() : 'Recently',
                            'timestamp' => $trail->created_at ? $trail->created_at->format('M d, Y h:i A') : '',
                        ];
                    })
                    ->values()
                    ->toArray();
            } catch (\Throwable $e) {
                // Ignore audit trail retrieval errors gracefully
            }
        }

        // Active sessions if database session driver is configured
        $activeSessions = [];
        try {
            if (config('session.driver') === 'database' && Schema::hasTable('sessions')) {
                $currentSessionId = $request->session()->getId();
                $activeSessions = DB::table('sessions')
                    ->where('user_id', $user->id)
                    ->orderByDesc('last_activity')
                    ->get()
                    ->map(function ($session) use ($currentSessionId) {
                        return [
                            'id' => $session->id,
                            'ip_address' => $session->ip_address ?? '127.0.0.1',
                            'user_agent' => $session->user_agent ?? 'Web Browser',
                            'is_current' => $session->id === $currentSessionId,
                            'last_active' => Carbon::createFromTimestamp($session->last_activity)->diffForHumans(),
                        ];
                    })
                    ->values()
                    ->toArray();
            }
        } catch (\Throwable $e) {
            // Ignore session table queries in non-database session environments
        }

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username ?? Str::before($user->email, '@'),
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at ? $user->email_verified_at->format('F d, Y') : null,
                'role' => $roleName,
                'roles' => $rolesList,
                'is_active' => (bool) $user->is_active,
                'account_status' => $user->is_active ? 'Active' : 'Inactive',
                'created_at_formatted' => $user->created_at ? $user->created_at->format('F d, Y') : 'System Initial Setup',
                'created_at_diff' => $user->created_at ? $user->created_at->diffForHumans() : null,
                'last_login' => $lastLogin,
                'login_history' => $loginHistory,
                'active_sessions' => $activeSessions,
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        // Enforce backend security: disallow users from deactivating, disabling, or modifying their own account status
        if ($request->has('is_active') || $request->has('status')) {
            $requestedActive = $request->input('is_active');
            $requestedStatus = strtolower((string) $request->input('status'));
            if ($requestedActive === false || $requestedActive === 0 || $requestedActive === '0' || in_array($requestedStatus, ['disabled', 'inactive', 'suspended', 'locked'])) {
                return back()->with('error', 'You cannot disable, deactivate, or lock your own account.');
            }
        }

        $user = $request->user();
        $validated = $request->validated();

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return Redirect::route('profile.edit')->with('success', 'Profile information updated successfully.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
