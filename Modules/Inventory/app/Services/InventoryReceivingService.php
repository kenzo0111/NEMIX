<?php

namespace Modules\Inventory\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;

class InventoryReceivingService
{
    public function __construct(
        protected InventoryBalanceService $balanceService
    ) {}

    /**
     * Records an incoming receiving transaction and creates a new inventory batch.
     */
    public function receive(array $data, ?int $userId = null): array
    {
        return $this->record($data, $userId);
    }

    /**
     * Alias for receive().
     */
    public function record(array $data, ?int $userId = null): array
    {
        return DB::transaction(function () use ($data, $userId) {
            $itemId = (int) $data['item_id'];
            $supplierId = (int) $data['supplier_id'];
            $quantity = (int) $data['quantity'];
            $unitCost = isset($data['unit_cost']) && $data['unit_cost'] !== '' ? (float) $data['unit_cost'] : 0.00;
            $dateReceived = $data['date_received'];

            $item = Item::where('id', $itemId)->lockForUpdate()->firstOrFail();

            // Ensure opening batch exists if item had standalone stock prior to receiving
            $this->balanceService->ensureOpeningBatch($item, $userId);

            // Default unit_cost to item's reference cost if not provided
            if ($unitCost <= 0 && (float) ($item->unit_cost ?? 0) > 0) {
                $unitCost = (float) $item->unit_cost;
            }

            // 1. Create receiving header record
            $receiving = Receiving::create([
                'item_id' => $item->id,
                'supplier_id' => $supplierId,
                'quantity' => $quantity,
                'date_received' => $dateReceived,
                'created_by' => $userId,
            ]);

            // 2. Create inventory batch
            $batch = InventoryBatch::create([
                'item_id' => $item->id,
                'receiving_id' => $receiving->id,
                'supplier_id' => $supplierId,
                'quantity_received' => $quantity,
                'quantity_remaining' => $quantity,
                'unit_cost' => $unitCost,
                'date_received' => $dateReceived,
                'created_by' => $userId,
            ]);

            // 3. If item had no supplier set, store as initial reference
            if (!$item->supplier_id && $supplierId) {
                $item->supplier_id = $supplierId;
            }

            // 4. Update cached stock & valuation
            $this->balanceService->synchronizeItem($item);

            // 5. Audit trail
            if (class_exists(TransactionTrail::class)) {
                TransactionTrail::create([
                    'user_id' => $userId,
                    'module' => 'Inventory',
                    'action' => 'Received Inventory Batch',
                    'resource_ref' => 'RR-' . $receiving->id,
                    'details' => json_encode([
                        'receiving_id' => $receiving->id,
                        'batch_id' => $batch->id,
                        'item_id' => $item->id,
                        'item_name' => $item->name,
                        'supplier_id' => $supplierId,
                        'quantity' => $quantity,
                        'unit_cost' => $unitCost,
                        'date_received' => $dateReceived,
                    ]),
                    'status' => 'completed',
                ]);
            }

            return [
                'receiving' => $receiving,
                'batch' => $batch,
            ];
        });
    }

    /**
     * Updates an existing receiving transaction and adjusts batch & stock by delta.
     */
    public function update(Receiving $receiving, array $data, ?int $userId = null): Receiving
    {
        return DB::transaction(function () use ($receiving, $data, $userId) {
            $lockedReceiving = Receiving::where('id', $receiving->id)->lockForUpdate()->firstOrFail();
            $batch = InventoryBatch::where('receiving_id', $lockedReceiving->id)->lockForUpdate()->first();

            $oldItemId = (int) $lockedReceiving->item_id;
            $oldQuantity = (int) $lockedReceiving->quantity;
            $newItemId = (int) ($data['item_id'] ?? $oldItemId);
            $newQuantity = (int) ($data['quantity'] ?? $oldQuantity);
            $newSupplierId = (int) ($data['supplier_id'] ?? $lockedReceiving->supplier_id);
            $newDate = $data['date_received'] ?? $lockedReceiving->date_received;

            if ($oldItemId === $newItemId) {
                $item = Item::where('id', $oldItemId)->lockForUpdate()->firstOrFail();
                $diff = $newQuantity - $oldQuantity;

                if ($batch) {
                    $consumedFromBatch = (int) $batch->quantity_received - (int) $batch->quantity_remaining;
                    if ($newQuantity < $consumedFromBatch) {
                        throw ValidationException::withMessages([
                            'quantity' => "Cannot reduce received quantity to {$newQuantity}. {$consumedFromBatch} units from this batch have already been issued to offices.",
                        ]);
                    }

                    $newRemaining = (int) $batch->quantity_remaining + $diff;
                    if ($newRemaining < 0) {
                        throw ValidationException::withMessages([
                            'quantity' => "Cannot reduce quantity: resulting batch remaining stock would be negative ({$newRemaining}).",
                        ]);
                    }

                    if ($item->stock + $diff < 0) {
                        throw ValidationException::withMessages([
                            'quantity' => "Cannot reduce received quantity by " . abs($diff) . ". Resulting stock balance for {$item->name} would be negative (" . ($item->stock + $diff) . ").",
                        ]);
                    }

                    $batch->quantity_received = $newQuantity;
                    $batch->quantity_remaining = $newRemaining;
                    $batch->supplier_id = $newSupplierId;
                    if (isset($data['unit_cost']) && $data['unit_cost'] !== '') {
                        $batch->unit_cost = (float) $data['unit_cost'];
                    }
                    $batch->date_received = $newDate;
                    $batch->save();
                } else {
                    if ($item->stock + $diff < 0) {
                        throw ValidationException::withMessages([
                            'quantity' => "Cannot reduce received quantity by " . abs($diff) . ". Resulting stock balance for {$item->name} would be negative (" . ($item->stock + $diff) . ").",
                        ]);
                    }
                    $item->stock += $diff;
                }

                $this->balanceService->synchronizeItem($item);
            } else {
                // Item reassignment
                $oldItem = Item::where('id', $oldItemId)->lockForUpdate()->firstOrFail();
                $newItem = Item::where('id', $newItemId)->lockForUpdate()->firstOrFail();

                if ($batch) {
                    $consumedFromBatch = (int) $batch->quantity_received - (int) $batch->quantity_remaining;
                    if ($consumedFromBatch > 0) {
                        throw ValidationException::withMessages([
                            'item_id' => "Cannot reassign item: {$consumedFromBatch} units from this batch have already been issued.",
                        ]);
                    }
                }

                if ($oldItem->stock - $oldQuantity < 0) {
                    throw ValidationException::withMessages([
                        'item_id' => "Cannot reassign item: reducing stock for {$oldItem->name} by {$oldQuantity} would result in a negative stock balance (" . ($oldItem->stock - $oldQuantity) . ").",
                    ]);
                }

                if ($batch) {
                    $batch->item_id = $newItem->id;
                    $batch->quantity_received = $newQuantity;
                    $batch->quantity_remaining = $newQuantity;
                    $batch->supplier_id = $newSupplierId;
                    if (isset($data['unit_cost']) && $data['unit_cost'] !== '') {
                        $batch->unit_cost = (float) $data['unit_cost'];
                    }
                    $batch->date_received = $newDate;
                    $batch->save();
                }

                $this->balanceService->synchronizeItem($oldItem);
                $this->balanceService->synchronizeItem($newItem);
            }

            $lockedReceiving->update([
                'item_id' => $newItemId,
                'supplier_id' => $newSupplierId,
                'quantity' => $newQuantity,
                'date_received' => $newDate,
            ]);

            return $lockedReceiving;
        });
    }

    /**
     * Voids a receiving record and its corresponding inventory batch.
     */
    public function void(Receiving $receiving, ?int $userId = null): void
    {
        DB::transaction(function () use ($receiving, $userId) {
            $lockedReceiving = Receiving::where('id', $receiving->id)->lockForUpdate()->firstOrFail();
            $batch = InventoryBatch::where('receiving_id', $lockedReceiving->id)->lockForUpdate()->first();
            $item = Item::where('id', $lockedReceiving->item_id)->lockForUpdate()->firstOrFail();

            if ($batch) {
                $consumed = (int) $batch->quantity_received - (int) $batch->quantity_remaining;
                if ($consumed > 0) {
                    throw ValidationException::withMessages([
                        'error' => "Cannot void receiving record: {$consumed} units from this batch have already been issued.",
                    ]);
                }

                if ($item->stock < (int) $batch->quantity_remaining) {
                    throw ValidationException::withMessages([
                        'error' => "Cannot void receiving record: current stock for {$item->name} ({$item->stock}) is less than batch quantity ({$batch->quantity_remaining}).",
                    ]);
                }

                $batch->delete();
            } else {
                if ($item->stock < (int) $lockedReceiving->quantity) {
                    throw ValidationException::withMessages([
                        'error' => "Cannot void receiving record: current stock for {$item->name} ({$item->stock}) is less than the received quantity ({$lockedReceiving->quantity}).",
                    ]);
                }
                $item->stock -= (int) $lockedReceiving->quantity;
            }

            $lockedReceiving->delete();
            $this->balanceService->synchronizeItem($item);
        });
    }
}
