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
        if ($request->user()->isSystemAdmin()) {
            // System Admins receive organization-wide operational metrics alongside
            // the technical overview below. DashboardService queries institution-wide
            // inventory records; coordinator scoping is only applied in its own branch.
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
            usort($backupFiles, fn ($left, $right) => filemtime($right) <=> filemtime($left));
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
                    $latestActivity = \Modules\AuditLogs\Models\TransactionTrail::with('user')->latest()->limit(8)->get()->map(fn ($trail) => [
                        'id' => $trail->id,
                        'action' => $trail->action,
                        'module' => $trail->module,
                        'actor' => $trail->user?->name ?? 'System',
                        'created_at' => $trail->created_at?->toIso8601String(),
                        'status' => $trail->status,
                    ])->values();
                }
            } catch (\Throwable $e) {
                report($e);
            }

            return Inertia::render('Admin/SystemDashboard', [
                'supplyOverview' => [
                    'summary' => $supplySummary['summary'],
                    'stats' => $supplySummary['stats'],
                    'criticalStock' => $criticalStock,
                    'recentReceiving' => $recentReceiving,
                    'recentIssuance' => $recentIssuance,
                    'requestSummary' => $requestSummary,
                ],
                'adminOverview' => [
                    'totalUsers' => $totalUsers ?? 'Unavailable',
                    'activeUsers' => $activeUsers ?? 'Unavailable',
                    'databaseStatus' => $databaseStatus,
                    'emailStatus' => filled(config('mail.default')) ? 'Configured' : 'Not configured',
                    'failedJobs' => $failedJobs,
                    'storageFreeBytes' => @disk_free_space(storage_path()) ?: null,
                    'systemMode' => $systemMode,
                    'backupStatus' => $backupStatus,
                    'checkedAt' => now()->toIso8601String(),
                ],
                'recentAdminActivity' => $latestActivity,
            ]);
        }

        $validated = $request->validate([
            'chart_filter' => ['nullable', 'string', 'in:monthly,yearly,custom'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);

        $chartFilter = $validated['chart_filter'] ?? 'monthly';
        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;

        if ($request->user()->usesCoordinatorInventory()) {
            return Inertia::render('Dashboard', app(\App\Services\CoordinatorInventoryService::class)
                ->dashboard($request->user(), $chartFilter, $startDate, $endDate));
        }

        // Authoritative metrics & movement from DashboardService
        $summaryData = $this->dashboardService->getSummaryStats();
        $movementData = $this->dashboardService->getInventoryMovement($chartFilter, $startDate, $endDate);
        $recentReceiving = $this->dashboardService->getRecentReceivings(5);
        $recentIssuance = $this->dashboardService->getRecentIssuances(5);
        $criticalStock = $this->dashboardService->getCriticalStock(5);
        $rfidSummary = $this->dashboardService->getRfidSummary();
        $supplierSummary = $this->dashboardService->getSupplierSummary();
        $complianceSummary = $this->dashboardService->getComplianceSummary();
        $recentActivity = $this->dashboardService->getRecentActivity($request->user(), 8);

        $roles = class_exists(\Spatie\Permission\Models\Role::class)
            ? \Spatie\Permission\Models\Role::pluck('name')->map(fn($r) => ['value' => $r, 'label' => $r])->all()
            : [];

        return Inertia::render('Dashboard', [
            // Modern, strongly-typed system overview payload
            'summary' => $summaryData['summary'],
            'movement' => $movementData['movement'],
            'movementSummary' => $movementData['movementSummary'],
            'recentReceiving' => $recentReceiving,
            'recentIssuance' => $recentIssuance,
            'criticalStock' => $criticalStock,
            'rfidSummary' => $rfidSummary,
            'showRfidAlert' => $request->user()->hasAnyRole(['System Admin', 'System Administrator', 'Property Staff']),
            'supplierSummary' => $supplierSummary,
            'complianceSummary' => $complianceSummary,
            'recentActivity' => $recentActivity,

            // Legacy keys preserved for backward-compatibility with existing tests & consumers
            'stats' => $summaryData['stats'],
            'chartData' => $movementData['chartData'],
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
        ]);
    }
}
