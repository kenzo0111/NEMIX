<?php

namespace Tests\Feature;

use App\Models\RfidDevice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RfidHmacSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function device(): RfidDevice
    {
        $device = RfidDevice::create([
            'device_uuid' => 'RFID-HH-SECURITY',
            'device_name' => 'Test device',
            'device_token_hash' => password_hash('unused-legacy-token', PASSWORD_DEFAULT),
            'device_secret_encrypted' => str_repeat('a', 64),
        ]);
        $device->settings()->create(['server_url' => 'https://inventory.example.edu']);

        return $device;
    }

    private function headers(RfidDevice $device, string $path, string $nonce, ?int $timestamp = null): array
    {
        $timestamp ??= time();
        $canonical = implode("\n", [
            (string) $timestamp, $nonce, 'GET', $path, hash('sha256', '[]'),
        ]);

        return [
            'X-Device-ID' => $device->device_uuid,
            'X-Timestamp' => (string) $timestamp,
            'X-Nonce' => $nonce,
            'X-Signature' => hash_hmac('sha256', $canonical, $device->device_secret_encrypted),
        ];
    }

    public function test_unsigned_user_agent_and_legacy_token_are_rejected(): void
    {
        $this->device();
        $this->withHeaders(['User-Agent' => 'ESP32HTTPClient'])->getJson('/api/hardware/rfid/config')->assertUnauthorized();
        $this->withHeaders(['User-Agent' => 'GenericBrowser'])->getJson('/api/hardware/rfid/config')->assertUnauthorized();
        $this->withHeaders(['X-Device-ID' => 'RFID-HH-SECURITY', 'X-Hardware-Token' => 'unused-legacy-token'])
            ->getJson('/api/hardware/rfid/config')->assertUnauthorized();
    }

    public function test_valid_signature_is_bound_to_path_and_replay_is_rejected(): void
    {
        $device = $this->device();
        $headers = $this->headers($device, '/api/hardware/rfid/config', str_repeat('b', 32));
        $this->withHeaders($headers)->getJson('/api/hardware/rfid/config')->assertOk();
        $this->withHeaders($headers)->getJson('/api/hardware/rfid/config')->assertUnauthorized();
        $this->withHeaders($this->headers($device, '/api/hardware/rfid/config', str_repeat('c', 32)))
            ->postJson('/api/hardware/rfid/heartbeat', [])->assertUnauthorized();
    }

    public function test_expired_invalid_and_disabled_device_requests_fail(): void
    {
        $device = $this->device();
        $path = '/api/hardware/rfid/config';
        $this->withHeaders($this->headers($device, $path, str_repeat('d', 32), time() - 61))
            ->getJson($path)->assertUnauthorized();
        $headers = $this->headers($device, $path, str_repeat('e', 32));
        $headers['X-Signature'] = str_repeat('0', 64);
        $this->withHeaders($headers)->getJson($path)->assertUnauthorized();
        $device->update(['status' => 'disabled']);
        $this->withHeaders($this->headers($device, $path, str_repeat('f', 32)))
            ->getJson($path)->assertUnauthorized();
    }

    public function test_production_fails_closed_when_cache_store_is_ephemeral_or_null(): void
    {
        $device = $this->device();
        $path = '/api/hardware/rfid/config';
        $headers = $this->headers($device, $path, str_repeat('7', 32));

        $this->app['env'] = 'production';
        config(['cache.default' => 'array']);

        $this->withHeaders($headers)->getJson('https://localhost' . $path)->assertUnauthorized();

        config(['cache.default' => 'null']);
        $this->withHeaders($headers)->getJson('https://localhost' . $path)->assertUnauthorized();
    }

    public function test_signed_hardware_scan_is_added_to_ordered_live_feed(): void
    {
        $device = $this->device();
        $path = '/api/hardware/rfid/scan';
        $body = json_encode(['epc' => 'ABCDEF0123']);
        $timestamp = (string) time();
        $nonce = str_repeat('8', 32);
        $canonical = implode("\n", [$timestamp, $nonce, 'POST', $path, hash('sha256', $body)]);
        $headers = [
            'X-Device-ID' => $device->device_uuid,
            'X-Timestamp' => $timestamp,
            'X-Nonce' => $nonce,
            'X-Signature' => hash_hmac('sha256', $canonical, $device->device_secret_encrypted),
        ];
        $this->withHeaders($headers)->postJson($path, ['epc' => 'ABCDEF0123'])->assertNotFound();
        $this->assertSame('ABCDEF0123', DB::table('rfid_scan_events')->first()->tag);
    }
}
