<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Inventory\Database\Factories\PropertyAcknowledgementReceiptFactory;

class PropertyAcknowledgementReceipt extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'entity_name',
        'fund_cluster',
        'par_no',
        'grand_total',
        'received_by_name',
        'received_by_position',
        'received_date',
        'issued_by_name',
        'issued_by_position',
        'issued_date',
    ];

    protected $casts = [
        'grand_total' => 'decimal:2',
        'received_date' => 'date',
        'issued_date' => 'date',
    ];

    public function items()
    {
        return $this->hasMany(PropertyAcknowledgementReceiptItem::class);
    }

    // protected static function newFactory(): PropertyAcknowledgementReceiptFactory
    // {
    //     // return PropertyAcknowledgementReceiptFactory::new();
    // }
}
