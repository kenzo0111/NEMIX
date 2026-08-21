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

    /**
     * Get the user who recorded the receiving.
     */
    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
