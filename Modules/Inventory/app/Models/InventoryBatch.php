<?php

namespace Modules\Inventory\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Suppliers\Models\Supplier;

class InventoryBatch extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inventory_batches';

    protected $fillable = [
        'item_id',
        'receiving_id',
        'supplier_id',
        'supplier_stock_no',
        'quantity_received',
        'quantity_remaining',
        'unit_cost',
        'date_received',
        'created_by',
    ];

    protected $casts = [
        'quantity_received' => 'integer',
        'quantity_remaining' => 'integer',
        'unit_cost' => 'decimal:2',
        'date_received' => 'date',
    ];

    protected $appends = [
        'batch_value',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    public function receiving(): BelongsTo
    {
        return $this->belongsTo(Receiving::class, 'receiving_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(IssuanceBatchAllocation::class, 'inventory_batch_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getBatchValueAttribute(): float
    {
        return round((float) $this->quantity_remaining * (float) $this->unit_cost, 2);
    }
}
