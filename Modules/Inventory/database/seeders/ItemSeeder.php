<?php

namespace Modules\Inventory\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Modules\Inventory\Models\Item;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing items first to make it a fresh start
        Item::truncate();

        $items = [
            // IT Equipment
            ['name' => 'ThinkPad Laptop Pro', 'unit_of_issue' => 'unit', 'stock' => 12, 'unit_cost' => 65000.00, 'amount' => 780000.00, 'status' => 'Available', 'description' => 'High-performance laptop for developers.'],
            ['name' => '27-inch 4K Monitor', 'unit_of_issue' => 'unit', 'stock' => 20, 'unit_cost' => 12000.00, 'amount' => 240000.00, 'status' => 'Available', 'description' => 'Ultra-HD monitor for dual display setups.'],
            ['name' => 'Wireless Mouse', 'unit_of_issue' => 'pc', 'stock' => 45, 'unit_cost' => 850.00, 'amount' => 38250.00, 'status' => 'Available', 'description' => 'Ergonomic wireless mouse with Bluetooth.'],
            ['name' => 'Mechanical Keyboard', 'unit_of_issue' => 'pc', 'stock' => 5, 'unit_cost' => 2500.00, 'amount' => 12500.00, 'status' => 'Low Stock', 'description' => 'Tactile mechanical keyboard.'],
            ['name' => 'USB-C Docking Station', 'unit_of_issue' => 'pc', 'stock' => 0, 'unit_cost' => 1500.00, 'amount' => 0.00, 'status' => 'Out of Stock', 'description' => '7-in-1 Type-C hub adapter.'],
            
            // Office Furniture
            ['name' => 'Ergonomic Office Chair', 'unit_of_issue' => 'unit', 'stock' => 15, 'unit_cost' => 4500.00, 'amount' => 67500.00, 'status' => 'Available', 'description' => 'Adjustable mesh office chair with lumbar support.'],
            ['name' => 'Standing Desk', 'unit_of_issue' => 'unit', 'stock' => 8, 'unit_cost' => 12500.00, 'amount' => 100000.00, 'status' => 'Low Stock', 'description' => 'Motorized adjustable standing desk.'],
            ['name' => 'Filing Cabinet', 'unit_of_issue' => 'unit', 'stock' => 10, 'unit_cost' => 3200.00, 'amount' => 32000.00, 'status' => 'Available', 'description' => '3-drawer metal filing cabinet.'],

            // General Supplies
            ['name' => 'Premium A4 Copy Paper', 'unit_of_issue' => 'ream', 'stock' => 100, 'unit_cost' => 280.00, 'amount' => 28000.00, 'status' => 'Available', 'description' => 'High-quality 80gsm A4 bond paper.'],
            ['name' => 'Dry Erase Markers (Assorted)', 'unit_of_issue' => 'set', 'stock' => 30, 'unit_cost' => 250.00, 'amount' => 7500.00, 'status' => 'Available', 'description' => 'Set of 4 whiteboard markers.'],
            ['name' => 'Heavy Duty Stapler', 'unit_of_issue' => 'pc', 'stock' => 12, 'unit_cost' => 550.00, 'amount' => 6600.00, 'status' => 'Available', 'description' => 'Industrial grade stapler.'],
            ['name' => 'Sticky Notes 3x3', 'unit_of_issue' => 'pad', 'stock' => 2, 'unit_cost' => 45.00, 'amount' => 90.00, 'status' => 'Low Stock', 'description' => 'Neon color sticky notes.'],
            ['name' => 'Paper Clips (Jumbo)', 'unit_of_issue' => 'box', 'stock' => 0, 'unit_cost' => 35.00, 'amount' => 0.00, 'status' => 'Out of Stock', 'description' => 'Box of 100 jumbo paper clips.'],
        ];

        foreach ($items as $itemData) {
            $itemData['sku'] = strtoupper(Str::random(8));
            Item::create($itemData);
        }
    }
}
