<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'System Admin']);
        $adminRole->syncPermissions(Permission::all());
        $staffRole = Role::firstOrCreate(['name' => 'Property Staff']);

        foreach ([
            ['SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD', 'System Administrator', $adminRole],
            ['SEED_STAFF_EMAIL', 'SEED_STAFF_PASSWORD', 'Property Staff User', $staffRole],
        ] as [$emailKey, $passwordKey, $name, $role]) {
            $email = env($emailKey);
            $password = env($passwordKey);
            if (! $email || ! $password) {
                continue;
            }
            $user = User::firstOrCreate(
                ['email' => $email],
                ['name' => $name, 'password' => Hash::make($password), 'email_verified_at' => now()]
            );
            $user->assignRole($role);
        }
    }
}
