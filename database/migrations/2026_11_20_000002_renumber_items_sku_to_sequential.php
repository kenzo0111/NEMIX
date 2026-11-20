<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('items')) {
            return;
        }

        DB::transaction(function () {
            // Retrieve all items (including any soft-deleted) in creation order
            $items = DB::table('items')->orderBy('id', 'asc')->get(['id']);

            if ($items->isEmpty()) {
                return;
            }

            // Step 1: Assign temporary unique placeholders to eliminate unique constraint collisions
            foreach ($items as $item) {
                DB::table('items')
                    ->where('id', $item->id)
                    ->update(['sku' => 'TEMP_RENUMBER_'.$item->id]);
            }

            // Step 2: Assign sequential numbers: 1, 2, 3, ...
            $counter = 1;
            foreach ($items as $item) {
                DB::table('items')
                    ->where('id', $item->id)
                    ->update(['sku' => (string) $counter++]);
            }

            // Step 3: Synchronize coordinator_stocks table if present
            if (Schema::hasTable('coordinator_stocks')) {
                $stocks = DB::table('coordinator_stocks')->get(['id', 'item_id']);
                foreach ($stocks as $stock) {
                    $itemSku = DB::table('items')->where('id', $stock->item_id)->value('sku');
                    if ($itemSku !== null) {
                        DB::table('coordinator_stocks')
                            ->where('id', $stock->id)
                            ->update(['sku' => $itemSku]);
                    }
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Numerical stock numbers are permanently valid representations of the stock sequence.
    }
};
