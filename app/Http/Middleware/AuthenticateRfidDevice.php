<?php

namespace App\Http\Middleware;

use App\Models\RfidDevice;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateRfidDevice
{
    public function handle(Request $request, Closure $next): Response
    {
        $deviceId = trim((string) $request->header('X-Device-ID'));
        $token = (string) $request->header('X-Hardware-Token');

        if ($deviceId === '' || $token === '') {
            return response()->json(['message' => 'RFID device credentials are required.'], 401);
        }

        $device = RfidDevice::with('settings')->where('device_uuid', $deviceId)->first();
        if (! $device || ! password_verify($token, $device->device_token_hash)) {
            return response()->json(['message' => 'Invalid RFID device credentials.'], 401);
        }

        $request->attributes->set('rfidDevice', $device);

        return $next($request);
    }
}
