<?php

namespace Modules\Acquisition\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Acquisition\Database\Factories\PurchaseOrderFactory;

class PurchaseOrder extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'po_number',
        'supplier',
        'date',
        'mode',
        'fund_cluster',
        'job_order',
        'contract_agreement',
        'purchase_order',
        'place_of_delivery',
        'date_of_delivery',
        'delivery_term',
        'payment_term',
        'delivery_status',
        'end_user',
        'department',
        'designation',
        'total',
    ];

    protected $casts = [
        'job_order' => 'boolean',
        'contract_agreement' => 'boolean',
        'purchase_order' => 'boolean',
        'date' => 'date',
        'date_of_delivery' => 'date',
        'total' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    // protected static function newFactory(): PurchaseOrderFactory
    // {
    //     // return PurchaseOrderFactory::new();
    // }
}
