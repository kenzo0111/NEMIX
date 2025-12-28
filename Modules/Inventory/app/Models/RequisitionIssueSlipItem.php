<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Inventory\Database\Factories\RequisitionIssueSlipItemFactory;

class RequisitionIssueSlipItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'requisition_issue_slip_id',
        'stock_no',
        'unit',
        'description',
        'quantity',
        'stock_available',
        'issue_quantity',
        'remarks',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'issue_quantity' => 'integer',
        'stock_available' => 'boolean',
    ];

    public function requisitionIssueSlip()
    {
        return $this->belongsTo(RequisitionIssueSlip::class);
    }

    // protected static function newFactory(): RequisitionIssueSlipItemFactory
    // {
    //     // return RequisitionIssueSlipItemFactory::new();
    // }
}
