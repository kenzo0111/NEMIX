<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IssuanceItem extends Model
{
    use HasFactory;

    protected $table = 'issuance_items';

    protected $fillable = [
        'issuance_id',
        'item_id',
        'quantity',
        'unit_cost',
        'amount',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function issuance()
    {
        return $this->belongsTo(Issuance::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
