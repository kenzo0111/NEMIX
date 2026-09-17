<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\Response;

class AuthorizeAction
{
    protected static array $verifiedPermissions = [];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $route = $request->route();

        if (! $user || ! $route) {
            return $next($request);
        }

        $routeName = $route->getName();

        if (! $routeName || $this->shouldSkipRoute($routeName)) {
            return $next($request);
        }

        if ($routeName === 'dashboard') {
            return $next($request);
        }

        // Fast-path: System Admin bypasses all checks without permission creation
        if ((method_exists($user, 'isSystemAdmin') && $user->isSystemAdmin())
            || $user->hasAnyRole(['System Admin', 'System Administrator'])) {
            return $next($request);
        }

        $permissionName = $this->routePermissionName($routeName);
        $this->ensurePermissionExists($permissionName);

        if (\App\Services\AccessControl\PermissionResolver::hasPermission($user, $permissionName)
            || \App\Services\AccessControl\PermissionResolver::hasPermission($user, $routeName)
            || \App\Services\AccessControl\PermissionResolver::hasPermission($user, 'route:' . $routeName)) {
            return $next($request);
        }

        abort(403);
    }

    private function shouldSkipRoute(string $routeName): bool
    {
        return Str::startsWith($routeName, [
            'login',
            'logout',
            'register',
            'password.',
            'verification.',
            'sanctum.',
            'telescope.',
            'profile.',
            'account.settings',
        ]);
    }

    private function routePermissionName(string $routeName): string
    {
        $rfidPermissions = [
            'rfid-scanner.index' => 'rfid.view',
            'rfid-scanner.status' => 'rfid.view',
            'rfid-scanner.lookup' => 'rfid.view',
            'rfid-scanner.live-feed' => 'rfid.view',
            'rfid-scanner.assign' => 'rfid.assign',
            'rfid-scanner.unassign' => 'rfid.unassign',
            'audit-logs.login-trails' => 'audit-logs.login-trails',
            'audit-logs.transaction-trails' => 'audit-logs.transaction-trails',
        ];

        if (isset($rfidPermissions[$routeName])) {
            return $rfidPermissions[$routeName];
        }

        return 'route:' . $routeName;
    }

    private function ensurePermissionExists(string $permissionName): void
    {
        if (isset(self::$verifiedPermissions[$permissionName]) && ! app()->environment('testing')) {
            return;
        }

        $permission = Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => 'web']);

        $systemAdmin = Role::where('name', 'System Admin')->first();

        if ($systemAdmin && ! $systemAdmin->hasPermissionTo($permissionName)) {
            $systemAdmin->givePermissionTo($permissionName);
        }

        self::$verifiedPermissions[$permissionName] = true;
    }
}
