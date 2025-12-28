<?php

use Illuminate\Support\Facades\Route;
use Modules\Acquisition\Http\Controllers\AcquisitionController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('acquisitions', AcquisitionController::class)->names('acquisition');
});
