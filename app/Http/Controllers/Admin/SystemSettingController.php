<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSystemSettingsRequest;
use App\Models\RfidDevice;
use App\Models\SystemConfiguration;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AuditLogs\Models\TransactionTrail;

class SystemSettingController extends Controller
{
    /**
     * Authorize that the current authenticated user is a System Administrator or holds required permission.
     */
    protected function authorizeSystemAdmin(Request $request, string $permission = 'system.settings.index'): void
    {
        $user = $request->user();

        $isAuthorized = $user && (
            (method_exists($user, 'isSystemAdmin') && $user->isSystemAdmin()) ||
            $user->hasRole('System Admin') ||
            $user->hasRole('System Administrator') ||
            ($user->role ?? null) === 'System Admin' ||
            ($user->role ?? null) === 'System Administrator' ||
            (method_exists($user, 'can') && $user->can($permission))
        );

        if (! $isAuthorized) {
            abort(403, 'Unauthorized. Access to System Settings is restricted to System Administrators.');
        }
    }

    /**
     * Display the System Settings management console.
     */
    public function index(Request $request): Response
    {
        $this->authorizeSystemAdmin($request, 'system.settings.index');

        $groupedSettings = SystemSetting::getAllGrouped();
        $sysConfig = SystemConfiguration::current();

        $telemetry = [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'database_driver' => config('database.default'),
            'system_mode' => $sysConfig->active_mode,
            'server_node' => $sysConfig->server_node,
            'environment' => config('app.env'),
            'cached_at' => now()->toIso8601String(),
        ];

        return Inertia::render('Admin/SystemSettings/Index', [
            'groupedSettings' => $groupedSettings,
            'telemetry' => $telemetry,
            'signatories' => \App\Models\Signatory::orderBy('name')->get(),
            'rfidDevices' => RfidDevice::with('settings')->get()->map(fn (RfidDevice $device) => [
                'id' => $device->id,
                'device_uuid' => $device->device_uuid,
                'device_name' => $device->device_name,
                'firmware_version' => $device->firmware_version,
                'status' => $device->isOnline() ? 'online' : 'offline',
                'ip_address' => $device->ip_address,
                'last_seen_at' => $device->last_seen_at?->toIso8601String(),
                'config_version' => $device->config_version,
                'wifi_ssid' => $device->settings?->wifi_ssid,
                'server_url' => $device->settings?->server_url,
                'scan_mode' => $device->settings?->scan_mode,
                'rf_power' => $device->settings?->rf_power,
                'scan_timeout' => $device->settings?->scan_timeout,
                'heartbeat_interval' => $device->settings?->heartbeat_interval,
                'buzzer_enabled' => $device->settings?->buzzer_enabled,
                'auto_reconnect' => $device->settings?->auto_reconnect,
                'has_wifi_password' => filled($device->settings?->wifi_password_encrypted),
            ]),
        ]);
    }

    /**
     * Update system settings.
     */
    public function update(UpdateSystemSettingsRequest $request): RedirectResponse
    {
        $this->authorizeSystemAdmin($request, 'system.settings.update');

        $settingsData = $request->settingsData();

        $updatedKeys = [];
        $auditDiffs = [];
        $groupId = 'settings:'.\Illuminate\Support\Str::uuid()->toString();

        \Modules\AuditLogs\Support\AuditGroupContext::start($groupId, 'CONFIG-BATCH', 'Administration', 'system.settings.updated');

        try {
            DB::transaction(function () use ($settingsData, &$updatedKeys, &$auditDiffs) {
                foreach ($settingsData as $key => $val) {
                    $setting = SystemSetting::where('key', $key)->first();

                    if (! $setting) {
                        // Create if valid known domain setting
                        $category = explode('.', $key)[0] ?? 'general';
                        $dataType = str_ends_with($key, '_id')
                            ? 'integer'
                            : (is_bool($val) ? 'boolean' : (is_int($val) ? 'integer' : (is_array($val) ? 'json' : 'string')));
                        $label = ucwords(str_replace(['.', '_'], ' ', $key));

                        $encodedNewValue = (str_ends_with($key, '_id') || $dataType === 'integer')
                            ? ((is_null($val) || $val === '') ? json_encode(null) : json_encode((int) $val))
                            : (is_null($val) ? json_encode(null) : json_encode($val));

                        $setting = SystemSetting::create([
                            'category' => $category,
                            'key' => $key,
                            'value' => $encodedNewValue,
                            'data_type' => $dataType,
                            'label' => $label,
                            'description' => $label,
                            'is_public' => true,
                            'is_encrypted' => false,
                        ]);

                        $updatedKeys[] = $key;
                        $auditDiffs[] = "{$key}: [NEW] → ".(is_array($val) ? json_encode($val) : (string) $val);

                        continue;
                    }

                    $oldVal = SystemSetting::castValue($setting->value, $setting->data_type);

                    // Normalize value based on type
                    if ($setting->data_type === 'integer' || str_ends_with($key, '_id')) {
                        $encodedValue = (is_null($val) || $val === '') ? json_encode(null) : json_encode((int) $val);
                    } elseif (is_null($val)) {
                        $encodedValue = json_encode(null);
                    } else {
                        $encodedValue = match ($setting->data_type) {
                            'float' => json_encode((float) $val),
                            'boolean' => json_encode(filter_var($val, FILTER_VALIDATE_BOOLEAN)),
                            'json', 'array' => json_encode(is_array($val) ? $val : json_decode($val, true)),
                            default => json_encode(trim((string) $val)),
                        };
                    }

                    $setting->update([
                        'value' => $encodedValue,
                    ]);

                    $updatedKeys[] = $key;

                    // Track audit diff (omitting any potentially sensitive keys)
                    $isSensitive = str_contains(strtolower($key), 'secret') ||
                                   str_contains(strtolower($key), 'password') ||
                                   str_contains(strtolower($key), 'token');

                    if ($isSensitive) {
                        $auditDiffs[] = "{$key}: [REDACTED]";
                    } else {
                        $oldDisplay = is_array($oldVal) ? json_encode($oldVal) : (is_bool($oldVal) ? ($oldVal ? 'true' : 'false') : (string) $oldVal);
                        $newDisplay = is_array($val) ? json_encode($val) : (is_bool($val) ? ($val ? 'true' : 'false') : (string) $val);
                        if ($oldDisplay !== $newDisplay) {
                            $auditDiffs[] = "{$key}: {$oldDisplay} → {$newDisplay}";
                        }
                    }
                }
            });
        } finally {
            \Modules\AuditLogs\Support\AuditGroupContext::stop();
        }

        // Invalidate settings caches
        SystemSetting::clearSettingCache();

        // Create transaction audit trail (Parent Business Transaction)
        try {
            if (class_exists(TransactionTrail::class)) {
                $user = $request->user();
                $count = count($updatedKeys);
                $secondaryLine = "Updated {$count} configuration parameter".($count === 1 ? '' : 's');

                TransactionTrail::create([
                    'user_id' => $user?->id,
                    'module' => 'Administration',
                    'action' => 'Updated System Settings',
                    'resource_ref' => 'CONFIG-BATCH-'.$count,
                    'details' => $secondaryLine,
                    'status' => 'Success',
                    'audit_group_id' => $groupId,
                    'is_parent' => true,
                    'event_key' => 'system.settings.updated',
                    'metadata' => [
                        'updated_keys' => $updatedKeys,
                        'diffs' => $auditDiffs,
                    ],
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Failed to log transaction trail for system settings: '.$e->getMessage());
        }

        return back()->with('success', 'System settings saved successfully.');
    }

    /**
     * Send a diagnostic test email to verify SMTP configuration.
     */
    public function testEmail(Request $request): RedirectResponse
    {
        $this->authorizeSystemAdmin($request, 'system.settings.test-email');

        $validated = $request->validate([
            'recipient' => ['nullable', 'email'],
        ]);

        $recipient = $validated['recipient'] ?: $request->user()->email;

        try {
            $body = "SMTP Configuration Test\n\n" .
                "This is a test email from the UCN Supply & Property Management Office System.\n\n" .
                "If you received this message successfully, the configured outgoing mail service is functioning correctly.\n\n" .
                "Supply & Property Management Office\n" .
                "University of Camarines Norte";

            Mail::raw($body, function ($message) use ($recipient) {
                $message->to($recipient)
                    ->subject('[SPMO System] SMTP Configuration Test');
            });

            return back()->with('success', "Diagnostic test email dispatched successfully to {$recipient}.");
        } catch (\Throwable $e) {
            Log::error('SMTP Diagnostic Test Failed: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return back()->with('error', 'SMTP test email failed. Please verify the mail configuration or review the system logs.');
        }
    }

    /**
     * Export a database backup or data snapshot.
     */
    public function exportBackup(Request $request)
    {
        $this->authorizeSystemAdmin($request, 'system.settings.backup');

        $data = [
            'exported_at' => now()->toIso8601String(),
            'system' => SystemConfiguration::current()->toArray(),
            'settings' => SystemSetting::all()->toArray(),
        ];

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $filename = 'nemix_settings_backup_'.date('Y_m_d_His').'.json';

        return response($json, 200, [
            'Content-Type' => 'application/json',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
