<?php

namespace App\Models\Compliance;

use Illuminate\Database\Eloquent\Model;

class StockCardMigratedRecord extends Model
{
    protected $table = 'stock_card_migrated_records';

    protected $fillable = [
        'migration_id',
        'migration_batch_id',
        'source_file',
        'source_sheet',
        'source_row',
        'form_identifier',
        'stock_no',
        'item',
        'unit',
        'date',
        'reference_no',
        'receipt_quantity',
        'issue_quantity',
        'balance',
        'unit_cost',
        'total_cost',
        'supplier_source',
        'office_end_user',
        'remarks',
        'raw_data',
    ];

    protected $casts = [
        'raw_data' => 'array',
        'date' => 'date',
    ];
}
