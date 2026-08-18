<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\ComplianceReport;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Inventory\Models\Issuance;
use Modules\Suppliers\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class IdorProtectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'System Admin']);
        Role::firstOrCreate(['name' => 'Staff']);
    }

    public function test_user_cannot_update_or_delete_another_users_compliance_report()
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();

        $report = ComplianceReport::create([
            'title' => 'User B Confidential Report',
            'type' => 'RSMI',
            'reference' => 'REF-100',
            'period_type' => 'specific',
            'created_by' => $owner->id,
        ]);

        // Attacker attempts to update owner's report -> 403
        $response = $this->actingAs($attacker)->put("/compliance/reports/{$report->id}", [
            'title' => 'Tampered Report',
            'type' => 'RSMI',
            'reference' => 'REF-100',
            'periodType' => 'specific',
        ]);
        $response->assertStatus(403);

        // Attacker attempts to archive/delete owner's report -> 403
        $deleteResponse = $this->actingAs($attacker)->delete("/compliance/reports/{$report->id}");
        $deleteResponse->assertStatus(403);
    }

    public function test_user_cannot_update_or_delete_another_users_inventory_item()
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();

        $supplier = Supplier::create([
            'name' => 'Supplier A',
            'tin' => '123-456-789',
            'address' => 'Sample Address',
            'reg_number' => 'REG-100',
            'category' => 'General',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);

        $item = Item::create([
            'name' => 'Laptops',
            'supplier_id' => $supplier->id,
            'sku' => 'SKU-001',
            'stock' => 10,
            'status' => 'Available',
            'created_by' => $owner->id,
        ]);

        // Attacker attempts to update item -> 403
        $response = $this->actingAs($attacker)->put("/inventories/{$item->id}", [
            'name' => 'Hacked Item',
            'supplier_id' => $supplier->id,
            'stock' => 0,
            'status' => 'Out of Stock',
        ]);
        $response->assertStatus(403);

        // Attacker attempts to delete item -> 403
        $deleteResponse = $this->actingAs($attacker)->delete("/inventories/{$item->id}");
        $deleteResponse->assertStatus(403);
    }

    public function test_user_cannot_update_or_delete_another_users_receiving_record()
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();

        $supplier = Supplier::create([
            'name' => 'Supplier B',
            'tin' => '987-654-321',
            'address' => 'Address B',
            'reg_number' => 'REG-200',
            'category' => 'Electronics',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);

        $item = Item::create([
            'name' => 'Monitors',
            'supplier_id' => $supplier->id,
            'stock' => 5,
            'status' => 'Low Stock',
            'created_by' => $owner->id,
        ]);

        $receiving = Receiving::create([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 5,
            'date_received' => now()->toDateString(),
            'created_by' => $owner->id,
        ]);

        // Attacker attempts to update receiving record -> 403
        $response = $this->actingAs($attacker)->put("/inventory/receiving/{$receiving->id}", [
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 100,
            'date_received' => now()->toDateString(),
        ]);
        $response->assertStatus(403);

        // Attacker attempts to delete receiving record -> 403
        $deleteResponse = $this->actingAs($attacker)->delete("/inventory/receiving/{$receiving->id}");
        $deleteResponse->assertStatus(403);
    }

    public function test_user_cannot_update_or_delete_another_users_issuance_record()
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();

        $supplier = Supplier::create([
            'name' => 'Supplier C',
            'tin' => '111-222-333',
            'address' => 'Address C',
            'reg_number' => 'REG-300',
            'category' => 'Stationery',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);

        $item = Item::create([
            'name' => 'Paper Reams',
            'supplier_id' => $supplier->id,
            'stock' => 50,
            'status' => 'Available',
            'created_by' => $owner->id,
        ]);

        $issuance = Issuance::create([
            'item_id' => $item->id,
            'quantity' => 5,
            'recipient' => 'Jane Doe',
            'date_issued' => now()->toDateString(),
            'status' => 'Issued',
            'issued_by' => $owner->id,
        ]);

        // Attacker attempts to update issuance -> 403
        $response = $this->actingAs($attacker)->put("/inventory/issuance/{$issuance->id}", [
            'item_id' => $item->id,
            'quantity' => 10,
            'recipient' => 'Jane Doe',
            'date_issued' => now()->toDateString(),
            'status' => 'Issued',
        ]);
        $response->assertStatus(403);

        // Attacker attempts to delete issuance -> 403
        $deleteResponse = $this->actingAs($attacker)->delete("/inventory/issuance/{$issuance->id}");
        $deleteResponse->assertStatus(403);
    }

    public function test_non_admin_cannot_update_or_toggle_other_staff_accounts()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $user1->assignRole('Staff');
        $user2->assignRole('Staff');

        // Non-admin user1 attempts to update user2 profile -> 403
        $updateResponse = $this->actingAs($user1)->put("/access-control/manage-staffs/{$user2->id}", [
            'name' => 'Modified Name',
            'email' => $user2->email,
            'role' => 'Staff',
        ]);
        $updateResponse->assertStatus(403);

        // Non-admin user1 attempts to toggle user2 status -> 403
        $toggleResponse = $this->actingAs($user1)->patch("/access-control/manage-staffs/{$user2->id}/toggle-status");
        $toggleResponse->assertStatus(403);
    }

    public function test_system_admin_can_manage_all_resources()
    {
        $admin = User::factory()->create();
        $admin->assignRole('System Admin');

        $user = User::factory()->create();
        $report = ComplianceReport::create([
            'title' => 'Staff Report',
            'type' => 'RPCI',
            'reference' => 'REF-999',
            'period_type' => 'specific',
            'created_by' => $user->id,
        ]);

        // Admin updates report successfully
        $response = $this->actingAs($admin)->put("/compliance/reports/{$report->id}", [
            'title' => 'Updated by Admin',
            'type' => 'RPCI',
            'reference' => 'REF-999',
            'periodType' => 'specific',
        ]);
        $response->assertRedirect();
        $this->assertEquals('Updated by Admin', $report->fresh()->title);
    }
}
