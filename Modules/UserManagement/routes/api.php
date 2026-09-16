<?php

use Illuminate\Support\Facades\Route;
use Modules\UserManagement\Http\Controllers\UserManagementController;

Route::middleware(['auth:sanctum', \App\Http\Middleware\AuthorizeAction::class])->prefix('v1')->group(function () {
    Route::apiResource('usermanagements', UserManagementController::class)->names('usermanagement');
});
