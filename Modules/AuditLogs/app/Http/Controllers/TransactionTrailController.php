<?php

namespace Modules\AuditLogs\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\AuditLogs\Models\TransactionTrail;

use App\Policies\ResourceOwnershipPolicy;

class TransactionTrailController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $query = ResourceOwnershipPolicy::scopeQuery(TransactionTrail::with('user.roles'), auth()->user(), 'user_id');

        $logs = $query->latest()->get()->map(function ($trail) {
            
            // Map the status to styling class, feel free to update the mapping
            $badge = match ($trail->status) {
                'Verified' => 'bg-green-50 text-green-700 ring-1 ring-green-600/20',
                'Logged' => 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
                'Flagged' => 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20',
                'In Progress' => 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20',
                default => 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20',
            };

            return [
                'id' => $trail->resource_ref ?? 'TRX-' . $trail->id,
                'user' => $trail->user ? $trail->user->name : 'Unknown User',
                'role' => $trail->user && $trail->user->roles->isNotEmpty() ? $trail->user->roles->first()->name : 'No Role',
                'module' => $trail->module,
                'action' => $trail->action,
                'details' => $trail->details,
                'status' => $trail->status,
                'badge' => $badge,
                'time' => $trail->created_at ? $trail->created_at->format('M d, Y • h:i A') : '',
            ];
        });

        return Inertia::render('AuditLogs/ManageTransaction', [
            'logs' => $logs,
        ]);
    }
}
