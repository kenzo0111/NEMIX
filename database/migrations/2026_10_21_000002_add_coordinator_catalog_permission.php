<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        $permission = Permission::firstOrCreate(['name' => 'route:coordinator.catalog.index', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Supply Coordinator', 'guard_name' => 'web'])->givePermissionTo($permission);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $permission = Permission::where('name', 'route:coordinator.catalog.index')->where('guard_name', 'web')->first();
        if ($permission) {
            Role::where('name', 'Supply Coordinator')->where('guard_name', 'web')->first()?->revokePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
