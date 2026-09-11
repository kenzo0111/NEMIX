<?php

namespace Modules\Inventory\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\InventoryBatch;

class InventoryCostingService
{
    /**
     * Allocates requested quantity using FIFO policy.
     * Batches are locked with lockForUpdate().
     *
     * @return array Array of allocated details:
     *               [
     *                  'allocations' => [
     *                      ['batch' => InventoryBatch, 'quantity' => int, 'unit_cost' => float, 'amount' => float],
     *                      ...
     *                  ],
     *                  'total_amount' => float,
     *                  'blended_unit_cost' => float,
     *               ]
     */
    public function allocateFifo(Item $item, int $requestedQty): array
    {
        $strictEnforcement = class_exists(SystemSetting::class)
            ? (bool) SystemSetting::get('inventory.strict_stock_enforcement', true)
            : true;

        if ($strictEnforcement && $item->stock < $requestedQty) {
            throw ValidationException::withMessages([
                'quantity' => "Insufficient stock for item: {$item->name} (Available: {$item->stock}, Requested: {$requestedQty})",
            ]);
        }

        // Ensure opening batch exists if item has stock but no batches
        if ($item->stock > 0 && $item->batches()->doesntExist()) {
            app(InventoryBalanceService::class)->ensureOpeningBatch($item);
        }

        // Lock eligible active batches ordered by date_received ASC, id ASC
        $batches = InventoryBatch::where('item_id', $item->id)
            ->whereNull('deleted_at')
            ->where('quantity_remaining', '>', 0)
            ->orderBy('date_received', 'asc')
            ->orderBy('id', 'asc')
            ->lockForUpdate()
            ->get();

        $allocations = [];
        $remainingToAllocate = $requestedQty;
        $totalAmount = 0.00;

        foreach ($batches as $batch) {
            if ($remainingToAllocate <= 0) {
                break;
            }

            $take = min((int) $batch->quantity_remaining, $remainingToAllocate);
            $amount = round($take * (float) $batch->unit_cost, 2);

            $allocations[] = [
                'batch' => $batch,
                'batch_id' => $batch->id,
                'quantity' => $take,
                'unit_cost' => (float) $batch->unit_cost,
                'amount' => $amount,
            ];

            $totalAmount += $amount;
            $batch->quantity_remaining -= $take;
            $batch->save();

            $remainingToAllocate -= $take;
        }

        // If batches didn't exist or didn't cover the full quantity (e.g. legacy items without full batch history)
        if ($remainingToAllocate > 0) {
            $unitCost = (float) ($item->unit_cost ?? 0.00);
            $amount = round($remainingToAllocate * $unitCost, 2);
            $allocations[] = [
                'batch' => null,
                'batch_id' => null,
                'quantity' => $remainingToAllocate,
                'unit_cost' => $unitCost,
                'amount' => $amount,
            ];
            $totalAmount += $amount;
        }

        $blendedUnitCost = $requestedQty > 0 ? round($totalAmount / $requestedQty, 2) : 0.00;

        return [
            'allocations' => $allocations,
            'total_amount' => round($totalAmount, 2),
            'blended_unit_cost' => $blendedUnitCost,
        ];
    }
}
