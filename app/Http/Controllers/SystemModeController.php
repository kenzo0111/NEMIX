<?php

namespace App\Http\Controllers;

use App\Models\SystemConfiguration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\AuditLogs\Models\TransactionTrail;

class SystemModeController extends Controller
{
    /**
     * Update the active system operating mode.
     * Restricted strictly to System Administrator.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        // 1. Backend Authorization Check: System Administrator only
        $isSystemAdmin = $user && (
            $user->hasRole('System Admin') ||
            $user->hasRole('System Administrator') ||
            ($user->role ?? null) === 'System Admin' ||
            ($user->role ?? null) === 'System Administrator'
        );

        if (! $isSystemAdmin) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthorized. Only System Administrator can change the active operating mode.',
                ], 403);
            }

            abort(403, 'Unauthorized. Only System Administrator can change the active operating mode.');
        }

        // 2. Server-side Input Validation
        $validated = $request->validate([
            'mode' => [
                'required',
                'string',
                'in:LIVE PRODUCTION,STAGING SANDBOX,MAINTENANCE MODE,TRAINING SIMULATION',
            ],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $newMode = $validated['mode'];
        $reason = trim((string) ($validated['reason'] ?? 'Routine Operational Switch'));

        // 3. Retrieve or initialize current configuration
        $config = SystemConfiguration::current();
        $previousMode = $config->active_mode;

        // If mode is already active, return early
        if ($previousMode === $newMode) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => "System is already operating in {$newMode} mode.",
                    'system' => $config,
                ]);
            }

            return back()->with('success', "System is already operating in {$newMode} mode.");
        }

        // 4. Update configuration with new mode details
        $modeDetails = SystemConfiguration::getModeDetails($newMode);

        $config->update([
            'previous_mode' => $previousMode,
            'active_mode' => $newMode,
            'status' => $modeDetails['status'],
            'environment' => $modeDetails['environment'],
            'server_node' => $modeDetails['server_node'],
            'ping_ms' => $modeDetails['ping_ms'],
            'security_status' => $modeDetails['security_status'],
            'changed_by_user_id' => $user->id,
            'changed_at' => now(),
            'change_reason' => $reason,
        ]);

        // 5. Create Audit Trail Entry
        try {
            if (class_exists(TransactionTrail::class)) {
                TransactionTrail::create([
                    'user_id' => $user->id,
                    'module' => 'System Configuration',
                    'action' => 'Operating Mode Switched',
                    'resource_ref' => 'MODE-' . str_replace(' ', '_', $newMode),
                    'details' => "Switched mode from '{$previousMode}' to '{$newMode}'. Admin: {$user->name} ({$user->email}). IP: " . $request->ip() . ". Reason: " . ($reason ?: 'None provided'),
                    'status' => 'Verified',
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to log system mode change audit trail: ' . $e->getMessage());
        }

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => "System operating mode successfully changed to {$newMode}.",
                'system' => $config->fresh(['changedBy']),
            ]);
        }

        return back()->with('success', "System operating mode successfully changed to {$newMode}.");
    }

    /**
     * Get current system configuration status details.
     */
    public function show()
    {
        $config = SystemConfiguration::current();
        $config->loadMissing('changedBy');

        return response()->json([
            'system' => [
                'active_mode' => $config->active_mode,
                'previous_mode' => $config->previous_mode,
                'status' => $config->status,
                'environment' => $config->environment,
                'server_node' => $config->server_node,
                'ping_ms' => $config->ping_ms,
                'security_status' => $config->security_status,
                'changed_by' => $config->changedBy?->name ?? 'System Administrator',
                'changed_at' => $config->changed_at ? $config->changed_at->toDateTimeString() : null,
                'change_reason' => $config->change_reason,
            ],
        ]);
    }
}
