<?php

namespace Modules\AuditLogs\Traits;

use Illuminate\Support\Facades\Auth;
use Modules\AuditLogs\Models\TransactionTrail;

trait LogsTransactions
{
    /**
     * Boot the trait to listen for Eloquent events.
     */
    protected static function bootLogsTransactions()
    {
        static::created(function ($model) {
            $model->logTransaction('Created', 'Added a new ' . static::getLogResourceName());
        });

        static::updated(function ($model) {
            // Get the changed fields except timestamps
            $changes = $model->getChanges();
            unset($changes['updated_at']);
            
            $details = 'Updated ' . static::getLogResourceName();
            if (!empty($changes)) {
                $fields = implode(', ', array_keys($changes));
                $details .= " (Fields: {$fields})";
            }
            
            $model->logTransaction('Updated', $details);
        });

        static::deleted(function ($model) {
            $model->logTransaction('Deleted', 'Removed ' . static::getLogResourceName());
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
        // Default to logged in user if available
        $userId = Auth::id();

        // Prevent logging if no user is authenticated (e.g. seeder/console), 
        // unless you want system operations logged too. We'll leave it as null for system.
        
        TransactionTrail::create([
            'user_id' => $userId,
            'module' => static::getLogResourceName(),
            'action' => $action,
            'resource_ref' => 'ID-' . $this->getKey(),
            'details' => $details ?? "Performed {$action} on " . static::getLogResourceName(),
            'status' => match (strtolower($action)) {
                'created' => 'Success',
                'updated' => 'Updated',
                'deleted' => 'Deleted',
                default => 'Logged',
            },
        ]);
    }
}
