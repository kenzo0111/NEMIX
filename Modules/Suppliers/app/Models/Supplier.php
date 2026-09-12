<?php

namespace Modules\Suppliers\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use SoftDeletes;

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($supplier) {
            if ($supplier->hasHistoricalTransactions()) {
                throw new \RuntimeException('This record cannot be permanently deleted because it is referenced by existing inventory transactions. Archive or deactivate the record instead.');
            }
        });
    }

    public function hasHistoricalTransactions(): bool
    {
        if (class_exists(\Modules\Inventory\Models\Receiving::class)) {
            if (\Modules\Inventory\Models\Receiving::where('supplier_id', $this->id)->exists()) {
                return true;
            }
        }

        if (class_exists(\Modules\Inventory\Models\Item::class)) {
            if (\Modules\Inventory\Models\Item::where('supplier_id', $this->id)->exists()) {
                return true;
            }
        }

        return false;
    }

    protected $fillable = [
        'name',
        'tin',
        'address',
        'reg_number',
        'category',
        'status',
        'amount',
        'created_by',
    ];

    protected $appends = [
        'contract_supplies_value',
        'total_received_value',
        'current_inventory_value',
        'total_received_quantity',
        'current_quantity',
        'batch_count',
    ];

    public function items()
    {
        return $this->hasMany(\Modules\Inventory\Models\Item::class, 'supplier_id');
    }

    public function inventoryBatches()
    {
        return $this->hasMany(\Modules\Inventory\Models\InventoryBatch::class, 'supplier_id');
    }

    public function batches()
    {
        return $this->inventoryBatches();
    }

    public function getTotalReceivedValueAttribute(): float
    {
        if (array_key_exists('total_received_value', $this->attributes)) {
            return (float) $this->attributes['total_received_value'];
        }

        if (class_exists(\Modules\Inventory\Models\InventoryBatch::class)) {
            return (float) ($this->inventoryBatches()
                ->whereNull('deleted_at')
                ->selectRaw('COALESCE(SUM(quantity_received * unit_cost), 0) as total_val')
                ->value('total_val') ?? 0.00);
        }

        return 0.00;
    }

    public function getCurrentInventoryValueAttribute(): float
    {
        if (array_key_exists('current_inventory_value', $this->attributes)) {
            return (float) $this->attributes['current_inventory_value'];
        }

        if (class_exists(\Modules\Inventory\Models\InventoryBatch::class)) {
            return (float) ($this->inventoryBatches()
                ->whereNull('deleted_at')
                ->where('quantity_remaining', '>', 0)
                ->where('unit_cost', '>', 0)
                ->selectRaw('COALESCE(SUM(quantity_remaining * unit_cost), 0) as total_val')
                ->value('total_val') ?? 0.00);
        }

        return 0.00;
    }

    public function getTotalReceivedQuantityAttribute(): int
    {
        if (array_key_exists('total_received_quantity', $this->attributes)) {
            return (int) $this->attributes['total_received_quantity'];
        }

        if (class_exists(\Modules\Inventory\Models\InventoryBatch::class)) {
            return (int) ($this->inventoryBatches()
                ->whereNull('deleted_at')
                ->sum('quantity_received') ?? 0);
        }

        return 0;
    }

    public function getCurrentQuantityAttribute(): int
    {
        if (array_key_exists('current_quantity', $this->attributes)) {
            return (int) $this->attributes['current_quantity'];
        }

        if (class_exists(\Modules\Inventory\Models\InventoryBatch::class)) {
            return (int) ($this->inventoryBatches()
                ->whereNull('deleted_at')
                ->where('quantity_remaining', '>', 0)
                ->sum('quantity_remaining') ?? 0);
        }

        return 0;
    }

    public function getBatchCountAttribute(): int
    {
        if (array_key_exists('batch_count', $this->attributes)) {
            return (int) $this->attributes['batch_count'];
        }

        if (class_exists(\Modules\Inventory\Models\InventoryBatch::class)) {
            return (int) ($this->inventoryBatches()
                ->whereNull('deleted_at')
                ->count() ?? 0);
        }

        return 0;
    }

    public function getContractSuppliesValueAttribute(): float
    {
        if (array_key_exists('contract_supplies_value', $this->attributes)) {
            return (float) $this->attributes['contract_supplies_value'];
        }

        return $this->getCurrentInventoryValueAttribute();
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}