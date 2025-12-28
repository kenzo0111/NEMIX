<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Inventory\Database\Factories\PropertyAcknowledgementReceiptItemFactory;

class PropertyAcknowledgementReceiptItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'property_acknowledgement_receipt_id',
        'quantity',
        'unit',
        'description',
        'property_number',
        'date_acquired',
        'amount',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'date_acquired' => 'date',
        'amount' => 'decimal:2',
    ];

    public function propertyAcknowledgementReceipt()
    {
        return $this->belongsTo(PropertyAcknowledgementReceipt::class);
    }

    // protected static function newFactory(): PropertyAcknowledgementReceiptItemFactory
    // {
    //     // return PropertyAcknowledgementReceiptItemFactory::new();
    // }
}
