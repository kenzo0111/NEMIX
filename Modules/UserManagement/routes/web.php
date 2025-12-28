<?php

use Illuminate\Support\Facades\Route;
use Modules\UserManagement\Http\Controllers\UserManagementController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('usermanagements', UserManagementController::class)->names('usermanagement');
});
