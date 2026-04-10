<?php

namespace Modules\AuditLogs\Listeners;

use Illuminate\Auth\Events\Failed;
use Illuminate\Http\Request;
use Modules\AuditLogs\Models\LoginTrail;

class FailedLoginListener
{
    /**
     * Create the event listener.
     */
    public function __construct(private Request $request) {}

    /**
     * Handle the event.
     */
    public function handle(Failed $event): void
    {
        LoginTrail::create([
            'user_id' => $event->user?->id,
            'name' => $event->user?->name ?? 'Unknown',
            'email' => $event->credentials['email'] ?? 'Unknown',
            'ip_address' => $this->request->ip(),
            'user_agent' => $this->request->userAgent(),
            'status' => 'Failed',
        ]);
    }
}
