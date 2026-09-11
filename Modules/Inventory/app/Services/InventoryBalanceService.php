<?php

namespace Modules\Inventory\Services;

use App\Models\SystemSetting;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\InventoryBatch;
use Illuminate\Support\Facades\Log;

class InventoryBalanceService
{
    /**
     * Ensures an opening balance batch exists if an item has stock but no batches.
     */
    public function ensureOpeningBatch(Item $item, ?int $userId = null): ?InventoryBatch
    {
        if ($item->stock > 0 && $item->batches()->doesntExist()) {
            return InventoryBatch::create([
                'item_id' => $item->id,
                'supplier_id' => $item->supplier_id,
                'batch_number' => 'BATCH-OPENING-' . $item->id,
                'quantity_received' => (int) $item->stock,
                'quantity_remaining' => (int) $item->stock,
                'unit_cost' => (float) ($item->unit_cost ?? 0.00),
                'date_received' => $item->created_at ?? now(),
                'created_by' => $userId,
            ]);
        }

        return null;
    }

    /**
     * Authoritatively synchronizes an item's cached balance, valuation, and status.
     * Must be called inside the active DB transaction.
     */
    public function synchronizeItem(Item $item): void
    {
        $hasBatches = $item->batches()->exists();

        if ($hasBatches) {
            $totalRemaining = (int) $item->batches()
                ->whereNull('deleted_at')
                ->sum('quantity_remaining');

            $totalValue = (float) ($item->batches()
                ->whereNull('deleted_at')
                ->where('quantity_remaining', '>', 0)
                ->selectRaw('COALESCE(SUM(quantity_remaining * unit_cost), 0) as val')
                ->value('val') ?? 0.00);

            $item->stock = $totalRemaining;
            $item->amount = round($totalValue, 2);

            // Keep unit_cost as latest/average reference if active batches exist
            $latestBatch = $item->batches()
                ->whereNull('deleted_at')
                ->latest('date_received')
                ->latest('id')
                ->first();

            if ($latestBatch && (float) $latestBatch->unit_cost > 0) {
                $item->unit_cost = (float) $latestBatch->unit_cost;
            }
        } else {
            // Legacy / standalone without batches yet
            $item->amount = round((float) $item->stock * (float) ($item->unit_cost ?? 0), 2);
        }

        $item->status = $this->determineStatus($item->stock);
        $item->save();
    }

    /**
     * Determines status from system settings thresholds.
     */
    public function determineStatus(int $stock): string
    {
        if ($stock <= 0) {
            return 'Out of Stock';
        }

        $lowStockThreshold = class_exists(SystemSetting::class)
            ? (int) SystemSetting::get('inventory.low_stock_threshold', 10)
            : 10;

        if ($stock <= $lowStockThreshold) {
            return 'Low Stock';
        }

        return 'Available';
    }

    /**
     * Validates that item cached stock matches batch remaining sum.
     */
    public function verifyConsistency(Item $item): bool
    {
        if (!$item->batches()->exists()) {
            return true;
        }

        $batchSum = (int) $item->batches()
            ->whereNull('deleted_at')
            ->sum('quantity_remaining');

        $isConsistent = ($item->stock === $batchSum);

        if (!$isConsistent) {
            Log::warning("Inventory balance discrepancy for item #{$item->id} ({$item->name}): item.stock={$item->stock}, batches.quantity_remaining={$batchSum}");
        }

        return $isConsistent;
    }
}
