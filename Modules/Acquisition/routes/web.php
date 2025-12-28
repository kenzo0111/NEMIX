<?php

use Illuminate\Support\Facades\Route;
use Modules\Acquisition\Http\Controllers\AcquisitionController;
use Inertia\Inertia;
use Modules\Acquisition\Models\PurchaseOrder;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('purchase-orders', AcquisitionController::class);

    // Procurement Panel routes
    Route::get('/procurement-panel', function () {
        $now = now();
        $year = $now->year;
        $month = str_pad($now->month, 2, '0', STR_PAD_LEFT);
        $prefix = "{$year}-{$month}-";

        // Find the latest PO number for this month
        $latestPo = PurchaseOrder::where('po_number', 'like', $prefix . '%')
            ->orderBy('po_number', 'desc')
            ->first();

        if ($latestPo) {
            // Extract the number part and increment
            $numberPart = (int) substr($latestPo->po_number, -4);
            $nextNumber = $numberPart + 1;
        } else {
            $nextNumber = 1;
        }

        $nextPoNumber = $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Acquisition/ProcurementPanel', [
            'auth' => auth()->user(),
            'suppliers' => \Modules\Suppliers\Models\Supplier::all(),
            'nextPoNumber' => $nextPoNumber,
        ]);
    })->name('procurement-panel');

    Route::get('/procurement-panel/{id}', function ($id) {
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        return Inertia::render('Acquisition/ProcurementPanel', [
            'auth' => auth()->user(),
            'purchaseOrder' => $purchaseOrder,
            'suppliers' => \Modules\Suppliers\Models\Supplier::all(),
        ]);
    })->name('procurement-panel.edit');

    // Next PO Number
    Route::get('/next-po-number', [AcquisitionController::class, 'getNextPoNumber']);
});
