<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnforceHttpsAndSecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        // Enforce HTTPS if configured or in production
        if ($this->shouldEnforceHttps($request)) {
            return redirect()->secure($request->getRequestUri(), 301);
        }

        $response = $next($request);

        // Attach security headers
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';");

        return $response;
    }

    /**
     * Determine whether HTTPS enforcement redirect should occur.
     */
    protected function shouldEnforceHttps(Request $request): bool
    {
        if ($request->secure() || $request->header('X-Forwarded-Proto') === 'https') {
            return false;
        }

        return app()->environment('production') || config('app.force_https', env('FORCE_HTTPS', false));
    }
}
