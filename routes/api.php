<?php

use App\Http\Controllers\Hardware\RfidDeviceController;
use App\Http\Middleware\AuthenticateRfidDevice;
use Illuminate\Support\Facades\Route;

Route::prefix('hardware/rfid')->middleware([AuthenticateRfidDevice::class])->group(function () {
    Route::post('/scans', [RfidDeviceController::class, 'scans'])->middleware('throttle:rfid-delivery');
    Route::post('/scan', [RfidDeviceController::class, 'scan'])->middleware('throttle:rfid-delivery');
    Route::middleware('throttle:rfid-control')->group(function () {
        Route::post('/config/candidate', [RfidDeviceController::class, 'candidate']);
        Route::get('/config', [RfidDeviceController::class, 'configuration']);
        Route::post('/network-config', [RfidDeviceController::class, 'networkConfiguration']);
        Route::post('/heartbeat', [RfidDeviceController::class, 'heartbeat']);
        Route::post('/config/status', [RfidDeviceController::class, 'configurationStatus']);
    });
});
