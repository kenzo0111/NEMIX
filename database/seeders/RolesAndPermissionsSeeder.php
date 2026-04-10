<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // create general permissions
        Permission::create(['name' => 'view system']);
        Permission::create(['name' => 'manage roles']);
        Permission::create(['name' => 'manage inventory']);
        Permission::create(['name' => 'manage audits']);
        // Add more specific permissions as your application grows

        // create roles and assign permissions
        $systemAdmin = Role::create(['name' => 'System Admin']);
        $systemAdmin->givePermissionTo(Permission::all());

        $propertyStaff = Role::create(['name' => 'Property Staff']);
        $propertyStaff->givePermissionTo(['view system', 'manage inventory']);

        $internalAuditor = Role::create(['name' => 'Internal Auditor']);
        $internalAuditor->givePermissionTo(['view system', 'manage audits']);

        $externalAuditor = Role::create(['name' => 'External Auditor']);
        $externalAuditor->givePermissionTo(['view system']);
    }
}
