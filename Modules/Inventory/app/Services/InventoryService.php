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
        $receivingService = app(InventoryReceivingService::class);
        $result = $receivingService->receive([
            'item_id' => $dto->item_id,
            'supplier_id' => $dto->supplier_id,
            'quantity' => $dto->quantity,
            'date_received' => $dto->date_received,
        ], auth()->id());

        return $result['receiving'];
    }

    /**
     * Record an issuance transaction.
     */
    public function recordIssuance(IssuanceDTO $dto): Issuance
    {
        $issuanceService = app(InventoryIssuanceService::class);
        return $issuanceService->issue([
            'recipient' => $dto->recipient,
            'department' => $dto->department,
            'fund_cluster' => $dto->fund_cluster,
            'recipient_designation' => $dto->recipient_designation,
            'purpose' => $dto->purpose,
            'approved_by' => $dto->approved_by ?: 'ARSENIO GEM A. GARCILLANOSA',
            'approved_by_designation' => $dto->approved_by_designation ?: 'SUPPLY OFFICER III/ADMIN OFFICER V',
            'date_issued' => $dto->date_issued,
        ], [
            [
                'item_id' => $dto->item_id,
                'quantity' => $dto->quantity,
            ]
        ], auth()->id());
    }

    // Generic execute method for ServiceInterface compliance
    public function execute(...$args)
    {
        // Not used directly; individual methods are preferred.
        return null;
    }
}
