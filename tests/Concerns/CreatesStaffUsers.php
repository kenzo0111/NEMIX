<?php

namespace Tests\Concerns;

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

trait CreatesStaffUsers
{
    protected function createStaffUser(array $routeNames, string $roleName = 'Property Staff'): User
    {
        $user = User::factory()->create([
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $user->assignRole(Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']));

        foreach ($routeNames as $routeName) {
            $user->givePermissionTo(Permission::firstOrCreate([
                'name' => 'route:'.$routeName,
                'guard_name' => 'web',
            ]));
        }

        return $user;
    }
}
