<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Services\InventoryBalanceService;
use Modules\Inventory\Services\RequestStockAllocation;
use Modules\Inventory\Services\SupplyRequestService;
use Modules\Inventory\Services\WeeklyRequestQuota;

class ConvertApprovalStock extends Command
{
    protected $signature = 'inventory:convert-approval-stock {--dry-run : Validate conversion and roll back all changes} {--restore : Restore outstanding allocations to the legacy reservation model}';

    protected $description = 'Atomically convert existing approvals to deducted FIFO allocations, or restore them before rollback';

    public function handle(): int
    {
        DB::beginTransaction();
        try {
            $query = SupplyRequest::whereIn('status', ['Approved', 'Ready for Pickup']);
            $this->option('restore') ? $query->whereNotNull('stock_allocated_at') : $query->whereNull('stock_allocated_at');
            $ids = $query->orderBy('id')->pluck('id');
            foreach (SupplyRequest::whereIn('id', $ids)->orderBy('requested_by')->distinct()->pluck('requested_by')->unique() as $userId) {
                WeeklyRequestQuota::lockUser($userId);
            }
            $requests = SupplyRequest::whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get();
            $itemIds = DB::table('supply_request_items')->whereIn('supply_request_id', $ids)->pluck('item_id')->unique()->sort();
            $items = Item::whereIn('id', $itemIds)->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $count = 0;
            foreach ($requests as $request) {
                if (! in_array($request->status, ['Approved', 'Ready for Pickup'], true) || (bool) $request->stock_allocated_at !== (bool) $this->option('restore')) {
                    continue;
                }
                foreach ($request->items()->orderBy('item_id')->get() as $line) {
                    $item = $items->get($line->item_id);
                    if (! $item) {
                        throw new \RuntimeException("Request {$request->id}: item {$line->item_id} is archived or missing; reconcile before conversion.");
                    }
                    if ($this->option('restore')) {
                        RequestStockAllocation::restore($line);
                        app(InventoryBalanceService::class)->synchronizeItem($item);
                    } else {
                        // Existing approvals already reserve this stock. Preserve that commitment,
                        // including historical approvals below today's minimum-stock threshold.
                        $maximum = max(0, $item->stock - SupplyRequestService::reservedQuantity($item->id, $request->id));
                        if ($line->approved_quantity > $maximum) {
                            throw new \RuntimeException("Request {$request->id}, item {$item->id}: approved quantity exceeds available stock. No conversion changes were committed.");
                        }
                        RequestStockAllocation::allocate($line, $item, (int) $line->approved_quantity);
                    }
                }
                $request->update(['stock_allocated_at' => $this->option('restore') ? null : now()]);
                SupplyRequestService::audit($request, $request->reviewed_by ?: $request->requested_by, $this->option('restore') ? 'Restored Legacy Stock Reservation' : 'Converted Legacy Approval Allocation');
                $count++;
            }
            $this->option('dry-run') ? DB::rollBack() : DB::commit();
            $this->info(($this->option('dry-run') ? 'Validated (rolled back): ' : 'Completed: ').$count.' outstanding approvals.');

            return self::SUCCESS;
        } catch (\Throwable $error) {
            DB::rollBack();
            $this->error($error->getMessage());

            return self::FAILURE;
        }
    }
}
