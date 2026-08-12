<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $systemAdminRole = Role::firstOrCreate(['name' => 'System Admin']);
        $systemAdminRole->syncPermissions(Permission::all());

        // Designated system admin account
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'System Administrator',
                'password' => bcrypt('admin123'),
                'email_verified_at' => now(),
            ]
        );
        $adminUser->update(['email_verified_at' => now()]);

        if (! $adminUser->hasRole($systemAdminRole)) {
            $adminUser->assignRole($systemAdminRole);
        }

        // Property Staff account
        $staffRole = Role::firstOrCreate(['name' => 'Property Staff']);
        $staffUser = User::firstOrCreate(
            ['email' => 'staff@example.com'],
            [
                'name' => 'Property Staff User',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );
        $staffUser->update(['email_verified_at' => now()]);

        if (! $staffUser->hasRole($staffRole)) {
            $staffUser->assignRole($staffRole);
        }
    }
}
