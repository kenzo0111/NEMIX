<?php

use Illuminate\Support\Facades\Route;
use Modules\Suppliers\Http\Controllers\SuppliersController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('suppliers', [SuppliersController::class, 'index'])->name('suppliers.index');
    Route::post('suppliers', [SuppliersController::class, 'store'])->name('suppliers.store');
    Route::get('suppliers/{supplier}', [SuppliersController::class, 'show'])->name('suppliers.show');
    Route::put('suppliers/{supplier}', [SuppliersController::class, 'update'])->name('suppliers.update');
    Route::delete('suppliers/{supplier}', [SuppliersController::class, 'destroy'])->name('suppliers.destroy');
    Route::get('suppliers/{supplier}/edit', [SuppliersController::class, 'edit'])->name('suppliers.edit');
});
