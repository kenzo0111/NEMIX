<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
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
    }

    return Inertia::render('Dashboard', [
        'auditLogs' => $auditLogs,
        'stats' => $stats,
        'lowStockAlerts' => $lowStockAlerts,
        'chartData' => $chartData,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/compliance/reports', function () {
    $items = class_exists(\Modules\Inventory\Models\Item::class) 
        ? \Modules\Inventory\Models\Item::all() 
        : [];
        
    $issuances = class_exists(\Modules\Inventory\Models\Issuance::class) 
        ? \Modules\Inventory\Models\Issuance::with(['item', 'issuer'])->latest()->get() 
        : [];
        
    return Inertia::render('Compliance/ManageReports', [
        'items' => $items,
        'reports' => [],
        'issuances' => $issuances,
    ]);
})->middleware(['auth', 'verified'])->name('compliance.reports');

Route::get('/compliance/analytics', function () {
    return Inertia::render('Compliance/ManageAnalytics');
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

Route::get('/access-control/manage-staffs', function () {
    return Inertia::render('AccessControl/ManageStaffs');
})->middleware(['auth', 'verified'])->name('access-control.staffs');

Route::get('/rfid-scanner', function () {
    return Inertia::render('RFID-Scanner/Index');
})->middleware(['auth', 'verified'])->name('rfid-scanner.index');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
