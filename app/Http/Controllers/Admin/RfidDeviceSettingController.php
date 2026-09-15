<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateRfidDeviceRequest;
use App\Models\RfidDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RfidDeviceSettingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->hasRole('System Admin') || $request->user()?->hasRole('System Administrator') || $request->user()?->can('system.settings.update'), 403);
        $data = $request->validate([
            'device_uuid' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9-]+$/', 'unique:rfid_devices,device_uuid'],
            'device_name' => ['required', 'string', 'max:100'],
            'server_url' => ['required', 'url:http,https', 'max:2048'],
        ]);
        $plainToken = Str::random(48);
        $device = DB::transaction(function () use ($data, $plainToken) {
            $device = RfidDevice::create([
                'device_uuid' => $data['device_uuid'], 'device_name' => $data['device_name'],
                'device_token_hash' => password_hash($plainToken, PASSWORD_DEFAULT), 'config_version' => 1,
            ]);
            $device->settings()->create([
                'server_url' => $data['server_url'], 'scan_mode' => 'single', 'rf_power' => 20,
                'scan_timeout' => 3000, 'heartbeat_interval' => 30, 'buzzer_enabled' => true,
                'auto_reconnect' => true, 'configuration_version' => 1,
            ]);

            return $device;
        });

        return response()->json([
            'success' => true, 'device_id' => $device->id, 'device_token' => $plainToken,
            'message' => 'Device registered. Copy the token now; it will not be shown again.',
        ], 201);
    }

    public function update(UpdateRfidDeviceRequest $request, RfidDevice $device): JsonResponse
    {
        $data = $request->validated();
        DB::transaction(function () use ($device, $data) {
            $device = RfidDevice::whereKey($device->getKey())->lockForUpdate()->firstOrFail();
            $settings = $device->settings()->lockForUpdate()->firstOrFail();
            $version = max($device->config_version, $settings->configuration_version) + 1;
            $device->update(['device_name' => $data['device_name'], 'config_version' => $version]);

            $settingsData = collect($data)->except(['device_name', 'wifi_password'])->all();
            $settingsData['configuration_version'] = $version;
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
