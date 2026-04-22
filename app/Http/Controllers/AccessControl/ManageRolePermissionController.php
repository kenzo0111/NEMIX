<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ManageRolePermissionController extends Controller
{
    public function index(): Response
    {
        $this->ensureRoutePermissionsExist();

        $roles = Role::with('permissions')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('id')->toArray(),
                'permissions_count' => $role->permissions->count(),
            ]);

        $permissions = Permission::orderBy('name')
            ->get()
            ->map(fn (Permission $permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'module' => $this->permissionModule($permission->name),
            ]);

        return Inertia::render('AccessControl/ManageRolePermission', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    private function ensureRoutePermissionsExist(): void
    {
        $routeNames = collect(Route::getRoutes()->getRoutes())
            ->map(fn ($route) => $route->getName())
            ->filter()
            ->unique()
            ->reject(fn ($routeName) => $this->shouldSkipRoute($routeName) || str_starts_with($routeName, 'api.'))
            ->map(fn ($routeName) => 'route:' . $routeName)
            ->values();

        $systemAdmin = Role::firstOrCreate(['name' => 'System Admin']);

        $existingRoutePermissions = Permission::whereIn('name', $routeNames)->pluck('name')->all();
        $missingRoutePermissions = $routeNames->diff($existingRoutePermissions);

        foreach ($missingRoutePermissions as $permissionName) {
            Permission::create(['name' => $permissionName]);
        }

        if ($routeNames->isNotEmpty()) {
            $systemAdmin->givePermissionTo($routeNames->all());
        }
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
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role = Role::create(['name' => $validated['name']]);
        $role->syncPermissions($validated['permissions'] ?? []);

        return back()->with('success', 'Role created successfully.');
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name,' . $role->id],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role->update(['name' => $validated['name']]);
        $role->syncPermissions($validated['permissions'] ?? []);

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        $role->delete();

        return back()->with('success', 'Role deleted successfully.');
    }

    private function permissionModule(string $permissionName): string
    {
        if (str_starts_with($permissionName, 'route:')) {
            $routeName = str_replace('route:', '', $permissionName);
            $section = explode('.', $routeName)[0];

            return match ($section) {
                'dashboard' => 'Dashboard',
                'compliance' => 'Compliance',
                'inventory' => 'Inventory',
                'acquisition' => 'Acquisition',
                'audit-logs' => 'Audit Logs',
                'access-control' => 'Access Control',
                'suppliers' => 'Suppliers',
                'rfid-scanner' => 'RFID Scanner',
                default => 'General',
            };
        }

        $name = strtolower($permissionName);

        return match (true) {
            str_contains($name, 'user') => 'User Management',
            str_contains($name, 'role') => 'Access Control',
            str_contains($name, 'inventory') => 'Inventory',
            str_contains($name, 'audit') => 'Audit Logs',
            str_contains($name, 'system') => 'System',
            str_contains($name, 'supplier') => 'Suppliers',
            default => 'General',
        };
    }
}
