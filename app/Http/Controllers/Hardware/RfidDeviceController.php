<?php

namespace App\Http\Controllers\Hardware;

use App\Http\Controllers\Controller;
use App\Models\RfidDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Inventory\Models\Item;

class RfidDeviceController extends Controller
{
    private function device(Request $request): RfidDevice
    {
        return $request->attributes->get('rfidDevice');
    }

    /** One snapshot prevents settings and Wi-Fi from crossing configuration versions. */
    public function candidate(Request $request): JsonResponse
    {
        $data = $request->validate(['current_network_version' => ['sometimes', 'integer', 'min:0', 'max:4294967295']]);
        $settings = $this->device($request)->settings;
        $networkAvailable = strlen($settings->wifi_ssid ?? '') > 0
            && (! isset($data['current_network_version']) || $settings->network_version > $data['current_network_version']);

        return response()->json([
            'success' => true,
            'configuration' => $settings->only(['server_url', 'scan_mode', 'rf_power', 'scan_timeout', 'heartbeat_interval', 'buzzer_enabled', 'auto_reconnect']) + [
                'version' => $settings->configuration_version,
                'network_version' => $settings->network_version,
                'network_available' => $networkAvailable,
                'wifi_ssid' => $networkAvailable ? $settings->wifi_ssid : null,
                'wifi_password' => $networkAvailable ? $settings->wifi_password_encrypted : null,
            ],
        ], 200, ['Cache-Control' => 'no-store'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public function configuration(Request $request): JsonResponse
    {
        $device = $this->device($request);
        $settings = $device->settings;

        return response()->json([
            'success' => true,
            'configuration' => [
                'version' => $settings->configuration_version,
                'network_version' => $settings->network_version,
                'server_url' => $settings->server_url,
                'scan_mode' => $settings->scan_mode,
                'rf_power' => $settings->rf_power,
                'scan_timeout' => $settings->scan_timeout,
                'heartbeat_interval' => $settings->heartbeat_interval,
                'buzzer_enabled' => $settings->buzzer_enabled,
                'auto_reconnect' => $settings->auto_reconnect,
            ],
        ], 200, ['Cache-Control' => 'no-store'], JSON_UNESCAPED_SLASHES);
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
            return response()->json(['success' => true, 'configuration_available' => false], 200, ['Cache-Control' => 'no-store'], JSON_UNESCAPED_SLASHES);
        }

        Log::channel('security')->info('RFID network configuration delivered', [
            'device_id' => $device->id, 'ip' => $request->ip(), 'version' => $settings->configuration_version,
        ]);

        return response()->json([
            'success' => true,
            'configuration_available' => true,
            'version' => $settings->configuration_version,
            'wifi_ssid' => $settings->wifi_ssid,
            'wifi_password' => $settings->wifi_password_encrypted,
        ], 200, ['Cache-Control' => 'no-store'], JSON_UNESCAPED_SLASHES);
    }

    public function heartbeat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'firmware_version' => ['required', 'string', 'max:50'],
            'ip_address' => ['nullable', 'ip'],
            'configuration_version' => ['required', 'integer', 'min:0'],
            'wifi_rssi' => ['nullable', 'integer', 'between:-127,0'],
            'wifi_networks' => ['sometimes', 'array', 'max:20'],
            'wifi_networks.*' => ['required', 'array:ssid,rssi,secure'],
            'wifi_networks.*.ssid' => ['required', 'string', 'max:32', function ($attribute, $value, $fail) {
                if (! is_string($value) || strlen($value) > 32 || str_contains($value, "\0")) {
                    $fail('Invalid network name.');
                }
            }],
            'wifi_networks.*.rssi' => ['required', 'integer', 'between:-127,0'],
            'wifi_networks.*.secure' => ['required', 'boolean'],
            'wifi_scan_request_id' => ['nullable', 'string', 'size:32', 'regex:/^[a-f0-9]+$/'],
            'wifi_scan_age_ms' => [\Illuminate\Validation\Rule::requiredIf($request->exists('wifi_networks')), 'integer', 'between:0,120000'],
            'connected_ssid' => ['sometimes', 'required', 'string', 'max:32'],
            'network_version' => ['sometimes', 'required', 'integer', 'min:0', 'max:4294967295'],
            'uptime' => ['required', 'integer', 'min:0'],
            'scanner_ready' => ['required', 'boolean'],
            'reader_diagnostics' => ['sometimes', 'nullable', 'array:responses,tags,timeouts,invalid_frames,reader_errors,last_error,queue_count,scan_block_reason,recovery_attempts,last_response_age_ms,last_tag_age_ms'],
            'reader_diagnostics.responses' => ['required_with:reader_diagnostics', 'integer', 'min:0', 'max:4294967295'],
            'reader_diagnostics.tags' => ['required_with:reader_diagnostics', 'integer', 'min:0', 'max:4294967295'],
            'reader_diagnostics.timeouts' => ['required_with:reader_diagnostics', 'integer', 'min:0', 'max:4294967295'],
            'reader_diagnostics.invalid_frames' => ['required_with:reader_diagnostics', 'integer', 'min:0', 'max:4294967295'],
            'reader_diagnostics.reader_errors' => ['required_with:reader_diagnostics', 'integer', 'min:0', 'max:4294967295'],
            'reader_diagnostics.last_error' => ['required_with:reader_diagnostics', 'integer', 'between:-1,255'],
            'reader_diagnostics.queue_count' => ['required_with:reader_diagnostics', 'integer', 'between:0,100'],
            'reader_diagnostics.scan_block_reason' => ['required_with:reader_diagnostics', 'in:none,reader_unavailable,queue_full,storage_pending,storage_invalid'],
            'reader_diagnostics.recovery_attempts' => ['required_with:reader_diagnostics', 'integer', 'min:0', 'max:4294967295'],
            'reader_diagnostics.last_response_age_ms' => ['present_with:reader_diagnostics', 'nullable', 'integer', 'min:0', 'max:4294967295'],
            'reader_diagnostics.last_tag_age_ms' => ['present_with:reader_diagnostics', 'nullable', 'integer', 'min:0', 'max:4294967295'],
        ]);
        $device = $this->device($request);
        DB::transaction(function () use ($device, $data, $request) {
            $device = RfidDevice::whereKey($device->id)->lockForUpdate()->firstOrFail();
            abort_if($device->status === 'disabled' || ! $device->device_secret_encrypted, 401, 'RFID device access is disabled.');
            abort_if($data['configuration_version'] > $device->config_version, 422, 'Unknown configuration version.');
            abort_if(isset($data['network_version']) && $data['network_version'] > $device->settings->network_version, 422, 'Unknown network version.');
            abort_if(isset($data['connected_ssid']) && strlen($data['connected_ssid']) > 32, 422, 'SSID must not exceed 32 bytes.');
            $device->update([
                'firmware_version' => $data['firmware_version'],
                'status' => 'online',
                'ip_address' => $data['ip_address'] ?? $request->ip(),
                'wifi_rssi' => $data['wifi_rssi'] ?? null,
                'uptime_seconds' => $data['uptime'],
                'scanner_ready' => $data['scanner_ready'],
                // An older firmware heartbeat must not retain diagnostics from a newer session.
                'reader_diagnostics' => $data['reader_diagnostics'] ?? null,
                'connected_ssid' => $data['connected_ssid'] ?? null,
                'reported_network_version' => $data['network_version'] ?? null,
                // PostgreSQL timestamptz expects UTC; SQLite/MySQL datetime casts use app time.
                'last_seen_at' => DB::getDriverName() === 'pgsql' ? now()->utc() : now(),
                'applied_config_version' => $data['configuration_version'],
            ]);
            if ($data['configuration_version'] === $device->config_version) {
                $device->update([
                    'configuration_status' => 'applied', 'configuration_status_version' => $data['configuration_version'],
                    'configuration_message' => null, 'configuration_reported_at' => now()->utc(),
                ]);
            } elseif ($device->configuration_status === 'applied') {
                $device->update(['configuration_status' => 'pending']);
            }
        });
        $device->refresh();

        if (array_key_exists('wifi_networks', $data)) {
            $networks = collect($data['wifi_networks'])->sortByDesc('rssi')->unique('ssid')->values()->all();
            Cache::put('rfid_wifi_networks:'.$device->id, [
                'networks' => $networks,
                'scanned_at' => now()->subMilliseconds($data['wifi_scan_age_ms'])->toIso8601String(),
                'request_id' => $data['wifi_scan_request_id'] ?? null,
            ], 600);
            if (isset($data['wifi_scan_request_id']) && Cache::get('rfid_wifi_scan_request:'.$device->id) === $data['wifi_scan_request_id']) {
                Cache::forget('rfid_wifi_scan_request:'.$device->id);
            }
        }

        return response()->json([
            'success' => true,
            'server_configuration_version' => $device->settings->configuration_version,
            'wifi_scan_request_id' => Cache::get('rfid_wifi_scan_request:'.$device->id),
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
        DB::transaction(function () use ($device, $data) {
            $device = RfidDevice::whereKey($device->id)->lockForUpdate()->firstOrFail();
            abort_if($data['version'] > $device->config_version, 422, 'Unknown configuration version.');
            // A delayed report must not replace the outcome of a newer save.
            if ($data['version'] !== $device->config_version) {
                return;
            }
            $device->update([
                'configuration_status' => $data['status'], 'configuration_status_version' => $data['version'],
                'configuration_message' => $data['message'] ?? null, 'configuration_reported_at' => now()->utc(),
                ...($data['status'] === 'applied' ? ['applied_config_version' => $data['version']] : []),
            ]);
        });

        return response()->json(['success' => true]);
    }

    public function scan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'epc' => ['required', 'string', 'max:100', 'regex:/^[A-Fa-f0-9]+$/'],
            'rssi' => ['nullable', 'integer', 'between:-127,0'],
            'station_id' => ['nullable', 'string', 'max:100'],
            'event_uuid' => ['nullable', 'string', 'regex:/^[a-f0-9]{32}$/'],
        ]);
        $device = $this->device($request);
        $stationId = $device->station_id ?? ($data['station_id'] ?? null);
        $item = Item::where('rfid_tag', strtoupper($data['epc']))->first();
        $inserted = $this->recordScan($device, $data, $stationId);
        if ($inserted) {
            Cache::put('latest_rfid_hardware_scan', [
                'tag' => strtoupper($data['epc']), 'found' => (bool) $item,
                'device_id' => $device->device_uuid, 'station_id' => $stationId,
                'timestamp' => microtime(true),
                'scanned_at' => now()->format('h:i:s A'),
            ], 60);
        }

        return response()->json(['success' => true, 'found' => (bool) $item, 'item' => $item?->only(['id', 'name', 'sku', 'stock', 'unit_of_issue'])], $item ? 200 : 404);
    }

    public function scans(Request $request): JsonResponse
    {
        $data = $request->validate([
            'scans' => ['required', 'array', 'min:1', 'max:20'],
            'scans.*.epc' => ['required', 'string', 'max:100', 'regex:/^[A-Fa-f0-9]+$/'],
            'scans.*.rssi' => ['required', 'integer', 'between:-127,0'],
            'scans.*.event_uuid' => ['required', 'string', 'distinct', 'regex:/^[a-f0-9]{32}$/'],
        ]);
        $device = $this->device($request);
        DB::transaction(function () use ($device, $data) {
            foreach ($data['scans'] as $scan) {
                $this->recordScan($device, $scan, $device->station_id);
            }
        });

        return response()->json(['success' => true, 'accepted' => array_column($data['scans'], 'event_uuid')]);
    }

    private function recordScan(RfidDevice $device, array $scan, ?string $stationId): bool
    {
        $row = [
            'tag' => strtoupper($scan['epc']), 'device_uuid' => $device->device_uuid,
            'station_id' => $stationId, 'occurred_at' => microtime(true), 'created_at' => now(),
            'event_uuid' => $scan['event_uuid'] ?? null,
        ];
        // The unique device/event key makes a lost response safe to retry.
        $inserted = DB::table('rfid_scan_events')->insertOrIgnore($row) === 1;
        if (! $inserted && isset($scan['event_uuid'])) {
            $existing = DB::table('rfid_scan_events')->where('device_uuid', $device->device_uuid)->where('event_uuid', $scan['event_uuid'])->first();
            abort_unless($existing && $existing->tag === strtoupper($scan['epc']), 409, 'Event identifier already used for a different tag.');
        }

        return $inserted;
    }
}
