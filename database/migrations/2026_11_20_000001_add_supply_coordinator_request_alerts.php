<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        $role = Role::firstOrCreate(['name' => 'Supply Coordinator', 'guard_name' => 'web']);
        foreach (['index', 'read'] as $action) {
            $permission = Permission::firstOrCreate(['name' => 'route:inventory.request-alerts.'.$action, 'guard_name' => 'web']);
            $role->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $role = Role::where('name', 'Supply Coordinator')->where('guard_name', 'web')->first();
        if ($role) {
            foreach (['index', 'read'] as $action) {
                $permission = Permission::where('name', 'route:inventory.request-alerts.'.$action)->where('guard_name', 'web')->first();
                if ($permission) {
                    $role->revokePermissionTo($permission);
                }
            }
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
