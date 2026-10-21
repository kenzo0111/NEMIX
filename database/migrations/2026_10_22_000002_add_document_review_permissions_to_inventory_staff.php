<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        // Production uses Inventory Staff as its designated SPMO processing role.
        // Keep other custom reviewers subject to explicit permission assignment.
        $role = Role::where('name', 'Inventory Staff')->where('guard_name', 'web')->first();
        if ($role) {
            foreach (['document', 'verify-document', 'ready'] as $action) {
                $role->givePermissionTo(Permission::firstOrCreate([
                    'name' => 'route:inventory.requests.'.$action, 'guard_name' => 'web',
                ]));
            }
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Preserve permission assignments that administrators may have customized.
    }
};
