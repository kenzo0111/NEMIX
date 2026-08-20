<?php

namespace App\Models\Compliance;

use Illuminate\Database\Eloquent\Model;

class MemorandumReceiptMigratedRecord extends Model
{
    protected $table = 'memorandum_receipt_migrated_records';

    protected $fillable = [
        'migration_id',
        'migration_batch_id',
        'source_file',
        'source_sheet',
        'source_row',
        'form_identifier',
        'memorial_no',
        'date_received',
        'received_from',
        'received_by',
        'received_for',
        'remarks',
        'raw_data',
    ];

    protected $casts = [
        'raw_data' => 'array',
        'date_received' => 'date',
    ];
}
