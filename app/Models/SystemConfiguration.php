<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemConfiguration extends Model
{
    use HasFactory;

    protected $table = 'system_configurations';

    protected $fillable = [
        'active_mode',
        'previous_mode',
        'status',
        'environment',
        'server_node',
        'ping_ms',
        'security_status',
        'changed_by_user_id',
        'changed_at',
        'change_reason',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
        'ping_ms' => 'integer',
    ];

    public static function current(): self
    {
        $config = static::first();

        if (! $config) {
            $config = static::create([
                'active_mode' => 'LIVE PRODUCTION',
                'previous_mode' => null,
                'status' => 'OPERATIONAL',
                'environment' => 'Production Database (Primary)',
                'server_node' => 'PH-MNL-PRM01',
                'ping_ms' => 12,
                'security_status' => '256-BIT TLS (STRICT ENFORCED)',
                'changed_by_user_id' => null,
                'changed_at' => now(),
                'change_reason' => 'Initial System Initialization',
            ]);
        }

        return $config;
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }

    public static function getModeDetails(string $mode): array
    {
        return match ($mode) {
            'STAGING SANDBOX' => [
                'status' => 'SANDBOX ACTIVE',
                'environment' => 'Staging DB (Sandbox)',
                'server_node' => 'PH-MNL-STG02',
                'ping_ms' => 15,
                'security_status' => 'ISOLATED SANDBOX',
            ],
            'MAINTENANCE MODE' => [
                'status' => 'MAINTENANCE LOCK',
                'environment' => 'Maintenance Lock',
                'server_node' => 'PH-MNL-MNT00',
                'ping_ms' => 8,
                'security_status' => 'RESTRICTED WRITE LOCK',
            ],
            'TRAINING SIMULATION' => [
                'status' => 'SIMULATION ACTIVE',
                'environment' => 'Synthetic Demo DB',
                'server_node' => 'PH-MNL-TRN09',
                'ping_ms' => 18,
                'security_status' => 'TRAINING SIMULATION',
            ],
            default => [ // LIVE PRODUCTION
                'status' => 'OPERATIONAL',
                'environment' => 'Production Database (Primary)',
                'server_node' => 'PH-MNL-PRM01',
                'ping_ms' => 12,
                'security_status' => '256-BIT TLS (STRICT ENFORCED)',
            ],
        };
    }
}
