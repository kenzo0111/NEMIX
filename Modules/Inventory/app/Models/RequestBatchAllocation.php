<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;

class RequestBatchAllocation extends Model
{
    protected $fillable = ['supply_request_item_id', 'inventory_batch_id', 'quantity', 'unit_cost', 'amount', 'state'];

    protected $casts = ['quantity' => 'integer', 'unit_cost' => 'decimal:2', 'amount' => 'decimal:2'];

    public function inventoryBatch()
    {
        return $this->belongsTo(InventoryBatch::class);
    }

    public function requestItem()
    {
        return $this->belongsTo(SupplyRequestItem::class, 'supply_request_item_id');
    }
}
