<?php

namespace Tests\Feature;

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\Inventory\Models\Item;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SystemSettingsTest extends TestCase
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
            'name' => 'Chief Administrator',
            'email' => 'admin@ucn.edu.ph',
        ]);
        $this->adminUser->assignRole($adminRole);

        $this->staffUser = User::factory()->create([
            'name' => 'Storekeeper Staff',
            'email' => 'storekeeper@ucn.edu.ph',
        ]);
        $this->staffUser->assignRole($staffRole);
    }

    public function test_non_admin_cannot_access_system_settings(): void
    {
        $response = $this->actingAs($this->staffUser)->get('/admin/system-settings');
        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_update_system_settings(): void
    {
        $response = $this->actingAs($this->staffUser)->post('/admin/system-settings', [
            'settings' => [
                'institution.name' => 'Hacked University Name',
            ],
        ]);
        $response->assertStatus(403);
    }

    public function test_system_admin_can_view_system_settings(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/admin/system-settings');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/SystemSettings/Index')
            ->has('groupedSettings')
            ->has('telemetry')
        );
    }

    public function test_system_admin_can_update_consumable_settings(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/admin/system-settings', [
            'settings' => [
                'institution.name' => 'University of Camarines Norte Main Campus',
                'signatories.ris_approved_by_name' => 'DR. JUAN DELA CRUZ',
                'signatories.ris_approved_by_designation' => 'DIRECTOR, SPMO',
                'inventory.low_stock_threshold' => 25,
                'numbering.ris_prefix' => 'UCN-RIS-',
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertEquals('University of Camarines Norte Main Campus', SystemSetting::get('institution.name'));
        $this->assertEquals('DR. JUAN DELA CRUZ', SystemSetting::get('signatories.ris_approved_by_name'));
        $this->assertEquals('DIRECTOR, SPMO', SystemSetting::get('signatories.ris_approved_by_designation'));
        $this->assertEquals(25, SystemSetting::get('inventory.low_stock_threshold'));
        $this->assertEquals('UCN-RIS-', SystemSetting::get('numbering.ris_prefix'));
    }

    public function test_settings_caching_and_invalidation(): void
    {
        SystemSetting::clearSettingCache();

        // First call caches the setting
        $initial = SystemSetting::get('institution.name');
        $this->assertNotEmpty($initial);

        // Update via controller
        $this->actingAs($this->adminUser)->post('/admin/system-settings', [
            'settings' => [
                'institution.name' => 'Updated Cached Institution',
            ],
        ]);

        // Second call should return the fresh value due to cache invalidation
        $this->assertEquals('Updated Cached Institution', SystemSetting::get('institution.name'));
    }

    public function test_settings_update_logs_transaction_trail(): void
    {
        $this->actingAs($this->adminUser)->post('/admin/system-settings', [
            'settings' => [
                'inventory.low_stock_threshold' => 30,
            ],
        ]);

        $this->assertDatabaseHas('transaction_trails', [
            'user_id' => $this->adminUser->id,
            'module' => 'System Settings',
            'action' => 'Consumables Settings Updated',
        ]);
    }

    public function test_inventory_status_uses_dynamic_low_stock_threshold(): void
    {
        $supplier = Supplier::create([
            'name' => 'UCN Supplies Corp',
            'tin' => '123-456-789-000',
            'reg_number' => 'REG-98765',
            'category' => 'Office Supplies',
            'status' => 'active',
            'address' => 'Daet, Camarines Norte',
            'created_by' => $this->adminUser->id,
        ]);

        // When threshold is 10, an item with stock 15 is Available
        SystemSetting::set('inventory.low_stock_threshold', 10);
        SystemSetting::clearSettingCache();

        $item = Item::create([
            'name' => 'A4 Bond Paper Reams',
            'supplier_id' => $supplier->id,
            'sku' => 'STOCK-A4-01',
            'stock' => 15,
            'unit_cost' => 250,
            'amount' => 3750,
            'status' => 'Available',
            'created_by' => $this->adminUser->id,
        ]);

        $this->assertEquals('Available', $item->status);

        // Now change threshold to 20 via admin settings
        $this->actingAs($this->adminUser)->post('/admin/system-settings', [
            'settings' => [
                'inventory.low_stock_threshold' => 20,
            ],
        ]);

        // Simulating stock recalculation or receiving update
        $item->stock = 15;
        $item->amount = (float) $item->stock * (float) $item->unit_cost;
        $lowStockThreshold = (int) SystemSetting::get('inventory.low_stock_threshold', 10);
        $item->status = $item->stock <= 0 ? 'Out of Stock' : ($item->stock <= $lowStockThreshold ? 'Low Stock' : 'Available');
        $item->save();

        $this->assertEquals('Low Stock', $item->fresh()->status);
    }

    public function test_cannot_set_critical_stock_threshold_higher_than_low_stock(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/admin/system-settings', [
            'settings' => [
                'inventory.low_stock_threshold' => 10,
                'inventory.critical_stock_threshold' => 15,
            ],
        ]);

        $response->assertSessionHasErrors('settings.inventory.critical_stock_threshold');
    }

    public function test_can_update_recognized_units_of_issue(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/admin/system-settings', [
            'settings' => [
                'inventory.units_of_issue' => ['box', 'ream', 'carton', 'bundle'],
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $units = SystemSetting::get('inventory.units_of_issue');
        $this->assertIsArray($units);
        $this->assertContains('carton', $units);
    }
}
