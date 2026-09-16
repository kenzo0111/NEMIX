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
