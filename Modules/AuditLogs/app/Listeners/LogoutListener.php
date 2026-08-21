<?php

namespace Modules\AuditLogs\Listeners;

use Illuminate\Auth\Events\Logout;
use Illuminate\Http\Request;
use Modules\AuditLogs\Models\LoginTrail;
use Modules\AuditLogs\Models\TransactionTrail;

class LogoutListener
{
    /**
     * Create the event listener.
     */
    public function __construct(private Request $request) {}

    /**
     * Handle the event.
     */
    public function handle(Logout $event): void
    {
        $user = $event->user;
        $ip = $this->request->ip() ?: '127.0.0.1';
        $userName = $user?->name ?? 'User';
        $userEmail = $user?->email ?? '';

        try {
            LoginTrail::create([
                'user_id' => $user?->id,
                'name' => $userName,
                'email' => $userEmail,
                'ip_address' => $ip,
                'user_agent' => $this->request->userAgent(),
                'status' => 'Logged Out',
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to log logout trail: ' . $e->getMessage());
        }

        try {
            TransactionTrail::create([
                'user_id' => $user?->id,
                'module' => 'Audit Logs',
                'action' => 'User Logout',
                'resource_ref' => 'AUTH-' . ($user?->id ?? '0'),
                'details' => "User '{$userName}'" . ($userEmail ? " ({$userEmail})" : '') . " logged out of the system from IP {$ip}",
                'status' => 'Verified',
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to log logout transaction trail: ' . $e->getMessage());
        }
    }
}
