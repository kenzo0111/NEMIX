<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Inventory\Database\Factories\InspectionAcceptanceReportFactory;

class InspectionAcceptanceReport extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'entity_name',
        'fund_cluster',
        'supplier',
        'iar_no',
        'po_no',
        'po_date',
        'iar_date',
        'invoice_no',
        'requisitioning_office',
        'responsibility_center_code',
        'responsibility_date',
        'date_inspected',
        'inspection_status',
        'inspection_officer_name',
        'inspection_officer_position',
        'date_received',
        'acceptance_status',
        'partial_quantity',
        'acceptance_officer_name',
        'acceptance_officer_position',
    ];

    protected $casts = [
        'po_date' => 'date',
        'iar_date' => 'date',
        'responsibility_date' => 'date',
        'date_inspected' => 'date',
        'date_received' => 'date',
    ];

    public function items()
    {
        return $this->hasMany(InspectionAcceptanceReportItem::class);
    }

    // protected static function newFactory(): InspectionAcceptanceReportFactory
    // {
    //     // return InspectionAcceptanceReportFactory::new();
    // }
}
