<?php

namespace Modules\AuditLogs\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\AuditLogs\Models\LoginTrail;

class AuditLogsController extends Controller
{
    /**
     * Display a listing of login trails.
     */
    public function loginTrails()
    {
        $loginTrails = LoginTrail::with('user:id,name,email')
            ->latest()
            ->get()
            ->map(function ($trail) {
                // To match the frontend state, provide a formatted object
                return [
                    'id' => $trail->id,
                    'name' => $trail->name,
                    'email' => $trail->email,
                    'role' => $trail->user ? ($trail->user->getRoleNames()->first() ?? 'User') : 'Unknown',
                    'time' => $trail->created_at->format('Y-m-d H:i:s'),
                    'ip' => $trail->ip_address,
                    'status' => $trail->status,
                ];
            });

        return Inertia::render('AuditLogs/ManageLoginTrails', [
            'loginData' => $loginTrails
        ]);
    }
}
