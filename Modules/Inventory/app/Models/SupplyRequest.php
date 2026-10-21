<?php

namespace Modules\Inventory\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class SupplyRequest extends Model
{
    protected $fillable = [
        'requires_supporting_document', 'supporting_document_type', 'supporting_document_path',
        'supporting_document_name', 'supporting_document_mime', 'document_verified_by',
        'document_verified_at', 'document_verification_remarks',
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
        'requires_supporting_document' => 'boolean',
        'document_verified_at' => 'datetime',
        'requested_by' => 'integer',
        'reviewed_at' => 'datetime',
        'released_at' => 'datetime',
        // A requisition date is a calendar day, not a UTC instant.
        'date_requested' => 'date:Y-m-d',
    ];

    public function items() { return $this->hasMany(SupplyRequestItem::class); }
    protected $hidden = ['supporting_document_path'];

    public function documentVerifier() { return $this->belongsTo(User::class, 'document_verified_by'); }
    public function requester() { return $this->belongsTo(User::class, 'requested_by'); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }
    public function issuance() { return $this->belongsTo(Issuance::class); }
}
