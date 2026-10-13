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
            'auto_reconnect' => true, 'configuration_version' => 2, 'network_version' => 2,
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

    public function test_other_settings_do_not_reapply_acknowledged_wifi(): void
    {
        [$device] = $this->device();
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'System Admin']));
        $this->actingAs($admin)->putJson(route('system.settings.rfid-devices.update', $device), $this->settingsPayload())->assertOk();
        $this->assertSame(2, $device->fresh()->settings->network_version);
        $path = '/api/hardware/rfid/config/candidate';
        $body = ['current_network_version' => 2];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)
            ->assertOk()->assertJsonPath('configuration.version', 3)
            ->assertJsonPath('configuration.network_version', 2)
            ->assertJsonPath('configuration.network_available', false)
            ->assertJsonPath('configuration.wifi_ssid', null)
            ->assertJsonPath('configuration.wifi_password', null);
    }

    public function test_explicit_reapply_creates_a_new_network_revision(): void
    {
        [$device] = $this->device();
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'System Admin']));
        $payload = $this->settingsPayload() + ['wifi_apply' => true];
        $this->actingAs($admin)->putJson(route('system.settings.rfid-devices.update', $device), $payload)->assertOk();
        $path = '/api/hardware/rfid/config/candidate';
        $body = ['current_network_version' => 2];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)
            ->assertOk()->assertJsonPath('configuration.network_version', 3)
            ->assertJsonPath('configuration.network_available', true)
            ->assertJsonPath('configuration.wifi_password', 'correct horse battery staple');
        $body['current_network_version'] = 3;
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)
            ->assertOk()->assertJsonPath('configuration.network_available', false);
    }

    public function test_new_ssid_requires_explicit_credentials_without_partial_save(): void
    {
        [$device] = $this->device();
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'System Admin']));
        $payload = $this->settingsPayload();
        $payload['wifi_ssid'] = 'New Network';
        $this->actingAs($admin)->putJson(route('system.settings.rfid-devices.update', $device), $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('wifi_password');
        $this->assertSame(2, $device->fresh()->config_version);
        $this->assertSame('Private Network', $device->fresh()->settings->wifi_ssid);
        $payload['wifi_open_network'] = true;
        $this->putJson(route('system.settings.rfid-devices.update', $device), $payload)->assertOk();
        $this->assertSame('', $device->fresh()->settings->wifi_password_encrypted);
        $this->assertSame(3, $device->fresh()->settings->network_version);
    }

    public function test_clearing_server_ssid_retains_the_device_network(): void
    {
        [$device] = $this->device();
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'System Admin']));
        $payload = $this->settingsPayload();
        $payload['wifi_ssid'] = '';
        $this->actingAs($admin)->putJson(route('system.settings.rfid-devices.update', $device), $payload)->assertOk();
        $this->assertNull($device->fresh()->settings->wifi_ssid);
        $this->assertSame('', $device->fresh()->settings->wifi_password_encrypted);
        $path = '/api/hardware/rfid/config/candidate';
        $body = ['current_network_version' => 2];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)
            ->assertOk()->assertJsonPath('configuration.network_version', 3)
            ->assertJsonPath('configuration.network_available', false);
    }

    public function test_reapplying_an_unknown_saved_password_requires_explicit_credentials(): void
    {
        [$device] = $this->device();
        $device->settings->update(['wifi_password_encrypted' => null]);
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'System Admin']));
        $payload = $this->settingsPayload() + ['wifi_apply' => true];
        $this->actingAs($admin)->putJson(route('system.settings.rfid-devices.update', $device), $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('wifi_password');
        $this->assertSame(2, $device->fresh()->config_version);
    }

    public function test_heartbeat_reports_local_network_independently_and_legacy_clears_it(): void
    {
        [$device] = $this->device();
        $path = '/api/hardware/rfid/heartbeat';
        $body = ['firmware_version' => '2.4.0', 'configuration_version' => 2, 'uptime' => 120,
            'scanner_ready' => false, 'connected_ssid' => 'Local Recovery Network', 'network_version' => 2];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)->assertOk();
        $this->assertSame('Local Recovery Network', $device->fresh()->connected_ssid);
        $this->assertSame('Private Network', $device->fresh()->settings->wifi_ssid);
        $this->assertSame(2, $device->fresh()->reported_network_version);
        $body['network_version'] = 999;
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)->assertUnprocessable();
        $this->assertSame(2, $device->fresh()->reported_network_version);
        unset($body['connected_ssid'], $body['network_version']);
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))->postJson($path, $body)->assertOk();
        $this->assertNull($device->fresh()->connected_ssid);
        $this->assertNull($device->fresh()->reported_network_version);
    }

    public function test_upgrade_backfills_only_configured_network_revisions(): void
    {
        [$device] = $this->device();
        $migration = require database_path('migrations/2026_10_13_120000_add_rfid_network_revisions.php');
        $migration->down();
        $other = RfidDevice::create(['device_uuid' => 'RFID-HH-NOWIFI', 'device_name' => 'Local only', 'device_token_hash' => $device->device_token_hash]);
        $other->settings()->create(['server_url' => 'https://inventory.example.edu', 'configuration_version' => 4]);
        $migration->up();
        $this->assertSame(2, $device->fresh()->settings->network_version);
        $this->assertSame(0, $other->fresh()->settings->network_version);
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

    private function readerDiagnostics(): array
    {
        return [
            'responses' => 4, 'tags' => 0, 'timeouts' => 3, 'invalid_frames' => 1,
            'reader_errors' => 1, 'last_error' => 21, 'queue_count' => 100,
            'scan_block_reason' => 'queue_full', 'recovery_attempts' => 2,
            'last_response_age_ms' => 100, 'last_tag_age_ms' => null,
        ];
    }

    public function test_heartbeat_stores_reader_diagnostics_without_claiming_a_tag_was_read(): void
    {
        [$device] = $this->device();
        $path = '/api/hardware/rfid/heartbeat';
        $body = ['firmware_version' => '2.3.0', 'configuration_version' => 2, 'uptime' => 90,
            'scanner_ready' => true, 'reader_diagnostics' => $this->readerDiagnostics()];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))
            ->postJson($path, $body)->assertOk();
        $device->refresh();
        $this->assertTrue($device->scanner_ready);
        $this->assertTrue($device->hasCurrentReader());
        $this->assertSame($body['reader_diagnostics'], $device->reader_diagnostics);
        $this->assertSame(0, DB::table('rfid_scan_events')->count());
        $body['scanner_ready'] = false;
        $body['reader_diagnostics']['scan_block_reason'] = 'reader_unavailable';
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))
            ->postJson($path, $body)->assertOk();
        $this->assertFalse($device->fresh()->scanner_ready);
    }

    public function test_legacy_heartbeat_clears_previous_session_diagnostics(): void
    {
        [$device] = $this->device();
        $device->update(['reader_diagnostics' => $this->readerDiagnostics()]);
        $path = '/api/hardware/rfid/heartbeat';
        $body = ['firmware_version' => '2.2.0', 'configuration_version' => 2, 'uptime' => 5, 'scanner_ready' => true];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))
            ->postJson($path, $body)->assertOk();
        $this->assertNull($device->fresh()->reader_diagnostics);
    }

    public function test_invalid_reader_diagnostics_do_not_replace_last_heartbeat(): void
    {
        [$device] = $this->device();
        $path = '/api/hardware/rfid/heartbeat';
        $body = ['firmware_version' => '2.3.0', 'configuration_version' => 2, 'uptime' => 90,
            'scanner_ready' => true, 'reader_diagnostics' => $this->readerDiagnostics()];
        $body['reader_diagnostics']['queue_count'] = 101;
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))
            ->postJson($path, $body)->assertUnprocessable()->assertJsonValidationErrors('reader_diagnostics.queue_count');
        $this->assertNull($device->fresh()->last_seen_at);
        $body['reader_diagnostics'] = ['unexpected' => 'value'];
        $this->withHeaders($this->signedHeaders($device, 'POST', $path, $body))
            ->postJson($path, $body)->assertUnprocessable()->assertJsonValidationErrors('reader_diagnostics');
    }

    public function test_expired_heartbeat_masks_reader_readiness_and_diagnostics(): void
    {
        $this->freezeTime();
        [$device] = $this->device();
        $device->update(['status' => 'online', 'last_seen_at' => now(), 'scanner_ready' => true,
            'reader_diagnostics' => $this->readerDiagnostics()]);
        $admin = User::factory()->create();
        $admin->assignRole(Role::firstOrCreate(['name' => 'System Admin']));
        $this->actingAs($admin)->postJson(route('system.settings.rfid-devices.test', $device))
            ->assertOk()->assertJsonPath('scanner_ready', true)->assertJsonPath('reader_diagnostics.queue_count', 100);
        $this->travel(90)->seconds();
        $this->postJson(route('system.settings.rfid-devices.test', $device))
            ->assertStatus(422)->assertJsonPath('scanner_ready', false)->assertJsonPath('reader_diagnostics', null);
        $this->assertTrue($device->fresh()->scanner_ready);
        $this->assertFalse($device->fresh()->hasCurrentReader());
        $this->get(route('system.settings.index'))->assertInertia(fn ($page) => $page
            ->where('rfidDevices.0.scanner_ready', false)->where('rfidDevices.0.reader_diagnostics', null));
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
