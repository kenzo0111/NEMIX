<?php

namespace App\Services\AccessControl;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionResolver
{
    /**
     * Map of standardized permissions to their legacy and route aliases.
     *
     * @var array<string, list<string>>
     */
    protected const PERMISSION_ALIASES = [
        // Staff / Users
        'users.view' => [
            'users.view',
            'access-control.staffs',
            'route:access-control.staffs',
        ],
        'users.create' => [
            'users.create',
            'access-control.staffs.store',
            'route:access-control.staffs.store',
            'access-control.staffs.resend-invitation',
            'route:access-control.staffs.resend-invitation',
        ],
        'users.update' => [
            'users.update',
            'access-control.staffs.update',
            'route:access-control.staffs.update',
        ],
        'users.manage-status' => [
            'users.manage-status',
            'access-control.staffs.toggle-status',
            'route:access-control.staffs.toggle-status',
        ],
        'users.assign-role' => [
            'users.assign-role',
            'users.update',
            'access-control.staffs.update',
            'route:access-control.staffs.update',
        ],

        // Roles
        'roles.view' => [
            'roles.view',
            'access-control.role-permission',
            'route:access-control.role-permission',
        ],
        'roles.create' => [
            'roles.create',
            'access-control.role-permission.store',
            'route:access-control.role-permission.store',
        ],
        'roles.update' => [
            'roles.update',
            'access-control.role-permission.update',
            'route:access-control.role-permission.update',
        ],
        'roles.delete' => [
            'roles.delete',
            'access-control.role-permission.destroy',
            'route:access-control.role-permission.destroy',
        ],

        // Permissions
        'permissions.view' => [
            'permissions.view',
            'roles.view',
            'access-control.role-permission',
            'route:access-control.role-permission',
        ],
        'permissions.assign' => [
            'permissions.assign',
            'roles.update',
            'access-control.role-permission.update',
            'route:access-control.role-permission.update',
        ],
        'permissions.revoke' => [
            'permissions.revoke',
            'roles.update',
            'access-control.role-permission.update',
            'route:access-control.role-permission.update',
        ],

        // Access Control Overview
        'access-control.view' => [
            'access-control.view',
            'users.view',
            'roles.view',
            'access-control.staffs',
            'route:access-control.staffs',
            'access-control.role-permission',
            'route:access-control.role-permission',
        ],

        // Audit Logs
        'audit-logs.view-global' => [
            'audit-logs.view-global',
            'audit-logs.login-trails',
            'route:audit-logs.login-trails',
            'audit-logs.transaction-trails',
            'route:audit-logs.transaction-trails',
        ],
        'audit-logs.transaction-trails' => [
            'audit-logs.transaction-trails',
            'route:audit-logs.transaction-trails',
            'audit-logs.view-global',
        ],
        'audit-logs.login-trails' => [
            'audit-logs.login-trails',
            'route:audit-logs.login-trails',
            'audit-logs.view-global',
        ],

        // RFID Hardware & Scanner
        'rfid.view' => [
            'rfid.view',
            'rfid-scanner.index',
            'route:rfid-scanner.index',
            'rfid-scanner.status',
            'route:rfid-scanner.status',
            'rfid-scanner.lookup',
            'route:rfid-scanner.lookup',
            'rfid-scanner.live-feed',
            'route:rfid-scanner.live-feed',
        ],
        'rfid.assign' => [
            'rfid.assign',
            'rfid-scanner.assign',
            'route:rfid-scanner.assign',
        ],
        'rfid.unassign' => [
            'rfid.unassign',
            'rfid-scanner.unassign',
            'route:rfid-scanner.unassign',
        ],
    ];

    /**
     * Protected role names that require System Admin privileges.
     *
     * @var list<string>
     */
    protected const PROTECTED_ROLES = [
        'system admin',
        'system administrator',
    ];

    /**
     * Check if a role name or Role instance is a protected System Admin role.
     */
    public static function isProtectedRole(Role|string $role): bool
    {
        $roleName = $role instanceof Role ? $role->name : $role;
        $normalized = strtolower(trim($roleName));

        return in_array($normalized, self::PROTECTED_ROLES, true);
    }

    /**
     * Get all aliases for a given permission ability.
     *
     * @return list<string>
     */
    public static function getAliases(string $ability): array
    {
        $ability = trim($ability);

        $matches = [$ability];

        if (isset(self::PERMISSION_ALIASES[$ability])) {
            $matches = array_merge($matches, self::PERMISSION_ALIASES[$ability]);
        }

        // Check reverse lookup if an alias was provided directly
        foreach (self::PERMISSION_ALIASES as $standard => $aliases) {
            if (in_array($ability, $aliases, true)) {
                $matches = array_merge($matches, [$standard], $aliases);
            }
        }

        // Automatic route prefix bidirectional resolution
        $expanded = [];
        foreach ($matches as $match) {
            $expanded[] = $match;
            if (str_starts_with($match, 'route:')) {
                $expanded[] = substr($match, 6);
            } else {
                $expanded[] = 'route:' . $match;
            }
        }

        return array_values(array_unique($expanded));
    }

    /**
     * Determine if a user possesses the requested permission or any of its aliases.
     */
    public static function hasPermission(User $user, string $ability): bool
    {
        if ($user->isSystemAdmin()) {
            return true;
        }

        $aliases = self::getAliases($ability);

        try {
            $userPermissions = $user->getAllPermissions()->pluck('name')->all();

            foreach ($aliases as $alias) {
                if (in_array($alias, $userPermissions, true)) {
                    return true;
                }
            }
        } catch (\Throwable $e) {
            // Fallback to direct Spatie check
            foreach ($aliases as $alias) {
                try {
                    if ($user->hasPermissionTo($alias)) {
                        return true;
                    }
                } catch (\Throwable $ignored) {
                    continue;
                }
            }
        }

        return false;
    }

    /**
     * Resolve and return all effective permissions for a user including aliases.
     *
     * @return list<string>
     */
    public static function resolveEffectivePermissions(?User $user): array
    {
        if (! $user) {
            return [];
        }

        if ($user->isSystemAdmin()) {
            // System Admin has all permissions plus all standard keys
            $allPerms = Permission::pluck('name')->all();
            $expanded = array_merge($allPerms, array_keys(self::PERMISSION_ALIASES));

            return array_values(array_unique($expanded));
        }

        try {
            $rawPermissions = $user->getAllPermissions()->pluck('name')->all();
        } catch (\Throwable $e) {
            $rawPermissions = $user->getPermissionNames()->toArray();
        }

        $effective = $rawPermissions;

        foreach (self::PERMISSION_ALIASES as $standard => $aliases) {
            foreach ($aliases as $alias) {
                if (in_array($alias, $rawPermissions, true)) {
                    $effective[] = $standard;
                    $effective = array_merge($effective, $aliases);
                    break;
                }
            }
        }

        return array_values(array_unique($effective));
    }

    /**
     * Return assignable roles builder filtered for the current user.
     * Non-System Admins can never assign protected system roles.
     */
    public static function getAssignableRolesQuery(User $user): Builder
    {
        $query = Role::query()->orderBy('name');

        if (! $user->isSystemAdmin()) {
            $query->whereNotIn('name', ['System Admin', 'System Administrator']);
        }

        return $query;
    }

    /**
     * Ensure a user does not assign permissions to a role that the user does not possess.
     *
     * @param  list<int>  $requestedPermissionIds
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public static function validatePermissionSubset(User $user, array $requestedPermissionIds): void
    {
        if ($user->isSystemAdmin()) {
            return;
        }

        $userPermIds = $user->getAllPermissions()->pluck('id')->all();
        $unauthorizedIds = array_diff($requestedPermissionIds, $userPermIds);

        if (! empty($unauthorizedIds)) {
            abort(403, 'Unauthorized action. You cannot grant permissions that you do not possess.');
        }
    }

    /**
     * Clear Spatie permission cache.
     */
    public static function clearPermissionCache(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
