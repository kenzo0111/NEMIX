<?php

use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\InventoryController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('inventories', InventoryController::class)->names('inventory');
    Route::get('inventory/categories', [InventoryController::class, 'categories'])->name('inventory.categories');
    Route::post('inventory/categories', [InventoryController::class, 'storeCategory'])->name('inventory.categories.store');
    Route::put('inventory/categories/{category}', [InventoryController::class, 'updateCategory'])->name('inventory.categories.update');
    Route::delete('inventory/categories/{category}', [InventoryController::class, 'deleteCategory'])->name('inventory.categories.delete');
    Route::get('inventory/receiving', [InventoryController::class, 'receiving'])->name('inventory.receiving');
    Route::post('inventory/receiving', [InventoryController::class, 'storeReceiving'])->name('inventory.receiving.store');
    Route::put('inventory/receiving/{receiving}', [InventoryController::class, 'updateReceiving'])->name('inventory.receiving.update');
    Route::delete('inventory/receiving/{receiving}', [InventoryController::class, 'destroyReceiving'])->name('inventory.receiving.destroy');
    Route::get('inventory/issuance', [InventoryController::class, 'issuance'])->name('inventory.issuance');
    Route::post('inventory/issuance', [InventoryController::class, 'storeIssuance'])->name('inventory.issuance.store');
    Route::put('inventory/issuance/{issuance}', [InventoryController::class, 'updateIssuance'])->name('inventory.issuance.update');
    Route::delete('inventory/issuance/{issuance}', [InventoryController::class, 'destroyIssuance'])->name('inventory.issuance.destroy');
});
