<?php

namespace Tests\Feature\AccessControl;

use App\Models\User;
use App\Services\AccessControl\PermissionResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AccessControlRbacSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected Role $adminRole;
    protected Role $viewerRole;
    protected Role $editorRole;
    protected Role $customRole;

    protected User $adminUser;
    protected User $viewerUser;
    protected User $editorUser;
    protected User $regularStaff;

    protected function setUp(): void
    {
        parent::setUp();

        // Create standard permissions
        $permissions = [
            'users.view',
            'users.create',
            'users.update',
            'users.manage-status',
            'users.assign-role',
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
            'permissions.view',
            'permissions.assign',
            'permissions.revoke',
            'access-control.view',
            'route:access-control.staffs',
            'route:access-control.staffs.store',
            'route:access-control.staffs.update',
            'route:access-control.staffs.toggle-status',
            'route:access-control.role-permission',
            'route:access-control.role-permission.store',
            'route:access-control.role-permission.update',
            'route:access-control.role-permission.destroy',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // Roles
        $this->adminRole = Role::firstOrCreate(['name' => 'System Admin']);
        $this->viewerRole = Role::firstOrCreate(['name' => 'Staff Viewer']);
        $this->editorRole = Role::firstOrCreate(['name' => 'Staff Editor']);
        $this->customRole = Role::firstOrCreate(['name' => 'Custom Department Head']);

        // Assign permissions to roles
        $this->viewerRole->syncPermissions(['users.view']);
        $this->editorRole->syncPermissions(['users.view', 'users.update']);

        // Users
        $this->adminUser = User::factory()->create(['name' => 'Admin User', 'email_verified_at' => now(), 'is_active' => true]);
        $this->adminUser->assignRole($this->adminRole);

        $this->viewerUser = User::factory()->create(['name' => 'Viewer User', 'email_verified_at' => now(), 'is_active' => true]);
        $this->viewerUser->assignRole($this->viewerRole);

        $this->editorUser = User::factory()->create(['name' => 'Editor User', 'email_verified_at' => now(), 'is_active' => true]);
        $this->editorUser->assignRole($this->editorRole);

        $this->regularStaff = User::factory()->create(['name' => 'Regular Staff', 'email_verified_at' => now(), 'is_active' => true]);
        $this->regularStaff->assignRole($this->customRole);
    }

    public function test_system_admin_has_unrestricted_administrative_access(): void
    {
        $response = $this->actingAs($this->adminUser)->get(route('access-control.staffs'));
        $response->assertStatus(200);

        $rolesResponse = $this->actingAs($this->adminUser)->get(route('access-control.role-permission'));
        $rolesResponse->assertStatus(200);

        // System Admin can create staff
        $storeResponse = $this->actingAs($this->adminUser)->post(route('access-control.staffs.store'), [
            'name' => 'New Staff By Admin',
            'email' => 'new.staff.admin@example.com',
            'role' => 'Custom Department Head',
        ]);
        $storeResponse->assertRedirect();
        $this->assertDatabaseHas('users', ['email' => 'new.staff.admin@example.com']);
    }

    public function test_staff_viewer_can_view_staff_but_cannot_perform_mutations(): void
    {
        // Can access GET view
        $response = $this->actingAs($this->viewerUser)->get(route('access-control.staffs'));
        $response->assertStatus(200);

        // Attempting to create staff returns 403
        $createResponse = $this->actingAs($this->viewerUser)->post(route('access-control.staffs.store'), [
            'name' => 'Unauthorized Create',
            'email' => 'unauth.create@example.com',
            'role' => 'Custom Department Head',
        ]);
        $createResponse->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'unauth.create@example.com']);

        // Attempting to update staff returns 403
        $updateResponse = $this->actingAs($this->viewerUser)->put(route('access-control.staffs.update', $this->regularStaff->id), [
            'name' => 'Unauthorized Update',
            'email' => $this->regularStaff->email,
            'role' => 'Custom Department Head',
        ]);
        $updateResponse->assertStatus(403);

        // Attempting to toggle status returns 403
        $toggleResponse = $this->actingAs($this->viewerUser)->patch(route('access-control.staffs.toggle-status', $this->regularStaff->id));
        $toggleResponse->assertStatus(403);

        // Attempting to resend invitation returns 403
        $resendResponse = $this->actingAs($this->viewerUser)->post(route('access-control.staffs.resend-invitation', $this->regularStaff->id));
        $resendResponse->assertStatus(403);
    }

    public function test_staff_editor_can_edit_permitted_staff_but_cannot_create_or_toggle(): void
    {
        // Can view
        $this->actingAs($this->editorUser)->get(route('access-control.staffs'))->assertStatus(200);

        // Can update permitted staff
        $updateResponse = $this->actingAs($this->editorUser)->put(route('access-control.staffs.update', $this->regularStaff->id), [
            'name' => 'Updated Staff Name',
            'email' => $this->regularStaff->email,
            'role' => 'Custom Department Head',
        ]);
        $updateResponse->assertRedirect();
        $this->assertEquals('Updated Staff Name', $this->regularStaff->fresh()->name);

        // Cannot create staff (lacks users.create)
        $createResponse = $this->actingAs($this->editorUser)->post(route('access-control.staffs.store'), [
            'name' => 'Editor Create Attempt',
            'email' => 'editor.create@example.com',
            'role' => 'Custom Department Head',
        ]);
        $createResponse->assertStatus(403);

        // Cannot toggle status (lacks users.manage-status)
        $toggleResponse = $this->actingAs($this->editorUser)->patch(route('access-control.staffs.toggle-status', $this->regularStaff->id));
        $toggleResponse->assertStatus(403);
    }

    public function test_granting_permission_dynamically_enables_action_without_code_changes(): void
    {
        // Initially editor cannot toggle status
        $this->actingAs($this->editorUser)
            ->patch(route('access-control.staffs.toggle-status', $this->regularStaff->id))
            ->assertStatus(403);

        // Dynamically assign users.manage-status to editorRole
        $this->editorRole->givePermissionTo('users.manage-status');
        PermissionResolver::clearPermissionCache();
        $this->editorUser->refresh();

        // Now editor can toggle status
        $toggleResponse = $this->actingAs($this->editorUser->fresh())
            ->patch(route('access-control.staffs.toggle-status', $this->regularStaff->id));
        $toggleResponse->assertRedirect();
        $this->assertFalse($this->regularStaff->fresh()->is_active);
    }

    public function test_revoking_permission_dynamically_blocks_action(): void
    {
        // Editor starts with users.update
        $this->actingAs($this->editorUser)
            ->put(route('access-control.staffs.update', $this->regularStaff->id), [
                'name' => 'First Update',
                'email' => $this->regularStaff->email,
                'role' => 'Custom Department Head',
            ])->assertRedirect();

        // Revoke users.update
        $this->editorRole->revokePermissionTo('users.update');
        PermissionResolver::clearPermissionCache();
        $this->editorUser->refresh();

        // Attempting update now fails with 403
        $this->actingAs($this->editorUser->fresh())
            ->put(route('access-control.staffs.update', $this->regularStaff->id), [
                'name' => 'Second Update Attempt',
                'email' => $this->regularStaff->email,
                'role' => 'Custom Department Head',
            ])->assertStatus(403);
    }

    public function test_user_without_access_control_permissions_receives_403_on_direct_urls(): void
    {
        $unauthorizedUser = User::factory()->create(['email_verified_at' => now(), 'is_active' => true]);
        $unauthorizedUser->assignRole($this->customRole); // No access control perms

        $this->actingAs($unauthorizedUser)->get(route('access-control.staffs'))->assertStatus(403);
        $this->actingAs($unauthorizedUser)->get(route('access-control.role-permission'))->assertStatus(403);
        $this->actingAs($unauthorizedUser)->post(route('access-control.staffs.store'), [])->assertStatus(403);
        $this->actingAs($unauthorizedUser)->post(route('access-control.role-permission.store'), [])->assertStatus(403);
    }

    public function test_non_admin_cannot_assign_system_admin_role_on_create(): void
    {
        // Give user create permission
        $creator = User::factory()->create(['email_verified_at' => now(), 'is_active' => true]);
        $creatorRole = Role::create(['name' => 'Staff Creator']);
        $creatorRole->givePermissionTo(['users.view', 'users.create']);
        $creator->assignRole($creatorRole);

        // Attempt to create staff with System Admin role
        $response = $this->actingAs($creator)->post(route('access-control.staffs.store'), [
            'name' => 'Escalated Admin Attempt',
            'email' => 'escalated.admin@example.com',
            'role' => 'System Admin',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'escalated.admin@example.com']);
    }

    public function test_non_admin_cannot_assign_system_admin_role_on_update(): void
    {
        $response = $this->actingAs($this->editorUser)->put(route('access-control.staffs.update', $this->regularStaff->id), [
            'name' => 'Escalated Target',
            'email' => $this->regularStaff->email,
            'role' => 'System Admin',
        ]);

        $response->assertStatus(403);
        $this->assertFalse($this->regularStaff->fresh()->hasRole('System Admin'));
    }

    public function test_non_admin_cannot_modify_or_deactivate_system_admin_user(): void
    {
        // Attempting to edit System Admin account
        $editResponse = $this->actingAs($this->editorUser)->put(route('access-control.staffs.update', $this->adminUser->id), [
            'name' => 'Tampered Admin',
            'email' => $this->adminUser->email,
            'role' => 'Custom Department Head',
        ]);
        $editResponse->assertStatus(403);
        $this->assertEquals('Admin User', $this->adminUser->fresh()->name);

        // Give editor users.manage-status
        $this->editorRole->givePermissionTo('users.manage-status');
        PermissionResolver::clearPermissionCache();

        // Attempting to deactivate System Admin account
        $toggleResponse = $this->actingAs($this->editorUser)->patch(route('access-control.staffs.toggle-status', $this->adminUser->id));
        $toggleResponse->assertStatus(403);
        $this->assertTrue($this->adminUser->fresh()->is_active);
    }

    public function test_non_admin_cannot_change_own_role(): void
    {
        // Editor tries to change their own role to anything
        $response = $this->actingAs($this->editorUser)->put(route('access-control.staffs.update', $this->editorUser->id), [
            'name' => $this->editorUser->name,
            'email' => $this->editorUser->email,
            'role' => 'Custom Department Head',
        ]);

        $response->assertStatus(403);
        $this->assertTrue($this->editorUser->fresh()->hasRole('Staff Editor'));
    }

    public function test_non_admin_cannot_delete_protected_system_admin_role(): void
    {
        // Create user with roles.delete
        $roleManager = User::factory()->create(['email_verified_at' => now(), 'is_active' => true]);
        $rmRole = Role::create(['name' => 'Role Deleter']);
        $rmRole->givePermissionTo(['roles.view', 'roles.delete']);
        $roleManager->assignRole($rmRole);

        $response = $this->actingAs($roleManager)->delete(route('access-control.role-permission.destroy', $this->adminRole->id));
        $response->assertStatus(403);
        $this->assertDatabaseHas('roles', ['name' => 'System Admin']);
    }

    public function test_role_editor_cannot_grant_permissions_they_do_not_possess(): void
    {
        $roleManager = User::factory()->create(['email_verified_at' => now(), 'is_active' => true]);
        $rmRole = Role::create(['name' => 'Role Modifier']);
        $rmRole->givePermissionTo(['roles.view', 'roles.update', 'users.view']);
        $roleManager->assignRole($rmRole);

        $targetCustomRole = Role::create(['name' => 'Subordinate Role']);

        // Fetch ID of a permission the caller does NOT possess (e.g. roles.delete)
        $unauthorizedPerm = Permission::where('name', 'roles.delete')->first();

        $response = $this->actingAs($roleManager)->put(route('access-control.role-permission.update', $targetCustomRole->id), [
            'name' => 'Subordinate Role',
            'permissions' => [$unauthorizedPerm->id],
        ]);

        $response->assertStatus(403);
        $this->assertFalse($targetCustomRole->fresh()->hasPermissionTo('roles.delete'));
    }

    public function test_backward_compatibility_with_legacy_route_permissions(): void
    {
        // User assigned legacy 'route:access-control.staffs'
        $legacyUser = User::factory()->create(['email_verified_at' => now(), 'is_active' => true]);
        $legacyRole = Role::create(['name' => 'Legacy Staff Viewer']);
        $legacyRole->givePermissionTo('route:access-control.staffs');
        $legacyUser->assignRole($legacyRole);

        // Can access via Gate::allows('users.view')
        $this->assertTrue($legacyUser->can('users.view'));
        $this->actingAs($legacyUser)->get(route('access-control.staffs'))->assertStatus(200);

        // Inertia props resolution expands effective permissions
        $effective = PermissionResolver::resolveEffectivePermissions($legacyUser);
        $this->assertContains('users.view', $effective);
        $this->assertContains('route:access-control.staffs', $effective);
    }

    public function test_assignable_roles_excludes_system_admin_for_non_admin_users(): void
    {
        $response = $this->actingAs($this->viewerUser)->get(route('access-control.staffs'));
        $response->assertStatus(200);

        $props = $response->original->getData()['page']['props'];
        $roles = $props['roles'];

        $this->assertNotContains('System Admin', $roles);
        $this->assertNotContains('System Administrator', $roles);
        $this->assertContains('Custom Department Head', $roles);
    }
}
