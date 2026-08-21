<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use SoftDeletes;

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

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(\Modules\Suppliers\Models\Supplier::class, 'supplier_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}