<?php

namespace Modules\AuditLogs\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\AuditLogs\Support\AuditLogFormatter;
use App\Policies\ResourceOwnershipPolicy;

class TransactionTrailController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return app(AuditLogsController::class)->manageTransactions($request);
    }
}
