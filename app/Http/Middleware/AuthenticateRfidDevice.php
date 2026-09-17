<?php

namespace App\Http\Middleware;

use App\Models\RfidDevice;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateRfidDevice
{
    public function handle(Request $request, Closure $next): Response
    {
        $deviceId = trim((string) $request->header('X-Device-ID'));
        $timestamp = (string) $request->header('X-Timestamp');
        $nonce = (string) $request->header('X-Nonce');
        $signature = (string) $request->header('X-Signature');
        if (! preg_match('/^[A-Za-z0-9-]{1,100}$/D', $deviceId)
            || ! preg_match('/^[0-9]{10}$/D', $timestamp)
            || abs(time() - (int) $timestamp) > 60
            || ! preg_match('/^[a-fA-F0-9]{32}$/D', $nonce)
            || ! preg_match('/^[a-fA-F0-9]{64}$/D', $signature)) {
            return $this->deny($deviceId, 'invalid_headers');
        }

        $device = RfidDevice::with('settings')->where('device_uuid', $deviceId)->first();
        if (! $device || $device->status === 'disabled' || ! $device->device_secret_encrypted) {
            return $this->deny($deviceId, 'unknown_or_disabled');
        }
        $canonical = implode("\n", [
            $timestamp, $nonce, strtoupper($request->method()),
            '/' . ltrim($request->path(), '/'), hash('sha256', $request->getContent()),
        ]);
        $expected = hash_hmac('sha256', $canonical, $device->device_secret_encrypted);
        if (! hash_equals($expected, strtolower($signature))) {
            return $this->deny($deviceId, 'invalid_signature');
        }
        if (app()->environment('production') && in_array(config('cache.default'), ['array', 'null'], true)) {
            return $this->deny($deviceId, 'replay_cache_unavailable');
        }
        if (! Cache::add("rfid:nonce:{$deviceId}:{$nonce}", true, now()->addMinutes(2))) {
            return $this->deny($deviceId, 'replay');
        }

        $request->attributes->set('rfidDevice', $device);

        return $next($request);
    }

    private function deny(string $deviceId, string $reason): Response
    {
        Log::channel('security')->warning('RFID device authentication rejected', [
            'device_id' => $deviceId, 'reason' => $reason,
        ]);

        return response()->json(['message' => 'RFID device authentication failed.'], 401);
    }
}
