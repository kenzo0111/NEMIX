<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Inventory\Database\Factories\ReceivingFactory;

class Receiving extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'item_id',
        'supplier_id',
        'quantity',
        'date_received',
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
}
