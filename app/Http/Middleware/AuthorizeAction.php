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
        if (in_array($request->method(), ['GET', 'HEAD'], true)) {
            return $next($request);
        }

        $user = $request->user();
        $route = $request->route();

        if (! $user || ! $route) {
            return $next($request);
        }

        $routeName = $route->getName();

        if (! $routeName || $this->shouldSkipRoute($routeName)) {
            return $next($request);
        }

        // Fast-path: System Admin bypasses all checks without permission creation
        if (method_exists($user, 'isSystemAdmin') ? $user->isSystemAdmin() : $user->hasRole('System Admin')) {
            return $next($request);
        }

        $permissionName = $this->routePermissionName($routeName);
        $this->ensurePermissionExists($permissionName);

        try {
            if ($user->hasPermissionTo($permissionName)) {
                return $next($request);
            }
        } catch (\Spatie\Permission\Exceptions\PermissionDoesNotExist $e) {
            abort(403);
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
        ]);
    }

    private function routePermissionName(string $routeName): string
    {
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
