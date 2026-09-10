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
        $validated = $request->validate([
            'chart_filter' => ['nullable', 'string', 'in:monthly,yearly,custom'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);

        $chartFilter = $validated['chart_filter'] ?? 'monthly';
        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;

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
