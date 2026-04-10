<?php

use Illuminate\Support\Facades\Route;
use Modules\AuditLogs\Http\Controllers\AuditLogsController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('auditlogs', AuditLogsController::class)->names('auditlogs');
});
