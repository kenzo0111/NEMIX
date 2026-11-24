<?php

namespace Tests\Feature\AccessControl;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Spatie\Permission\Models\Role;

class LegacyUserManagementUiTest extends TestCase
{
    use RefreshDatabase;

    public function test_legacy_html_pages_redirect_to_staff_management(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole(Role::findOrCreate('System Admin', 'web'));
        foreach (['/usermanagements', '/usermanagements/create', '/usermanagements/1', '/usermanagements/1/edit'] as $url) {
            $this->actingAs($user)->get($url)->assertRedirect(route('access-control.staffs'));
        }
    }

    public function test_guest_still_needs_to_sign_in(): void
    {
        $this->get('/usermanagements')->assertRedirect(route('login'));
    }

    public function test_existing_json_index_response_is_preserved(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole(Role::findOrCreate('System Admin', 'web'));
        $this->actingAs($user)->getJson('/usermanagements')->assertOk()->assertJson(['message' => 'User Management Module API']);
    }
}
