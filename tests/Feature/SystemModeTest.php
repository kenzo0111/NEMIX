<?php

namespace Tests\Feature;

use App\Models\SystemConfiguration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SystemModeTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $staffUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'System Admin']);
        $staffRole = Role::firstOrCreate(['name' => 'Property Staff']);

        $this->adminUser = User::factory()->create([
            'name' => 'Test System Admin',
            'email' => 'admin@test.com',
        ]);
        $this->adminUser->assignRole($adminRole);

        $this->staffUser = User::factory()->create([
            'name' => 'Test Staff Member',
            'email' => 'staff@test.com',
        ]);
        $this->staffUser->assignRole($staffRole);
    }

    public function test_non_admin_cannot_change_operating_mode(): void
    {
        $response = $this->actingAs($this->staffUser)->postJson('/system/mode', [
            'mode' => 'MAINTENANCE MODE',
            'reason' => 'Unauthorized Attempt',
        ]);

        $response->assertStatus(403);
        $this->assertEquals('LIVE PRODUCTION', SystemConfiguration::current()->active_mode);
    }

    public function test_system_admin_can_change_operating_mode(): void
    {
        $response = $this->actingAs($this->adminUser)->postJson('/system/mode', [
            'mode' => 'STAGING SANDBOX',
            'reason' => 'Pre-release testing',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('STAGING SANDBOX', SystemConfiguration::current()->active_mode);
        $this->assertEquals('LIVE PRODUCTION', SystemConfiguration::current()->previous_mode);
        $this->assertEquals('Test System Admin', SystemConfiguration::current()->changedBy->name);
    }

    public function test_mode_change_creates_audit_log_entry(): void
    {
        $this->actingAs($this->adminUser)->postJson('/system/mode', [
            'mode' => 'MAINTENANCE MODE',
            'reason' => 'Database indexing',
        ]);

        $this->assertDatabaseHas('transaction_trails', [
            'user_id' => $this->adminUser->id,
            'module' => 'System Configuration',
            'action' => 'Operating Mode Switched',
            'resource_ref' => 'MODE-MAINTENANCE_MODE',
        ]);
    }

    public function test_maintenance_mode_restricts_non_admin_writes(): void
    {
        // Switch system to MAINTENANCE MODE
        SystemConfiguration::current()->update([
            'active_mode' => 'MAINTENANCE MODE',
        ]);

        // Non-admin write attempt on a protected route
        $response = $this->actingAs($this->staffUser)->post('/compliance/migrations', [
            'form_type' => 'RSMI',
            'records' => [],
        ]);

        $response->assertStatus(403);
    }

    public function test_maintenance_mode_allows_admin_writes(): void
    {
        SystemConfiguration::current()->update([
            'active_mode' => 'MAINTENANCE MODE',
        ]);

        $response = $this->actingAs($this->adminUser)->postJson('/system/mode', [
            'mode' => 'LIVE PRODUCTION',
            'reason' => 'Maintenance completed',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('LIVE PRODUCTION', SystemConfiguration::current()->active_mode);
    }
}
