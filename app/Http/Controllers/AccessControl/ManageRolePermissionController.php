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
        $user = request()->user();
        if (! $user?->hasRole('System Admin') && ! $user?->hasRole('System Administrator')) {
            abort(403, 'Unauthorized action. System Admin access required.');
        }

        $this->ensureRoutePermissionsExist();

        $roles = Role::with('permissions')
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(function (Role $role) {
                $isSystem = $this->isProtectedRole($role);
                $usersCount = (int) ($role->users_count ?? 0);

                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('id')->toArray(),
                    'permissions_count' => $role->permissions->count(),
                    'is_system' => $isSystem,
                    'is_deletable' => ! $isSystem && $usersCount === 0,
                    'is_editable' => true,
                    'users_count' => $usersCount,
                ];
            });

        $permissions = Permission::orderBy('name')
            ->get()
            ->filter(fn (Permission $permission) =>
                ! str_starts_with($permission->name, 'route:')
                || $this->isSidebarRoute(str_replace('route:', '', $permission->name))
            )
            ->map(fn (Permission $permission) => $this->enrichPermission($permission))
            ->values();

        $isSystemAdmin = (bool) (
            $user->hasRole('System Admin') ||
            $user->hasRole('System Administrator') ||
            (method_exists($user, 'isSystemAdmin') && $user->isSystemAdmin())
        );

        $userPermissions = $user->getAllPermissions()->pluck('name')->all();

        $capabilities = [
            'canCreate' => $isSystemAdmin || in_array('route:access-control.role-permission.store', $userPermissions, true),
            'canUpdate' => $isSystemAdmin || in_array('route:access-control.role-permission.update', $userPermissions, true),
            'canDelete' => $isSystemAdmin || in_array('route:access-control.role-permission.destroy', $userPermissions, true),
        ];

        return Inertia::render('AccessControl/ManageRolePermission', [
            'roles' => $roles,
            'permissions' => $permissions,
            'capabilities' => $capabilities,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user?->hasRole('System Admin') && ! $user?->hasRole('System Administrator')) {
            abort(403, 'Unauthorized action. System Admin access required.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z0-9\s\-_]+$/', 'unique:roles,name'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
        ], [
            'name.required' => 'The role title is required.',
            'name.unique' => 'A role with this name already exists in the system.',
            'name.regex' => 'The role name may only contain alphanumeric characters, spaces, hyphens, and underscores.',
        ]);

        $role = Role::create(['name' => trim($validated['name'])]);
        if (! empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return back()->with('success', "Role '{$role->name}' was created successfully.");
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $user = $request->user();
        if (! $user?->hasRole('System Admin') && ! $user?->hasRole('System Administrator')) {
            abort(403, 'Unauthorized action. System Admin access required.');
        }

        $isSystem = $this->isProtectedRole($role);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z0-9\s\-_]+$/', 'unique:roles,name,' . $role->id],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
        ], [
            'name.required' => 'The role title is required.',
            'name.unique' => 'A role with this name already exists in the system.',
            'name.regex' => 'The role name may only contain alphanumeric characters, spaces, hyphens, and underscores.',
        ]);

        // Prevent renaming protected system roles
        if ($isSystem && trim($validated['name']) !== $role->name) {
            return back()->with('error', "System role '{$role->name}' is protected and its name cannot be altered.");
        }

        if (! $isSystem) {
            $role->update(['name' => trim($validated['name'])]);
        }

        $role->syncPermissions($validated['permissions'] ?? []);

        return back()->with('success', "Permissions for '{$role->name}' were updated successfully.");
    }

    public function destroy(Role $role): RedirectResponse
    {
        $user = request()->user();
        if (! $user?->hasRole('System Admin') && ! $user?->hasRole('System Administrator')) {
            abort(403, 'Unauthorized action. System Admin access required.');
        }

        // Backend-authoritative protection check
        if ($this->isProtectedRole($role)) {
            return back()->with('error', "System role '{$role->name}' is protected and cannot be deleted.");
        }

        // Safer handling of assigned users
        $assignedUsersCount = $role->users()->count();
        if ($assignedUsersCount > 0) {
            return back()->with(
                'error',
                "Cannot delete role '{$role->name}' because {$assignedUsersCount} staff member(s) are currently assigned to it. Please reassign those accounts before deleting this role."
            );
        }

        $roleName = $role->name;
        $role->delete();

        return back()->with('success', "Role '{$roleName}' was deleted successfully.");
    }

    private function isProtectedRole(Role $role): bool
    {
        $normalized = strtolower(trim($role->name));

        return in_array($normalized, ['system admin', 'system administrator'], true);
    }

    private function ensureRoutePermissionsExist(): void
    {
        $routeNames = collect(Route::getRoutes()->getRoutes())
            ->map(fn ($route) => $route->getName())
            ->filter()
            ->unique()
            ->reject(fn ($routeName) => $this->shouldSkipRoute($routeName) || str_starts_with($routeName, 'api.'))
            ->filter(fn ($routeName) => $this->isSidebarRoute($routeName))
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

    private function isSidebarRoute(string $routeName): bool
    {
        $routePrefix = explode('.', $routeName)[0];

        return in_array($routePrefix, $this->sidebarRoutePrefixes(), true);
    }

    private function sidebarRoutePrefixes(): array
    {
        return [
            'inventory',
            'suppliers',
            'compliance',
            'audit-logs',
            'access-control',
            'rfid-scanner',
            'system',
        ];
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

    private function enrichPermission(Permission $permission): array
    {
        $name = $permission->name;
        $clean = str_replace('route:', '', $name);

        $catalog = [
            // Inventory
            'inventory.index' => ['module' => 'Inventory', 'action' => 'view', 'display_name' => 'View Inventory', 'description' => 'Allows viewing inventory item listings, quantities, and catalog details.'],
            'inventory.store' => ['module' => 'Inventory', 'action' => 'create', 'display_name' => 'Create Inventory Item', 'description' => 'Allows adding new materials, equipment, and items to the catalog.'],
            'inventory.show' => ['module' => 'Inventory', 'action' => 'view', 'display_name' => 'View Item Details', 'description' => 'Allows viewing comprehensive specifications and properties of inventory items.'],
            'inventory.update' => ['module' => 'Inventory', 'action' => 'update', 'display_name' => 'Update Inventory Item', 'description' => 'Allows modifying item descriptions, pricing, and stock metrics.'],
            'inventory.destroy' => ['module' => 'Inventory', 'action' => 'delete', 'display_name' => 'Delete Inventory Item', 'description' => 'Allows removing or archiving catalog items from inventory.'],

            // Issuance
            'inventory.issuance' => ['module' => 'Issuance', 'action' => 'view', 'display_name' => 'View Issuance', 'description' => 'Allows viewing item issuance records and requisition issue slips (RIS).'],
            'inventory.issuance.store' => ['module' => 'Issuance', 'action' => 'create', 'display_name' => 'Create Issuance Voucher', 'description' => 'Allows issuing supplies and generating issuance vouchers for departments.'],
            'inventory.issuance.update' => ['module' => 'Issuance', 'action' => 'update', 'display_name' => 'Update Issuance Voucher', 'description' => 'Allows modifying issuance slips and recipient records.'],
            'inventory.issuance.destroy' => ['module' => 'Issuance', 'action' => 'delete', 'display_name' => 'Delete Issuance Voucher', 'description' => 'Allows voiding or deleting item issuance records.'],

            // Receiving
            'inventory.receiving' => ['module' => 'Receiving', 'action' => 'view', 'display_name' => 'View Receiving', 'description' => 'Allows viewing received deliveries and inspection acceptance reports (IAR).'],
            'inventory.receiving.store' => ['module' => 'Receiving', 'action' => 'create', 'display_name' => 'Create Receiving Record', 'description' => 'Allows registering incoming supplier deliveries into inventory.'],
            'inventory.receiving.update' => ['module' => 'Receiving', 'action' => 'update', 'display_name' => 'Update Receiving Record', 'description' => 'Allows modifying delivery quantities and inspection notes.'],
            'inventory.receiving.destroy' => ['module' => 'Receiving', 'action' => 'delete', 'display_name' => 'Delete Receiving Record', 'description' => 'Allows cancelling or deleting stock delivery records.'],

            // RFID Scanner
            'rfid-scanner.index' => ['module' => 'RFID Scanner', 'action' => 'view', 'display_name' => 'View RFID Interface', 'description' => 'Allows accessing the RFID hardware scanning console.'],
            'rfid-scanner.assign' => ['module' => 'RFID Scanner', 'action' => 'assign', 'display_name' => 'Assign RFID Tag', 'description' => 'Allows binding physical RFID tags to inventory assets.'],
            'rfid-scanner.unassign' => ['module' => 'RFID Scanner', 'action' => 'unassign', 'display_name' => 'Unassign RFID Tag', 'description' => 'Allows releasing RFID tag associations from inventory assets.'],
            'rfid-scanner.status' => ['module' => 'RFID Scanner', 'action' => 'view', 'display_name' => 'Check Scanner Status', 'description' => 'Allows monitoring reader device connectivity and hardware health.'],
            'rfid-scanner.lookup' => ['module' => 'RFID Scanner', 'action' => 'view', 'display_name' => 'Lookup RFID Tag', 'description' => 'Allows querying inventory data linked to a scanned RFID tag.'],
            'rfid-scanner.live-feed' => ['module' => 'RFID Scanner', 'action' => 'view', 'display_name' => 'Monitor Live Feed', 'description' => 'Allows streaming real-time RFID scan detections.'],

            // Suppliers
            'suppliers.index' => ['module' => 'Suppliers', 'action' => 'view', 'display_name' => 'View Suppliers', 'description' => 'Allows viewing the accredited university vendor directory.'],
            'suppliers.store' => ['module' => 'Suppliers', 'action' => 'create', 'display_name' => 'Register Supplier', 'description' => 'Allows adding new university vendors and TIN records.'],
            'suppliers.show' => ['module' => 'Suppliers', 'action' => 'view', 'display_name' => 'View Supplier Profile', 'description' => 'Allows viewing detailed supplier registration and contact credentials.'],
            'suppliers.update' => ['module' => 'Suppliers', 'action' => 'update', 'display_name' => 'Update Supplier', 'description' => 'Allows modifying vendor profiles and accreditation status.'],
            'suppliers.destroy' => ['module' => 'Suppliers', 'action' => 'delete', 'display_name' => 'Delete Supplier', 'description' => 'Allows archiving or removing vendors from the registry.'],

            // Compliance
            'compliance.reports' => ['module' => 'Compliance', 'action' => 'view', 'display_name' => 'View Compliance Reports', 'description' => 'Allows viewing statutory university audit and inventory reports.'],
            'compliance.reports.store' => ['module' => 'Compliance', 'action' => 'generate', 'display_name' => 'Generate Compliance Report', 'description' => 'Allows compiling official compliance report documents (RPCI, RSMI).'],
            'compliance.reports.update' => ['module' => 'Compliance', 'action' => 'update', 'display_name' => 'Update Compliance Report', 'description' => 'Allows editing drafted compliance reports and references.'],
            'compliance.reports.archive' => ['module' => 'Compliance', 'action' => 'delete', 'display_name' => 'Archive Compliance Report', 'description' => 'Allows archiving statutory compliance reports.'],
            'compliance.reports.preview_dataset' => ['module' => 'Compliance', 'action' => 'view', 'display_name' => 'Preview Report Dataset', 'description' => 'Allows previewing filtered report datasets before compilation.'],
            'compliance.analytics' => ['module' => 'Compliance', 'action' => 'view', 'display_name' => 'View Compliance Analytics', 'description' => 'Allows reviewing institutional compliance trends and inventory KPIs.'],
            'compliance.migrations.store' => ['module' => 'Compliance', 'action' => 'migrate', 'display_name' => 'Execute Data Migration', 'description' => 'Allows executing batch migrations for legacy data.'],
            'compliance.migrate.stock_card' => ['module' => 'Compliance', 'action' => 'migrate', 'display_name' => 'Migrate Stock Cards', 'description' => 'Allows importing historical stock card records into the database.'],
            'compliance.migrate.memorandum_receipt' => ['module' => 'Compliance', 'action' => 'migrate', 'display_name' => 'Migrate Memorandum Receipts', 'description' => 'Allows importing legacy memorandum receipts.'],

            // Audit Logs
            'audit-logs.login-trails' => ['module' => 'Audit Logs', 'action' => 'view', 'display_name' => 'View Login Trails', 'description' => 'Allows reviewing staff authentication events, IP addresses, and timestamps.'],
            'audit-logs.transaction-trails' => ['module' => 'Audit Logs', 'action' => 'view', 'display_name' => 'View Transaction Trails', 'description' => 'Allows reviewing institutional ledger modifications across modules.'],

            // Access Control
            'access-control.staffs' => ['module' => 'Access Control', 'action' => 'view', 'display_name' => 'View Staff Accounts', 'description' => 'Allows viewing university personnel accounts and role designations.'],
            'access-control.staffs.store' => ['module' => 'Access Control', 'action' => 'create', 'display_name' => 'Register Staff Account', 'description' => 'Allows inviting new university personnel and granting access.'],
            'access-control.staffs.update' => ['module' => 'Access Control', 'action' => 'update', 'display_name' => 'Update Staff Account', 'description' => 'Allows modifying staff profile details and role designations.'],
            'access-control.staffs.resend-invitation' => ['module' => 'Access Control', 'action' => 'resend', 'display_name' => 'Resend Staff Invitation', 'description' => 'Allows resending registration invites to pending staff members.'],
            'access-control.staffs.toggle-status' => ['module' => 'Access Control', 'action' => 'toggle_status', 'display_name' => 'Toggle Staff Status', 'description' => 'Allows enabling or disabling staff account access.'],
            'access-control.role-permission' => ['module' => 'Access Control', 'action' => 'view', 'display_name' => 'View Roles & Permissions', 'description' => 'Allows reviewing configured institutional roles and capabilities.'],
            'access-control.role-permission.store' => ['module' => 'Access Control', 'action' => 'create', 'display_name' => 'Create Role', 'description' => 'Allows registering new administrative role profiles.'],
            'access-control.role-permission.update' => ['module' => 'Access Control', 'action' => 'update', 'display_name' => 'Update Role & Permissions', 'description' => 'Allows modifying role names and assigned permissions.'],
            'access-control.role-permission.destroy' => ['module' => 'Access Control', 'action' => 'delete', 'display_name' => 'Delete Role', 'description' => 'Allows deleting custom administrative roles.'],

            // System
            'system.mode.show' => ['module' => 'System', 'action' => 'view', 'display_name' => 'View System Mode', 'description' => 'Allows viewing current operating mode and environment parameters.'],
            'system.mode.update' => ['module' => 'System', 'action' => 'manage', 'display_name' => 'Update System Mode', 'description' => 'Allows toggling production, maintenance, or training modes.'],
        ];

        if (isset($catalog[$clean])) {
            return [
                'id' => $permission->id,
                'name' => $name,
                'module' => $catalog[$clean]['module'],
                'action' => $catalog[$clean]['action'],
                'display_name' => $catalog[$clean]['display_name'],
                'description' => $catalog[$clean]['description'],
            ];
        }

        // Dynamic fallback resolution
        $parts = explode('.', $clean);
        $moduleKey = $parts[0] ?? 'general';
        $actionKey = end($parts);

        $moduleName = match ($moduleKey) {
            'inventory' => (isset($parts[1]) && in_array($parts[1], ['issuance', 'receiving'], true)) ? ucfirst($parts[1]) : 'Inventory',
            'suppliers' => 'Suppliers',
            'compliance' => 'Compliance',
            'audit-logs' => 'Audit Logs',
            'access-control' => 'Access Control',
            'rfid-scanner' => 'RFID Scanner',
            'system' => 'System',
            default => Str::headline($moduleKey),
        };

        $action = match (true) {
            preg_match('/(store|create)/i', $actionKey) === 1 => 'create',
            preg_match('/(update|edit)/i', $actionKey) === 1 => 'update',
            preg_match('/(destroy|delete|archive)/i', $actionKey) === 1 => 'delete',
            preg_match('/(assign)/i', $actionKey) === 1 && ! str_contains($actionKey, 'unassign') => 'assign',
            preg_match('/(unassign)/i', $actionKey) === 1 => 'unassign',
            preg_match('/(migrate)/i', $actionKey) === 1 => 'migrate',
            preg_match('/(resend)/i', $actionKey) === 1 => 'resend',
            preg_match('/(toggle)/i', $actionKey) === 1 => 'toggle_status',
            preg_match('/(generate)/i', $actionKey) === 1 => 'generate',
            preg_match('/(export|download)/i', $actionKey) === 1 => 'download',
            preg_match('/(approve)/i', $actionKey) === 1 => 'approve',
            default => 'view',
        };

        $displayName = Str::headline(str_replace(['.', '-', '_'], ' ', $clean));

        return [
            'id' => $permission->id,
            'name' => $name,
            'module' => $moduleName,
            'action' => $action,
            'display_name' => $displayName,
            'description' => "Allows operational access for {$displayName}.",
        ];
    }
}
