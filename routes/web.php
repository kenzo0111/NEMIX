<?php

use App\Http\Controllers\AccessControl\ManageStaffController;
use App\Http\Controllers\ProfileController;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    $chartFilter = request('chart_filter', 'monthly');
    $startDate = request('start_date');
    $endDate = request('end_date');

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
            ];
        })
        : [];

    $stats = [
        'totalInventoryValue' => class_exists(\Modules\Inventory\Models\Item::class)
            ? '₱' . number_format(\Modules\Inventory\Models\Item::sum('amount'), 2)
            : '₱0.00',
        'totalRisIssued' => class_exists(\Modules\Inventory\Models\Issuance::class)
            ? \Modules\Inventory\Models\Issuance::count()
            : 0,
        'itemsIssuedMtd' => class_exists(\Modules\Inventory\Models\Issuance::class)
            ? \Modules\Inventory\Models\Issuance::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('quantity')
            : 0,
        'unserviceable' => class_exists(\Modules\Inventory\Models\Item::class)
            ? \Modules\Inventory\Models\Item::where('status', 'Out of Stock')->count()
            : 0,
        'criticalAlerts' => class_exists(\Modules\Inventory\Models\Item::class)
            ? \Modules\Inventory\Models\Item::where('status', 'Low Stock')->count()
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
        // Last 6 Months Analytics
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            
            $stockIn = \Modules\Inventory\Models\Receiving::whereMonth('date_received', $date->month)
                ->whereYear('date_received', $date->year)
                ->sum('quantity');
                
            $risIssued = \Modules\Inventory\Models\Issuance::whereMonth('date_issued', $date->month)
                ->whereYear('date_issued', $date->year)
                ->sum('quantity');

            // Optionally get "historical" stock via Item history or just use RIS calculation difference
            $starting = max(0, (\Modules\Inventory\Models\Item::sum('stock') ?? 0) - ($stockIn - $risIssued)); 

            $chartData['monthly'][] = [
                'label' => $date->format('M Y'),
                'starting' => $starting,
                'stockIn' => (int) $stockIn,
                'risIssued' => (int) $risIssued,
            ];
        }

        // Yearly Analytics (Last 5 Years)
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
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/compliance/reports', function () {
    $items = class_exists(\Modules\Inventory\Models\Item::class)
        ? \Modules\Inventory\Models\Item::all()
        : [];

    $issuances = class_exists(\Modules\Inventory\Models\Issuance::class)
        ? \Modules\Inventory\Models\Issuance::with(['item', 'issuer'])->latest()->get()
        : [];

    $reports = \App\Models\ComplianceReport::query()
        ->whereNull('archived_at')
        ->latest()
        ->get()
        ->map(function ($report) {
            $supplierName = data_get($report->payload, 'supplierName');
            return [
                'id' => $report->id,
                'title' => $report->title,
                'type' => $report->type,
                'reference' => $report->reference,
                'itemName' => $report->item_name,
                'supplierId' => data_get($report->payload, 'supplierId') ?? null,
                'supplierName' => is_string($supplierName) && trim($supplierName) ? trim($supplierName) : null,
                'date' => $report->coverage_label,
                'periodType' => $report->period_type,
                'dateValue' => optional($report->date)->toDateString(),
                'startDate' => optional($report->start_date)->toDateString(),
                'endDate' => optional($report->end_date)->toDateString(),
                'selectedMonth' => $report->selected_month,
                'selectedYear' => $report->selected_year,
            ];
        })
        ->values();

    $suppliers = class_exists(\Modules\Suppliers\Models\Supplier::class)
        ? \Modules\Suppliers\Models\Supplier::all()
        : [];

    return Inertia::render('Compliance/ManageReports', [
        'items' => $items,
        'reports' => $reports,
        'issuances' => $issuances,
        'suppliers' => $suppliers,
    ]);
})->middleware(['auth', 'verified'])->name('compliance.reports');

Route::post('/compliance/reports', function (\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'title' => ['required', 'string', 'max:255'],
        'type' => ['required', 'string', 'max:50'],
        'reference' => ['required', 'string', 'max:100'],
        'itemName' => ['nullable', 'string', 'max:255'],
        'supplierId' => ['nullable', 'integer', 'exists:suppliers,id'],
        'supplierName' => ['nullable', 'string', 'max:255'],
        'periodType' => ['required', 'in:specific,range,monthly,yearly'],
        'date' => ['nullable', 'date'],
        'startDate' => ['nullable', 'date'],
        'endDate' => ['nullable', 'date'],
        'selectedMonth' => ['nullable', 'integer', 'between:1,12'],
        'selectedYear' => ['nullable', 'integer', 'between:2000,2100'],
        'coverageLabel' => ['nullable', 'string', 'max:255'],
        'payload' => ['nullable', 'array'],
    ]);

    $coverageLabel = $validated['coverageLabel'] ?? null;

    if (!$coverageLabel) {
        if (($validated['periodType'] ?? null) === 'monthly' && !empty($validated['selectedMonth']) && !empty($validated['selectedYear'])) {
            $coverageLabel = Carbon::createFromDate((int) $validated['selectedYear'], (int) $validated['selectedMonth'], 1)->format('F Y');
        } elseif (($validated['periodType'] ?? null) === 'yearly' && !empty($validated['selectedYear'])) {
            $coverageLabel = 'Year ' . $validated['selectedYear'];
        } elseif (($validated['periodType'] ?? null) === 'range' && !empty($validated['startDate']) && !empty($validated['endDate'])) {
            $coverageLabel = $validated['startDate'] . ' to ' . $validated['endDate'];
        } else {
            $coverageLabel = $validated['date'] ?? null;
        }
    }

    \App\Models\ComplianceReport::create([
        'title' => $validated['title'],
        'type' => $validated['type'],
        'reference' => $validated['reference'],
        'item_name' => $validated['itemName'] ?? null,
        'period_type' => $validated['periodType'],
        'date' => $validated['date'] ?? null,
        'start_date' => $validated['startDate'] ?? null,
        'end_date' => $validated['endDate'] ?? null,
        'selected_month' => $validated['selectedMonth'] ?? null,
        'selected_year' => $validated['selectedYear'] ?? null,
        'coverage_label' => $coverageLabel,
        'payload' => $validated['payload'] ?? null,
        'created_by' => optional($request->user())->id,
    ]);

    return redirect()->route('compliance.reports');
})->middleware(['auth', 'verified'])->name('compliance.reports.store');

Route::put('/compliance/reports/{report}', function (\Illuminate\Http\Request $request, \App\Models\ComplianceReport $report) {
    $validated = $request->validate([
        'title' => ['required', 'string', 'max:255'],
        'type' => ['required', 'string', 'max:50'],
        'reference' => ['required', 'string', 'max:100'],
        'itemName' => ['nullable', 'string', 'max:255'],
        'supplierId' => ['nullable', 'integer', 'exists:suppliers,id'],
        'supplierName' => ['nullable', 'string', 'max:255'],
        'periodType' => ['required', 'in:specific,range,monthly,yearly'],
        'date' => ['nullable', 'date'],
        'startDate' => ['nullable', 'date'],
        'endDate' => ['nullable', 'date'],
        'selectedMonth' => ['nullable', 'integer', 'between:1,12'],
        'selectedYear' => ['nullable', 'integer', 'between:2000,2100'],
        'coverageLabel' => ['nullable', 'string', 'max:255'],
        'payload' => ['nullable', 'array'],
    ]);

    $coverageLabel = $validated['coverageLabel'] ?? null;

    if (!$coverageLabel) {
        if (($validated['periodType'] ?? null) === 'monthly' && !empty($validated['selectedMonth']) && !empty($validated['selectedYear'])) {
            $coverageLabel = Carbon::createFromDate((int) $validated['selectedYear'], (int) $validated['selectedMonth'], 1)->format('F Y');
        } elseif (($validated['periodType'] ?? null) === 'yearly' && !empty($validated['selectedYear'])) {
            $coverageLabel = 'Year ' . $validated['selectedYear'];
        } elseif (($validated['periodType'] ?? null) === 'range' && !empty($validated['startDate']) && !empty($validated['endDate'])) {
            $coverageLabel = $validated['startDate'] . ' to ' . $validated['endDate'];
        } else {
            $coverageLabel = $validated['date'] ?? null;
        }
    }

    $report->update([
        'title' => $validated['title'],
        'type' => $validated['type'],
        'reference' => $validated['reference'],
        'item_name' => $validated['itemName'] ?? null,
        'period_type' => $validated['periodType'],
        'date' => $validated['date'] ?? null,
        'start_date' => $validated['startDate'] ?? null,
        'end_date' => $validated['endDate'] ?? null,
        'selected_month' => $validated['selectedMonth'] ?? null,
        'selected_year' => $validated['selectedYear'] ?? null,
        'coverage_label' => $coverageLabel,
        'payload' => $validated['payload'] ?? null,
    ]);

    return redirect()->route('compliance.reports');
})->middleware(['auth', 'verified'])->name('compliance.reports.update');

Route::delete('/compliance/reports/{report}', function (\App\Models\ComplianceReport $report) {
    $report->update([
        'archived_at' => now(),
    ]);

    return redirect()->route('compliance.reports');
})->middleware(['auth', 'verified'])->name('compliance.reports.archive');

Route::get('/compliance/analytics', function () {
    $items = class_exists(\Modules\Inventory\Models\Item::class)
        ? \Modules\Inventory\Models\Item::query()->latest()->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku ?? 'No SKU',
                'stock' => (int) $item->stock,
                'unitCost' => (float) ($item->unit_cost ?? 0),
                'amount' => (float) ($item->amount ?? 0),
                'status' => $item->status,
                'unitOfIssue' => $item->unit_of_issue ?? 'Pcs',
                'description' => $item->description,
            ];
        })
        : collect();

    $stats = [
        'totalItems' => $items->count(),
        'totalStock' => (int) $items->sum('stock'),
        'lowStockAlerts' => (int) $items->where('status', 'Low Stock')->count(),
        'outOfStock' => (int) $items->where('status', 'Out of Stock')->count(),
        'totalValue' => '₱' . number_format((float) $items->sum('amount'), 2),
        'highestConsumable' => data_get($items->sortByDesc('stock')->first(), 'name', 'N/A'),
        'lowestConsumable' => data_get($items->sortBy('stock')->first(), 'name', 'N/A'),
    ];

    $lowStockItems = $items
        ->where('status', 'Low Stock')
        ->take(6)
        ->values()
        ->map(function ($item) {
            return [
                'id' => $item['id'],
                'name' => $item['name'],
                'sku' => $item['sku'],
                'stock' => $item['stock'],
                'unitOfIssue' => $item['unitOfIssue'],
                'amount' => $item['amount'],
            ];
        });

    $statusCounts = [
        'Available' => (int) $items->where('status', 'Available')->count(),
        'Low Stock' => (int) $items->where('status', 'Low Stock')->count(),
        'Out of Stock' => (int) $items->where('status', 'Out of Stock')->count(),
    ];

    $highestConsumables = $items
        ->sortByDesc('stock')
        ->take(5)
        ->values()
        ->map(function ($item) {
            return [
                'id' => $item['id'],
                'name' => $item['name'],
                'sku' => $item['sku'],
                'stock' => $item['stock'],
                'unitOfIssue' => $item['unitOfIssue'],
                'status' => $item['status'],
            ];
        });

    $lowestConsumables = $items
        ->sortBy('stock')
        ->take(5)
        ->values()
        ->map(function ($item) {
            return [
                'id' => $item['id'],
                'name' => $item['name'],
                'sku' => $item['sku'],
                'stock' => $item['stock'],
                'unitOfIssue' => $item['unitOfIssue'],
                'status' => $item['status'],
            ];
        });

    $stockChartItems = $items
        ->sortByDesc('stock')
        ->take(8)
        ->values()
        ->map(function ($item) {
            return [
                'label' => $item['name'],
                'value' => $item['stock'],
                'meta' => $item['unitOfIssue'] . ' • ' . $item['sku'],
                'color' => $item['status'] === 'Out of Stock' ? '#dc2626' : ($item['status'] === 'Low Stock' ? '#f59e0b' : '#b91c1c'),
            ];
        });

    $valueChartItems = $items
        ->sortByDesc('amount')
        ->take(8)
        ->values()
        ->map(function ($item) {
            return [
                'label' => $item['name'],
                'value' => (float) $item['amount'],
                'meta' => $item['sku'],
                'color' => '#0f766e',
            ];
        });

    $lowStockChartItems = $items
        ->where('status', 'Low Stock')
        ->take(6)
        ->values()
        ->map(function ($item) {
            return [
                'label' => $item['name'],
                'value' => $item['stock'],
                'meta' => 'Min threshold 10',
                'color' => '#f59e0b',
            ];
        });

    return Inertia::render('Compliance/ManageAnalytics', [
        'analytics' => [
            'stats' => $stats,
            'items' => $items->values(),
            'lowStockItems' => $lowStockItems,
            'consumables' => [
                'highest' => $highestConsumables,
                'lowest' => $lowestConsumables,
            ],
            'statusCounts' => $statusCounts,
            'chartData' => [
                'stockItems' => $stockChartItems,
                'valueItems' => $valueChartItems,
                'lowStockItems' => $lowStockChartItems,
                'statusSeries' => [
                    ['label' => 'Available', 'value' => $statusCounts['Available'], 'color' => '#059669'],
                    ['label' => 'Low Stock', 'value' => $statusCounts['Low Stock'], 'color' => '#f59e0b'],
                    ['label' => 'Out of Stock', 'value' => $statusCounts['Out of Stock'], 'color' => '#dc2626'],
                ],
            ],
        ],
    ]);
})->middleware(['auth', 'verified'])->name('compliance.analytics');

Route::get('/acquisition/inbound-deliveries', function () {
    return Inertia::render('Acquisition/InboundDeliveries', [
        'purchaseOrders' => \Modules\Acquisition\Models\PurchaseOrder::with('items')->latest()->get(),
    ]);
})->middleware(['auth', 'verified'])->name('acquisition.inbound-deliveries');

// Note: /audit-logs/login-trails is now handled by the AuditLogs module routes.

Route::get('/audit-logs/transaction-trails', [\Modules\AuditLogs\Http\Controllers\TransactionTrailController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('audit-logs.transaction-trails');


Route::get('/access-control/role-permission', function () {
    return Inertia::render('AccessControl/ManageRolePermission');
})->middleware(['auth', 'verified'])->name('access-control.role-permission');

Route::get('/access-control/manage-staffs', [ManageStaffController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.staffs');

Route::post('/access-control/manage-staffs', [ManageStaffController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.staffs.store');

Route::put('/access-control/manage-staffs/{user}', [ManageStaffController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.staffs.update');

Route::patch('/access-control/manage-staffs/{user}/toggle-status', [ManageStaffController::class, 'toggleStatus'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.staffs.toggle-status');

Route::get('/rfid-scanner', function () {
    return Inertia::render('RFID-Scanner/Index');
})->middleware(['auth', 'verified'])->name('rfid-scanner.index');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
