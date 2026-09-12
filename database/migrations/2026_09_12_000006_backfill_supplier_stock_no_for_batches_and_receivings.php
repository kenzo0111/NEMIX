<?php

use Carbon\Carbon;
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
        if (!Schema::hasTable('inventory_batches')) {
            return;
        }

        // 1. Backfill inventory_batches where supplier_stock_no is null or empty
        $batches = DB::table('inventory_batches')
            ->whereNull('supplier_stock_no')
            ->orWhere('supplier_stock_no', '')
            ->orderBy('id', 'asc')
            ->get();

        foreach ($batches as $batch) {
            $stockNo = $this->generateStockNo($batch->supplier_id, $batch->item_id, $batch->date_received, $batch->id);
            DB::table('inventory_batches')
                ->where('id', $batch->id)
                ->update(['supplier_stock_no' => $stockNo]);

            if (!empty($batch->receiving_id) && Schema::hasTable('receivings')) {
                DB::table('receivings')
                    ->where('id', $batch->receiving_id)
                    ->where(function ($q) {
                        $q->whereNull('supplier_stock_no')->orWhere('supplier_stock_no', '');
                    })
                    ->update(['supplier_stock_no' => $stockNo]);
            }
        }

        // 2. Also backfill any remaining receivings without supplier_stock_no
        if (Schema::hasTable('receivings')) {
            $receivings = DB::table('receivings')
                ->whereNull('supplier_stock_no')
                ->orWhere('supplier_stock_no', '')
                ->orderBy('id', 'asc')
                ->get();

            foreach ($receivings as $rec) {
                $stockNo = $this->generateStockNo($rec->supplier_id, $rec->item_id, $rec->date_received, $rec->id);
                DB::table('receivings')
                    ->where('id', $rec->id)
                    ->update(['supplier_stock_no' => $stockNo]);
            }
        }
    }

    protected function generateStockNo(?int $supplierId, ?int $itemId, ?string $date, int $fallbackId): string
    {
        $acronym = 'GEN';
        if ($supplierId) {
            $supplier = DB::table('suppliers')->where('id', $supplierId)->first();
            if ($supplier && !empty(trim((string) $supplier->name))) {
                $words = preg_split('/[\s\-_]+/', trim((string) $supplier->name));
                $letters = [];
                foreach ($words as $word) {
                    $cleaned = preg_replace('/[^A-Za-z0-9]/', '', $word);
                    if ($cleaned !== '') {
                        $letters[] = strtoupper(substr($cleaned, 0, 1));
                    }
                }
                if (count($letters) < 3 && !empty($words[0])) {
                    $cleanFirst = preg_replace('/[^A-Za-z0-9]/', '', $words[0]);
                    for ($i = 1; $i < strlen($cleanFirst) && count($letters) < 3; $i++) {
                        $letters[] = strtoupper(substr($cleanFirst, $i, 1));
                    }
                }
                while (count($letters) < 3) {
                    $letters[] = 'X';
                }
                $acronym = implode('', array_slice($letters, 0, 3));
            }
        }

        try {
            $c = $date ? Carbon::parse($date) : Carbon::now();
        } catch (\Throwable $e) {
            $c = Carbon::now();
        }

        $yy = $c->format('y');
        $mm = $c->format('m');
        $itemPart = sprintf('%03d', ($itemId ?: 1) % 1000);
        $series = sprintf('%04d', $fallbackId % 10000);

        return sprintf('%s-%s-%s-%s-%s', $acronym, $yy, $mm, $itemPart, $series);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive: No rollback required
    }
};
