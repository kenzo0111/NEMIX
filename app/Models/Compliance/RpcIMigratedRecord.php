<?php

namespace App\Models\Compliance;

use Illuminate\Database\Eloquent\Model;

class RpcIMigratedRecord extends Model
{
    protected $table = 'rpci_migrated_records';

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
        'stock_no',
        'item',
        'unit',
        'quantity_per_books',
        'physical_count',
        'variance',
        'unit_cost',
        'total_value',
        'location',
        'condition',
        'remarks',
        'raw_data',
    ];

    protected $casts = [
        'raw_data' => 'array',
        'date' => 'date',
    ];
}
