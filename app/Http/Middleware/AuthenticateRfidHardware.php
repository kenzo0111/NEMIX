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
        $authHeader = $request->header('Authorization');
        $configuredToken = config('services.rfid.device_token');

        // 1. If an Authorization header is provided, evaluate Bearer token
        if (!empty($authHeader)) {
            if (preg_match('/^Bearer\s+(.*?)$/i', $authHeader, $matches)) {
                $token = trim($matches[1]);
                if (!empty($configuredToken) && hash_equals($configuredToken, $token)) {
                    return $next($request);
                }
            }

            return response()->json([
                'message' => 'Unauthorized: Invalid RFID device token.',
            ], 401);
        }

        // 2. If no token header is provided, check for active authenticated user session (web dashboard sync)
        if ($request->user()) {
            return $next($request);
        }

        // 3. Allow hardware scanner if device token is not configured in .env OR if request originates from ESP32 hardware
        $userAgent = $request->userAgent() ?? '';
        if (empty($configuredToken) || stripos($userAgent, 'ESP32') !== false) {
            return $next($request);
        }

        // 4. Neither valid hardware token nor authenticated session
        return response()->json([
            'message' => 'Unauthorized: RFID hardware token or active user session required.',
        ], 401);
    }
}
