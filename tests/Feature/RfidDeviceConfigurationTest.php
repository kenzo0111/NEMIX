<?php

namespace Tests\Feature;

use App\Models\RfidDevice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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

    public function test_configuration_api_rejects_missing_credentials(): void
    {
        $this->device();
        $this->getJson('/api/hardware/rfid/config')->assertUnauthorized();
    }

    public function test_regular_configuration_never_exposes_wifi_or_tokens(): void
    {
        [$device, $token] = $this->device();
        $response = $this->withHeaders(['X-Device-ID' => $device->device_uuid, 'X-Hardware-Token' => $token])
            ->getJson('/api/hardware/rfid/config')
            ->assertOk()
            ->assertJsonPath('configuration.version', 2)
            ->assertJsonMissingPath('configuration.wifi_password')
            ->assertJsonMissingPath('configuration.device_token');
        $this->assertStringNotContainsString('correct horse battery staple', $response->getContent());
    }

    public function test_authenticated_version_gated_network_migration_and_heartbeat(): void
    {
        [$device, $token] = $this->device();
        $headers = ['X-Device-ID' => $device->device_uuid, 'X-Hardware-Token' => $token];
        $this->withHeaders($headers)->postJson('/api/hardware/rfid/network-config', ['current_version' => 1])
            ->assertOk()->assertJsonPath('wifi_ssid', 'Private Network')
            ->assertJsonPath('wifi_password', 'correct horse battery staple');
        $this->withHeaders($headers)->postJson('/api/hardware/rfid/heartbeat', [
            'firmware_version' => '2.0.0', 'ip_address' => '192.168.1.20',
            'configuration_version' => 1, 'wifi_rssi' => -55, 'uptime' => 120,
            'scanner_ready' => true,
        ])->assertOk()->assertJsonPath('configuration_available', true);
        $this->assertNotNull($device->fresh()->last_seen_at);
    }

    public function test_wifi_password_is_encrypted_at_rest(): void
    {
        [$device] = $this->device();
        $raw = DB::table('rfid_device_settings')->where('device_id', $device->id)->value('wifi_password_encrypted');
        $this->assertNotSame('correct horse battery staple', $raw);
        $this->assertSame('correct horse battery staple', $device->settings->wifi_password_encrypted);
    }
}
