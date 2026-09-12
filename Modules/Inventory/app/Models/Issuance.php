<?php

namespace Modules\Inventory\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Issuance extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ris_number',
        'item_id',
        'quantity',
        'recipient',
        'department',
        'fund_cluster',
        'recipient_designation',
        'purpose',
        'approved_by',
        'approved_by_designation',
        'issued_by_name',
        'issued_by_position',
        'snapshot',
        'date_issued',
        'status',
        'issued_by',
    ];

    protected $casts = [
        'date_issued' => 'date',
        'snapshot' => 'array',
    ];

    public function items()
    {
        return $this->hasMany(IssuanceItem::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function issuer()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}