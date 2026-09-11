<?php

namespace Modules\Inventory\Services;

use App\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\IssuanceBatchAllocation;
use Modules\Inventory\Models\IssuanceItem;
use Modules\Inventory\Models\Item;

class InventoryIssuanceService
{
    public function __construct(
        protected InventoryBalanceService $balanceService,
        protected InventoryCostingService $costingService
    ) {}

    /**
     * Issues stock transactionally with FIFO batch allocation from payload.
     */
    public function store(array $payload, ?int $userId = null): Issuance
    {
        $lines = $payload['lines'] ?? $payload['issuances'] ?? [];
        return $this->issue($payload, $lines, $userId);
    }

    /**
     * Issues stock transactionally with FIFO batch allocation.
     */
    public function issue(array $data, array $lines, ?int $userId = null): Issuance
    {
        return DB::transaction(function () use ($data, $lines, $userId) {
            $normalizedDate = $data['date_issued'];

            // 1. Group requested lines by item_id
            $condensed = [];
            foreach ($lines as $line) {
                $iid = (int) $line['item_id'];
                $qty = (int) $line['quantity'];
                if ($qty <= 0) continue;
                $condensed[$iid] = ($condensed[$iid] ?? 0) + $qty;
            }

            if (empty($condensed)) {
                throw ValidationException::withMessages([
                    'issuances' => 'At least one item with valid quantity must be issued.',
                ]);
            }

            // 2. Lock all items in deterministic order
            $itemIds = array_keys($condensed);
            sort($itemIds);
            $lockedItems = Item::whereIn('id', $itemIds)->lockForUpdate()->get()->keyBy('id');

            // 3. Validate stock availability
            $strict = class_exists(SystemSetting::class)
                ? (bool) SystemSetting::get('inventory.strict_stock_enforcement', true)
                : true;

            foreach ($condensed as $itemId => $qty) {
                $item = $lockedItems->get($itemId);
                if (!$item || ($strict && $item->stock < $qty)) {
                    $available = $item ? $item->stock : 0;
                    $name = $item ? $item->name : "Item #{$itemId}";
                    throw ValidationException::withMessages([
                        'issuances' => "Insufficient stock for item: {$name} (Available: {$available}, Requested: {$qty})",
                    ]);
                }
            }

            // 4. Generate RIS number
            $risPrefix = class_exists(SystemSetting::class)
                ? SystemSetting::get('numbering.ris_prefix', 'RIS-')
                : 'RIS-';

            $dateCarbon = Carbon::parse($normalizedDate);
            $yearMonth = $dateCarbon->format('Y-m');

            $monthCount = Issuance::whereYear('date_issued', $dateCarbon->year)
                ->whereMonth('date_issued', $dateCarbon->month)
                ->count();
            $seq = $monthCount + 1;
            $risNumber = sprintf('%s%s-%04d', $risPrefix, $yearMonth, $seq);
            while (Issuance::where('ris_number', $risNumber)->exists()) {
                $seq++;
                $risNumber = sprintf('%s%s-%04d', $risPrefix, $yearMonth, $seq);
            }

            $primaryItemId = $itemIds[0];
            $totalQuantity = array_sum($condensed);

            // 5. Create Issuance parent record
            $issuance = Issuance::create([
                'ris_number' => $risNumber,
                'item_id' => $primaryItemId,
                'quantity' => $totalQuantity,
                'recipient' => $data['recipient'],
                'department' => $data['department'] ?? null,
                'fund_cluster' => $data['fund_cluster'] ?? '01 - Regular Agency Fund',
                'recipient_designation' => $data['recipient_designation'] ?? null,
                'purpose' => $data['purpose'] ?? null,
                'approved_by' => $data['approved_by'] ?? null,
                'approved_by_designation' => $data['approved_by_designation'] ?? null,
                'date_issued' => $normalizedDate,
                'status' => 'Issued',
                'issued_by' => $userId,
            ]);

            // 6. Allocate batches via FIFO and create detail records
            foreach ($condensed as $itemId => $qty) {
                $item = $lockedItems->get($itemId);
                $costingResult = $this->costingService->allocateFifo($item, $qty);

                $issuanceItem = IssuanceItem::create([
                    'issuance_id' => $issuance->id,
                    'item_id' => $item->id,
                    'quantity' => $qty,
                    'unit_cost' => $costingResult['blended_unit_cost'],
                    'amount' => $costingResult['total_amount'],
                ]);

                foreach ($costingResult['allocations'] as $alloc) {
                    if ($alloc['batch']) {
                        IssuanceBatchAllocation::create([
                            'issuance_item_id' => $issuanceItem->id,
                            'inventory_batch_id' => $alloc['batch']->id,
                            'quantity' => $alloc['quantity'],
                            'unit_cost' => $alloc['unit_cost'],
                            'amount' => $alloc['amount'],
                        ]);
                    }
                }

                $this->balanceService->synchronizeItem($item);
            }

            // 7. Audit log
            if (class_exists(TransactionTrail::class)) {
                TransactionTrail::create([
                    'user_id' => $userId,
                    'module' => 'Inventory',
                    'action' => 'Created Stock Issuance',
                    'resource_ref' => $issuance->ris_number,
                    'details' => json_encode([
                        'issuance_id' => $issuance->id,
                        'ris_number' => $issuance->ris_number,
                        'recipient' => $issuance->recipient,
                        'department' => $issuance->department,
                        'total_quantity' => $totalQuantity,
                        'items_count' => count($condensed),
                    ]),
                    'status' => 'completed',
                ]);
            }

            return $issuance;
        });
    }

    /**
     * Updates an existing issuance, reversing prior batch allocations and applying new ones.
     */
    public function update(Issuance $issuance, array $data, array $lines, ?int $userId = null): Issuance
    {
        return DB::transaction(function () use ($issuance, $data, $lines, $userId) {
            $lockedIssuance = Issuance::where('id', $issuance->id)->lockForUpdate()->firstOrFail();
            $normalizedDate = $data['date_issued'];
            $newStatus = $data['status'] ?? $lockedIssuance->status;

            // Retrieve old child items and their batch allocations
            $oldChildItems = $lockedIssuance->items()->with('allocations')->get();
            $oldItemIds = [];

            if ($lockedIssuance->status === 'Issued') {
                foreach ($oldChildItems as $ci) {
                    $oldItemIds[] = (int) $ci->item_id;
                    if ($ci->allocations->isNotEmpty()) {
                        // Restore allocations back to batches
                        foreach ($ci->allocations as $allocation) {
                            $batch = InventoryBatch::where('id', $allocation->inventory_batch_id)->lockForUpdate()->first();
                            if ($batch) {
                                $batch->quantity_remaining += (int) $allocation->quantity;
                                $batch->save();
                            }
                        }
                    } else {
                        // Legacy child item without allocations: restore to batch or item stock
                        $it = Item::where('id', $ci->item_id)->lockForUpdate()->first();
                        if ($it) {
                            $batch = InventoryBatch::where('item_id', $ci->item_id)
                                ->whereNull('deleted_at')
                                ->latest('date_received')
                                ->latest('id')
                                ->lockForUpdate()
                                ->first();
                            if ($batch) {
                                $batch->quantity_remaining += (int) $ci->quantity;
                                $batch->save();
                            } else {
                                $it->stock += (int) $ci->quantity;
                                $it->save();
                            }
                        }
                    }
                }

                // If legacy parent-level issuance without child lines
                if ($oldChildItems->isEmpty() && $lockedIssuance->item_id) {
                    $oldItemIds[] = (int) $lockedIssuance->item_id;
                    $legacyItem = Item::where('id', $lockedIssuance->item_id)->lockForUpdate()->first();
                    if ($legacyItem) {
                        $legacyItem->stock += (int) $lockedIssuance->quantity;
                        $legacyItem->save();
                    }
                }
            }

            // Condense new requested lines
            $condensed = [];
            foreach ($lines as $line) {
                $iid = (int) $line['item_id'];
                $qty = (int) $line['quantity'];
                if ($qty <= 0) continue;
                $condensed[$iid] = ($condensed[$iid] ?? 0) + $qty;
            }

            // Lock all affected items
            $allItemIds = array_values(array_unique(array_merge($oldItemIds, array_keys($condensed))));
            sort($allItemIds);
            $lockedItems = Item::whereIn('id', $allItemIds)->lockForUpdate()->get()->keyBy('id');

            // Refresh items whose stock was restored
            foreach ($oldItemIds as $oid) {
                $it = $lockedItems->get($oid);
                if ($it) {
                    $this->balanceService->synchronizeItem($it);
                }
            }

            // If new status is Issued, validate stock and allocate batches
            $totalQuantity = 0;
            $totalAmount = 0.00;
            $primaryItemId = !empty($condensed) ? array_keys($condensed)[0] : $lockedIssuance->item_id;

            // Delete old child items (allocations cascade deleted)
            $lockedIssuance->items()->delete();

            if ($newStatus === 'Issued') {
                $strict = class_exists(SystemSetting::class)
                    ? (bool) SystemSetting::get('inventory.strict_stock_enforcement', true)
                    : true;

                foreach ($condensed as $itemId => $qty) {
                    $item = $lockedItems->get($itemId);
                    if (!$item || ($strict && $item->stock < $qty)) {
                        $available = $item ? $item->stock : 0;
                        $name = $item ? $item->name : "Item #{$itemId}";
                        throw ValidationException::withMessages([
                            'quantity' => "Insufficient stock for item: {$name} (Available: {$available}, Requested: {$qty})",
                        ]);
                    }
                }

                foreach ($condensed as $itemId => $qty) {
                    $item = $lockedItems->get($itemId);
                    $costingResult = $this->costingService->allocateFifo($item, $qty);

                    $issuanceItem = IssuanceItem::create([
                        'issuance_id' => $lockedIssuance->id,
                        'item_id' => $item->id,
                        'quantity' => $qty,
                        'unit_cost' => $costingResult['blended_unit_cost'],
                        'amount' => $costingResult['total_amount'],
                    ]);

                    foreach ($costingResult['allocations'] as $alloc) {
                        if ($alloc['batch']) {
                            IssuanceBatchAllocation::create([
                                'issuance_item_id' => $issuanceItem->id,
                                'inventory_batch_id' => $alloc['batch']->id,
                                'quantity' => $alloc['quantity'],
                                'unit_cost' => $alloc['unit_cost'],
                                'amount' => $alloc['amount'],
                            ]);
                        }
                    }

                    $totalQuantity += $qty;
                    $totalAmount += $costingResult['total_amount'];
                    $this->balanceService->synchronizeItem($item);
                }
            } else {
                // Pending or Cancelled
                foreach ($condensed as $itemId => $qty) {
                    $item = $lockedItems->get($itemId);
                    IssuanceItem::create([
                        'issuance_id' => $lockedIssuance->id,
                        'item_id' => $itemId,
                        'quantity' => $qty,
                        'unit_cost' => (float) ($item?->unit_cost ?? 0.00),
                        'amount' => round($qty * (float) ($item?->unit_cost ?? 0.00), 2),
                    ]);
                    $totalQuantity += $qty;
                }
            }

            // Update parent fields
            $updateData = [
                'recipient' => $data['recipient'],
                'department' => $data['department'] ?? null,
                'fund_cluster' => $data['fund_cluster'] ?? null,
                'recipient_designation' => $data['recipient_designation'] ?? null,
                'purpose' => $data['purpose'] ?? null,
                'approved_by' => $data['approved_by'] ?? null,
                'approved_by_designation' => $data['approved_by_designation'] ?? null,
                'date_issued' => $normalizedDate,
                'status' => $newStatus,
                'item_id' => $primaryItemId,
                'quantity' => $totalQuantity,
            ];
            $lockedIssuance->update($updateData);

            return $lockedIssuance;
        });
    }

    /**
     * Voids or archives an issuance and restores batch stock.
     */
    public function destroy(Issuance $issuance, ?int $userId = null): void
    {
        DB::transaction(function () use ($issuance, $userId) {
            $lockedIssuance = Issuance::where('id', $issuance->id)->lockForUpdate()->firstOrFail();

            if ($lockedIssuance->status === 'Issued') {
                $childItems = $lockedIssuance->items()->with('allocations')->get();
                $touchedItems = [];

                foreach ($childItems as $ci) {
                    $touchedItems[$ci->item_id] = true;
                    if ($ci->allocations->isNotEmpty()) {
                        foreach ($ci->allocations as $allocation) {
                            $batch = InventoryBatch::where('id', $allocation->inventory_batch_id)->lockForUpdate()->first();
                            if ($batch) {
                                $batch->quantity_remaining += (int) $allocation->quantity;
                                $batch->save();
                            }
                        }
                    } else {
                        $it = Item::where('id', $ci->item_id)->lockForUpdate()->first();
                        if ($it) {
                            $batch = InventoryBatch::where('item_id', $ci->item_id)
                                ->whereNull('deleted_at')
                                ->latest('date_received')
                                ->latest('id')
                                ->lockForUpdate()
                                ->first();
                            if ($batch) {
                                $batch->quantity_remaining += (int) $ci->quantity;
                                $batch->save();
                            } else {
                                $it->stock += (int) $ci->quantity;
                                $it->save();
                            }
                        }
                    }
                }

                if ($childItems->isEmpty() && $lockedIssuance->item_id) {
                    $item = Item::where('id', $lockedIssuance->item_id)->lockForUpdate()->first();
                    if ($item) {
                        $item->stock += (int) $lockedIssuance->quantity;
                        $item->save();
                        $touchedItems[$item->id] = true;
                    }
                }

                foreach (array_keys($touchedItems) as $itemId) {
                    $it = Item::where('id', $itemId)->lockForUpdate()->first();
                    if ($it) {
                        $this->balanceService->synchronizeItem($it);
                    }
                }
            }

            $lockedIssuance->delete();
        });
    }
}
