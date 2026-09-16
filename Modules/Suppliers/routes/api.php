<?php

use Illuminate\Support\Facades\Route;
use Modules\Suppliers\Http\Controllers\SuppliersController;

Route::middleware(['auth:sanctum', \App\Http\Middleware\AuthorizeAction::class])->prefix('v1')->group(function () {
    Route::apiResource('suppliers', SuppliersController::class)->names('suppliers');
});
