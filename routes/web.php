<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/compliance/reports', function () {
    return Inertia::render('Compliance/ManageReports');
})->middleware(['auth', 'verified'])->name('compliance.reports');

Route::get('/compliance/analytics', function () {
    return Inertia::render('Compliance/ManageAnalytics');
})->middleware(['auth', 'verified'])->name('compliance.analytics');

Route::get('/acquisition/inbound-deliveries', function () {
    return Inertia::render('Acquisition/InboundDeliveries', [
        'auth' => auth()->user(),
        'purchaseOrders' => \Modules\Acquisition\Models\PurchaseOrder::all(),
    ]);
})->middleware(['auth', 'verified'])->name('acquisition.inbound-deliveries');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
