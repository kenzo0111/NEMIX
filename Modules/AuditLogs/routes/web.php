<?php

use Illuminate\Support\Facades\Route;
use Modules\AuditLogs\Http\Controllers\AuditLogsController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/audit-logs/login-trails', [AuditLogsController::class, 'loginTrails'])->name('audit-logs.login-trails');
});
