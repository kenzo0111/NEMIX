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
        'forms_header',
        'total',
    ];

    protected $casts = [
        'job_order' => 'boolean',
        'contract_agreement' => 'boolean',
        'purchase_order' => 'boolean',
        'date' => 'date',
        'date_of_delivery' => 'date',
        'total' => 'decimal:2',
        'forms_header' => 'array',
    ];

    protected $appends = ['supplier_address', 'tin_number'];

    public function getSupplierAddressAttribute()
    {
        $supplier = \Modules\Suppliers\Models\Supplier::where('name', $this->supplier)->first();
        return $supplier ? $supplier->address : null;
    }

    public function getTinNumberAttribute()
    {
        $supplier = \Modules\Suppliers\Models\Supplier::where('name', $this->supplier)->first();
        return $supplier ? $supplier->tin : null;
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    // protected static function newFactory(): PurchaseOrderFactory
    // {
    //     // return PurchaseOrderFactory::new();
    // }
}
