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

        $exceptions->render(function (\Illuminate\Database\QueryException $e, $request) {
            $message = $e->getMessage();
            if (
                str_contains($message, 'foreign key constraint') ||
                str_contains($message, 'FOREIGN KEY constraint failed') ||
                str_contains($message, 'Cannot delete or update a parent row') ||
                str_contains($message, 'foreign_key')
            ) {
                $friendlyMessage = 'This record cannot be deleted because it is referenced by existing inventory transactions.';
                if ($request->expectsJson()) {
                    return response()->json(['message' => $friendlyMessage], 422);
                }
                return back()->with('error', $friendlyMessage);
            }

            if (
                str_contains($message, 'rfid_tag') ||
                str_contains($message, 'UNIQUE constraint failed: items.rfid_tag') ||
                str_contains($message, 'duplicate key value violates unique constraint')
            ) {
                $friendlyMessage = 'This RFID tag is already associated with an existing inventory item.';
                if ($request->expectsJson()) {
                    return response()->json(['message' => $friendlyMessage], 422);
                }
                return back()->withErrors(['rfid_tag' => $friendlyMessage]);
            }
        });
    })->create();
