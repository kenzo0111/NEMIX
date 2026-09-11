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
    ];

    public function items()
    {
        return $this->hasMany(\Modules\Inventory\Models\Item::class, 'supplier_id');
    }

    public function getContractSuppliesValueAttribute(): float
    {
        if (array_key_exists('contract_supplies_value', $this->attributes)) {
            return (float) $this->attributes['contract_supplies_value'];
        }

        if ($this->relationLoaded('items')) {
            return (float) $this->items
                ->where('stock', '>', 0)
                ->sum(fn ($item) => (float) $item->stock * (float) ($item->unit_cost ?? 0));
        }

        if (! class_exists(\Modules\Inventory\Models\Item::class)) {
            return 0.00;
        }

        return (float) ($this->items()
            ->where('stock', '>', 0)
            ->where('unit_cost', '>', 0)
            ->selectRaw('COALESCE(SUM(stock * unit_cost), 0) as total_val')
            ->value('total_val') ?? 0.00);
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}