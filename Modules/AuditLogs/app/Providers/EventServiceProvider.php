<?php

namespace Modules\AuditLogs\Providers;

use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\AuditLogs\Listeners\FailedLoginListener;
use Modules\AuditLogs\Listeners\LoginListener;
use Modules\AuditLogs\Listeners\LogoutListener;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Auth;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\AuditLogs\Support\AuditLogFormatter;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event handler mappings for the application.
     *
     * @var array<string, array<int, string>>
     */
    protected $listen = [
        Login::class => [
            LoginListener::class,
        ],
        Failed::class => [
            FailedLoginListener::class,
        ],
        Logout::class => [
            LogoutListener::class,
        ],
    ];

    public function boot(): void
    {
        parent::boot();

        // Listen for all Eloquent model events
        Event::listen('eloquent.*: *', function ($eventName, array $data) {
            // Only care about created, updated, and deleted events
            if (
                !str_starts_with($eventName, 'eloquent.created:') &&
                !str_starts_with($eventName, 'eloquent.updated:') &&
                !str_starts_with($eventName, 'eloquent.deleted:')
            ) {
                return;
            }

            $model = $data[0] ?? null;
            if (!$model || !($model instanceof \Illuminate\Database\Eloquent\Model)) {
                return;
            }

            $className = get_class($model);

            // Ignore system/logging models to prevent loops and noise
            if (
                str_contains($className, 'AuditLogs\\Models') ||
                str_contains($className, 'Laravel\\Sanctum') ||
                str_contains($className, 'Illuminate\\Notifications') ||
                str_contains($className, 'Session') ||
                str_contains($className, 'Cache') ||
                str_contains($className, 'Job')
            ) {
                return;
            }

            // Extract the action: created, updated, or deleted
            preg_match('/eloquent\.(created|updated|deleted):/', $eventName, $matches);
            $action = isset($matches[1]) ? ucfirst($matches[1]) : 'Unknown';

            $user_id = Auth::id() ?? request()->user()?->id;
            if ($user_id && ! \App\Models\User::where('id', $user_id)->exists()) {
                $user_id = null;
            }

            // Ignore models handled explicitly to prevent duplication
            if ($model instanceof \App\Models\SystemConfiguration) {
                return;
            }

            $changes = [];
            if ($action === 'Updated') {
                $changes = $model->getChanges();
                unset($changes['updated_at']);

                // If no substantive changes (e.g. only updated_at was touched), skip logging
                if (empty($changes)) {
                    return;
                }
            }

            $original = $model->getOriginal();
            $formatted = AuditLogFormatter::formatForModel($model, $action, $changes, $original);

            $inGroup = \Modules\AuditLogs\Support\AuditGroupContext::hasActiveGroup();
            $groupId = $inGroup ? \Modules\AuditLogs\Support\AuditGroupContext::getGroupId() : null;
            $isParent = !$inGroup;
            $eventKey = AuditLogFormatter::deriveEventKey($model, $action, $changes);
            $module = ($inGroup && \Modules\AuditLogs\Support\AuditGroupContext::getModule())
                ? \Modules\AuditLogs\Support\AuditGroupContext::getModule()
                : $formatted['module'];
            $resourceRef = ($inGroup && \Modules\AuditLogs\Support\AuditGroupContext::getReference())
                ? \Modules\AuditLogs\Support\AuditGroupContext::getReference()
                : $formatted['resource_ref'];
            $actionLabel = $inGroup
                ? AuditLogFormatter::normalizeActivityLabel($formatted['action'], $eventKey)
                : $formatted['action'];

            $oldValues = null;
            $newValues = null;
            if ($action === 'Updated' && !empty($changes)) {
                $oldValues = AuditLogFormatter::sanitizeValues(array_intersect_key($original, $changes));
                $newValues = AuditLogFormatter::sanitizeValues($changes);
            } elseif ($action === 'Created') {
                $newValues = AuditLogFormatter::sanitizeValues($model->getAttributes());
            }

            try {
                TransactionTrail::create([
                    'user_id' => $user_id,
                    'module' => $module,
                    'action' => $actionLabel,
                    'resource_ref' => $resourceRef,
                    'details' => $formatted['details'],
                    'status' => $formatted['status'],
                    'audit_group_id' => $groupId,
                    'is_parent' => $isParent,
                    'event_key' => $eventKey,
                    'subject_type' => get_class($model),
                    'subject_id' => (string) $model->getKey(),
                    'old_values' => $oldValues,
                    'new_values' => $newValues,
                    'metadata' => [
                        'class' => class_basename($model),
                        'id' => $model->getKey(),
                    ],
                ]);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Failed to create audit log entry: '.$e->getMessage(), [
                    'user_id' => $user_id,
                    'module' => $module ?? class_basename($model),
                    'action' => $actionLabel ?? $action,
                    'exception' => $e,
                ]);
            }
        });
    }

    /**
     * Indicates if events should be discovered.
     *
     * @var bool
     */
    protected static $shouldDiscoverEvents = true;

    /**
     * Configure the proper event listeners for email verification.
     */
    protected function configureEmailVerification(): void {}
}
