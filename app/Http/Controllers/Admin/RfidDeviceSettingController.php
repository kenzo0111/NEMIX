<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateRfidDeviceRequest;
use App\Models\RfidDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RfidDeviceSettingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->hasRole('System Admin') || $request->user()?->hasRole('System Administrator') || $request->user()?->can('system.settings.update'), 403);
        $data = $request->validate([
            'device_uuid' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9-]+$/', 'unique:rfid_devices,device_uuid'],
            'device_name' => ['required', 'string', 'max:100'],
            'server_url' => ['required', 'url:https', 'max:2048'],
        ]);
        $plainToken = bin2hex(random_bytes(32));
        $device = DB::transaction(function () use ($data, $plainToken) {
            $device = RfidDevice::create([
                'device_uuid' => $data['device_uuid'], 'device_name' => $data['device_name'],
                'device_token_hash' => password_hash($plainToken, PASSWORD_DEFAULT),
                'device_secret_encrypted' => $plainToken, 'config_version' => 1,
            ]);
            $device->settings()->create([
                'server_url' => $data['server_url'], 'scan_mode' => 'single', 'rf_power' => 20,
                'scan_timeout' => 3000, 'heartbeat_interval' => 30, 'buzzer_enabled' => true,
                'auto_reconnect' => true, 'configuration_version' => 1,
            ]);

            return $device;
        });
        Log::channel('security')->info('RFID device registered', ['device_id' => $device->id, 'user_id' => $request->user()->id]);

        return response()->json([
            'success' => true, 'device_id' => $device->id, 'device_token' => $plainToken,
            'message' => 'Device registered. Copy the token now; it will not be shown again.',
        ], 201, ['Cache-Control' => 'no-store']);
    }

    public function rotate(Request $request, RfidDevice $device): JsonResponse
    {
        abort_unless($request->user()?->hasAnyRole(['System Admin', 'System Administrator']) || $request->user()?->can('system.settings.update'), 403);
        $secret = bin2hex(random_bytes(32));
        $device->update([
            'device_secret_encrypted' => $secret,
            'device_token_hash' => password_hash($secret, PASSWORD_DEFAULT),
        ]);
        Log::channel('security')->info('RFID device secret rotated', ['device_id' => $device->id, 'user_id' => $request->user()->id]);

        return response()->json(['device_token' => $secret], 200, ['Cache-Control' => 'no-store']);
    }

    public function setEnabled(Request $request, RfidDevice $device): JsonResponse
    {
        abort_unless($request->user()?->hasAnyRole(['System Admin', 'System Administrator']) || $request->user()?->can('system.settings.update'), 403);
        $data = $request->validate(['enabled' => ['required', 'boolean']]);
        if ($data['enabled'] && ! $device->device_secret_encrypted) {
            return response()->json(['message' => 'Rotate and provision a new signing secret before enabling this device.'], 422);
        }
        $device->update(['status' => $data['enabled'] ? 'offline' : 'disabled']);
        Log::channel('security')->info('RFID device access changed', [
            'device_id' => $device->id, 'user_id' => $request->user()->id, 'enabled' => $data['enabled'],
        ]);

        return response()->json(['success' => true, 'status' => $device->status]);
    }

    public function revoke(Request $request, RfidDevice $device): JsonResponse
    {
        abort_unless($request->user()?->hasAnyRole(['System Admin', 'System Administrator']) || $request->user()?->can('system.settings.update'), 403);
        $device->update(['status' => 'disabled', 'device_secret_encrypted' => null]);
        Log::channel('security')->warning('RFID device revoked', [
            'device_id' => $device->id, 'user_id' => $request->user()->id,
        ]);

        return response()->json(['success' => true, 'status' => 'disabled']);
    }

    public function update(UpdateRfidDeviceRequest $request, RfidDevice $device): JsonResponse
    {
        $data = $request->validated();
        DB::transaction(function () use ($device, $data) {
            $device = RfidDevice::whereKey($device->getKey())->lockForUpdate()->firstOrFail();
            $settings = $device->settings()->lockForUpdate()->firstOrFail();
            $version = max($device->config_version, $settings->configuration_version) + 1;
            $device->update(['device_name' => $data['device_name'], 'config_version' => $version]);

            $settingsData = collect($data)->except(['device_name', 'wifi_password', 'wifi_ssid'])->all();
            $settingsData['configuration_version'] = $version;
            if (filled($data['wifi_ssid'] ?? null)) {
                $settingsData['wifi_ssid'] = $data['wifi_ssid'];
            }
            if (filled($data['wifi_password'] ?? null)) {
                $settingsData['wifi_password_encrypted'] = $data['wifi_password'];
            }
            $settings->update($settingsData);
        });

        return response()->json(['success' => true, 'message' => 'Configuration queued for the scanner.', 'version' => $device->fresh()->config_version]);
    }

    public function test(RfidDevice $device): JsonResponse
    {
        abort_unless(request()->user()?->hasRole('System Admin') || request()->user()?->hasRole('System Administrator') || request()->user()?->can('system.settings.update'), 403);

        return response()->json([
            'success' => $device->isOnline(),
            'message' => $device->isOnline() ? 'The scanner heartbeat is current.' : 'No recent scanner heartbeat was received.',
            'configuration_status' => Cache::get("rfid_config_status:{$device->id}"),
        ], $device->isOnline() ? 200 : 422);
    }
}
