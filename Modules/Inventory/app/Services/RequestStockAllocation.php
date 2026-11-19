<?php

namespace Modules\Inventory\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\RequestBatchAllocation;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Models\SupplyRequestItem;

class RequestStockAllocation
{
    public static function allocate(SupplyRequestItem $line, Item $item, int $quantity): void
    {
        if ($quantity === 0) {
            return;
        }
        $result = app(InventoryCostingService::class)->allocateFifo($item, $quantity);
        foreach ($result['allocations'] as $allocation) {
            // Requisitions never accept synthetic shortages, even in non-strict direct issuance mode.
            if ($allocation['batch']->quantity_remaining < 0) {
                throw ValidationException::withMessages(['approved_quantities' => 'Available batches cannot cover this approval.']);
            }
            RequestBatchAllocation::create([
                'supply_request_item_id' => $line->id, 'inventory_batch_id' => $allocation['batch_id'],
                'quantity' => $allocation['quantity'], 'unit_cost' => $allocation['unit_cost'],
                'amount' => $allocation['amount'], 'state' => 'allocated',
            ]);
        }
        app(InventoryBalanceService::class)->synchronizeItem($item);
    }

    public static function restore(SupplyRequestItem $line): void
    {
        $allocations = $line->approvalAllocations()->where('state', 'allocated')->orderBy('inventory_batch_id')->lockForUpdate()->get();
        foreach ($allocations as $allocation) {
            $batch = InventoryBatch::whereKey($allocation->inventory_batch_id)->lockForUpdate()->firstOrFail();
            $batch->increment('quantity_remaining', $allocation->quantity);
            $allocation->update(['state' => 'restored']);
        }
    }

    public static function physicalQuantity(int $itemId): int
    {
        return (int) DB::table('request_batch_allocations as allocations')
            ->join('supply_request_items as lines', 'lines.id', '=', 'allocations.supply_request_item_id')
            ->where('lines.item_id', $itemId)->where('allocations.state', 'allocated')->sum('allocations.quantity');
    }

    public static function physicalBatchQuantity(int $batchId): int
    {
        return (int) RequestBatchAllocation::where('inventory_batch_id', $batchId)->where('state', 'allocated')->sum('quantity');
    }

    public static function decorateReview(SupplyRequest $request): SupplyRequest
    {
        $usage = WeeklyRequestQuota::usage($request->requested_by, $request->quota_week_start, $request->id);
        foreach ($request->items as $line) {
            if (! $line->item) {
                continue;
            }
            $existing = $request->stock_allocated_at ? (int) $line->approved_quantity : 0;
            $maximum = SupplyRequestService::requestableQuantity($line->item->stock + $existing, SupplyRequestService::reservedQuantity($line->item_id, $request->id));
            $requestMaximum = min($maximum, WeeklyRequestQuota::remaining($line->item, $usage));
            $line->setAttribute('max_request_quantity', $requestMaximum);
            $line->setAttribute('max_approval_quantity', min($line->quantity, $requestMaximum));
            $line->setAttribute('quota_remaining', WeeklyRequestQuota::remaining($line->item, $usage));
        }

        return $request;
    }
}
