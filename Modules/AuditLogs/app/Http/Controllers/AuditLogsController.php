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
    public function loginTrails(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $role = $request->input('role');
        $status = $request->input('status');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        // Eager load user and user.roles to avoid N+1 queries
        $query = ResourceOwnershipPolicy::scopeQuery(
            LoginTrail::query()->with(['user.roles']),
            auth()->user(),
            'user_id'
        );

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        if (!empty($role)) {
            if ($role === 'Unknown' || $role === '—' || $role === 'none') {
                $query->whereNull('user_id');
            } else {
                $query->whereHas('user.roles', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            }
        }

        if (!empty($status)) {
            $statusMap = [
                'login_success' => 'Success',
                'login_failed'  => 'Failed',
                'logout'        => 'Logged Out',
            ];
            $targetStatus = $statusMap[$status] ?? $status;
            $query->where('status', $targetStatus);
        }

        if (!empty($dateFrom)) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if (!empty($dateTo)) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        // Summary counts based on active query scope
        $summaryQuery = clone $query;
        $totalRecords = (clone $summaryQuery)->count();
        $successfulCount = (clone $summaryQuery)->where('status', 'Success')->count();
        $failedCount = (clone $summaryQuery)->where('status', 'Failed')->count();
        $uniqueUsers = (clone $summaryQuery)
            ->whereNotNull('email')
            ->where('email', '!=', '')
            ->distinct()
            ->count('email');

        $summary = [
            'total' => $totalRecords,
            'successful' => $successfulCount,
            'failed' => $failedCount,
            'unique_users' => $uniqueUsers,
        ];

        // Paginate results (25 per page by default)
        $paginated = $query->latest('created_at')
            ->paginate(25)
            ->withQueryString();

        $paginated->through(function ($trail) {
            $roleName = null;
            if ($trail->user) {
                $roleName = $trail->user->roles->first()?->name ?? 'User';
            }

            $event = match ($trail->status) {
                'Success' => 'login_success',
                'Failed' => 'login_failed',
                'Logged Out' => 'logout',
                default => strtolower(str_replace(' ', '_', $trail->status ?? 'login_success')),
            };

            $userName = $trail->name ?: ($trail->user?->name ?? ($event === 'login_failed' ? 'Unknown User' : null));
            $email = $trail->email ?: $trail->user?->email;
            $occurredAt = $trail->created_at?->toIso8601String();

            return [
                'id' => $trail->id,
                'user_id' => $trail->user_id,
                'user_name' => $userName,
                'name' => $userName,
                'email' => $email,
                'role' => $roleName,
                'event' => $event,
                'status' => $trail->status,
                'ip_address' => $trail->ip_address,
                'ip' => $trail->ip_address,
                'user_agent' => $trail->user_agent,
                'occurred_at' => $occurredAt,
                'time' => $occurredAt,
            ];
        });

        $availableRoles = class_exists(\Spatie\Permission\Models\Role::class)
            ? \Spatie\Permission\Models\Role::pluck('name')->values()->all()
            : [];

        $availableStatuses = [
            ['value' => 'login_success', 'label' => 'Successful Login'],
            ['value' => 'login_failed', 'label' => 'Failed Login'],
            ['value' => 'logout', 'label' => 'Logged Out'],
        ];

        return Inertia::render('AuditLogs/ManageLoginTrails', [
            'loginData' => $paginated,
            'summary' => $summary,
            'filters' => [
                'search' => $search ?: null,
                'role' => $role ?: null,
                'status' => $status ?: null,
                'date_from' => $dateFrom ?: null,
                'date_to' => $dateTo ?: null,
            ],
            'availableRoles' => $availableRoles,
            'availableStatuses' => $availableStatuses,
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
