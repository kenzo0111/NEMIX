<?php

use Illuminate\Support\Facades\Route;
use Modules\Acquisition\Http\Controllers\AcquisitionController;
use Inertia\Inertia;
use Modules\Acquisition\Models\PurchaseOrder;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('purchase-orders', AcquisitionController::class);

    // Procurement Panel routes
    Route::get('/procurement-panel', function () {
        return Inertia::render('Acquisition/ProcurementPanel', [
            'auth' => auth()->user(),
        ]);
    })->name('procurement-panel');

    Route::get('/procurement-panel/{id}', function ($id) {
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        return Inertia::render('Acquisition/ProcurementPanel', [
            'auth' => auth()->user(),
            'purchaseOrder' => $purchaseOrder,
        ]);
    })->name('procurement-panel.edit');

    // Next PO Number
    Route::get('/next-po-number', [AcquisitionController::class, 'getNextPoNumber']);
});
