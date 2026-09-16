<?php

use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\InventoryController;

Route::middleware(['auth:sanctum', \App\Http\Middleware\AuthorizeAction::class])->prefix('v1')->group(function () {
    Route::apiResource('inventories', InventoryController::class)->names('inventory');
});
