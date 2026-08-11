<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComplianceMigratedRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_type',
        'source',
        'reference',
        'item_name',
        'quantity',
        'recipient',
        'department',
        'designation',
        'remarks',
        'date',
        'status',
        'payload',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'date' => 'date',
        'payload' => 'array',
    ];
}
