<?php

namespace Modules\AuditLogs\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\AuditLogs\Models\LoginTrail;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\AuditLogs\Support\AuditLogFormatter;
use App\Policies\ResourceOwnershipPolicy;

class AuditLogsController extends Controller
{
    /**
     * Display a listing of login trails.
     */
    public function loginTrails()
    {
        $query = ResourceOwnershipPolicy::scopeQuery(LoginTrail::with('user:id,name,email'), auth()->user(), 'user_id');

        $loginTrails = $query->latest()
            ->get()
            ->map(function ($trail) {
                return [
                    'id' => $trail->id,
                    'name' => $trail->name,
                    'email' => $trail->email,
                    'role' => $trail->user ? ($trail->user->getRoleNames()->first() ?? 'User') : 'Unknown',
                    'time' => $trail->created_at ? $trail->created_at->timezone('Asia/Manila')->format('M d, Y • h:i A') : now('Asia/Manila')->format('M d, Y • h:i A'),
                    'ip' => $trail->ip_address,
                    'status' => $trail->status,
                ];
            });

        return Inertia::render('AuditLogs/ManageLoginTrails', [
            'loginData' => $loginTrails
        ]);
    }

    /**
     * Display a listing of transaction trails.
     */
    public function manageTransactions()
    {
        $query = ResourceOwnershipPolicy::scopeQuery(TransactionTrail::with('user:id,name,email'), auth()->user(), 'user_id');

        $transactionTrails = $query->latest()
            ->get()
            ->map(function ($trail) {
                $resolved = AuditLogFormatter::resolveLogEntry($trail);

                return [
                    'id' => $resolved['resource_ref'] ?: ('TRX-' . $trail->id),
                    'user' => $trail->user ? $trail->user->name : 'System',
                    'role' => $trail->user && method_exists($trail->user, 'getRoleNames') ? ($trail->user->getRoleNames()->first() ?? 'User') : 'Administrator',
                    'action' => $resolved['action'],
                    'details' => $resolved['details'],
                    'time' => $trail->created_at ? $trail->created_at->timezone('Asia/Manila')->format('M d, Y • h:i A') : now('Asia/Manila')->format('M d, Y • h:i A'),
                    'module' => $resolved['module'],
                    'status' => $resolved['status'],
                    'badge' => $this->getStatusBadge($resolved['status']),
                ];
            });

        return Inertia::render('AuditLogs/ManageTransaction', [
            'logs' => $transactionTrails
        ]);
    }

    /**
     * Get badge styling based on status.
     */
    protected function getStatusBadge($status)
    {
        $status = strtolower($status ?: '');
        if (in_array($status, ['verified', 'success', 'logged'])) {
            return 'bg-green-100 text-green-700';
        } elseif (in_array($status, ['flagged', 'failed', 'error', 'deleted'])) {
            return 'bg-red-100 text-red-700';
        } elseif (in_array($status, ['updated', 'modified'])) {
            return 'bg-blue-100 text-blue-700';
        }
        return 'bg-gray-100 text-gray-700';
    }
}
