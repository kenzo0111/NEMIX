<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->append(\App\Http\Middleware\EnforceHttpsAndSecurityHeaders::class);
        $middleware->append(\App\Http\Middleware\SecurityAuditLogger::class);
        $middleware->append(\App\Http\Middleware\SanitizeInput::class);

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\AuthorizeAction::class,
            \App\Http\Middleware\EnforceOperatingMode::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->reportable(function (\Throwable $e) {
            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
            if ($status >= 400) {
                $request = request();
                $params = $request->except(['password', 'password_confirmation', 'secret', 'token', '_token']);

                try {
                    \Illuminate\Support\Facades\Log::channel('security')->error('API/HTTP Error Occurred', [
                        'event' => 'API_ERROR',
                        'status_code' => $status,
                        'exception' => get_class($e),
                        'message' => $e->getMessage(),
                        'url' => $request->fullUrl(),
                        'method' => $request->method(),
                        'ip' => $request->ip(),
                        'user_id' => $request->user()?->id,
                        'params' => $params,
                        'file' => $e->getFile().':'.$e->getLine(),
                    ]);
                } catch (\Throwable $loggingError) {
                    // Fallback to default logger if security channel fails
                }
            }
        });
    })->create();
