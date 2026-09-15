<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Audit characterization checks: PASS confirms the observed weakness, not secure behavior. */
class AuditVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_spoofed_device_header_bypasses_configured_token(): void
    {
        config(['services.rfid.device_token' => 'audit-only-required-token']);
        $this->withHeaders(['User-Agent' => 'ESP32HTTPClient', 'Accept' => 'application/json'])
            ->get('/rfid-scanner/status')->assertOk();
    }

    public function test_missing_device_configuration_allows_anonymous_status(): void
    {
        config(['services.rfid.device_token' => '']);
        $this->getJson('/rfid-scanner/status')->assertOk();
    }

    public function test_verified_user_without_permissions_can_read_inventory_and_rfid_pages(): void
    {
        $user = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
        $this->assertCount(0, $user->getAllPermissions());
        $this->actingAs($user)->get('/inventories')->assertOk();
        $this->actingAs($user)->get('/rfid-scanner')->assertOk();
    }
}
