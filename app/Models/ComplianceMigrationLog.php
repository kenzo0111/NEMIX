<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComplianceMigrationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_type',
        'source',
        'records_count',
        'status',
        'message',
        'created_by',
    ];

    protected $casts = [
        'records_count' => 'integer',
    ];
}
