<?php

use App\Http\Controllers\AccessControl\ManageRolePermissionController;
use App\Http\Controllers\AccessControl\ManageStaffController;
use App\Http\Controllers\Compliance\ComplianceAnalyticsController;
use App\Http\Controllers\Compliance\ComplianceMigrationController;
use App\Http\Controllers\Compliance\ComplianceReportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Inventory\RfidScannerController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SystemModeController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // System Mode Configuration
    Route::get('/system/mode', [SystemModeController::class, 'show'])->name('system.mode.show');
    Route::post('/system/mode', [SystemModeController::class, 'update'])->name('system.mode.update');

    // Compliance & Reports
    Route::get('/compliance/reports', [ComplianceReportController::class, 'index'])->name('compliance.reports');
    Route::post('/compliance/reports', [ComplianceReportController::class, 'store'])->name('compliance.reports.store');
    Route::put('/compliance/reports/{report}', [ComplianceReportController::class, 'update'])->name('compliance.reports.update');
    Route::delete('/compliance/reports/{report}', [ComplianceReportController::class, 'archive'])->name('compliance.reports.archive');

    // Compliance Migrations
    Route::post('/compliance/migrations', [ComplianceMigrationController::class, 'store'])->name('compliance.migrations.store');
    Route::post('/compliance/migrate/stock-card', [ComplianceMigrationController::class, 'migrateStockCard'])->name('compliance.migrate.stock_card');
    Route::post('/compliance/migrate/memorandum-receipt', [ComplianceMigrationController::class, 'migrateMemorandumReceipt'])->name('compliance.migrate.memorandum_receipt');

    // Compliance Analytics
    Route::get('/compliance/analytics', [ComplianceAnalyticsController::class, 'index'])->name('compliance.analytics');

    // Access Control: Role & Permissions
    Route::get('/access-control/role-permission', [ManageRolePermissionController::class, 'index'])->name('access-control.role-permission');
    Route::post('/access-control/role-permission', [ManageRolePermissionController::class, 'store'])->name('access-control.role-permission.store');
    Route::put('/access-control/role-permission/{role}', [ManageRolePermissionController::class, 'update'])->name('access-control.role-permission.update');
    Route::delete('/access-control/role-permission/{role}', [ManageRolePermissionController::class, 'destroy'])->name('access-control.role-permission.destroy');

    // Access Control: Staff Management
    Route::get('/access-control/manage-staffs', [ManageStaffController::class, 'index'])->name('access-control.staffs');
    Route::post('/access-control/manage-staffs', [ManageStaffController::class, 'store'])->name('access-control.staffs.store');
    Route::put('/access-control/manage-staffs/{user}', [ManageStaffController::class, 'update'])->name('access-control.staffs.update');
    Route::patch('/access-control/manage-staffs/{user}/toggle-status', [ManageStaffController::class, 'toggleStatus'])->name('access-control.staffs.toggle-status');
    Route::post('/access-control/manage-staffs/{user}/resend-invitation', [ManageStaffController::class, 'resendInvitation'])->name('access-control.staffs.resend-invitation');

    // RFID Scanner
    Route::get('/rfid-scanner', [RfidScannerController::class, 'index'])->name('rfid-scanner.index');
    Route::post('/rfid-scanner/assign', [RfidScannerController::class, 'assign'])->name('rfid-scanner.assign');
    Route::post('/rfid-scanner/unassign', [RfidScannerController::class, 'unassign'])->name('rfid-scanner.unassign');
    Route::get('/rfid-scanner/lookup/{tag}', [RfidScannerController::class, 'lookup'])->name('rfid-scanner.lookup');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
