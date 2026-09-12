<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Receiving extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'item_id',
        'supplier_id',
        'supplier_stock_no',
        'quantity',
        'date_received',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'date_received' => 'date',
    ];

    /**
     * Get the item that was received.
     */
    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Get the supplier who supplied the item.
     */
    public function supplier()
    {
        return $this->belongsTo(\Modules\Suppliers\Models\Supplier::class);
    }

    public function batch()
    {
        return $this->hasOne(InventoryBatch::class, 'receiving_id');
    }

    public function getUnitCostAttribute(): float
    {
        if ($this->batch) {
            return (float) $this->batch->unit_cost;
        }
        return (float) ($this->item?->unit_cost ?? 0.00);
    }

    public function getQuantityRemainingAttribute(): int
    {
        if ($this->batch) {
            return (int) $this->batch->quantity_remaining;
        }
        return (int) $this->quantity;
    }

    public function getAmountAttribute(): float
    {
        return round((float) $this->quantity * (float) $this->unit_cost, 2);
    }

    public function getSupplierStockNoAttribute(): ?string
    {
        if (isset($this->attributes['supplier_stock_no']) && $this->attributes['supplier_stock_no'] !== null) {
            return $this->attributes['supplier_stock_no'];
        }
        return $this->batch?->supplier_stock_no;
    }

    /**
     * Get the user who recorded the receiving.
     */
    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
