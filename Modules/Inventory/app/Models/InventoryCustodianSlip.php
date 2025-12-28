<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Inventory\Database\Factories\InventoryCustodianSlipFactory;

class InventoryCustodianSlip extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'entity_name',
        'fund_cluster',
        'ics_no',
        'not_found_message',
        'received_from_name',
        'received_from_position',
        'received_from_date',
        'received_by_name',
        'received_by_position',
        'received_by_date',
    ];

    protected $casts = [
        'received_from_date' => 'date',
        'received_by_date' => 'date',
    ];

    public function items()
    {
        return $this->hasMany(InventoryCustodianSlipItem::class);
    }

    // protected static function newFactory(): InventoryCustodianSlipFactory
    // {
    //     // return InventoryCustodianSlipFactory::new();
    // }
}
