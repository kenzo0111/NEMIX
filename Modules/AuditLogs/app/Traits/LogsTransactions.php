<?php

namespace Modules\AuditLogs\Traits;

use Illuminate\Support\Facades\Auth;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\AuditLogs\Support\AuditLogFormatter;

trait LogsTransactions
{
    /**
     * Boot the trait to listen for Eloquent events.
     */
    protected static function bootLogsTransactions()
    {
        static::created(function ($model) {
            $model->logTransaction('Created');
        });

        static::updated(function ($model) {
            $changes = $model->getChanges();
            unset($changes['updated_at']);

            $model->logTransaction('Updated', $changes);
        });

        static::deleted(function ($model) {
            $model->logTransaction('Deleted');
        });
    }

    /**
     * Get the resource name automatically unless specified.
     */
    protected static function getLogResourceName()
    {
        return class_basename(static::class);
    }

    /**
     * Create a log entry in transaction_trails based on user action.
     */
    public function logTransaction($action, $details = null)
    {
        $userId = Auth::id() ?? request()->user()?->id;
        if ($userId && ! \App\Models\User::where('id', $userId)->exists()) {
            $userId = null;
        }

        $changes = is_array($details) ? $details : ($this->getChanges() ?: []);
        unset($changes['updated_at']);

        $original = $this->getOriginal();
        $formatted = AuditLogFormatter::formatForModel($this, $action, $changes, $original);

        if (is_string($details) && !empty($details)) {
            $formatted['details'] = $details;
        }

        try {
            TransactionTrail::create([
                'user_id' => $userId,
                'module' => $formatted['module'],
                'action' => $formatted['action'],
                'resource_ref' => $formatted['resource_ref'],
                'details' => $formatted['details'],
                'status' => $formatted['status'],
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to log transaction: '.$e->getMessage(), [
                'user_id' => $userId,
                'action' => $action,
                'exception' => $e,
            ]);
        }
    }
}
