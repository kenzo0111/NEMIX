<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

class LogAuthenticationActivity
{
    /**
     * Handle user login events.
     */
    public function handleUserLogin(Login $event): void
    {
        $this->logAuthEvent('AUTH_LOGIN_SUCCESS', 'User logged in successfully', [
            'user_id' => $event->user?->getAuthIdentifier(),
            'email' => $event->user?->email ?? null,
            'guard' => $event->guard,
        ]);
    }

    /**
     * Handle failed authentication events.
     */
    public function handleUserFailed(Failed $event): void
    {
        // Redact password or credentials from logged details
        $credentials = $event->credentials;
        unset($credentials['password'], $credentials['password_confirmation'], $credentials['secret']);

        $this->logAuthEvent('AUTH_LOGIN_FAILED', 'Authentication failed', [
            'guard' => $event->guard,
            'user_id' => $event->user?->getAuthIdentifier(),
            'credentials_attempted' => $credentials,
        ], 'warning');
    }

    /**
     * Handle user logout events.
     */
    public function handleUserLogout(Logout $event): void
    {
        $this->logAuthEvent('AUTH_LOGOUT', 'User logged out', [
            'user_id' => $event->user?->getAuthIdentifier(),
            'email' => $event->user?->email ?? null,
            'guard' => $event->guard,
        ]);
    }

    /**
     * Handle authentication lockout events (rate limited login attempts).
     */
    public function handleUserLockout(Lockout $event): void
    {
        $this->logAuthEvent('AUTH_LOCKOUT', 'Authentication attempt rate limited (Lockout)', [
            'request_ip' => $event->request->ip(),
            'request_email' => $event->request->input('email'),
        ], 'warning');
    }

    /**
     * Handle password reset events.
     */
    public function handlePasswordReset(PasswordReset $event): void
    {
        $this->logAuthEvent('AUTH_PASSWORD_RESET', 'User password reset completed', [
            'user_id' => $event->user?->getAuthIdentifier(),
            'email' => $event->user?->email ?? null,
        ]);
    }

    /**
     * Helper to write authentication events to security log channel.
     */
    protected function logAuthEvent(string $eventType, string $message, array $extraContext = [], string $level = 'info'): void
    {
        $context = array_merge([
            'event' => $eventType,
            'ip' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'timestamp' => now()->toIso8601String(),
        ], $extraContext);

        try {
            Log::channel('security')->log($level, $message, $context);
        } catch (\Throwable $e) {
            Log::log($level, $message, $context);
        }
    }

    /**
     * Register the listeners for the subscriber.
     *
     * @param \Illuminate\Events\Dispatcher $events
     * @return array<string, string>
     */
    public function subscribe($events): array
    {
        return [
            Login::class => 'handleUserLogin',
            Failed::class => 'handleUserFailed',
            Logout::class => 'handleUserLogout',
            Lockout::class => 'handleUserLockout',
            PasswordReset::class => 'handlePasswordReset',
        ];
    }
}
