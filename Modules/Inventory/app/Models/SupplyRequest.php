<?php

namespace Modules\Inventory\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class SupplyRequest extends Model
{
    protected $fillable = [
        'requested_by',
        'recipient',
        'recipient_designation',
        'fund_cluster',
        'date_requested',
        'department',
        'purpose',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_remarks',
        'ris_number',
        'issuance_id',
        'released_at',
    ];

    protected $casts = [
        'requested_by' => 'integer',
        'reviewed_at' => 'datetime',
        'released_at' => 'datetime',
        'date_requested' => 'date',
    ];

    public function items() { return $this->hasMany(SupplyRequestItem::class); }
    public function requester() { return $this->belongsTo(User::class, 'requested_by'); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }
    public function issuance() { return $this->belongsTo(Issuance::class); }
}
