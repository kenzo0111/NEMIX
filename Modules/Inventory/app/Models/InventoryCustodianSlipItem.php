<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Inventory\Database\Factories\InventoryCustodianSlipItemFactory;

class InventoryCustodianSlipItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'inventory_custodian_slip_id',
        'quantity',
        'unit',
        'unit_cost',
        'total_cost',
        'description',
        'item_no',
        'useful_life',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    public function inventoryCustodianSlip()
    {
        return $this->belongsTo(InventoryCustodianSlip::class);
    }

    // protected static function newFactory(): InventoryCustodianSlipItemFactory
    // {
    //     // return InventoryCustodianSlipItemFactory::new();
    // }
}
