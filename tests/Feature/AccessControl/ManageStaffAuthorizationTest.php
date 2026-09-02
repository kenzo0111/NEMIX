<?php

namespace Tests\Feature\AccessControl;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ManageStaffAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'System Admin']);
        Role::create(['name' => 'Property Staff']);
        Role::create(['name' => 'Internal Auditor']);
    }

    public function test_non_admin_cannot_create_staff(): void
    {
        $nonAdmin = User::factory()->create(['email_verified_at' => now()]);
        $nonAdmin->assignRole('Property Staff');

        $response = $this->actingAs($nonAdmin)->post(route('access-control.staffs.store'), [
            'name' => 'Unauthorized Staff',
            'email' => 'unauthorized.staff@example.com',
            'role' => 'Property Staff',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'unauthorized.staff@example.com']);
    }

    public function test_non_admin_cannot_edit_other_staff(): void
    {
        $nonAdmin = User::factory()->create(['email_verified_at' => now()]);
        $nonAdmin->assignRole('Property Staff');

        $targetStaff = User::factory()->create([
            'name' => 'Original Name',
            'email' => 'original@example.com',
            'email_verified_at' => now(),
        ]);
        $targetStaff->assignRole('Property Staff');

        $response = $this->actingAs($nonAdmin)->put(route('access-control.staffs.update', $targetStaff->id), [
            'name' => 'Hacked Name',
            'email' => 'original@example.com',
            'role' => 'System Admin',
        ]);

        $response->assertStatus(403);
        $this->assertEquals('Original Name', $targetStaff->fresh()->name);
        $this->assertFalse($targetStaff->fresh()->hasRole('System Admin'));
    }

    public function test_non_admin_cannot_edit_self_via_staff_management(): void
    {
        $nonAdmin = User::factory()->create([
            'name' => 'Staff Member',
            'email' => 'staff.member@example.com',
            'email_verified_at' => now(),
        ]);
        $nonAdmin->assignRole('Property Staff');

        $response = $this->actingAs($nonAdmin)->put(route('access-control.staffs.update', $nonAdmin->id), [
            'name' => 'Escalated User',
            'email' => 'staff.member@example.com',
            'role' => 'System Admin',
        ]);

        $response->assertStatus(403);
        $this->assertEquals('Staff Member', $nonAdmin->fresh()->name);
        $this->assertFalse($nonAdmin->fresh()->hasRole('System Admin'));
    }

    public function test_non_admin_cannot_toggle_status_of_other_staff(): void
    {
        $nonAdmin = User::factory()->create(['email_verified_at' => now()]);
        $nonAdmin->assignRole('Property Staff');

        $targetStaff = User::factory()->create([
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $targetStaff->assignRole('Property Staff');

        $response = $this->actingAs($nonAdmin)->patch(route('access-control.staffs.toggle-status', $targetStaff->id));

        $response->assertStatus(403);
        $this->assertTrue($targetStaff->fresh()->is_active);
    }

    public function test_non_admin_cannot_resend_invitation(): void
    {
        $nonAdmin = User::factory()->create(['email_verified_at' => now()]);
        $nonAdmin->assignRole('Property Staff');

        $targetStaff = User::factory()->create([
            'is_active' => false,
            'email_verified_at' => null,
        ]);
        $targetStaff->assignRole('Property Staff');

        $response = $this->actingAs($nonAdmin)->post(route('access-control.staffs.resend-invitation', $targetStaff->id));

        $response->assertStatus(403);
    }

    public function test_system_admin_can_update_staff_details_and_role(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $admin->assignRole('System Admin');

        $targetStaff = User::factory()->create([
            'name' => 'Original Name',
            'email' => 'original.staff@example.com',
            'email_verified_at' => now(),
        ]);
        $targetStaff->assignRole('Property Staff');

        $response = $this->actingAs($admin)->put(route('access-control.staffs.update', $targetStaff->id), [
            'name' => 'Updated Staff Name',
            'email' => 'original.staff@example.com',
            'role' => 'Internal Auditor',
        ]);

        $response->assertRedirect();
        $this->assertEquals('Updated Staff Name', $targetStaff->fresh()->name);
        $this->assertTrue($targetStaff->fresh()->hasRole('Internal Auditor'));
        $this->assertFalse($targetStaff->fresh()->hasRole('Property Staff'));
    }

    public function test_system_admin_can_toggle_staff_status(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $admin->assignRole('System Admin');

        $targetStaff = User::factory()->create([
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $targetStaff->assignRole('Property Staff');

        $response = $this->actingAs($admin)->patch(route('access-control.staffs.toggle-status', $targetStaff->id));

        $response->assertRedirect();
        $this->assertFalse($targetStaff->fresh()->is_active);

        // Toggle back to active
        $response = $this->actingAs($admin)->patch(route('access-control.staffs.toggle-status', $targetStaff->id));
        $response->assertRedirect();
        $this->assertTrue($targetStaff->fresh()->is_active);
    }

    public function test_system_admin_cannot_disable_own_account(): void
    {
        $admin = User::factory()->create([
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('System Admin');

        $response = $this->actingAs($admin)->patch(route('access-control.staffs.toggle-status', $admin->id));

        $response->assertRedirect();
        $response->assertSessionHas('error', 'You cannot disable your own account.');
        $this->assertTrue($admin->fresh()->is_active);
    }
}
