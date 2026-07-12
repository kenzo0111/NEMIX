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
        $userId = Auth::id();

        $formattedDetails = is_array($details)
            ? AuditLogFormatter::describe($action, static::getLogResourceName(), $details)
            : $details;
        
        TransactionTrail::create([
            'user_id' => $userId,
            'module' => static::getLogResourceName(),
            'action' => $action,
            'resource_ref' => 'ID-' . $this->getKey(),
            'details' => $formattedDetails ?? AuditLogFormatter::describe($action, static::getLogResourceName()),
            'status' => match (strtolower($action)) {
                'created' => 'Success',
                'updated' => 'Updated',
                'deleted' => 'Deleted',
                default => 'Logged',
            },
        ]);
    }
}
