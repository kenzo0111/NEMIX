<?php

use App\Http\Controllers\AccessControl\ManageRolePermissionController;
use App\Http\Controllers\AccessControl\ManageStaffController;
use App\Http\Controllers\ProfileController;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::get('/compliance/reports', function () {
    $items = class_exists(\Modules\Inventory\Models\Item::class)
        ? \Modules\Inventory\Models\Item::all()
        : [];

    $issuances = class_exists(\Modules\Inventory\Models\Issuance::class)
        ? \Modules\Inventory\Models\Issuance::with(['item', 'issuer'])->latest()->get()
        : [];

    $migratedRecords = \App\Models\ComplianceMigratedRecord::query()
        ->latest()
        ->get()
        ->map(function ($record) {
            return [
                'id' => $record->id,
                'form_type' => $record->form_type,
                'source' => $record->source,
                'reference' => $record->reference,
                'item_name' => $record->item_name,
                'quantity' => (int) ($record->quantity ?? 0),
                'recipient' => $record->recipient,
                'department' => $record->department,
                'designation' => $record->designation,
                'remarks' => $record->remarks,
                'date' => optional($record->date)->toDateString(),
                'status' => $record->status,
                'payload' => $record->payload ?? [],
            ];
        })
        ->values();

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
        'migratedRecords' => $migratedRecords,
    ]);
})->middleware(['auth', 'verified'])->name('compliance.reports');

Route::post('/compliance/migrations', function (\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'form_type' => ['required', 'in:RSMI,RPCI,STOCK_CARD'],
        'source' => ['nullable', 'string', 'max:100'],
        'records' => ['required', 'array'],
        'records.*.reference' => ['nullable', 'string', 'max:100'],
        'records.*.date' => ['nullable', 'date'],
        'records.*.item_name' => ['nullable', 'string', 'max:255'],
        'records.*.quantity' => ['nullable', 'numeric', 'min:0'],
        'records.*.unit_cost' => ['nullable', 'numeric', 'min:0'],
        'records.*.amount' => ['nullable', 'numeric', 'min:0'],
        'records.*.unit' => ['nullable', 'string', 'max:50'],
        'records.*.stock_no' => ['nullable', 'string', 'max:100'],
        'records.*.recipient' => ['nullable', 'string', 'max:255'],
        'records.*.department' => ['nullable', 'string', 'max:255'],
        'records.*.designation' => ['nullable', 'string', 'max:255'],
        'records.*.remarks' => ['nullable', 'string'],
        'records.*.receipt_qty' => ['nullable', 'numeric', 'min:0'],
        'records.*.balance_qty' => ['nullable', 'numeric', 'min:0'],
        'records.*.on_hand_count' => ['nullable', 'numeric', 'min:0'],
        'records.*.shortage_qty' => ['nullable', 'numeric'],
        'records.*.shortage_value' => ['nullable', 'numeric'],
        'records.*.fund_cluster' => ['nullable', 'string', 'max:100'],
        'records.*.responsibility_center_code' => ['nullable', 'string', 'max:100'],
        'records.*.re_order_point' => ['nullable', 'string', 'max:50'],
    ]);

    $records = collect($validated['records'] ?? []);
    $saved = 0;
    $skipped = 0;

    foreach ($records as $index => $recordInput) {
        if (empty($recordInput['reference']) && empty($recordInput['item_name'])) {
            $skipped++;
            continue;
        }

        $reference = trim((string) ($recordInput['reference'] ?? '')) ?: 'MIGRATED-' . ($index + 1);
        $itemName = trim((string) ($recordInput['item_name'] ?? ''));
        $date = !empty($recordInput['date']) ? $recordInput['date'] : null;

        $query = \App\Models\ComplianceMigratedRecord::query()
            ->where('form_type', $validated['form_type']);

        $existing = $query->where(function ($q) use ($reference, $itemName, $date, $recordInput) {
            $q->where('reference', $reference);
            if ($itemName && $date) {
                $q->orWhere(function ($sub) use ($itemName, $date, $recordInput) {
                    $sub->where('item_name', $itemName)
                        ->where('date', $date)
                        ->where('quantity', (int) ($recordInput['quantity'] ?? 0));
                });
            }
        })->exists();

        if ($existing) {
            $skipped++;
            continue;
        }

        $payload = array_merge($recordInput, [
            'data_source' => 'historical_migration',
            'migrated_at' => now()->toIso8601String(),
        ]);

        \App\Models\ComplianceMigratedRecord::create([
            'form_type' => $validated['form_type'],
            'source' => $validated['source'] ?? 'historical_migration',
            'reference' => $reference,
            'item_name' => $itemName ?: null,
            'quantity' => (int) ($recordInput['quantity'] ?? 0),
            'recipient' => $recordInput['recipient'] ?? null,
            'department' => $recordInput['department'] ?? null,
            'designation' => $recordInput['designation'] ?? null,
            'remarks' => $recordInput['remarks'] ?? null,
            'date' => $date,
            'status' => 'historical_migration',
            'payload' => $payload,
            'created_by' => optional($request->user())->id,
        ]);

        $saved++;
    }

    \App\Models\ComplianceMigrationLog::create([
        'form_type' => $validated['form_type'],
        'source' => $validated['source'] ?? 'historical_migration',
        'records_count' => $saved,
        'status' => 'completed',
        'message' => 'Migrated ' . $saved . ' historical ' . $validated['form_type'] . ' records; skipped ' . $skipped . ' duplicates or invalid rows.',
        'created_by' => optional($request->user())->id,
    ]);

    return redirect()->route('compliance.reports');
})->middleware(['auth', 'verified'])->name('compliance.migrations.store');

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

    $totalSupplierValue = 0;
    if (class_exists(\Modules\Suppliers\Models\Supplier::class)) {
        \Modules\Suppliers\Models\Supplier::all()->each(function ($supplier) use (&$totalSupplierValue, $supplierItemValues) {
            $supplierId = (string) $supplier->id;
            $totalSupplierValue += $supplierItemValues[$supplierId] ?? 0;
        });
    }

    $stats = [
        'totalItems' => $items->count(),
        'totalStock' => (int) $items->sum('stock'),
        'lowStockAlerts' => (int) $items->where('status', 'Low Stock')->count(),
        'outOfStock' => (int) $items->where('status', 'Out of Stock')->count(),
        'totalValue' => '₱' . number_format($totalSupplierValue > 0 ? $totalSupplierValue : (float) $items->sum('amount'), 2),
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


Route::get('/access-control/role-permission', [ManageRolePermissionController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.role-permission');

Route::post('/access-control/role-permission', [ManageRolePermissionController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.role-permission.store');

Route::put('/access-control/role-permission/{role}', [ManageRolePermissionController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.role-permission.update');

Route::delete('/access-control/role-permission/{role}', [ManageRolePermissionController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.role-permission.destroy');

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
