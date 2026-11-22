<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function index(Request $request): Response
    {
        // Gather data common to all users
        $validated = $request->validate([
            'chart_filter' => ['nullable', 'string', 'in:monthly,yearly,custom'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);

        $chartFilter = $validated['chart_filter'] ?? 'monthly';
        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;

        // Coordinator inventory view
        if ($request->user()->usesCoordinatorInventory()) {
            return Inertia::render('Dashboard', app(\App\Services\CoordinatorInventoryService::class)
                ->dashboard($request->user(), $chartFilter, $startDate, $endDate));
        }

        // Pull admin‑wide overview when the user is a system admin
        $adminOverview = [];
        if ($request->user()->isSystemAdmin()) {
            $supplySummary = $this->dashboardService->getSummaryStats();
            $criticalStock = $this->dashboardService->getCriticalStock(5);
            $recentReceiving = $this->dashboardService->getRecentReceivings(5);
            $recentIssuance = $this->dashboardService->getRecentIssuances(5);
            $requestSummary = [];
            if (class_exists(\Modules\Inventory\Models\SupplyRequest::class)) {
                $requestSummary = \Modules\Inventory\Models\SupplyRequest::query()
                    ->selectRaw('status, count(*) as total')
                    ->groupBy('status')
                    ->pluck('total', 'status')
                    ->all();
            }

            $databaseStatus = 'Unavailable';
            try {
                \Illuminate\Support\Facades\DB::connection()->select('SELECT 1');
                $databaseStatus = 'Connected';
            } catch (\Throwable $e) {
                report($e);
            }

            $failedJobs = null;
            $totalUsers = null;
            $activeUsers = null;
            $systemMode = 'Unavailable';
            $latestActivity = collect();
            $backupFiles = glob(storage_path('app/private/backups/supply-sync-*')) ?: [];
            usort($backupFiles, fn($l, $r) => filemtime($r) <=> filemtime($l));
            $backupStatus = $backupFiles
                ? 'Latest database backup: '.date('Y-m-d H:i', filemtime($backupFiles[0]))
                : 'Daily backup is scheduled; no database backup has run yet';
            try {
                $totalUsers = \App\Models\User::count();
                $activeUsers = \App\Models\User::where('is_active', true)->count();
                if (\Illuminate\Support\Facades\Schema::hasTable('failed_jobs')) {
                    $failedJobs = \Illuminate\Support\Facades\DB::table('failed_jobs')->count();
                }
                $systemMode = \App\Models\SystemConfiguration::current()->active_mode;
                if (class_exists(\Modules\AuditLogs\Models\TransactionTrail::class)) {
                    $latestActivity = \Modules\AuditLogs\Models\TransactionTrail::with('user')
                        ->latest()
                        ->limit(8)
                        ->get()
                        ->map(fn($t) => [
                            'id' => $t->id,
                            'action' => $t->action,
                            'module' => $t->module,
                            'actor' => $t->user?->name ?? 'System',
                            'created_at' => $t->created_at?->toIso8601String(),
                            'status' => $t->status,
                        ])->values();
                }
            } catch (\Throwable $e) {
                report($e);
            }

            $adminOverview = [
                'totalUsers' => $totalUsers ?? 'Unavailable',
                'activeUsers' => $activeUsers ?? 'Unavailable',
                'databaseStatus' => $databaseStatus,
                'emailStatus' => filled(config('mail.default')) ? 'Configured' : 'Not configured',
                'failedJobs' => $failedJobs,
                'storageFreeBytes' => @disk_free_space(storage_path()) ?: null,
                'systemMode' => $systemMode,
                'backupStatus' => $backupStatus,
                'checkedAt' => now()->toIso8601String(),
                'recentAdminActivity' => $latestActivity,
            ];
            // Overwrite the earlier supply overview variables with admin data where appropriate
            $summaryData = $supplySummary;
        } else {
            // Regular (non‑admin) summary
            $summaryData = $this->dashboardService->getSummaryStats();
        }

        // Authoritative metrics for all users
        $movementData = $this->dashboardService->getInventoryMovement($chartFilter, $startDate, $endDate);
        $recentReceiving = $this->dashboardService->getRecentReceivings(5);
        $recentIssuance = $this->dashboardService->getRecentIssuances(5);
        $criticalStock = $this->dashboardService->getCriticalStock(5);
        $rfidSummary = $this->dashboardService->getRfidSummary();
        $supplierSummary = $this->dashboardService->getSupplierSummary();
        $complianceSummary = $this->dashboardService->getComplianceSummary();
        $recentActivity = $this->dashboardService->getRecentActivity($request->user(), 8);

        $roles = class_exists(\Spatie\Permission\Models\Role::class)
            ? \Spatie\Permission\Models\Role::pluck('name')
                ->map(fn($r) => ['value' => $r, 'label' => $r])
                ->all()
            : [];

        return Inertia::render('Dashboard', [
            // Modern payload
            'summary' => $summaryData['summary'] ?? null,
            'movement' => $movementData['movement'] ?? null,
            'movementSummary' => $movementData['movementSummary'] ?? null,
            'recentReceiving' => $recentReceiving,
            'recentIssuance' => $recentIssuance,
            'criticalStock' => $criticalStock,
            'rfidSummary' => $rfidSummary,
            'showRfidAlert' => $request->user()->hasAnyRole(['System Admin', 'System Administrator', 'Property Staff']),
            'supplierSummary' => $supplierSummary,
            'complianceSummary' => $complianceSummary,
            'recentActivity' => $recentActivity,
            // Legacy keys for backward compatibility
            'stats' => $summaryData['stats'] ?? null,
            'chartData' => $movementData['chartData'] ?? null,
            'filters' => [
                'chartFilter' => $chartFilter,
                'customStartDate' => $startDate,
                'customEndDate' => $endDate,
            ],
            'roles' => $roles,
            'lowStockAlerts' => $criticalStock,
            'auditLogs' => $recentActivity,
            'chartFilter' => $chartFilter,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'chartLabels' => $movementData['chartLabels'],
            'stockInData' => $movementData['stockInData'],
            'risIssuedData' => $movementData['risIssuedData'],
            // Admin specific payload (only present for system admins)
            'adminOverview' => $adminOverview,
        ]);
    }
}
