<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController
{
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

        $auditLogs = class_exists(\Modules\AuditLogs\Models\TransactionTrail::class)
            ? \Modules\AuditLogs\Models\TransactionTrail::with('user.roles')->latest()->take(10)->get()->map(function ($trail) {
                $resolved = class_exists(\Modules\AuditLogs\Support\AuditLogFormatter::class)
                    ? \Modules\AuditLogs\Support\AuditLogFormatter::resolveLogEntry($trail)
                    : [
                        'action' => $trail->action,
                        'details' => $trail->details,
                        'module' => $trail->module,
                        'resource_ref' => $trail->resource_ref,
                        'status' => $trail->status,
                    ];

                $badge = match ($resolved['status']) {
                    'Verified', 'Success' => 'bg-green-50 text-green-700 ring-1 ring-green-600/20',
                    'Logged' => 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
                    'Flagged', 'Failed' => 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20',
                    'In Progress' => 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20',
                    default => 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20',
                };

                return [
                    'id' => $resolved['resource_ref'] ?: ('TRX-' . $trail->id),
                    'user' => $trail->user ? $trail->user->name : 'Unknown User',
                    'role' => $trail->user && $trail->user->roles->isNotEmpty() ? $trail->user->roles->first()->name : 'No Role',
                    'module' => $resolved['module'],
                    'action' => $resolved['action'],
                    'details' => $resolved['details'],
                    'status' => $resolved['status'],
                    'badge' => $badge,
                    'time' => $trail->created_at ? $trail->created_at->timezone('Asia/Manila')->diffForHumans() : now('Asia/Manila')->diffForHumans(),
                    'timestamp' => $trail->created_at ? $trail->created_at->timezone('Asia/Manila')->format('M d, Y • h:i A') : now('Asia/Manila')->format('M d, Y • h:i A'),
                ];
            })
            : [];

        $totalInventoryValue = class_exists(\Modules\Inventory\Models\Item::class)
            ? (float) \Modules\Inventory\Models\Item::query()->sum(DB::raw('stock * COALESCE(unit_cost, 0)'))
            : 0;

        $stats = [
            'totalInventoryValue' => '₱' . number_format($totalInventoryValue, 2),
            'totalRisIssued' => class_exists(\Modules\Inventory\Models\Issuance::class)
                ? (int) DB::table(DB::raw('(select distinct recipient, date_issued, status, issued_by, created_at from issuances) as distinct_issuances'))->count()
                : 0,
            'itemsIssuedMtd' => class_exists(\Modules\Inventory\Models\Issuance::class)
                ? \Modules\Inventory\Models\Issuance::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count()
                : 0,
            'unserviceable' => class_exists(\Modules\Inventory\Models\Item::class)
                ? \Modules\Inventory\Models\Item::where('status', 'Out of Stock')->count()
                : 0,
            'criticalAlerts' => class_exists(\Modules\Inventory\Models\Item::class)
                ? \Modules\Inventory\Models\Item::where('status', 'Low Stock')->count()
                : 0,
            'activeInventoryItems' => class_exists(\Modules\Inventory\Models\Item::class)
                ? \Modules\Inventory\Models\Item::count()
                : 0,
        ];

        $lowStockAlerts = class_exists(\Modules\Inventory\Models\Item::class)
            ? \Modules\Inventory\Models\Item::where('status', 'Low Stock')->take(5)->get()->map(function ($item) {
                return [
                    'name' => $item->name,
                    'sku' => $item->sku ?? 'No SKU',
                    'current' => $item->stock,
                    'min' => 10,
                    'unit' => $item->unit_of_issue ?? 'Pcs',
                    'priority' => $item->stock <= 5 ? 'Critical' : 'Warning',
                ];
            })
            : [];

        $chartData = [
            'monthly' => [],
            'yearly' => [],
            'custom' => [],
        ];

        if (class_exists(\Modules\Inventory\Models\Receiving::class) && class_exists(\Modules\Inventory\Models\Issuance::class)) {
            $currentTotalStock = class_exists(\Modules\Inventory\Models\Item::class)
                ? (int) \Modules\Inventory\Models\Item::sum('stock')
                : 0;

            // Monthly view: last 6 months
            for ($i = 5; $i >= 0; $i--) {
                $monthDate = now()->subMonths($i);
                $startOfMonth = $monthDate->copy()->startOfMonth();
                $endOfMonth = $monthDate->copy()->endOfMonth();

                $stockIn = (int) \Modules\Inventory\Models\Receiving::whereBetween('date_received', [
                    $startOfMonth->toDateString(),
                    $endOfMonth->toDateString(),
                ])->sum('quantity');

                $risIssued = (int) \Modules\Inventory\Models\Issuance::whereBetween('date_issued', [
                    $startOfMonth->toDateString(),
                    $endOfMonth->toDateString(),
                ])->sum('quantity');

                $receivingsSince = (int) \Modules\Inventory\Models\Receiving::where('date_received', '>=', $startOfMonth->toDateString())->sum('quantity');
                $issuancesSince = (int) \Modules\Inventory\Models\Issuance::where('date_issued', '>=', $startOfMonth->toDateString())->sum('quantity');

                $starting = max(0, $currentTotalStock - $receivingsSince + $issuancesSince);

                $chartData['monthly'][] = [
                    'label' => $monthDate->format('M Y'),
                    'starting' => $starting,
                    'stockIn' => $stockIn,
                    'risIssued' => $risIssued,
                ];
            }

            // Yearly view: last 5 years
            for ($i = 4; $i >= 0; $i--) {
                $yearDate = now()->subYears($i);
                $year = $yearDate->year;
                $startOfYear = $yearDate->copy()->startOfYear();
                $endOfYear = $yearDate->copy()->endOfYear();

                $stockIn = (int) \Modules\Inventory\Models\Receiving::whereBetween('date_received', [
                    $startOfYear->toDateString(),
                    $endOfYear->toDateString(),
                ])->sum('quantity');

                $risIssued = (int) \Modules\Inventory\Models\Issuance::whereBetween('date_issued', [
                    $startOfYear->toDateString(),
                    $endOfYear->toDateString(),
                ])->sum('quantity');

                $receivingsSince = (int) \Modules\Inventory\Models\Receiving::where('date_received', '>=', $startOfYear->toDateString())->sum('quantity');
                $issuancesSince = (int) \Modules\Inventory\Models\Issuance::where('date_issued', '>=', $startOfYear->toDateString())->sum('quantity');

                $starting = max(0, $currentTotalStock - $receivingsSince + $issuancesSince);

                $chartData['yearly'][] = [
                    'label' => (string) $year,
                    'starting' => $starting,
                    'stockIn' => $stockIn,
                    'risIssued' => $risIssued,
                ];
            }

            // Custom date range view
            if ($startDate && $endDate) {
                $start = Carbon::parse($startDate);
                $end = Carbon::parse($endDate);
                $daysDiff = $start->diffInDays($end);

                if ($daysDiff <= 31) {
                    $period = CarbonPeriod::create($start, '1 day', $end);
                    foreach ($period as $dt) {
                        $stockIn = (int) \Modules\Inventory\Models\Receiving::whereDate('date_received', $dt->toDateString())->sum('quantity');
                        $risIssued = (int) \Modules\Inventory\Models\Issuance::whereDate('date_issued', $dt->toDateString())->sum('quantity');

                        $receivingsSince = (int) \Modules\Inventory\Models\Receiving::where('date_received', '>=', $dt->toDateString())->sum('quantity');
                        $issuancesSince = (int) \Modules\Inventory\Models\Issuance::where('date_issued', '>=', $dt->toDateString())->sum('quantity');

                        $starting = max(0, $currentTotalStock - $receivingsSince + $issuancesSince);

                        $chartData['custom'][] = [
                            'label' => $dt->format('M d'),
                            'starting' => $starting,
                            'stockIn' => $stockIn,
                            'risIssued' => $risIssued,
                        ];
                    }
                } else {
                    $period = CarbonPeriod::create($start->copy()->startOfMonth(), '1 month', $end->copy()->endOfMonth());
                    foreach ($period as $dt) {
                        $startOfMonth = $dt->copy()->startOfMonth();
                        $endOfMonth = $dt->copy()->endOfMonth();

                        $stockIn = (int) \Modules\Inventory\Models\Receiving::whereBetween('date_received', [
                            $startOfMonth->toDateString(),
                            $endOfMonth->toDateString(),
                        ])->sum('quantity');

                        $risIssued = (int) \Modules\Inventory\Models\Issuance::whereBetween('date_issued', [
                            $startOfMonth->toDateString(),
                            $endOfMonth->toDateString(),
                        ])->sum('quantity');

                        $receivingsSince = (int) \Modules\Inventory\Models\Receiving::where('date_received', '>=', $startOfMonth->toDateString())->sum('quantity');
                        $issuancesSince = (int) \Modules\Inventory\Models\Issuance::where('date_issued', '>=', $startOfMonth->toDateString())->sum('quantity');

                        $starting = max(0, $currentTotalStock - $receivingsSince + $issuancesSince);

                        $chartData['custom'][] = [
                            'label' => $dt->format('M Y'),
                            'starting' => $starting,
                            'stockIn' => $stockIn,
                            'risIssued' => $risIssued,
                        ];
                    }
                }
            } else {
                $chartData['custom'] = $chartData['monthly'];
            }
        }

        $chartLabels = collect($chartData[$chartFilter] ?? [])->pluck('label')->all();
        $stockInData = collect($chartData[$chartFilter] ?? [])->pluck('stockIn')->all();
        $risIssuedData = collect($chartData[$chartFilter] ?? [])->pluck('risIssued')->all();

        $roles = class_exists(\Spatie\Permission\Models\Role::class)
            ? \Spatie\Permission\Models\Role::pluck('name')->map(fn($r) => ['value' => $r, 'label' => $r])->all()
            : [];

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'chartData' => $chartData,
            'filters' => [
                'chartFilter' => $chartFilter,
                'customStartDate' => $startDate,
                'customEndDate' => $endDate,
            ],
            'roles' => $roles,
            'lowStockAlerts' => $lowStockAlerts,
            'auditLogs' => $auditLogs,
            'chartFilter' => $chartFilter,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'chartLabels' => $chartLabels,
            'stockInData' => $stockInData,
            'risIssuedData' => $risIssuedData,
        ]);
    }
}
