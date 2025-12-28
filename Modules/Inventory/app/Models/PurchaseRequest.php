<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Inventory\Database\Factories\PurchaseRequestFactory;

class PurchaseRequest extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'entity_name',
        'fund_cluster',
        'pr_no',
        'responsibility_center_code',
        'date',
        'purpose',
        'requested_by',
        'requested_designation',
        'approved_by',
        'approved_designation',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function items()
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    // protected static function newFactory(): PurchaseRequestFactory
    // {
    //     // return PurchaseRequestFactory::new();
    // }
}
