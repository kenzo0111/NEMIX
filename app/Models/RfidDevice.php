<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RfidDevice extends Model
{
    protected $fillable = [
        'device_uuid', 'device_name', 'device_token_hash', 'device_secret_encrypted', 'firmware_version',
        'status', 'ip_address', 'wifi_rssi', 'uptime_seconds', 'scanner_ready',
        'last_seen_at', 'config_version', 'applied_config_version', 'configuration_status',
        'configuration_status_version', 'configuration_message', 'configuration_reported_at', 'station_id',
    ];

    protected $hidden = ['device_token_hash', 'device_secret_encrypted'];

    protected $casts = [
        'device_secret_encrypted' => 'encrypted',
        'last_seen_at' => 'datetime',
        'scanner_ready' => 'boolean',
        'config_version' => 'integer',
        'applied_config_version' => 'integer',
        'configuration_status_version' => 'integer',
        'configuration_reported_at' => 'datetime',
        'uptime_seconds' => 'integer',
    ];

    public function settings(): HasOne
    {
        return $this->hasOne(RfidDeviceSetting::class, 'device_id');
    }

    public function isOnline(): bool
    {
        if ($this->status === 'disabled') {
            return false;
        }

        $interval = max(10, (int) ($this->settings?->heartbeat_interval ?? 30));

        return $this->last_seen_at?->greaterThan(now()->subSeconds($interval * 3)) ?? false;
    }
}
