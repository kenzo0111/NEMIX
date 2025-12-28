<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Inventory\Database\Factories\RequisitionIssueSlipFactory;

class RequisitionIssueSlip extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'entity_name',
        'fund_cluster',
        'division',
        'responsibility_center_code',
        'office',
        'ris_no',
        'purpose',
        'requested_by_name',
        'requested_by_designation',
        'requested_by_date',
        'approved_by_name',
        'approved_by_designation',
        'approved_by_date',
        'issued_by_name',
        'issued_by_designation',
        'issued_by_date',
        'received_by_name',
        'received_by_designation',
        'received_by_date',
    ];

    protected $casts = [
        'requested_by_date' => 'date',
        'approved_by_date' => 'date',
        'issued_by_date' => 'date',
        'received_by_date' => 'date',
    ];

    public function items()
    {
        return $this->hasMany(RequisitionIssueSlipItem::class);
    }

    // protected static function newFactory(): RequisitionIssueSlipFactory
    // {
    //     // return RequisitionIssueSlipFactory::new();
    // }
}
