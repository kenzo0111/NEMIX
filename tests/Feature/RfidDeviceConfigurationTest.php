<?php

namespace Tests\Feature;

use App\Models\RfidDevice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RfidDeviceConfigurationTest extends TestCase
{
    use RefreshDatabase;

    private function device(): array
    {
        $token = 'test-device-token-with-sufficient-entropy';
        $device = RfidDevice::create([
            'device_uuid' => 'RFID-HH-TEST01',
            'device_name' => 'Test Scanner',
            'device_token_hash' => password_hash($token, PASSWORD_DEFAULT),
            'device_secret_encrypted' => $token,
            'config_version' => 2,
        ]);
        $device->settings()->create([
            'wifi_ssid' => 'Private Network',
            'wifi_password_encrypted' => 'correct horse battery staple',
            'server_url' => 'https://inventory.example.edu',
            'scan_mode' => 'single', 'rf_power' => 20, 'scan_timeout' => 3000,
            'heartbeat_interval' => 30, 'buzzer_enabled' => true,
            'auto_reconnect' => true, 'configuration_version' => 2,
        ]);

        return [$device, $token];
    }

    private function signedHeaders(RfidDevice $device, string $method, string $path, array $body = []): array
    {
        $timestamp = (string) time();
        $nonce = bin2hex(random_bytes(16));
        $rawBody = $method === 'GET' ? '[]' : json_encode($body);
        $canonical = implode("\n", [$timestamp, $nonce, $method, $path, hash('sha256', $rawBody)]);

        return [
            'X-Device-ID' => $device->device_uuid,
            'X-Timestamp' => $timestamp,
            'X-Nonce' => $nonce,
            'X-Signature' => hash_hmac('sha256', $canonical, $device->device_secret_encrypted),
        ];
    }

    public function test_configuration_api_rejects_missing_credentials(): void
    {
        $this->device();
        $this->getJson('/api/hardware/rfid/config')->assertUnauthorized();
    }

    public function test_human_readable_esp32_identifier_can_be_registered(): void
    {
        [$device] = $this->device();

        $this->assertSame('RFID-HH-TEST01', $device->device_uuid);
        $this->assertDatabaseHas('rfid_devices', [
            'device_uuid' => 'RFID-HH-TEST01',
        ]);
    }

    public function test_admin_registration_endpoint_accepts_firmware_device_identifier(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'System Admin']));

        $response = $this->actingAs($admin)->postJson('/admin/system-settings/rfid-devices', [
            'device_uuid' => 'RFID-HH-0FF0A4',
            'device_name' => 'Stockroom Scanner 1',
            'server_url' => 'https://unc-nemix.com',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['device_token']);
        $this->assertDatabaseHas('rfid_devices', [
            'device_uuid' => 'RFID-HH-0FF0A4',
        ]);
    }

    public function test_regular_configuration_never_exposes_wifi_or_tokens(): void
    {
        [$device, $token] = $this->device();
        $response = $this->withHeaders($this->signedHeaders($device, 'GET', '/api/hardware/rfid/config'))
            ->getJson('/api/hardware/rfid/config')
            ->assertOk()
            ->assertJsonPath('configuration.version', 2)
            ->assertJsonPath('configuration.server_url', 'https://inventory.example.edu')
            ->assertJsonMissingPath('configuration.wifi_password')
            ->assertJsonMissingPath('configuration.device_token');
        $this->assertStringNotContainsString('correct horse battery staple', $response->getContent());
        $this->assertStringNotContainsString('https:\/\/', $response->getContent());
        $this->assertStringContainsString('https://inventory.example.edu', $response->getContent());
    }

    public function test_authenticated_version_gated_network_migration_and_heartbeat(): void
    {
        [$device, $token] = $this->device();
        $networkBody = ['current_version' => 1];
        $this->withHeaders($this->signedHeaders($device, 'POST', '/api/hardware/rfid/network-config', $networkBody))
            ->postJson('/api/hardware/rfid/network-config', $networkBody)
            ->assertOk()->assertHeader('Cache-Control', 'no-store, private')->assertJsonPath('wifi_ssid', 'Private Network')
            ->assertJsonPath('wifi_password', 'correct horse battery staple');
        $heartbeatBody = [
            'firmware_version' => '2.0.0', 'ip_address' => '192.168.1.20',
            'configuration_version' => 1, 'wifi_rssi' => -55, 'uptime' => 120,
            'scanner_ready' => true,
        ];
        $this->withHeaders($this->signedHeaders($device, 'POST', '/api/hardware/rfid/heartbeat', $heartbeatBody))
            ->postJson('/api/hardware/rfid/heartbeat', $heartbeatBody)
            ->assertOk()->assertJsonPath('configuration_available', true);
        $this->assertNotNull($device->fresh()->last_seen_at);
    }

    public function test_blank_server_wifi_configuration_does_not_replace_locally_provisioned_credentials(): void
    {
        $token = 'test-device-token-with-sufficient-entropy';
        $device = RfidDevice::create([
            'device_uuid' => 'RFID-HH-LOCAL01',
            'device_name' => 'Locally Provisioned Scanner',
            'device_token_hash' => password_hash($token, PASSWORD_DEFAULT),
            'device_secret_encrypted' => $token,
            'config_version' => 1,
        ]);
        $device->settings()->create([
            'server_url' => 'https://inventory.example.edu',
            'scan_mode' => 'single', 'rf_power' => 20, 'scan_timeout' => 3000,
            'heartbeat_interval' => 30, 'buzzer_enabled' => true,
            'auto_reconnect' => true, 'configuration_version' => 1,
        ]);

        $body = ['current_version' => 0];
        $this->withHeaders($this->signedHeaders($device, 'POST', '/api/hardware/rfid/network-config', $body))
            ->postJson('/api/hardware/rfid/network-config', $body)
            ->assertOk()
            ->assertJsonPath('configuration_available', false)
            ->assertJsonMissingPath('wifi_ssid')
            ->assertJsonMissingPath('wifi_password');
    }

    public function test_wifi_password_is_encrypted_at_rest(): void
    {
        [$device] = $this->device();
        $raw = DB::table('rfid_device_settings')->where('device_id', $device->id)->value('wifi_password_encrypted');
        $this->assertNotSame('correct horse battery staple', $raw);
        $this->assertSame('correct horse battery staple', $device->settings->wifi_password_encrypted);
    }

    private function settingsPayload(): array
    {
        return [
            'device_name' => 'Updated Scanner', 'wifi_ssid' => 'Private Network', 'wifi_password' => '',
            'server_url' => 'https://inventory.example.edu', 'scan_mode' => 'inventory', 'rf_power' => 18,
            'scan_timeout' => 5000, 'heartbeat_interval' => 20, 'buzzer_enabled' => true, 'auto_reconnect' => true,
            'station_id' => 'STATION-1',
        ];
    }

    public function test_save_queues_version_without_claiming_device_applied_it(): void
    {
        [$device] = $this->device();
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'System Admin']));
        $this->actingAs($admin)->putJson(route('system.settings.rfid-devices.update', $device), $this->settingsPayload())
            ->assertOk()->assertJsonPath('version', 3);
        $device->refresh();
        $this->assertSame('pending', $device->configuration_status);
        $this->assertSame(0, $device->applied_config_version);
        $this->assertSame('STATION-1', $device->station_id);
        $this->assertSame('correct horse battery staple', $device->settings->wifi_password_encrypted);
    }

    public function test_open_network_and_special_characters_survive_candidate_snapshot(): void
    {
        [$device] = $this->device();
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'System Admin']));
        $payload = $this->settingsPayload();
        $payload['wifi_ssid'] = ' Network "\\角" ';
        $payload['wifi_password'] = 'special"\\password';
        $this->actingAs($admin)->putJson(route('system.settings.rfid-devices.update', $device), $payload)->assertOk();
        $device->refresh();
        $path = '/api/hardware/rfid/config/candidate';
        $this->withHeaders($this->signedHeaders($device, 'POST', $path))->postJson($path, [])
            ->assertOk()->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('configuration.version', 3)
            ->assertJsonPath('configuration.wifi_ssid', $payload['wifi_ssid'])
            ->assertJsonPath('configuration.wifi_password', $payload['wifi_password']);
        $payload['wifi_password'] = '';
        $payload['wifi_open_network'] = true;
        $this->actingAs($admin)->putJson(route('system.settings.rfid-devices.update', $device), $payload)->assertOk();
        $device->refresh();
        $this->withHeaders($this->signedHeaders($device, 'POST', $path))->postJson($path, [])
            ->assertJsonPath('configuration.version', 4)->assertJsonPath('configuration.wifi_password', '');
    }

    public function test_stale_status_cannot_overwrite_new_save_and_heartbeat_confirms_applied_version(): void
    {
        [$device] = $this->device();
        $device->update(['config_version' => 3, 'configuration_status' => 'pending']);
        $device->settings->update(['configuration_version' => 3]);
        $path = '/api/hardware/rfid/config/status';
        $body = ['version' => 2, 'status' => 'applied'];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)->assertOk();
        $this->assertSame('pending', $device->fresh()->configuration_status);
        $body = ['version' => 3, 'status' => 'rolled_back', 'message' => 'New server unreachable'];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)->assertOk();
        $this->assertSame('rolled_back', $device->fresh()->configuration_status);
        $path = '/api/hardware/rfid/heartbeat';
        $body = ['firmware_version' => '2.1.0', 'configuration_version' => 2, 'uptime' => 90, 'scanner_ready' => true];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)
            ->assertOk()->assertJsonPath('configuration_available', true);
        $this->assertSame(2, $device->fresh()->applied_config_version);
        $this->assertSame('rolled_back', $device->fresh()->configuration_status);
        $body['configuration_version'] = 3;
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)->assertOk();
        $this->assertSame('applied', $device->fresh()->configuration_status);
        $this->assertSame(3, $device->fresh()->applied_config_version);
    }

    public function test_future_configuration_report_is_rejected(): void
    {
        [$device] = $this->device();
        $path = '/api/hardware/rfid/config/status';
        $body = ['version' => 999, 'status' => 'applied'];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)->assertStatus(422);
        $this->assertSame(0, $device->fresh()->applied_config_version);
    }

    public function test_batch_delivery_retry_is_idempotent_and_uses_assigned_station(): void
    {
        [$device] = $this->device();
        $device->update(['station_id' => 'STATION-1']);
        $path = '/api/hardware/rfid/scans';
        $body = ['scans' => [
            ['epc' => 'ABCDEF01', 'rssi' => -45, 'event_uuid' => str_repeat('a', 32)],
            ['epc' => 'ABCDEF02', 'rssi' => -48, 'event_uuid' => str_repeat('b', 32)],
        ]];
        for ($attempt = 0; $attempt < 2; $attempt++) {
            $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)
                ->assertOk()->assertJsonPath('accepted', [str_repeat('a', 32), str_repeat('b', 32)]);
        }
        $this->assertSame(2, DB::table('rfid_scan_events')->count());
        $this->assertSame(2, DB::table('rfid_scan_events')->where('station_id', 'STATION-1')->count());
        $body['scans'][1]['epc'] = 'NOT-HEX';
        $body['scans'][0]['event_uuid'] = str_repeat('c', 32);
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)->assertStatus(422);
        $this->assertSame(2, DB::table('rfid_scan_events')->count());
    }

    public function test_delivery_limit_does_not_block_configuration_traffic(): void
    {
        [$device] = $this->device();
        $path = '/api/hardware/rfid/scans';
        $body = ['scans' => [['epc' => 'ABCDEF01', 'rssi' => -45, 'event_uuid' => str_repeat('a', 32)]]];
        for ($attempt = 0; $attempt < 120; $attempt++) {
            $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)->assertOk();
        }
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)->assertStatus(429);
        $path = '/api/hardware/rfid/config';
        $this->withHeaders($this->signedHeaders($device, 'GET', $path))->getJson($path)->assertOk();
    }

    public function test_event_identifier_collision_rolls_back_the_entire_batch(): void
    {
        [$device] = $this->device();
        $path = '/api/hardware/rfid/scans';
        $body = ['scans' => [['epc' => 'ABCDEF01', 'rssi' => -45, 'event_uuid' => str_repeat('a', 32)]]];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)->assertOk();
        $body = ['scans' => [
            ['epc' => 'ABCDEF02', 'rssi' => -45, 'event_uuid' => str_repeat('b', 32)],
            ['epc' => 'ABCDEF03', 'rssi' => -45, 'event_uuid' => str_repeat('a', 32)],
        ]];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)->assertStatus(409);
        $this->assertSame(1, DB::table('rfid_scan_events')->count());
    }

    public function test_invalid_origins_and_oversized_ssid_bytes_are_rejected(): void
    {
        [$device] = $this->device();
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'System Admin']));
        $payload = $this->settingsPayload();
        $payload['server_url'] = 'https://inventory.example.edu/subpath';
        $this->actingAs($admin)->putJson(route('system.settings.rfid-devices.update', $device), $payload)
            ->assertStatus(422)->assertJsonValidationErrors('server_url');
        $payload['server_url'] = 'https://inventory.example.edu/';
        $payload['wifi_ssid'] = str_repeat('角', 11);
        $this->actingAs($admin)->putJson(route('system.settings.rfid-devices.update', $device), $payload)
            ->assertStatus(422)->assertJsonValidationErrors('wifi_ssid');
        $this->assertSame(2, $device->fresh()->config_version);
    }

    public function test_device_can_be_disabled_and_secret_rotated_only_by_admin(): void
    {
        [$device] = $this->device();
        $staff = User::factory()->create();
        $this->actingAs($staff)->postJson(route('system.settings.rfid-devices.rotate', $device))->assertForbidden();

        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'System Admin']));
        $oldSecret = $device->device_secret_encrypted;
        $rotated = $this->actingAs($admin)->postJson(route('system.settings.rfid-devices.rotate', $device))
            ->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $this->assertNotSame($oldSecret, $rotated->json('device_token'));
        $this->assertNotSame($oldSecret, $device->fresh()->device_secret_encrypted);

        $this->actingAs($admin)->patchJson(route('system.settings.rfid-devices.enabled', $device), ['enabled' => false])
            ->assertOk()->assertJsonPath('status', 'disabled');
        $this->withHeaders($this->signedHeaders($device->fresh(), 'GET', '/api/hardware/rfid/config'))
            ->getJson('/api/hardware/rfid/config')->assertUnauthorized();

        $this->actingAs($admin)->postJson(route('system.settings.rfid-devices.revoke', $device))->assertOk();
        $this->assertNull($device->fresh()->device_secret_encrypted);
        $this->actingAs($admin)->patchJson(route('system.settings.rfid-devices.enabled', $device), ['enabled' => true])
            ->assertStatus(422);
    }
}
