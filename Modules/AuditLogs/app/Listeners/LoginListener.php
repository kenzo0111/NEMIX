<?php

namespace Modules\AuditLogs\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;
use Modules\AuditLogs\Models\LoginTrail;

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
        LoginTrail::create([
            'user_id' => $event->user->id,
            'name' => $event->user->name,
            'email' => $event->user->email,
            'ip_address' => $this->request->ip(),
            'user_agent' => $this->request->userAgent(),
            'status' => 'Success',
        ]);
    }
}
