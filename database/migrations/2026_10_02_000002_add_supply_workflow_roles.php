<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('roles') || !Schema::hasTable('permissions')) return;

        $coordinatorPermissions = [
            'route:inventory.requests.index',
            'route:inventory.requests.store',
            'route:inventory.requests.update',
            'route:inventory.requests.cancel',
        ];
        $custodianPermissions = [
            'route:inventory.issuance',
            'route:inventory.requests.approve',
            'route:inventory.requests.reject',
            'route:inventory.requests.release',
        ];

        foreach (array_merge($coordinatorPermissions, $custodianPermissions) as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }
        Role::firstOrCreate(['name' => 'Supply Coordinator', 'guard_name' => 'web'])
            ->givePermissionTo($coordinatorPermissions);
        Role::firstOrCreate(['name' => 'Property Custodian', 'guard_name' => 'web'])
            ->givePermissionTo($custodianPermissions);
    }

    public function down(): void
    {
        // Preserve roles and assignments belonging to real users.
    }
};
