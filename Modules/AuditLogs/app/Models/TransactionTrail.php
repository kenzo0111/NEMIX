<?php

namespace Modules\AuditLogs\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;

class TransactionTrail extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'module',
        'action',
        'resource_ref',
        'details',
        'status',
        'audit_group_id',
        'is_parent',
        'event_key',
        'subject_type',
        'subject_id',
        'old_values',
        'new_values',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_parent' => 'boolean',
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Get the user that performed the transaction.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the child technical events associated with this business event group.
     */
    public function children()
    {
        return $this->hasMany(TransactionTrail::class, 'audit_group_id', 'audit_group_id')
            ->where('is_parent', false)
            ->whereNotNull('audit_group_id')
            ->orderBy('id', 'asc');
    }

    /**
     * Scope query to business-level transactions (parent rows or standalone events).
     */
    public function scopeBusinessEvents($query)
    {
        return $query->where('is_parent', true);
    }

    /**
     * Scope query to technical child events.
     */
    public function scopeChildEvents($query)
    {
        return $query->where('is_parent', false);
    }
}
