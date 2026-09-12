<?php

namespace Tests\Feature\Inventory;

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Item;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InventoryIssuanceSignatoryTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Supplier $supplier;
    protected Item $item;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();

        $adminRole = Role::firstOrCreate(['name' => 'System Admin']);
        $this->adminUser = User::factory()->create([
            'name' => 'SYSTEM ADMINISTRATOR',
            'email' => 'admin@ucn.edu.ph',
        ]);
        $this->adminUser->assignRole($adminRole);

        // Seed Supplier and Item with stock
        $this->supplier = Supplier::create([
            'name' => 'Universal General Merchandise',
            'tin' => '123-456-789-000',
            'address' => 'Daet, Camarines Norte',
            'reg_number' => 'REG-001',
            'category' => 'Office Supplies',
            'status' => 'active',
        ]);

        $this->item = Item::create([
            'name' => 'Heavy Duty Stapler',
            'sku' => 'STP-001',
            'stock' => 100,
            'unit_cost' => 150.00,
            'amount' => 15000.00,
            'status' => 'Available',
            'supplier_id' => $this->supplier->id,
            'created_by' => $this->adminUser->id,
        ]);

        InventoryBatch::create([
            'item_id' => $this->item->id,
            'supplier_id' => $this->supplier->id,
            'quantity_received' => 100,
            'quantity_remaining' => 100,
            'unit_cost' => 150.00,
            'date_received' => '2026-01-01',
            'created_by' => $this->adminUser->id,
        ]);
    }

    public function test_system_settings_persists_issued_by_and_aliases_resolve(): void
    {
        // 1. Update settings via Admin endpoint
        $response = $this->actingAs($this->adminUser)
            ->from('/admin/system-settings')
            ->post('/admin/system-settings', [
                'settings' => [
                    'signatories.ris_approved_by_name' => 'ATTY. ROBERTO SANTOS',
                    'signatories.ris_approved_by_designation' => 'VP FOR ADMINISTRATION',
                    'signatories.ris_issued_by_name' => 'JUAN DELA CRUZ',
                    'signatories.ris_issued_by_designation' => 'SUPPLY OFFICER III',
                ],
            ]);

        $response->assertRedirect('/admin/system-settings');
        $response->assertSessionHas('success');

        // 2. Verify SystemSetting accessors & aliases
        $this->assertSame('JUAN DELA CRUZ', SystemSetting::get('signatories.ris_issued_by_name'));
        $this->assertSame('SUPPLY OFFICER III', SystemSetting::get('signatories.ris_issued_by_designation'));
        $this->assertSame('JUAN DELA CRUZ', SystemSetting::get('issued_by_name'));
        $this->assertSame('JUAN DELA CRUZ', SystemSetting::get('issued_by'));
        $this->assertSame('SUPPLY OFFICER III', SystemSetting::get('issued_by_position'));
        $this->assertSame('SUPPLY OFFICER III', SystemSetting::get('issued_by_designation'));

        $publicSettings = SystemSetting::getPublicSettings();
        $this->assertSame('JUAN DELA CRUZ', $publicSettings['issued_by_name']);
        $this->assertSame('SUPPLY OFFICER III', $publicSettings['issued_by_position']);
        $this->assertSame('JUAN DELA CRUZ', $publicSettings['signatories_ris_issued_by_name']);
        $this->assertSame('SUPPLY OFFICER III', $publicSettings['signatories_ris_issued_by_designation']);
    }

    public function test_new_issuance_automatically_snapshots_configured_issued_by_officer(): void
    {
        // Configure System Settings
        SystemSetting::set('signatories.ris_approved_by_name', 'ATTY. ROBERTO SANTOS');
        SystemSetting::set('signatories.ris_approved_by_designation', 'VP FOR ADMINISTRATION');
        SystemSetting::set('signatories.ris_issued_by_name', 'JUAN DELA CRUZ');
        SystemSetting::set('signatories.ris_issued_by_designation', 'SUPPLY OFFICER III');

        // Create Issuance through endpoint
        $response = $this->actingAs($this->adminUser)->post(route('inventory.issuance.store'), [
            'recipient' => 'Dr. Jane Smith',
            'department' => 'College of Education',
            'fund_cluster' => '01 - Regular Agency Fund',
            'recipient_designation' => 'Dean',
            'purpose' => 'Instructional use',
            'date_issued' => '2026-09-12',
            'issuances' => [
                [
                    'item_id' => $this->item->id,
                    'quantity' => 5,
                ],
            ],
        ]);

        $response->assertRedirect(route('inventory.issuance'));
        $response->assertSessionHas('success');

        $issuance = Issuance::where('recipient', 'Dr. Jane Smith')->firstOrFail();

        // Must NOT use auth()->user()->name ("SYSTEM ADMINISTRATOR") for official Issued By
        $this->assertNotSame($this->adminUser->name, $issuance->issued_by_name);
        $this->assertSame('JUAN DELA CRUZ', $issuance->issued_by_name);
        $this->assertSame('SUPPLY OFFICER III', $issuance->issued_by_position);

        // Verify JSON snapshot
        $this->assertNotNull($issuance->snapshot);
        $this->assertSame('JUAN DELA CRUZ', $issuance->snapshot['issued_by']['name']);
        $this->assertSame('SUPPLY OFFICER III', $issuance->snapshot['issued_by']['position']);

        // User ID audit is preserved in issued_by foreign key
        $this->assertSame($this->adminUser->id, $issuance->issued_by);

        // Verify transformed output in index
        $indexResponse = $this->actingAs($this->adminUser)->get(route('inventory.issuance'));
        $indexResponse->assertOk();
        $issuancesProp = $indexResponse->original->getData()['page']['props']['issuances'];
        $items = isset($issuancesProp['data']) ? $issuancesProp['data'] : $issuancesProp;
        $matched = collect($items)->firstWhere('id', $issuance->id);

        $this->assertNotNull($matched);
        $this->assertSame('JUAN DELA CRUZ', $matched['issued_by']);
        $this->assertSame('JUAN DELA CRUZ', $matched['issued_by_name']);
        $this->assertSame('SUPPLY OFFICER III', $matched['issued_by_position']);
        $this->assertSame($this->adminUser->id, $matched['created_by_user_id']);
    }

    public function test_changing_system_settings_later_preserves_historical_issuance_snapshot(): void
    {
        // 1. Initial system settings
        SystemSetting::set('signatories.ris_issued_by_name', 'ORIGINAL ISSUER JUAN');
        SystemSetting::set('signatories.ris_issued_by_designation', 'SUPPLY OFFICER I');

        // 2. Create first issuance
        $this->actingAs($this->adminUser)->post(route('inventory.issuance.store'), [
            'recipient' => 'Prof. Alex Turner',
            'department' => 'College of Arts and Sciences',
            'fund_cluster' => '01',
            'date_issued' => '2026-09-12',
            'issuances' => [
                [
                    'item_id' => $this->item->id,
                    'quantity' => 2,
                ],
            ],
        ])->assertRedirect(route('inventory.issuance'));

        $firstIssuance = Issuance::where('recipient', 'Prof. Alex Turner')->firstOrFail();
        $this->assertSame('ORIGINAL ISSUER JUAN', $firstIssuance->issued_by_name);
        $this->assertSame('SUPPLY OFFICER I', $firstIssuance->issued_by_position);

        // 3. Admin changes System Settings to a new signatory
        SystemSetting::set('signatories.ris_issued_by_name', 'NEW ISSUER MARIA');
        SystemSetting::set('signatories.ris_issued_by_designation', 'CHIEF ADMINISTRATIVE OFFICER');

        // 4. Create second issuance after settings change
        $this->actingAs($this->adminUser)->post(route('inventory.issuance.store'), [
            'recipient' => 'Engr. Carlos Mendoza',
            'department' => 'College of Engineering',
            'fund_cluster' => '01',
            'date_issued' => '2026-09-12',
            'issuances' => [
                [
                    'item_id' => $this->item->id,
                    'quantity' => 3,
                ],
            ],
        ])->assertRedirect(route('inventory.issuance'));

        $secondIssuance = Issuance::where('recipient', 'Engr. Carlos Mendoza')->firstOrFail();

        // 5. Historical issuance MUST preserve ORIGINAL ISSUER JUAN
        $firstIssuanceFresh = Issuance::find($firstIssuance->id);
        $this->assertSame('ORIGINAL ISSUER JUAN', $firstIssuanceFresh->issued_by_name);
        $this->assertSame('SUPPLY OFFICER I', $firstIssuanceFresh->issued_by_position);

        // 6. New issuance MUST use NEW ISSUER MARIA
        $this->assertSame('NEW ISSUER MARIA', $secondIssuance->issued_by_name);
        $this->assertSame('CHIEF ADMINISTRATIVE OFFICER', $secondIssuance->issued_by_position);

        // 7. Verify index transforms both properly according to their respective snapshot
        $indexResponse = $this->actingAs($this->adminUser)->get(route('inventory.issuance'));
        $indexResponse->assertOk();
        $issuancesProp = $indexResponse->original->getData()['page']['props']['issuances'];
        $items = isset($issuancesProp['data']) ? $issuancesProp['data'] : $issuancesProp;

        $matchedFirst = collect($items)->firstWhere('id', $firstIssuance->id);
        $matchedSecond = collect($items)->firstWhere('id', $secondIssuance->id);

        $this->assertSame('ORIGINAL ISSUER JUAN', $matchedFirst['issued_by_name']);
        $this->assertSame('SUPPLY OFFICER I', $matchedFirst['issued_by_position']);
        $this->assertSame('NEW ISSUER MARIA', $matchedSecond['issued_by_name']);
        $this->assertSame('CHIEF ADMINISTRATIVE OFFICER', $matchedSecond['issued_by_position']);
    }
}
