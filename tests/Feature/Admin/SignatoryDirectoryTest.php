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

    public function test_cannot_delete_signatory_currently_assigned_in_system_settings(): void
    {
        $sig = Signatory::create([
            'name' => 'ACTIVE ASSIGNED SIGNATORY',
            'designation' => 'DIRECTOR IV',
        ]);

        // Assign to System Settings
        $this->actingAs($this->adminUser)
            ->post(route('system.settings.update'), [
                'settings' => [
                    'signatories.ris_approved_by_name' => $sig->name,
                    'signatories.ris_approved_by_designation' => $sig->designation,
                    'signatories.ris_approved_by_id' => $sig->id,
                ],
            ]);

        // Attempt to delete should fail with 422
        $response = $this->actingAs($this->adminUser)
            ->deleteJson(route('admin.signatories.destroy', $sig->id));

        $response->assertStatus(422);
        $response->assertJsonPath(
            'message',
            "Cannot remove \"{$sig->name}\" because they are currently assigned to one or more active roles in System Settings. Please reassign those roles before removing this signatory."
        );

        $this->assertDatabaseHas('signatories', ['id' => $sig->id]);
    }

    public function test_system_settings_can_clear_signatory_id_to_null(): void
    {
        $sig = Signatory::create([
            'name' => 'TEMPORARY SIGNATORY',
            'designation' => 'AIDE',
        ]);

        // Assign
        $this->actingAs($this->adminUser)
            ->post(route('system.settings.update'), [
                'settings' => [
                    'signatories.ris_approved_by_name' => $sig->name,
                    'signatories.ris_approved_by_designation' => $sig->designation,
                    'signatories.ris_approved_by_id' => $sig->id,
                ],
            ]);

        $this->assertSame($sig->id, SystemSetting::get('signatories.ris_approved_by_id'));

        // Clear
        $this->actingAs($this->adminUser)
            ->post(route('system.settings.update'), [
                'settings' => [
                    'signatories.ris_approved_by_name' => '',
                    'signatories.ris_approved_by_designation' => '',
                    'signatories.ris_approved_by_id' => null,
                ],
            ]);

        $this->assertNull(SystemSetting::get('signatories.ris_approved_by_id'));
        $this->assertSame('', SystemSetting::get('signatories.ris_approved_by_name'));
    }

    public function test_system_settings_saves_all_signatory_selectors_consistently(): void
    {
        $sig1 = Signatory::create(['name' => 'ALBERTO DE VERA JR', 'designation' => 'STUDENT ASSISTANT']);
        $sig2 = Signatory::create(['name' => 'JUAN DELA CRUZ', 'designation' => 'SUPPLY CUSTODIAN']);

        $response = $this->actingAs($this->adminUser)
            ->post(route('system.settings.update'), [
                'settings' => [
                    'signatories.ris_approved_by_name' => $sig1->name,
                    'signatories.ris_approved_by_designation' => $sig1->designation,
                    'signatories.ris_approved_by_id' => $sig1->id,

                    'signatories.ris_issued_by_name' => $sig2->name,
                    'signatories.ris_issued_by_designation' => $sig2->designation,
                    'signatories.ris_issued_by_id' => $sig2->id,

                    'signatories.rsmi_certified_by_name' => $sig1->name,
                    'signatories.rsmi_certified_by_designation' => $sig1->designation,
                    'signatories.rsmi_certified_by_id' => $sig1->id,

                    'signatories.rsmi_posted_by_name' => $sig2->name,
                    'signatories.rsmi_posted_by_designation' => $sig2->designation,
                    'signatories.rsmi_posted_by_id' => $sig2->id,

                    'signatories.rpci_accountable_officer_name' => $sig1->name,
                    'signatories.rpci_accountable_officer_designation' => $sig1->designation,
                    'signatories.rpci_accountable_officer_id' => $sig1->id,

                    'signatories.rpci_committee_chair' => $sig2->name,
                    'signatories.rpci_committee_chair_id' => $sig2->id,

                    'signatories.rpci_certified_by_name' => $sig1->name,
                    'signatories.rpci_certified_by_position' => $sig1->designation,
                    'signatories.rpci_certified_by_id' => $sig1->id,

                    'signatories.rpci_verified_by_name' => $sig2->name,
                    'signatories.rpci_verified_by_position' => $sig2->designation,
                    'signatories.rpci_verified_by_id' => $sig2->id,

                    'signatories.stock_card_custodian' => $sig1->name,
                    'signatories.stock_card_custodian_id' => $sig1->id,

                    'signatories.mor_issued_by_name' => $sig2->name,
                    'signatories.mor_issued_by_designation' => $sig2->designation,
                    'signatories.mor_issued_by_id' => $sig2->id,
                ],
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSame($sig1->id, SystemSetting::get('signatories.ris_approved_by_id'));
        $this->assertSame($sig2->id, SystemSetting::get('signatories.ris_issued_by_id'));
        $this->assertSame($sig1->id, SystemSetting::get('signatories.rsmi_certified_by_id'));
        $this->assertSame($sig2->id, SystemSetting::get('signatories.rsmi_posted_by_id'));
        $this->assertSame($sig1->id, SystemSetting::get('signatories.rpci_accountable_officer_id'));
        $this->assertSame($sig2->id, SystemSetting::get('signatories.rpci_committee_chair_id'));
        $this->assertSame($sig1->id, SystemSetting::get('signatories.rpci_certified_by_id'));
        $this->assertSame($sig2->id, SystemSetting::get('signatories.rpci_verified_by_id'));
        $this->assertSame($sig1->id, SystemSetting::get('signatories.stock_card_custodian_id'));
        $this->assertSame($sig2->id, SystemSetting::get('signatories.mor_issued_by_id'));
    }
}
