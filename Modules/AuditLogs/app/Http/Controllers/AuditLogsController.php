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
     * Display a listing of transaction trails with server-side filtering, pagination, and summary counts.
     */
    public function manageTransactions(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $module = $request->input('module');
        $action = $request->input('action');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        // Eager load user and user.roles to avoid N+1 queries
        $query = ResourceOwnershipPolicy::scopeQuery(
            TransactionTrail::query()->with(['user.roles']),
            auth()->user(),
            'user_id'
        );

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('resource_ref', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('details', 'like', "%{$search}%")
                  ->orWhere('module', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($module) && $module !== 'all') {
            $query->where('module', $module);
        }

        if (!empty($action) && $action !== 'all') {
            $query->where('action', $action);
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
        $verifiedCount = (clone $summaryQuery)
            ->where(function ($q) {
                $q->whereRaw("LOWER(status) IN ('verified', 'success')");
            })
            ->count();
        $flaggedCount = (clone $summaryQuery)
            ->where(function ($q) {
                $q->whereRaw("LOWER(status) IN ('flagged', 'failed', 'error')");
            })
            ->count();
        $uniqueModulesCount = (clone $summaryQuery)
            ->whereNotNull('module')
            ->where('module', '!=', '')
            ->distinct()
            ->count('module');

        $summary = [
            'total' => $totalRecords,
            'verified' => $verifiedCount,
            'flagged' => $flaggedCount,
            'modules' => $uniqueModulesCount,
        ];

        // Paginate results (25 per page by default)
        $paginated = $query->latest('created_at')
            ->paginate(25)
            ->withQueryString();

        $paginated->through(function ($trail) {
            $resolved = AuditLogFormatter::resolveLogEntry($trail);

            $rawStatus = strtolower(trim((string) ($trail->status ?? 'logged')));
            $auditStatus = match (true) {
                in_array($rawStatus, ['verified', 'success']) => 'verified',
                in_array($rawStatus, ['flagged', 'failed', 'error']) => 'flagged',
                default => 'logged',
            };

            $result = match (true) {
                in_array($rawStatus, ['success', 'verified']) => 'success',
                in_array($rawStatus, ['failed', 'error']) => 'failed',
                default => null,
            };

            $roleName = null;
            if ($trail->user) {
                $roleName = $trail->user->roles->first()?->name;
            }

            $userName = $trail->user ? $trail->user->name : ($trail->user_id ? 'Unknown User' : 'System Administrator');
            $occurredAt = $trail->created_at?->toIso8601String();
            $reference = $resolved['resource_ref'] ?: ($trail->resource_ref ?: ('TRX-' . $trail->id));

            return [
                'id' => $trail->id,
                'resource_ref' => $reference,
                'reference' => $reference,
                'user_id' => $trail->user_id,
                'user_name' => $userName,
                'user' => $userName,
                'role' => $roleName,
                'action' => $resolved['action'] ?: ($trail->action ?: 'Action unavailable'),
                'details' => $resolved['details'] ?: $trail->details,
                'module' => $resolved['module'] ?: ($trail->module ?: 'Module unavailable'),
                'audit_status' => $auditStatus,
                'status' => ucfirst($auditStatus),
                'result' => $result,
                'occurred_at' => $occurredAt,
                'time' => $occurredAt,
            ];
        });

        $availableModules = TransactionTrail::whereNotNull('module')
            ->where('module', '!=', '')
            ->distinct()
            ->orderBy('module')
            ->pluck('module')
            ->values()
            ->all();

        $availableActions = TransactionTrail::whereNotNull('action')
            ->where('action', '!=', '')
            ->distinct()
            ->orderBy('action')
            ->pluck('action')
            ->values()
            ->all();

        return Inertia::render('AuditLogs/ManageTransaction', [
            'logs' => $paginated,
            'summary' => $summary,
            'filters' => [
                'search' => $search ?: null,
                'module' => $module ?: null,
                'action' => $action ?: null,
                'date_from' => $dateFrom ?: null,
                'date_to' => $dateTo ?: null,
            ],
            'availableModules' => $availableModules,
            'availableActions' => $availableActions,
        ]);
    }
}
