<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComplianceReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'type',
        'reference',
        'item_name',
        'period_type',
        'date',
        'start_date',
        'end_date',
        'selected_month',
        'selected_year',
        'coverage_label',
        'payload',
        'created_by',
        'archived_at',
    ];

    protected $casts = [
        'date' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'payload' => 'array',
        'archived_at' => 'datetime',
    ];
}
