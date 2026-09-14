<?php

namespace Tests\Feature\Admin;

use App\Models\Signatory;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SignatoryDirectoryTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'System Admin']);
        $staffRole = Role::firstOrCreate(['name' => 'Staff']);

        $this->adminUser = User::factory()->create([
            'name' => 'SYSTEM ADMINISTRATOR',
            'email' => 'admin@ucn.edu.ph',
        ]);
        $this->adminUser->assignRole($adminRole);

        $this->regularUser = User::factory()->create([
            'name' => 'REGULAR STAFF',
            'email' => 'staff@ucn.edu.ph',
        ]);
        $this->regularUser->assignRole($staffRole);
    }

    public function test_signatories_table_starts_empty_with_zero_seeds(): void
    {
        // Must have zero seeds initially
        $this->assertSame(0, Signatory::count());
    }

    public function test_non_admin_cannot_access_or_modify_signatories(): void
    {
        // 1. List
        $this->actingAs($this->regularUser)
            ->getJson(route('admin.signatories.index'))
            ->assertStatus(403);

        // 2. Store
        $this->actingAs($this->regularUser)
            ->postJson(route('admin.signatories.store'), [
                'name' => 'UNAUTHORIZED ATTEMPT',
                'designation' => 'TEST',
            ])
            ->assertStatus(403);

        // 3. Delete
        $sig = Signatory::create([
            'name' => 'TEST OFFICER',
            'designation' => 'OFFICER',
        ]);

        $this->actingAs($this->regularUser)
            ->deleteJson(route('admin.signatories.destroy', $sig->id))
            ->assertStatus(403);
    }

    public function test_admin_can_list_and_create_signatories(): void
    {
        // 1. Create a signatory
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('admin.signatories.store'), [
                'name' => 'ARSENIO GEM A. GARCILLANOSA',
                'designation' => 'SUPPLY OFFICER III / ADMIN OFFICER V',
                'office' => 'Supply & Property Management Office (SPMO)',
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('signatory.name', 'ARSENIO GEM A. GARCILLANOSA');
        $response->assertJsonPath('signatory.designation', 'SUPPLY OFFICER III / ADMIN OFFICER V');

        $this->assertDatabaseHas('signatories', [
            'name' => 'ARSENIO GEM A. GARCILLANOSA',
            'normalized_name' => 'arsenio gem a garcillanosa',
            'is_active' => true,
        ]);

        // 2. List signatories
        $listResponse = $this->actingAs($this->adminUser)
            ->getJson(route('admin.signatories.index'));

        $listResponse->assertOk();
        $listResponse->assertJsonCount(1, 'signatories');
    }

    public function test_creation_requires_name_and_designation(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('admin.signatories.store'), [
                'name' => '',
                'designation' => '',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'designation']);
    }

    public function test_duplicate_signatory_detection_prevents_recreation(): void
    {
        Signatory::create([
            'name' => 'ALBERTO DE VERA JR.',
            'designation' => 'ADMINISTRATIVE AIDE IV',
        ]);

        // Attempt creation with different casing, whitespace, and punctuation
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('admin.signatories.store'), [
                'name' => '  alberto de vera jr  ',
                'designation' => 'BOOKKEEPER',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
        $this->assertSame(
            'A signatory with this name already exists in the directory.',
            $response->json('errors.name.0')
        );
    }

    public function test_admin_can_delete_signatory_from_directory(): void
    {
        $sig = Signatory::create([
            'name' => 'TEMPORARY SIGNATORY',
            'designation' => 'AIDE',
        ]);

        $this->assertSame(1, Signatory::count());

        $response = $this->actingAs($this->adminUser)
            ->deleteJson(route('admin.signatories.destroy', $sig->id));

        $response->assertOk();
        $this->assertDatabaseMissing('signatories', ['id' => $sig->id]);
        $this->assertSame(0, Signatory::count());
    }

    public function test_system_settings_saves_signatory_ids_and_preserves_text_fallbacks(): void
    {
        $sig = Signatory::create([
            'name' => 'MARIA SANTOS',
            'designation' => 'ADMINISTRATIVE OFFICER V',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->post(route('system.settings.update'), [
                'settings' => [
                    'signatories.ris_approved_by_name' => $sig->name,
                    'signatories.ris_approved_by_designation' => $sig->designation,
                    'signatories.ris_approved_by_id' => $sig->id,
                ],
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSame('MARIA SANTOS', SystemSetting::get('signatories.ris_approved_by_name'));
        $this->assertSame('ADMINISTRATIVE OFFICER V', SystemSetting::get('signatories.ris_approved_by_designation'));
        $this->assertSame($sig->id, SystemSetting::get('signatories.ris_approved_by_id'));
    }
}
