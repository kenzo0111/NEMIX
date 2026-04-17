<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Item extends Model
{
    protected $fillable = [
        'name',
        'sku',
        'stock',
        'unit_cost',
        'amount',
        'status',
        'description',
        'unit_of_issue',
    ];

    protected $casts = [
        'stock' => 'integer',
        'unit_cost' => 'decimal:2',
        'amount' => 'decimal:2',
    ];
}