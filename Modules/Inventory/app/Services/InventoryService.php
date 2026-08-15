<?php

namespace Modules\Inventory\Services;

use App\Contracts\ServiceInterface;
use Modules\Inventory\DTOs\InventoryItemDTO;
use Modules\Inventory\DTOs\ReceivingDTO;
use Modules\Inventory\DTOs\IssuanceDTO;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Inventory\Models\Issuance;
use Illuminate\Support\Facades\DB;

class InventoryService implements ServiceInterface
{
    /**
     * List items with optional filters.
     */
    public function listItems(array $filters = []): array
    {
        $query = Item::with('supplier');
        // Apply filters if needed (e.g., by supplier, status)
        foreach ($filters as $field => $value) {
            $query->where($field, $value);
        }
        return $query->get()->toArray();
    }

    /**
     * Create a new inventory item.
     */
    public function createItem(InventoryItemDTO $dto): Item
    {
        $item = Item::create([
            'name' => $dto->name,
            'supplier_id' => $dto->supplier_id,
            'sku' => $dto->sku,
            'stock' => $dto->stock,
            'unit_cost' => $dto->unit_cost,
            'amount' => $dto->amount,
            'status' => $dto->status,
            'description' => $dto->description,
            'unit_of_issue' => $dto->unit_of_issue,
        ]);
        return $item;
    }

    /**
     * Update an existing item.
     */
    public function updateItem(int $id, InventoryItemDTO $dto): Item
    {
        $item = Item::findOrFail($id);
        $item->update([
            'name' => $dto->name,
            'supplier_id' => $dto->supplier_id,
            'sku' => $dto->sku,
            'stock' => $dto->stock,
            'unit_cost' => $dto->unit_cost,
            'amount' => $dto->amount,
            'status' => $dto->status,
            'description' => $dto->description,
            'unit_of_issue' => $dto->unit_of_issue,
        ]);
        return $item;
    }

    /**
     * Record a receiving transaction.
     */
    public function recordReceiving(ReceivingDTO $dto): Receiving
    {
        return DB::transaction(function () use ($dto) {
            $receiving = Receiving::create([
                'item_id' => $dto->item_id,
                'supplier_id' => $dto->supplier_id,
                'quantity' => $dto->quantity,
                'date_received' => $dto->date_received,
            ]);
            $item = Item::findOrFail($dto->item_id);
            $item->stock += $dto->quantity;
            // Recalculate amount and status (replicating controller logic)
            $item->amount = (float) $item->stock * (float) ($item->unit_cost ?? 0);
            $item->status = $item->stock <= 0 ? 'Out of Stock' : ($item->stock <= 10 ? 'Low Stock' : 'Available');
            $item->save();
            return $receiving;
        });
    }

    /**
     * Record an issuance transaction.
     */
    public function recordIssuance(IssuanceDTO $dto): Issuance
    {
        return DB::transaction(function () use ($dto) {
            $item = Item::findOrFail($dto->item_id);
            if ($item->stock < $dto->quantity) {
                abort(400, 'Insufficient stock');
            }
            $issuance = Issuance::create([
                'item_id' => $dto->item_id,
                'quantity' => $dto->quantity,
                'recipient' => $dto->recipient,
                'department' => $dto->department,
                'fund_cluster' => $dto->fund_cluster,
                'recipient_designation' => $dto->recipient_designation,
                'purpose' => $dto->purpose,
                'approved_by' => $dto->approved_by,
                'approved_by_designation' => $dto->approved_by_designation,
                'date_issued' => $dto->date_issued,
                'status' => 'Issued',
                'issued_by' => auth()->id(),
            ]);
            $item->stock -= $dto->quantity;
            $item->amount = (float) $item->stock * (float) ($item->unit_cost ?? 0);
            $item->status = $item->stock <= 0 ? 'Out of Stock' : ($item->stock <= 10 ? 'Low Stock' : 'Available');
            $item->save();
            return $issuance;
        });
    }

    // Generic execute method for ServiceInterface compliance
    public function execute(...$args)
    {
        // Not used directly; individual methods are preferred.
        return null;
    }
}
