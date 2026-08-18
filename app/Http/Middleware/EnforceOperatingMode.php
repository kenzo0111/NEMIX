<?php

namespace App\Http\Middleware;

use App\Models\SystemConfiguration;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceOperatingMode
{
    /**
     * Handle an incoming request and enforce system operating mode rules.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $config = SystemConfiguration::current();
        $mode = $config->active_mode;

        // Share current mode on request attributes
        $request->attributes->set('system_operating_mode', $mode);

        $user = $request->user();
        $isSystemAdmin = $user && (
            $user->hasRole('System Admin') ||
            $user->hasRole('System Administrator') ||
            ($user->role ?? null) === 'System Admin' ||
            ($user->role ?? null) === 'System Administrator'
        );

        // 1. MAINTENANCE MODE ENFORCEMENT: Restrict non-admin write operations
        if ($mode === 'MAINTENANCE MODE') {
            $isWriteOperation = in_array(strtoupper($request->method()), ['POST', 'PUT', 'PATCH', 'DELETE']);
            
            // Allow system mode update route itself and logout/auth routes
            $isSystemModeRoute = $request->routeIs('system.mode.update') || $request->is('logout') || $request->is('login');

            if ($isWriteOperation && ! $isSystemAdmin && ! $isSystemModeRoute) {
                $message = 'System is currently under MAINTENANCE MODE. Inventory writes, stock issuances, and sensitive transactions are temporarily restricted to System Administrators.';

                if ($request->wantsJson() || $request->is('api/*')) {
                    return response()->json([
                        'error' => 'Maintenance Mode Lockout',
                        'message' => $message,
                        'mode' => 'MAINTENANCE MODE',
                    ], 403);
                }

                return back()->with('error', $message);
            }
        }

        return $next($request);
    }
}
