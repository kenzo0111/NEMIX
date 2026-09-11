<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSystemSettingsRequest;
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

        DB::transaction(function () use ($settingsData, &$updatedKeys, &$auditDiffs) {
            foreach ($settingsData as $key => $val) {
                $setting = SystemSetting::where('key', $key)->first();

                if ($setting) {
                    $oldVal = SystemSetting::castValue($setting->value, $setting->data_type);

                    // Normalize value based on type
                    $encodedValue = match ($setting->data_type) {
                        'integer' => json_encode((int) $val),
                        'float' => json_encode((float) $val),
                        'boolean' => json_encode(filter_var($val, FILTER_VALIDATE_BOOLEAN)),
                        'json', 'array' => json_encode(is_array($val) ? $val : json_decode($val, true)),
                        default => json_encode(trim((string) $val)),
                    };

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
            }
        });

        // Invalidate settings caches
        SystemSetting::clearSettingCache();

        // Create transaction audit trail
        try {
            if (class_exists(TransactionTrail::class)) {
                $user = $request->user();
                $diffSummary = count($auditDiffs) > 0
                    ? ' Changes: ' . implode('; ', array_slice($auditDiffs, 0, 5)) . (count($auditDiffs) > 5 ? '...' : '')
                    : '';

                TransactionTrail::create([
                    'user_id' => $user?->id,
                    'module' => 'System Settings',
                    'action' => 'Consumables Settings Updated',
                    'resource_ref' => 'CONFIG-BATCH-' . count($updatedKeys),
                    'details' => "Updated " . count($updatedKeys) . " configuration parameter(s) by {$user?->name} ({$user?->email}). IP: " . $request->ip() . '.' . $diffSummary,
                    'status' => 'Verified',
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Failed to log transaction trail for system settings: ' . $e->getMessage());
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
            Mail::raw(
                "This is an automated diagnostic test from the NEMIX Consumable Supply & Inventory Management System (SPMO - University of Camarines Norte). Your SMTP mail transport is operational!\n\nSent at: " . now()->toDateTimeString() . ' (PST)',
                function ($message) use ($recipient) {
                    $message->to($recipient)
                        ->subject('NEMIX SPMO: SMTP Email System Test');
                }
            );

            return back()->with('success', "Diagnostic test email dispatched successfully to {$recipient}.");
        } catch (\Throwable $e) {
            Log::error('SMTP Diagnostic Test Failed: ' . $e->getMessage());
            return back()->with('error', 'SMTP Connection Failed: ' . $e->getMessage());
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
        $filename = 'nemix_settings_backup_' . date('Y_m_d_His') . '.json';

        return response($json, 200, [
            'Content-Type' => 'application/json',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
