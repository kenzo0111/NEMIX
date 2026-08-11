<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController
{
    public function index(Request $request)
    {
        $chartFilter = $request->input('chart_filter', 'monthly');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $auditLogs = class_exists(\Modules\AuditLogs\Models\TransactionTrail::class)
            ? \Modules\AuditLogs\Models\TransactionTrail::with('user.roles')->latest()->take(10)->get()->map(function ($trail) {
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
                    'time' => $trail->created_at->diffForHumans(),
                    'timestamp' => $trail->created_at->format('M d, Y • h:i A'),
                ];
            })
            : [];

        $supplierItemValues = [];
        if (class_exists(\Modules\Inventory\Models\Item::class)) {
            \Modules\Inventory\Models\Item::all(['supplier_id', 'stock', 'unit_cost', 'amount'])->each(function ($item) use (&$supplierItemValues) {
                if ($item->supplier_id === null) return;
                $supplierId = (string) $item->supplier_id;
                $itemAmount = $item->amount !== null ? (float) $item->amount : (float) $item->stock * (float) $item->unit_cost;
                $supplierItemValues[$supplierId] = ($supplierItemValues[$supplierId] ?? 0) + $itemAmount;
            });
        }

        $supplierIssuedTotals = [];
        if (class_exists(\Modules\Inventory\Models\Issuance::class)) {
            \Modules\Inventory\Models\Issuance::with('item')->get()->each(function ($issuance) use (&$supplierIssuedTotals) {
                if (! $issuance->item || $issuance->item->supplier_id === null) return;
                $supplierId = (string) $issuance->item->supplier_id;
                $supplierIssuedTotals[$supplierId] = ($supplierIssuedTotals[$supplierId] ?? 0) + (float) $issuance->quantity * (float) $issuance->item->unit_cost;
            });
        }

        $totalInventoryValue = 0;
        if (class_exists(\Modules\Suppliers\Models\Supplier::class)) {
            \Modules\Suppliers\Models\Supplier::all()->each(function ($supplier) use (&$totalInventoryValue, $supplierItemValues) {
                $supplierId = (string) $supplier->id;
                $totalInventoryValue += $supplierItemValues[$supplierId] ?? 0;
            });
        }

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
            for ($i = 5; $i >= 0; $i--) {
                $date = now()->subMonths($i);

                $stockIn = \Modules\Inventory\Models\Receiving::whereMonth('date_received', $date->month)
                    ->whereYear('date_received', $date->year)
                    ->sum('quantity');

                $risIssued = \Modules\Inventory\Models\Issuance::whereMonth('date_issued', $date->month)
                    ->whereYear('date_issued', $date->year)
                    ->sum('quantity');

                $starting = max(0, (\Modules\Inventory\Models\Item::sum('stock') ?? 0) - ($stockIn - $risIssued));

                $chartData['monthly'][] = [
                    'label' => $date->format('M Y'),
                    'starting' => $starting,
                    'stockIn' => (int) $stockIn,
                    'risIssued' => (int) $risIssued,
                ];
            }

            for ($i = 4; $i >= 0; $i--) {
                $year = now()->subYears($i)->year;

                $stockIn = \Modules\Inventory\Models\Receiving::whereYear('date_received', $year)->sum('quantity');
                $risIssued = \Modules\Inventory\Models\Issuance::whereYear('date_issued', $year)->sum('quantity');

                $starting = max(0, (\Modules\Inventory\Models\Item::sum('stock') ?? 0) - ($stockIn - $risIssued));

                $chartData['yearly'][] = [
                    'label' => (string) $year,
                    'starting' => $starting,
                    'stockIn' => (int) $stockIn,
                    'risIssued' => (int) $risIssued,
                ];
            }

            if ($chartFilter === 'custom' && $startDate && $endDate) {
                try {
                    $rangeStart = Carbon::parse($startDate)->startOfDay();
                    $rangeEnd = Carbon::parse($endDate)->endOfDay();

                    if ($rangeStart->gt($rangeEnd)) {
                        [$rangeStart, $rangeEnd] = [$rangeEnd->copy()->startOfDay(), $rangeStart->copy()->endOfDay()];
                    }

                    $period = CarbonPeriod::create(
                        $rangeStart->copy()->startOfMonth(),
                        '1 month',
                        $rangeEnd->copy()->startOfMonth()
                    );

                    foreach ($period as $monthStart) {
                        $monthEnd = $monthStart->copy()->endOfMonth();

                        $stockIn = \Modules\Inventory\Models\Receiving::whereBetween('date_received', [$monthStart, $monthEnd])
                            ->sum('quantity');

                        $risIssued = \Modules\Inventory\Models\Issuance::whereBetween('date_issued', [$monthStart, $monthEnd])
                            ->sum('quantity');

                        $starting = max(0, (\Modules\Inventory\Models\Item::sum('stock') ?? 0) - ($stockIn - $risIssued));

                        $chartData['custom'][] = [
                            'label' => $monthStart->format('M Y'),
                            'starting' => $starting,
                            'stockIn' => (int) $stockIn,
                            'risIssued' => (int) $risIssued,
                        ];
                    }
                } catch (\Throwable $e) {
                    $chartData['custom'] = [];
                }
            }
        }

        return Inertia::render('Dashboard', [
            'auditLogs' => $auditLogs,
            'stats' => $stats,
            'lowStockAlerts' => $lowStockAlerts,
            'chartData' => $chartData,
            'filters' => [
                'chartFilter' => $chartFilter,
                'customStartDate' => $startDate,
                'customEndDate' => $endDate,
            ],
        ]);
    }
}
