<?php

namespace Modules\AuditLogs\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\AuditLogs\Database\Factories\LoginTrailFactory;

class LoginTrail extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'ip_address',
        'user_agent',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
