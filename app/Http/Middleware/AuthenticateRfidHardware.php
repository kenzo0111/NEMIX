<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateRfidHardware
{
    /**
     * Handle an incoming request for RFID hardware endpoints.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            return $next($request);
        }
        return response()->json([
            'message' => 'Authentication required.',
        ], 401);
    }
}
