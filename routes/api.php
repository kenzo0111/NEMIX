<?php

use App\Http\Controllers\Hardware\RfidDeviceController;
use App\Http\Middleware\AuthenticateRfidDevice;
use Illuminate\Support\Facades\Route;

Route::prefix('hardware/rfid')->middleware([AuthenticateRfidDevice::class, 'throttle:120,1'])->group(function () {
    Route::get('/config', [RfidDeviceController::class, 'configuration']);
    Route::post('/network-config', [RfidDeviceController::class, 'networkConfiguration']);
    Route::post('/heartbeat', [RfidDeviceController::class, 'heartbeat']);
    Route::post('/config/status', [RfidDeviceController::class, 'configurationStatus']);
    Route::post('/scan', [RfidDeviceController::class, 'scan']);
});
