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
    ];

    /**
     * Get the user that performed the transaction.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
