<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\AuditLogs\Support\AuditLogFormatter;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Receiving;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuditLogsSpecificActionTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'System Admin']);

        $this->adminUser = User::factory()->create([
            'name' => 'Test System Administrator',
            'email' => 'admin@audit-test.com',
        ]);
        $this->adminUser->assignRole($adminRole);
    }

    public function test_item_creation_creates_specific_audit_log(): void
    {
        $supplier = Supplier::create([
            'name' => 'Test Supplier Inc',
            'tin' => '111-222-333',
            'address' => 'Daet, Camarines Norte',
            'reg_number' => 'REG-1001',
            'category' => 'Office Supplies',
            'status' => 'active',
        ]);

        $item = Item::create([
            'name' => 'A4 Bond Paper',
            'sku' => 'PAP-A4-001',
            'supplier_id' => $supplier->id,
            'stock' => 50,
            'unit_cost' => 250.00,
            'amount' => 12500.00,
            'status' => 'Available',
            'unit_of_issue' => 'Reams',
        ]);

        $this->assertDatabaseHas('transaction_trails', [
            'module' => 'Inventory',
            'action' => 'Added Inventory Item',
            'resource_ref' => 'ITEM-PAP-A4-001',
        ]);

        $log = TransactionTrail::where('resource_ref', 'ITEM-PAP-A4-001')->latest()->first();
        $this->assertNotNull($log);
        $this->assertStringContainsString('A4 Bond Paper', $log->details);
        $this->assertStringContainsString('50 Reams', $log->details);
    }

    public function test_item_stock_adjustment_creates_specific_audit_log(): void
    {
        $supplier = Supplier::create([
            'name' => 'Test Supplier Inc',
            'tin' => '111-222-334',
            'address' => 'Daet, Camarines Norte',
            'reg_number' => 'REG-1002',
            'category' => 'Office Supplies',
            'status' => 'active',
        ]);

        $item = Item::create([
            'name' => 'Ballpen Black',
            'sku' => 'PEN-BLK-001',
            'supplier_id' => $supplier->id,
            'stock' => 100,
            'unit_cost' => 10.00,
            'amount' => 1000.00,
            'status' => 'Available',
            'unit_of_issue' => 'Pcs',
        ]);

        $item->update(['stock' => 150]);

        $log = TransactionTrail::where('action', 'Adjusted Item Stock')->latest()->first();
        $this->assertNotNull($log);
        $this->assertEquals('Inventory', $log->module);
        $this->assertStringContainsString('Adjusted stock for \'Ballpen Black\'', $log->details);
        $this->assertStringContainsString('100 to 150', $log->details);
    }

    public function test_receiving_creation_creates_stock_in_specific_audit_log(): void
    {
        $supplier = Supplier::create([
            'name' => 'DepEd Supplies',
            'tin' => '222-333-444',
            'address' => 'Daet, Camarines Norte',
            'reg_number' => 'REG-2001',
            'category' => 'Office Supplies',
            'status' => 'active',
        ]);

        $item = Item::create([
            'name' => 'Whiteboard Marker',
            'sku' => 'MRK-WHT-001',
            'supplier_id' => $supplier->id,
            'stock' => 20,
            'unit_cost' => 35.00,
            'status' => 'Available',
        ]);

        $receiving = Receiving::create([
            'item_id' => $item->id,
            'supplier_id' => $supplier->id,
            'quantity' => 30,
            'date_received' => '2026-08-20',
        ]);

        $this->assertDatabaseHas('transaction_trails', [
            'module' => 'Inventory',
            'action' => 'Stock In Requisition',
            'resource_ref' => 'RCV-' . $receiving->id,
        ]);

        $log = TransactionTrail::where('resource_ref', 'RCV-' . $receiving->id)->first();
        $this->assertNotNull($log);
        $this->assertStringContainsString('Received 30 units of \'Whiteboard Marker\'', $log->details);
    }

    public function test_issuance_creation_creates_issued_stock_specific_audit_log(): void
    {
        $supplier = Supplier::create([
            'name' => 'DepEd Supplies',
            'tin' => '333-444-555',
            'address' => 'Daet, Camarines Norte',
            'reg_number' => 'REG-3001',
            'category' => 'Office Supplies',
            'status' => 'active',
        ]);

        $item = Item::create([
            'name' => 'Stapler Heavy Duty',
            'sku' => 'STP-HD-001',
            'supplier_id' => $supplier->id,
            'stock' => 10,
            'unit_cost' => 150.00,
            'status' => 'Available',
        ]);

        $issuance = Issuance::create([
            'item_id' => $item->id,
            'quantity' => 2,
            'recipient' => 'Juan Dela Cruz',
            'department' => 'Accounting Department',
            'purpose' => 'Quarterly office operation',
            'date_issued' => '2026-08-21',
            'status' => 'Issued',
            'issued_by' => $this->adminUser->id,
        ]);

        $this->assertDatabaseHas('transaction_trails', [
            'module' => 'Inventory',
            'action' => 'Issued Inventory Stock',
            'resource_ref' => 'RIS-' . $issuance->id,
        ]);

        $log = TransactionTrail::where('resource_ref', 'RIS-' . $issuance->id)->first();
        $this->assertNotNull($log);
        $this->assertStringContainsString('Issued 2 units of \'Stapler Heavy Duty\' to Juan Dela Cruz (Accounting Department)', $log->details);
    }

    public function test_supplier_creation_creates_specific_audit_log(): void
    {
        $supplier = Supplier::create([
            'name' => 'Prime Paper Corp',
            'tin' => '555-666-777',
            'address' => 'Legazpi City',
            'reg_number' => 'REG-4001',
            'category' => 'Paper Products',
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('transaction_trails', [
            'module' => 'Suppliers',
            'action' => 'Registered New Supplier',
            'resource_ref' => 'SUP-555-666-777',
        ]);

        $log = TransactionTrail::where('resource_ref', 'SUP-555-666-777')->first();
        $this->assertNotNull($log);
        $this->assertStringContainsString('Registered new supplier \'Prime Paper Corp\'', $log->details);
    }

    public function test_user_status_toggle_creates_specific_audit_log(): void
    {
        $staff = User::factory()->create([
            'name' => 'Jane Staff',
            'email' => 'jane.staff@test.com',
            'is_active' => true,
        ]);

        $staff->update(['is_active' => false]);

        $log = TransactionTrail::where('action', 'Deactivated Staff Account')->latest()->first();
        $this->assertNotNull($log);
        $this->assertEquals('Access Control', $log->module);
        $this->assertStringContainsString('Deactivated account for staff user Jane Staff', $log->details);
    }

    public function test_audit_log_formatter_resolve_entry_handles_legacy_records(): void
    {
        $legacyTrail = [
            'id' => 999,
            'action' => 'Created',
            'module' => 'Item',
            'details' => 'Created Item',
            'resource_ref' => 'ID-999',
            'status' => 'Verified',
        ];

        $resolved = AuditLogFormatter::resolveLogEntry($legacyTrail);

        $this->assertEquals('Added Inventory Item', $resolved['action']);
        $this->assertEquals('Inventory', $resolved['module']);
        $this->assertEquals('Verified', $resolved['status']);
    }

    public function test_dashboard_endpoint_returns_specific_audit_actions(): void
    {
        $supplier = Supplier::create([
            'name' => 'Supplier XYZ',
            'tin' => '999-888-777',
            'address' => 'Daet',
            'reg_number' => 'REG-999',
            'category' => 'General',
            'status' => 'active',
        ]);

        Item::create([
            'name' => 'Special Marking Pen',
            'sku' => 'MRK-SPEC-01',
            'supplier_id' => $supplier->id,
            'stock' => 15,
            'unit_cost' => 45.00,
            'status' => 'Available',
        ]);

        $response = $this->actingAs($this->adminUser)->get('/dashboard');
        $response->assertStatus(200);

        $logs = $response->viewData('page')['props']['auditLogs'];
        $this->assertNotEmpty($logs);
        
        $actions = collect($logs)->pluck('action')->all();
        $this->assertContains('Added Inventory Item', $actions);
    }

    public function test_manage_transactions_endpoint_returns_specific_audit_actions(): void
    {
        $supplier = Supplier::create([
            'name' => 'Supplier ABC',
            'tin' => '888-777-666',
            'address' => 'Daet',
            'reg_number' => 'REG-888',
            'category' => 'General',
            'status' => 'active',
        ]);

        Item::create([
            'name' => 'Scissors Large',
            'sku' => 'SCIS-LRG-01',
            'supplier_id' => $supplier->id,
            'stock' => 8,
            'unit_cost' => 80.00,
            'status' => 'Available',
        ]);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails');
        $response->assertStatus(200);

        $logs = $response->viewData('page')['props']['logs'];
        $this->assertNotEmpty($logs);

        $actions = collect($logs)->pluck('action')->all();
        $this->assertContains('Added Inventory Item', $actions);
    }
}
