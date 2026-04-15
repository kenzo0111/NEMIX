<?php

namespace Modules\Inventory\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Category;
use Modules\Inventory\Models\Item;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Expendable' => Category::firstOrCreate(['name' => 'Expendable', 'description' => 'Supplies that are consumed in use or lose their identity in the process.']),
            'Semi-Expendable' => Category::firstOrCreate(['name' => 'Semi-Expendable', 'description' => 'Items that are not consumed but have a short lifespan or low cost.']),
            'Non-Expendable' => Category::firstOrCreate(['name' => 'Non-Expendable', 'description' => 'Items that retain their identity and have a long lifespan (Equipment).'])
        ];

        $items = [
            // Expendable (Consumable Office Supplies)
            ['name' => 'Bond Paper A4', 'category_id' => $categories['Expendable']->id, 'stock' => 150, 'status' => 'Available', 'description' => 'White A4 size bond paper for printing.'],
            ['name' => 'Ballpen Black', 'category_id' => $categories['Expendable']->id, 'stock' => 300, 'status' => 'Available', 'description' => 'Standard black ballpoint pen.'],
            ['name' => 'Ballpen Red', 'category_id' => $categories['Expendable']->id, 'stock' => 100, 'status' => 'Available', 'description' => 'Standard red ballpoint pen.'],
            ['name' => 'Printer Ink Bottle Black', 'category_id' => $categories['Expendable']->id, 'stock' => 50, 'status' => 'Available', 'description' => 'Refill ink bottle for Epson printers.'],
            ['name' => 'Staples Wire No. 35', 'category_id' => $categories['Expendable']->id, 'stock' => 120, 'status' => 'Available', 'description' => 'Standard staples wire.'],
            ['name' => 'Correction Tape', 'category_id' => $categories['Expendable']->id, 'stock' => 80, 'status' => 'Available', 'description' => 'Correction tape for removing pen marks.'],
            ['name' => 'Sticky Notes 3x3', 'category_id' => $categories['Expendable']->id, 'stock' => 20, 'status' => 'Low Stock', 'description' => 'Yellow square sticky notes.'],
            ['name' => 'Paper Clips', 'category_id' => $categories['Expendable']->id, 'stock' => 0, 'status' => 'Out of Stock', 'description' => 'Box of standard metal paper clips.'],
            ['name' => 'Highlighter Assorted', 'category_id' => $categories['Expendable']->id, 'stock' => 45, 'status' => 'Available', 'description' => 'Set of 4 colors highlighter.'],
            
            // Semi-Expendable
            ['name' => 'Standard Stapler', 'category_id' => $categories['Semi-Expendable']->id, 'stock' => 30, 'status' => 'Available', 'description' => 'Stapler for standard size wires.'],
            ['name' => 'Heavy Duty Hole Puncher', 'category_id' => $categories['Semi-Expendable']->id, 'stock' => 15, 'status' => 'Low Stock', 'description' => 'Two-hole puncher for thick papers.'],
            ['name' => 'Tape Dispenser', 'category_id' => $categories['Semi-Expendable']->id, 'stock' => 10, 'status' => 'Available', 'description' => 'Heavy base tape dispenser for 1-inch tape.'],
            ['name' => 'Office Scissors', 'category_id' => $categories['Semi-Expendable']->id, 'stock' => 25, 'status' => 'Available', 'description' => 'Medium size steel scissors.'],
            
            // Non-Expendable
            ['name' => 'Office Chair', 'category_id' => $categories['Non-Expendable']->id, 'stock' => 5, 'status' => 'Available', 'description' => 'Ergonomic swivel mesh chair.'],
            ['name' => 'Laser Printer', 'category_id' => $categories['Non-Expendable']->id, 'stock' => 2, 'status' => 'Low Stock', 'description' => 'Multifunction laser printer.'],
            ['name' => 'Whiteboard 4x6', 'category_id' => $categories['Non-Expendable']->id, 'stock' => 0, 'status' => 'Out of Stock', 'description' => 'Magnetic whiteboard for meeting rooms.']
        ];

        foreach ($items as $itemData) {
            $itemData['sku'] = strtoupper(Str::random(8));
            Item::create($itemData);
        }
    }
}
