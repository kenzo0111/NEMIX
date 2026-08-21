<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        if ($user) {
            $user->loadMissing('roles');
            $userArray = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'is_active' => (bool) $user->is_active,
                'role' => $user->roles->first()?->name ?? 'Supply Officer',
                'roles' => $user->getRoleNames()->toArray(),
            ];
        } else {
            $userArray = null;
        }

        $isSystemAdmin = $user && (
            $user->hasRole('System Admin') ||
            $user->hasRole('System Administrator') ||
            ($user->role ?? null) === 'System Admin' ||
            ($user->role ?? null) === 'System Administrator'
        );

        $sysConfig = \App\Models\SystemConfiguration::current();
        $sysConfig->loadMissing('changedBy');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userArray,
                'permissions' => $request->user()?->getPermissionNames()->toArray() ?? [],
                'is_system_admin' => $isSystemAdmin,
            ],
            'system' => [
                'mode' => $sysConfig->active_mode,
                'previous_mode' => $sysConfig->previous_mode,
                'env' => $sysConfig->environment,
                'status' => $sysConfig->status,
                'server_node' => $sysConfig->server_node,
                'ping_ms' => $sysConfig->ping_ms,
                'security_status' => $sysConfig->security_status,
                'changed_by' => $sysConfig->changedBy?->name ?? ($sysConfig->changed_by_user_id ? 'Administrator' : 'System Administrator'),
                'changed_at' => $sysConfig->changed_at ? $sysConfig->changed_at->diffForHumans() : 'Initial System Setup',
                'changed_at_iso' => $sysConfig->changed_at ? $sysConfig->changed_at->toIso8601String() : null,
                'change_reason' => $sysConfig->change_reason,
                'version' => 'v2.4.0-Enterprise',
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}

