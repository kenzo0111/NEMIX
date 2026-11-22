<?php

namespace Tests\Feature\AccessControl;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class OperationalSupplyAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_system_admins_can_inspect_inventory_and_requests_but_cannot_run_supply_operations(): void
    {
        foreach (['System Admin', 'System Administrator'] as $roleName) {
            $user = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
            $user->assignRole(Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']));
            $this->actingAs($user);

            $this->get(route('inventory.index'))->assertOk();
            $this->get(route('inventory.requests.index'))->assertOk();
            $this->post(route('inventory.store'), ['name' => 'Blocked item'])->assertForbidden();
            $this->post(route('inventory.receiving.store'))->assertForbidden();
            $this->post(route('inventory.receiving.rfid.store'))->assertForbidden();
            $this->post(route('inventory.issuance.store'))->assertForbidden();
            $this->get(route('compliance.reports'))->assertForbidden();
            $this->get(route('compliance.analytics'))->assertForbidden();
            $this->post(route('compliance.migrations.store'))->assertForbidden();
        }
    }
}
