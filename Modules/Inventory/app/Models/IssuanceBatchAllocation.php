<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IssuanceBatchAllocation extends Model
{
    use HasFactory;

    protected $table = 'issuance_batch_allocations';

    protected $fillable = [
        'issuance_item_id',
        'inventory_batch_id',
        'quantity',
        'unit_cost',
        'amount',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function issuanceItem(): BelongsTo
    {
        return $this->belongsTo(IssuanceItem::class, 'issuance_item_id');
    }

    public function inventoryBatch(): BelongsTo
    {
        return $this->belongsTo(InventoryBatch::class, 'inventory_batch_id');
    }
}
