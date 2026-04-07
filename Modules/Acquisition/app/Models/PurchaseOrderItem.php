<?php

namespace Modules\Acquisition\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Acquisition\Database\Factories\PurchaseOrderItemFactory;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'stock_no',
        'unit',
        'description',
        'quantity',
        'unit_cost',
        'amount',
        'ris', 'par', 'ics', 'iar',
        'ris_number', 'ris_date',
        'par_number', 'par_date',
        'ics_number', 'ics_date',
        'iar_number', 'iar_date',
        'ics_details', 'par_details', 'ris_details', 'iar_details',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
        'amount' => 'decimal:2',
        'ris' => 'boolean',
        'par' => 'boolean',
        'ics' => 'boolean',
        'iar' => 'boolean',
        'ics_details' => 'array',
        'par_details' => 'array',
        'ris_details' => 'array',
        'iar_details' => 'array',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
