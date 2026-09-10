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
        $isSystemAdmin = (bool) ($user && method_exists($user, 'isSystemAdmin') ? $user->isSystemAdmin() : false);

        if ($user) {
            $user->loadMissing('roles');
            $primaryRole = $user->roles->first()?->name ?? (is_string($user->role ?? null) ? $user->role : 'Supply Officer');
            $userArray = [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username ?? \Illuminate\Support\Str::before($user->email, '@'),
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'is_active' => (bool) $user->is_active,
                'role' => $primaryRole,
                'primary_role' => $primaryRole,
                'roles' => $user->getRoleNames()->toArray(),
                'created_at' => $user->created_at?->toIso8601String(),
                'created_at_formatted' => $user->created_at?->format('F d, Y'),
            ];

            $userPermissions = [];
            try {
                $userPermissions = $user->getAllPermissions()->pluck('name')->all();
            } catch (\Throwable $e) {
                $userPermissions = $user->getPermissionNames()->toArray();
            }

            $hasPerm = function (string $routeName, bool $default = false) use ($isSystemAdmin, $user, $userPermissions) {
                if ($isSystemAdmin) {
                    return true;
                }
                if (in_array('route:' . $routeName, $userPermissions, true) || in_array($routeName, $userPermissions, true)) {
                    return true;
                }
                try {
                    if ($user->hasPermissionTo('route:' . $routeName) || $user->hasPermissionTo($routeName)) {
                        return true;
                    }
                } catch (\Throwable $e) {
                    // Fallback if permission not yet in database
                }
                return $default;
            };

            // Non-admin operational staff fallback if no route permissions seeded yet
            $hasAnyConfiguredPerms = count($userPermissions) > 0;
            $defaultForStaff = ! $hasAnyConfiguredPerms;

            $capabilities = [
                'dashboard' => true,
                'inventory' => [
                    'view' => $hasPerm('inventory.index', $defaultForStaff),
                    'receiving' => $hasPerm('inventory.receiving', $defaultForStaff),
                    'issuance' => $hasPerm('inventory.issuance', $defaultForStaff),
                ],
                'rfid' => [
                    'view' => $hasPerm('rfid-scanner.index', $defaultForStaff),
                ],
                'suppliers' => [
                    'view' => $hasPerm('suppliers.index', $defaultForStaff),
                ],
                'compliance' => [
                    'reports' => $hasPerm('compliance.reports', $defaultForStaff),
                    'analytics' => $hasPerm('compliance.analytics', $defaultForStaff),
                ],
                'audit' => [
                    'login' => $hasPerm('audit-logs.login-trails', false),
                    'transactions' => $hasPerm('audit-logs.transaction-trails', false),
                ],
                'accessControl' => [
                    'roles' => $isSystemAdmin || $hasPerm('access-control.role-permission', false),
                    'staff' => $isSystemAdmin || $hasPerm('access-control.staffs', false),
                ],
                'systemSettings' => $isSystemAdmin || $hasPerm('system.settings.index', false),
            ];
        } else {
            $userArray = null;
            $capabilities = null;
        }

        $sysConfig = \App\Models\SystemConfiguration::current();
        $sysConfig->loadMissing('changedBy');

        $publicSettings = [];
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('system_settings')) {
                $publicSettings = \App\Models\SystemSetting::getPublicSettings();
            }
        } catch (\Throwable $e) {
            // Fallback gracefully if table not yet migrated
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userArray,
                'permissions' => $request->user()?->getPermissionNames()->toArray() ?? [],
                'is_system_admin' => $isSystemAdmin,
                'capabilities' => $capabilities,
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
                'settings' => $publicSettings,
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

