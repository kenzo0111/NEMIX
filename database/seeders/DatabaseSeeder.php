<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
        ]);

        // User::factory(10)->create();

        $testUser = User::factory()->create([
            'name' => 'Property Staff User',
            'email' => 'staff@example.com',
        ]);
        $testUser->assignRole('Property Staff');

        // Create sample admin account
        $adminUser = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'doc',
            'password' => bcrypt('admin123'),
        ]);
        $adminUser->assignRole('System Admin');
    }
}
