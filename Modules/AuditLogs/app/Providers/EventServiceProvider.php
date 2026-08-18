<?php

namespace Modules\AuditLogs\Providers;

use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\AuditLogs\Listeners\FailedLoginListener;
use Modules\AuditLogs\Listeners\LoginListener;
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

            $resourceName = class_basename($model);
            $changes = [];

            if ($action === 'Updated') {
                $changes = $model->getChanges();
                unset($changes['updated_at']);
            }

            // Fallback for ID string
            $resourceRef = 'ID-' . $model->getKey();

            try {
                TransactionTrail::create([
                    'user_id' => $user_id,
                    'module' => $resourceName,
                    'action' => $action,
                    'resource_ref' => $resourceRef,
                    'details' => AuditLogFormatter::describe($action, $resourceName, $changes),
                    'status' => match (strtolower($action)) {
                        'created' => 'Verified',
                        'updated' => 'Updated',
                        'deleted' => 'Deleted',
                        default => 'Logged',
                    },
                ]);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Failed to create audit log entry: '.$e->getMessage(), [
                    'user_id' => $user_id,
                    'module' => $resourceName,
                    'action' => $action,
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
