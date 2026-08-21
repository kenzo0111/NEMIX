<?php

namespace Modules\AuditLogs\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;
use Modules\AuditLogs\Models\LoginTrail;
use Modules\AuditLogs\Models\TransactionTrail;

class LoginListener
{
    /**
     * Create the event listener.
     */
    public function __construct(private Request $request) {}

    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        $user = $event->user;
        $ip = $this->request->ip() ?: '127.0.0.1';

        try {
            LoginTrail::create([
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'ip_address' => $ip,
                'user_agent' => $this->request->userAgent(),
                'status' => 'Success',
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to create login trail: ' . $e->getMessage());
        }

        try {
            TransactionTrail::create([
                'user_id' => $user->id,
                'module' => 'Audit Logs',
                'action' => 'User Login',
                'resource_ref' => 'AUTH-' . $user->id,
                'details' => "User '{$user->name}' ({$user->email}) successfully logged in from IP {$ip}",
                'status' => 'Verified',
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to create login transaction trail: ' . $e->getMessage());
        }
    }
}
