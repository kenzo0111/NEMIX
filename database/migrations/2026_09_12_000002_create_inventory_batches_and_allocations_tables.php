<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create inventory_batches table
        if (!Schema::hasTable('inventory_batches')) {
            Schema::create('inventory_batches', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained('items')->onDelete('restrict');
                $table->foreignId('receiving_id')->nullable()->constrained('receivings')->onDelete('set null');
                $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('restrict');
                $table->integer('quantity_received');
                $table->integer('quantity_remaining');
                $table->decimal('unit_cost', 15, 2)->default(0.00);
                $table->date('date_received');
                $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamps();
                $table->softDeletes();

                $table->index(['item_id', 'quantity_remaining']);
                $table->index(['item_id', 'date_received']);
                $table->index('supplier_id');
            });
        }

        // 2. Create issuance_batch_allocations table
        if (!Schema::hasTable('issuance_batch_allocations')) {
            Schema::create('issuance_batch_allocations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('issuance_item_id')->constrained('issuance_items')->onDelete('cascade');
                $table->foreignId('inventory_batch_id')->constrained('inventory_batches')->onDelete('restrict');
                $table->integer('quantity');
                $table->decimal('unit_cost', 15, 2)->default(0.00);
                $table->decimal('amount', 15, 2)->default(0.00);
                $table->timestamps();

                $table->index('issuance_item_id');
                $table->index('inventory_batch_id');
            });
        }

        // 3. Safe legacy data backfill into inventory_batches & allocations
        if (Schema::hasTable('items') && Schema::hasTable('inventory_batches')) {
            // First, migrate existing receiving records into inventory_batches
            if (Schema::hasTable('receivings')) {
                $receivings = DB::table('receivings')->orderBy('date_received')->orderBy('id')->get();
                foreach ($receivings as $receiving) {
                    $item = DB::table('items')->where('id', $receiving->item_id)->first();
                    $unitCost = $item && isset($item->unit_cost) ? (float) $item->unit_cost : 0.00;

                    $exists = DB::table('inventory_batches')
                        ->where('receiving_id', $receiving->id)
                        ->exists();

                    if (!$exists) {
                        DB::table('inventory_batches')->insert([
                            'item_id' => $receiving->item_id,
                            'receiving_id' => $receiving->id,
                            'supplier_id' => $receiving->supplier_id,
                            'quantity_received' => (int) $receiving->quantity,
                            'quantity_remaining' => (int) $receiving->quantity,
                            'unit_cost' => $unitCost,
                            'date_received' => $receiving->date_received,
                            'created_by' => $receiving->created_by ?? null,
                            'created_at' => $receiving->created_at ?? now(),
                            'updated_at' => $receiving->updated_at ?? now(),
                        ]);
                    }
                }
            }

            // Next, for items with stock > sum(batches), create opening balance batch
            $items = DB::table('items')->get();
            foreach ($items as $item) {
                $totalBatchReceived = (int) DB::table('inventory_batches')
                    ->where('item_id', $item->id)
                    ->whereNull('deleted_at')
                    ->sum('quantity_received');

                $currentStock = (int) ($item->stock ?? 0);
                $unitCost = isset($item->unit_cost) ? (float) $item->unit_cost : 0.00;
                $supplierId = $item->supplier_id;

                if ($currentStock > $totalBatchReceived) {
                    $diff = $currentStock - $totalBatchReceived;
                    // Fallback supplier if null
                    if (!$supplierId) {
                        $firstSupplier = DB::table('suppliers')->first();
                        $supplierId = $firstSupplier ? $firstSupplier->id : 1;
                    }

                    DB::table('inventory_batches')->insert([
                        'item_id' => $item->id,
                        'receiving_id' => null,
                        'supplier_id' => $supplierId,
                        'quantity_received' => $diff,
                        'quantity_remaining' => $diff,
                        'unit_cost' => $unitCost,
                        'date_received' => $item->created_at ? substr($item->created_at, 0, 10) : date('Y-m-d'),
                        'created_by' => $item->created_by ?? null,
                        'created_at' => $item->created_at ?? now(),
                        'updated_at' => $item->updated_at ?? now(),
                    ]);
                }
            }

            // Reconcile batch quantity_remaining with existing issuances via FIFO
            if (Schema::hasTable('issuance_items') && Schema::hasTable('issuance_batch_allocations')) {
                $issuanceItems = DB::table('issuance_items')
                    ->join('issuances', 'issuance_items.issuance_id', '=', 'issuances.id')
                    ->whereNull('issuances.deleted_at')
                    ->where('issuances.status', 'Issued')
                    ->orderBy('issuances.date_issued')
                    ->orderBy('issuance_items.id')
                    ->select('issuance_items.*')
                    ->get();

                foreach ($issuanceItems as $line) {
                    $qtyToAllocate = (int) $line->quantity;
                    if ($qtyToAllocate <= 0) {
                        continue;
                    }

                    // Check if already allocated
                    $alreadyAllocated = DB::table('issuance_batch_allocations')
                        ->where('issuance_item_id', $line->id)
                        ->sum('quantity');

                    if ($alreadyAllocated >= $qtyToAllocate) {
                        continue;
                    }

                    $remainingToAllocate = $qtyToAllocate - $alreadyAllocated;

                    // Find eligible batches
                    $batches = DB::table('inventory_batches')
                        ->where('item_id', $line->item_id)
                        ->whereNull('deleted_at')
                        ->where('quantity_remaining', '>', 0)
                        ->orderBy('date_received', 'asc')
                        ->orderBy('id', 'asc')
                        ->get();

                    foreach ($batches as $batch) {
                        if ($remainingToAllocate <= 0) {
                            break;
                        }

                        $take = min((int) $batch->quantity_remaining, $remainingToAllocate);
                        $remainingInBatch = (int) $batch->quantity_remaining - $take;

                        DB::table('inventory_batches')
                            ->where('id', $batch->id)
                            ->update(['quantity_remaining' => $remainingInBatch]);

                        DB::table('issuance_batch_allocations')->insert([
                            'issuance_item_id' => $line->id,
                            'inventory_batch_id' => $batch->id,
                            'quantity' => $take,
                            'unit_cost' => $batch->unit_cost,
                            'amount' => round($take * (float) $batch->unit_cost, 2),
                            'created_at' => $line->created_at ?? now(),
                            'updated_at' => $line->updated_at ?? now(),
                        ]);

                        $remainingToAllocate -= $take;
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issuance_batch_allocations');
        Schema::dropIfExists('inventory_batches');
    }
};
