<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RfidDeviceSetting extends Model
{
    protected $fillable = [
        'device_id', 'wifi_ssid', 'wifi_password_encrypted', 'server_url',
        'scan_mode', 'rf_power', 'scan_timeout', 'heartbeat_interval',
        'buzzer_enabled', 'auto_reconnect', 'configuration_version',
    ];

    protected $hidden = ['wifi_password_encrypted'];

    protected $casts = [
        'wifi_password_encrypted' => 'encrypted',
        'rf_power' => 'integer',
        'scan_timeout' => 'integer',
        'heartbeat_interval' => 'integer',
        'buzzer_enabled' => 'boolean',
        'auto_reconnect' => 'boolean',
        'configuration_version' => 'integer',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(RfidDevice::class, 'device_id');
    }
}
