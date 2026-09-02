<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PasswordChangeRequest extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'password_change_requests';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'token',
        'otp_hash',
        'pending_password',
        'expires_at',
        'attempts',
        'max_attempts',
        'resend_count',
        'resend_available_at',
        'is_used',
        'used_at',
        'ip_address',
        'user_agent',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'otp_hash',
        'pending_password',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'resend_available_at' => 'datetime',
            'used_at' => 'datetime',
            'is_used' => 'boolean',
            'attempts' => 'integer',
            'max_attempts' => 'integer',
            'resend_count' => 'integer',
        ];
    }

    /**
     * Get the user that owns the password change request.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Determine if the OTP request has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at ? $this->expires_at->isPast() : true;
    }

    /**
     * Determine if maximum incorrect attempts have been exceeded.
     */
    public function isMaxAttemptsExceeded(): bool
    {
        return $this->attempts >= $this->max_attempts;
    }

    /**
     * Determine if the user is currently permitted to resend an OTP.
     */
    public function canResend(): bool
    {
        if ($this->is_used || empty($this->pending_password)) {
            return false;
        }

        if ($this->resend_available_at && $this->resend_available_at->isFuture()) {
            return false;
        }

        return true;
    }

    /**
     * Number of seconds remaining until resend is available.
     */
    public function secondsUntilResendAvailable(): int
    {
        if ($this->resend_available_at && $this->resend_available_at->isFuture()) {
            return (int) now()->diffInSeconds($this->resend_available_at, false);
        }

        return 0;
    }
}
