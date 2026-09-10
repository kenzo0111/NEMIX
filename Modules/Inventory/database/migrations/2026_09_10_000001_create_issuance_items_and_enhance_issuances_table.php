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
        // 1. Add ris_number to issuances table if not exists
        if (Schema::hasTable('issuances')) {
            Schema::table('issuances', function (Blueprint $table) {
                if (!Schema::hasColumn('issuances', 'ris_number')) {
                    $table->string('ris_number')->nullable()->after('id')->index();
                }
            });

            // Make item_id and quantity nullable if needed to support parent-level issuances
            try {
                Schema::table('issuances', function (Blueprint $table) {
                    $table->foreignId('item_id')->nullable()->change();
                    $table->integer('quantity')->nullable()->change();
                });
            } catch (\Throwable $e) {
                // Ignore if sqlite or driver doesn't support changing column directly
            }
        }

        // 2. Create issuance_items table
        if (!Schema::hasTable('issuance_items')) {
            Schema::create('issuance_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('issuance_id')->constrained('issuances')->onDelete('cascade');
                $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
                $table->integer('quantity');
                $table->decimal('unit_cost', 15, 2)->default(0.00);
                $table->decimal('amount', 15, 2)->default(0.00);
                $table->timestamps();
            });
        }

        // 3. Backfill legacy records: Populate ris_number and mirror to issuance_items
        if (Schema::hasTable('issuances') && Schema::hasTable('issuance_items')) {
            $legacyIssuances = DB::table('issuances')->get();
            foreach ($legacyIssuances as $issuance) {
                // Generate ris_number if null
                $risNumber = $issuance->ris_number;
                if (empty($risNumber)) {
                    $date = $issuance->date_issued ? substr($issuance->date_issued, 0, 7) : date('Y-m');
                    $risNumber = 'RIS-' . $date . '-' . str_pad($issuance->id, 4, '0', STR_PAD_LEFT);
                    DB::table('issuances')->where('id', $issuance->id)->update(['ris_number' => $risNumber]);
                }

                // If item_id is present and not yet in issuance_items, backfill it
                if (!empty($issuance->item_id)) {
                    $exists = DB::table('issuance_items')
                        ->where('issuance_id', $issuance->id)
                        ->where('item_id', $issuance->item_id)
                        ->exists();

                    if (!$exists) {
                        $item = DB::table('items')->where('id', $issuance->item_id)->first();
                        $unitCost = $item ? ($item->unit_cost ?? 0) : 0;
                        $quantity = $issuance->quantity ?? 1;
                        $amount = $quantity * $unitCost;

                        DB::table('issuance_items')->insert([
                            'issuance_id' => $issuance->id,
                            'item_id' => $issuance->item_id,
                            'quantity' => $quantity,
                            'unit_cost' => $unitCost,
                            'amount' => $amount,
                            'created_at' => $issuance->created_at ?? now(),
                            'updated_at' => $issuance->updated_at ?? now(),
                        ]);
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
        Schema::dropIfExists('issuance_items');

        if (Schema::hasTable('issuances')) {
            Schema::table('issuances', function (Blueprint $table) {
                if (Schema::hasColumn('issuances', 'ris_number')) {
                    $table->dropColumn('ris_number');
                }
            });
        }
    }
};
