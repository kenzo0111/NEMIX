<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class SecurityAuditLogger
{
    /**
     * Common suspicious URL patterns or payloads indicative of scanning/probing.
     *
     * @var array<string>
     */
    protected array $suspiciousPatterns = [
        '/\.\.[\/\\\\]/',            // Path traversal (../ or ..\)
        '/\.env/i',                   // Env file probing
        '/\.git/i',                   // Git folder probing
        '/wp-admin/i',                // WordPress admin probing
        '/phpmyadmin/i',              // phpMyAdmin probing
        '/union\s+select/i',          // SQL Injection signature
        '/select\s+.*\s+from/i',       // SQL Injection signature
        '/<script\b[^>]*>/i',         // XSS signature
        '/javascript:/i',             // XSS signature
        '/eval\(.*\)/i',              // Code execution signature
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $this->inspectRequestPayload($request);

        $response = $next($request);

        $this->inspectResponseStatus($request, $response);

        return $response;
    }

    /**
     * Inspect request parameters and path for suspicious attack signatures.
     */
    protected function inspectRequestPayload(Request $request): void
    {
        $decodedFullUrl = rawurldecode($request->fullUrl());
        $decodedQuery = rawurldecode($request->getQueryString() ?? '');
        $decodedPath = rawurldecode($request->path());
        $inputs = json_encode($request->all());

        foreach ($this->suspiciousPatterns as $pattern) {
            if (
                preg_match($pattern, $decodedFullUrl) ||
                preg_match($pattern, $decodedQuery) ||
                preg_match($pattern, $decodedPath) ||
                ($inputs && preg_match($pattern, rawurldecode($inputs)))
            ) {
                $this->logSecurityWarning('Suspicious request pattern detected', $request, [
                    'matched_pattern' => $pattern,
                    'path' => $decodedPath,
                    'query' => $decodedQuery,
                ]);
                break;
            }
        }
    }

    /**
     * Inspect response status code for unusual traffic metrics (e.g. 429 Too Many Requests, 404 scanning).
     */
    protected function inspectResponseStatus(Request $request, Response $response): void
    {
        $status = $response->getStatusCode();

        if ($status === 429) {
            $this->logSecurityWarning('Rate limit exceeded (429 Too Many Requests)', $request, [
                'status_code' => 429,
            ]);
        } elseif ($status === 404 && $this->isSensitiveScanPath($request->path())) {
            $this->logSecurityWarning('Probe detected on non-existent sensitive path', $request, [
                'status_code' => 404,
                'path' => $request->path(),
            ]);
        }
    }

    /**
     * Check if a 404 hit was on a sensitive path.
     */
    protected function isSensitiveScanPath(string $path): bool
    {
        $sensitivePaths = ['.env', '.git', 'wp-admin', 'phpmyadmin', 'admin.php', 'config.json', 'storage/logs'];
        foreach ($sensitivePaths as $sensitive) {
            if (stripos($path, $sensitive) !== false) {
                return true;
            }
        }
        return false;
    }

    /**
     * Log warning event to security log channel (fallback to default log channel).
     */
    protected function logSecurityWarning(string $message, Request $request, array $extraContext = []): void
    {
        $context = array_merge([
            'event' => 'UNUSUAL_TRAFFIC',
            'ip' => $request->ip(),
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'user_agent' => $request->userAgent(),
            'user_id' => $request->user()?->id,
        ], $extraContext);

        try {
            Log::channel('security')->warning($message, $context);
        } catch (\Throwable $e) {
            Log::warning($message, $context);
        }
    }
}
