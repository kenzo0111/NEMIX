<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
     * Authorize that the current authenticated user is a System Administrator.
     */
    protected function authorizeSystemAdmin(Request $request): void
    {
        $user = $request->user();

        $isSystemAdmin = $user && (
            (method_exists($user, 'isSystemAdmin') && $user->isSystemAdmin()) ||
            $user->hasRole('System Admin') ||
            $user->hasRole('System Administrator') ||
            ($user->role ?? null) === 'System Admin' ||
            ($user->role ?? null) === 'System Administrator'
        );

        if (! $isSystemAdmin) {
            abort(403, 'Unauthorized. Access to System Settings is restricted to System Administrators.');
        }
    }

    /**
     * Display the System Settings management console.
     */
    public function index(Request $request): Response
    {
        $this->authorizeSystemAdmin($request);

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
    public function update(Request $request): RedirectResponse
    {
        $this->authorizeSystemAdmin($request);

        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*' => ['nullable'],
        ]);

        $updatedKeys = [];
        $settingsData = $validated['settings'];

        DB::transaction(function () use ($settingsData, &$updatedKeys) {
            foreach ($settingsData as $key => $val) {
                $setting = SystemSetting::where('key', $key)->first();

                if ($setting) {
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
                }
            }
        });

        // Invalidate settings caches
        SystemSetting::clearSettingCache();

        // Create transaction audit trail
        try {
            if (class_exists(TransactionTrail::class)) {
                $user = $request->user();
                TransactionTrail::create([
                    'user_id' => $user?->id,
                    'module' => 'System Settings',
                    'action' => 'Consumables Settings Updated',
                    'resource_ref' => 'CONFIG-BATCH-' . count($updatedKeys),
                    'details' => "Updated " . count($updatedKeys) . " configuration parameter(s) by {$user?->name} ({$user?->email}). IP: " . $request->ip(),
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
        $this->authorizeSystemAdmin($request);

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
        $this->authorizeSystemAdmin($request);

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
