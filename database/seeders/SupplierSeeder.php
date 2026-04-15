<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $suppliers = [
            [
                'name' => 'ABC Office Supplies Trading',
                'tin' => '000-123-456-000',
                'address' => '123 Main St, Manila, Philippines',
                'reg_number' => '2023-112233 (PhilGEPS)',
                'category' => 'goods',
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'MegaBuild Construction Corp.',
                'tin' => '000-987-654-001',
                'address' => '456 Construction Ave, Cebu, Philippines',
                'reg_number' => '2022-998877 (PCAB)',
                'category' => 'infra',
                'status' => 'pending',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Tech Solutions Inc.',
                'tin' => '000-456-789-000',
                'address' => '789 Tech Blvd, Davao, Philippines',
                'reg_number' => '2024-000001 (PhilGEPS)',
                'category' => 'consulting',
                'status' => 'blacklisted',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('suppliers')->insert($suppliers);
    }
}
