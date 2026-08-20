<?php

namespace App\Models\Compliance;

use Illuminate\Database\Eloquent\Model;

class RsmiMigratedRecord extends Model
{
    protected $table = 'rsmi_migrated_records';

    protected $fillable = [
        'migration_id',
        'migration_batch_id',
        'source_file',
        'source_sheet',
        'source_row',
        'form_identifier',
        'serial_no',
        'date',
        'entity_name',
        'fund_cluster',
        'ris_no',
        'center_code',
        'stock_no',
        'item',
        'unit',
        'quantity_issued',
        'unit_cost',
        'amount',
        'raw_data',
    ];

    protected $casts = [
        'raw_data' => 'array',
        'date' => 'date',
    ];
}
