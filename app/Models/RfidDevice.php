<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RfidDevice extends Model
{
    protected $fillable = [
        'device_uuid', 'device_name', 'device_token_hash', 'device_secret_encrypted', 'firmware_version',
        'status', 'ip_address', 'wifi_rssi', 'uptime_seconds', 'scanner_ready',
        'last_seen_at', 'config_version',
    ];

    protected $hidden = ['device_token_hash', 'device_secret_encrypted'];

    protected $casts = [
        'device_secret_encrypted' => 'encrypted',
        'last_seen_at' => 'datetime',
        'scanner_ready' => 'boolean',
        'config_version' => 'integer',
        'uptime_seconds' => 'integer',
    ];

    public function settings(): HasOne
    {
        return $this->hasOne(RfidDeviceSetting::class, 'device_id');
    }

    public function isOnline(): bool
    {
        $interval = max(10, (int) ($this->settings?->heartbeat_interval ?? 30));

        return $this->last_seen_at?->greaterThan(now()->subSeconds($interval * 3)) ?? false;
    }
}
