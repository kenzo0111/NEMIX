<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use SoftDeletes;

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($item) {
            if ($item->isForceDeleting() && $item->hasHistoricalTransactions()) {
                throw new \RuntimeException('This record cannot be permanently deleted because it is referenced by existing inventory transactions. Archive or deactivate the record instead.');
            }
        });
    }

    public function hasHistoricalTransactions(): bool
    {
        if (class_exists(InventoryBatch::class) && InventoryBatch::where('item_id', $this->id)->exists()) {
            return true;
        }

        if (class_exists(Receiving::class) && Receiving::where('item_id', $this->id)->exists()) {
            return true;
        }

        if (class_exists(Issuance::class) && Issuance::where('item_id', $this->id)->exists()) {
            return true;
        }

        if (class_exists(IssuanceItem::class) && IssuanceItem::where('item_id', $this->id)->exists()) {
            return true;
        }

        return false;
    }

    protected $fillable = [
        'name',
        'supplier_id',
        'sku',
        'stock',
        'unit_cost',
        'amount',
        'status',
        'description',
        'unit_of_issue',
        'rfid_tag',
        'created_by',
    ];

    protected $casts = [
        'stock' => 'integer',
        'unit_cost' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    protected $appends = [
        'inventory_value',
    ];

    public function batches(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(InventoryBatch::class, 'item_id');
    }

    public function activeBatches(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(InventoryBatch::class, 'item_id')
            ->where('quantity_remaining', '>', 0)
            ->orderBy('date_received', 'asc')
            ->orderBy('id', 'asc');
    }

    public function getInventoryValueAttribute(): float
    {
        if (class_exists(InventoryBatch::class) && $this->batches()->exists()) {
            return (float) ($this->batches()
                ->where('quantity_remaining', '>', 0)
                ->selectRaw('COALESCE(SUM(quantity_remaining * unit_cost), 0) as total_val')
                ->value('total_val') ?? 0.00);
        }

        return (float) ($this->amount ?? ((float) $this->stock * (float) ($this->unit_cost ?? 0)));
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(\Modules\Suppliers\Models\Supplier::class, 'supplier_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}