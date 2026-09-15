<?php

namespace App\Http\Controllers\Hardware;

use App\Http\Controllers\Controller;
use App\Models\RfidDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Modules\Inventory\Models\Item;

class RfidDeviceController extends Controller
{
    private function device(Request $request): RfidDevice
    {
        return $request->attributes->get('rfidDevice');
    }

    public function configuration(Request $request): JsonResponse
    {
        $device = $this->device($request);
        $settings = $device->settings;

        return response()->json([
            'success' => true,
            'configuration' => [
                'version' => $settings->configuration_version,
                'server_url' => $settings->server_url,
                'scan_mode' => $settings->scan_mode,
                'rf_power' => $settings->rf_power,
                'scan_timeout' => $settings->scan_timeout,
                'heartbeat_interval' => $settings->heartbeat_interval,
                'buzzer_enabled' => $settings->buzzer_enabled,
                'auto_reconnect' => $settings->auto_reconnect,
            ],
        ], 200, [], JSON_UNESCAPED_SLASHES);
    }

    /** Authenticated, version-gated Wi-Fi migration payload. Never used by browser APIs. */
    public function networkConfiguration(Request $request): JsonResponse
    {
        $data = $request->validate(['current_version' => ['required', 'integer', 'min:0']]);
        $device = $this->device($request);
        $settings = $device->settings;
        if (
            (int) $data['current_version'] >= $settings->configuration_version
            || blank($settings->wifi_ssid)
        ) {
            return response()->json(['success' => true, 'configuration_available' => false], 200, [], JSON_UNESCAPED_SLASHES);
        }

        return response()->json([
            'success' => true,
            'configuration_available' => true,
            'version' => $settings->configuration_version,
            'wifi_ssid' => $settings->wifi_ssid,
            'wifi_password' => $settings->wifi_password_encrypted,
        ], 200, [], JSON_UNESCAPED_SLASHES);
    }

    public function heartbeat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'firmware_version' => ['required', 'string', 'max:50'],
            'ip_address' => ['nullable', 'ip'],
            'configuration_version' => ['required', 'integer', 'min:0'],
            'wifi_rssi' => ['nullable', 'integer', 'between:-127,0'],
            'uptime' => ['required', 'integer', 'min:0'],
            'scanner_ready' => ['required', 'boolean'],
        ]);
        $device = $this->device($request);
        $device->update([
            'firmware_version' => $data['firmware_version'],
            'status' => 'online',
            'ip_address' => $data['ip_address'] ?? $request->ip(),
            'wifi_rssi' => $data['wifi_rssi'] ?? null,
            'uptime_seconds' => $data['uptime'],
            'scanner_ready' => $data['scanner_ready'],
            'last_seen_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'server_configuration_version' => $device->settings->configuration_version,
            'configuration_available' => $device->settings->configuration_version > $data['configuration_version'],
        ]);
    }

    public function configurationStatus(Request $request): JsonResponse
    {
        $data = $request->validate([
            'version' => ['required', 'integer', 'min:1'],
            'status' => ['required', 'in:applied,failed,rolled_back'],
            'message' => ['nullable', 'string', 'max:255'],
        ]);
        $device = $this->device($request);
        Cache::put("rfid_config_status:{$device->id}", $data + ['reported_at' => now()->toIso8601String()], now()->addDay());

        return response()->json(['success' => true]);
    }

    public function scan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'epc' => ['required', 'string', 'max:100', 'regex:/^[A-Fa-f0-9]+$/'],
            'rssi' => ['nullable', 'integer', 'between:-127,0'],
        ]);
        $device = $this->device($request);
        $item = Item::where('rfid_tag', strtoupper($data['epc']))->first();
        Cache::put('latest_rfid_hardware_scan', [
            'tag' => strtoupper($data['epc']), 'found' => (bool) $item,
            'device_id' => $device->device_uuid, 'timestamp' => microtime(true),
            'scanned_at' => now()->format('h:i:s A'),
        ], 60);

        return response()->json(['success' => true, 'found' => (bool) $item, 'item' => $item?->only(['id', 'name', 'sku', 'stock', 'unit_of_issue'])], $item ? 200 : 404);
    }
}
