<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Inventory\Database\Factories\InspectionAcceptanceReportItemFactory;

class InspectionAcceptanceReportItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'inspection_acceptance_report_id',
        'stock_no',
        'description',
        'unit',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function inspectionAcceptanceReport()
    {
        return $this->belongsTo(InspectionAcceptanceReport::class);
    }

    // protected static function newFactory(): InspectionAcceptanceReportItemFactory
    // {
    //     // return InspectionAcceptanceReportItemFactory::new();
    // }
}
