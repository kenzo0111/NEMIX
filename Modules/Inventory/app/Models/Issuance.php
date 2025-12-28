<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Issuance extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'quantity',
        'recipient',
        'department',
        'fund_cluster',
        'recipient_designation',
        'purpose',
        'approved_by',
        'approved_by_designation',
        'date_issued',
        'status',
        'issued_by',
    ];

    protected $casts = [
        'date_issued' => 'date',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function issuer()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}