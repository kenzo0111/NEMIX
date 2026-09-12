<?php

namespace Tests\Feature\AuditLogs;

use App\Models\ComplianceReport;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\AuditLogs\Support\AuditGroupContext;
use Modules\AuditLogs\Support\AuditLogFormatter;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Services\InventoryIssuanceService;
use Modules\Inventory\Services\InventoryReceivingService;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuditLogGroupingTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Supplier $supplier;
    protected Item $itemA;
    protected Item $itemB;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'System Admin', 'guard_name' => 'web']);
        $this->adminUser = User::factory()->create([
            'name' => 'System Administrator',
            'email' => 'sysadmin@test.edu.ph',
        ]);
        $this->adminUser->assignRole($adminRole);

        $this->supplier = Supplier::create([
            'name' => 'Advance Paper Corporation',
            'tin' => '123-456-789',
            'reg_number' => 'REG-2026-001',
            'address' => 'Daet, Camarines Norte',
            'category' => 'Office Supplies',
            'status' => 'active',
        ]);

        $this->itemA = Item::create([
            'name' => 'Record Book 300 Pages',
            'sku' => 'RB-300',
            'supplier_id' => $this->supplier->id,
            'stock' => 100,
            'unit_cost' => 150.00,
            'status' => 'Available',
            'unit_of_issue' => 'Books',
        ]);

        $this->itemB = Item::create([
            'name' => 'Document Envelope Kraft',
            'sku' => 'ENV-DOC-01',
            'supplier_id' => $this->supplier->id,
            'stock' => 100,
            'unit_cost' => 15.00,
            'status' => 'Available',
            'unit_of_issue' => 'Pieces',
        ]);

        // Seed inventory batches for both items
        InventoryBatch::create([
            'item_id' => $this->itemA->id,
            'supplier_id' => $this->supplier->id,
            'supplier_stock_no' => 'APC-26-09-001-0001',
            'quantity_received' => 100,
            'quantity_remaining' => 100,
            'unit_cost' => 150.00,
            'date_received' => '2026-09-01',
        ]);

        InventoryBatch::create([
            'item_id' => $this->itemB->id,
            'supplier_id' => $this->supplier->id,
            'supplier_stock_no' => 'APC-26-09-002-0001',
            'quantity_received' => 100,
            'quantity_remaining' => 100,
            'unit_cost' => 15.00,
            'date_received' => '2026-09-01',
        ]);

        // Clean any trails created during test setup
        TransactionTrail::query()->delete();
    }

    /**
     * 1. One stock issuance produces one top-level business event in business view.
     */
    public function test_one_stock_issuance_produces_one_top_level_business_event(): void
    {
        $issuanceService = app(InventoryIssuanceService::class);

        $issuance = $issuanceService->issue([
            'recipient' => 'Dr. Maria Santos',
            'department' => 'College of Engineering',
            'date_issued' => '2026-09-13',
            'purpose' => 'Midterm examination materials',
        ], [
            ['item_id' => $this->itemA->id, 'quantity' => 20],
            ['item_id' => $this->itemB->id, 'quantity' => 10],
        ], $this->adminUser->id);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?view_mode=business');
        $response->assertStatus(200);

        $logs = $response->viewData('page')['props']['logs'];
        $items = isset($logs['data']) ? $logs['data'] : $logs;

        // Exactly 1 top-level transaction in the main business view
        $this->assertCount(1, $items);
        $topLevel = $items[0];

        $this->assertEquals('Created Stock Issuance', $topLevel['action']);
        $this->assertEquals('Inventory', $topLevel['module']);
        $this->assertEquals($issuance->ris_number, $topLevel['resource_ref']);
        $this->assertEquals('success', $topLevel['result']);
        $this->assertStringContainsString('2 items issued', $topLevel['secondary_line']);
    }

    /**
     * 2. Issuance child events remain preserved in database.
     */
    public function test_issuance_child_events_remain_preserved_in_database(): void
    {
        $issuanceService = app(InventoryIssuanceService::class);

        $issuance = $issuanceService->issue([
            'recipient' => 'Dr. Maria Santos',
            'department' => 'College of Engineering',
            'date_issued' => '2026-09-13',
        ], [
            ['item_id' => $this->itemA->id, 'quantity' => 20],
            ['item_id' => $this->itemB->id, 'quantity' => 10],
        ], $this->adminUser->id);

        $groupId = 'ISSUANCE:' . $issuance->ris_number;

        // Verify that raw records exist in database for forensics
        $allGroupRecords = TransactionTrail::where('audit_group_id', $groupId)->get();
        $this->assertGreaterThan(1, $allGroupRecords->count());

        // Exactly 1 parent, and multiple child events
        $parentRecords = $allGroupRecords->where('is_parent', true);
        $childRecords = $allGroupRecords->where('is_parent', false);

        $this->assertCount(1, $parentRecords);
        $this->assertNotEmpty($childRecords);

        // Technical records include batch allocations, items, and stock balances
        $actions = $childRecords->pluck('action')->all();
        $this->assertContains('Allocated Inventory Batch', $actions);
        $this->assertContains('Added Issuance Item', $actions);
        $this->assertContains('Updated Inventory Balance', $actions);
    }

    /**
     * 3. Expanded issuance shows all related technical events with old/new values.
     */
    public function test_expanded_issuance_shows_all_related_technical_events(): void
    {
        $issuanceService = app(InventoryIssuanceService::class);

        $issuance = $issuanceService->issue([
            'recipient' => 'Dr. Maria Santos',
            'department' => 'College of Engineering',
            'date_issued' => '2026-09-13',
        ], [
            ['item_id' => $this->itemA->id, 'quantity' => 20],
        ], $this->adminUser->id);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?view_mode=business');
        $response->assertStatus(200);

        $items = $response->viewData('page')['props']['logs']['data'];
        $topLevel = $items[0];

        $this->assertNotEmpty($topLevel['children']);
        $firstChild = $topLevel['children'][0];

        $this->assertArrayHasKey('id', $firstChild);
        $this->assertArrayHasKey('event_key', $firstChild);
        $this->assertArrayHasKey('label', $firstChild);
        $this->assertArrayHasKey('action', $firstChild);
        $this->assertArrayHasKey('details', $firstChild);
        $this->assertArrayHasKey('occurred_at', $firstChild);
    }

    /**
     * 4. Two unrelated issuances are not grouped together.
     */
    public function test_two_unrelated_issuances_are_not_grouped(): void
    {
        $issuanceService = app(InventoryIssuanceService::class);

        $issuance1 = $issuanceService->issue([
            'recipient' => 'Dean Engineering',
            'department' => 'College of Engineering',
            'date_issued' => '2026-09-13',
        ], [
            ['item_id' => $this->itemA->id, 'quantity' => 5],
        ], $this->adminUser->id);

        $issuance2 = $issuanceService->issue([
            'recipient' => 'Dean Education',
            'department' => 'College of Education',
            'date_issued' => '2026-09-13',
        ], [
            ['item_id' => $this->itemB->id, 'quantity' => 15],
        ], $this->adminUser->id);

        $this->assertNotEquals($issuance1->ris_number, $issuance2->ris_number);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?view_mode=business');
        $items = $response->viewData('page')['props']['logs']['data'];

        // 2 distinct business transactions
        $this->assertCount(2, $items);
        $references = collect($items)->pluck('resource_ref')->all();
        $this->assertContains($issuance1->ris_number, $references);
        $this->assertContains($issuance2->ris_number, $references);
    }

    /**
     * 5. Same timestamp does not cause accidental grouping.
     */
    public function test_same_timestamp_does_not_cause_accidental_grouping(): void
    {
        $now = now();

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Created Stock Issuance',
            'resource_ref' => 'RIS-2026-0001',
            'audit_group_id' => 'ISSUANCE:RIS-2026-0001',
            'is_parent' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Created Stock Issuance',
            'resource_ref' => 'RIS-2026-0002',
            'audit_group_id' => 'ISSUANCE:RIS-2026-0002',
            'is_parent' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?view_mode=business');
        $items = $response->viewData('page')['props']['logs']['data'];

        $this->assertCount(2, $items);
    }

    /**
     * 6. System Settings save groups related setting changes.
     */
    public function test_system_settings_save_groups_related_changes(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/admin/system-settings', [
            'settings' => [
                'inventory.low_stock_threshold' => 25,
                'inventory.critical_stock_threshold' => 8,
            ],
        ]);
        $response->assertSessionHasNoErrors();

        $trail = TransactionTrail::where('action', 'Updated System Settings')->latest()->first();
        $this->assertNotNull($trail);
        $this->assertTrue((bool) $trail->is_parent);
        $this->assertEquals('Administration', $trail->module);
        $this->assertNotNull($trail->audit_group_id);
        $this->assertStringContainsString('Updated 2 configuration parameters', $trail->details);

        // Verify child trails were linked with is_parent = false
        $childTrails = TransactionTrail::where('audit_group_id', $trail->audit_group_id)
            ->where('is_parent', false)
            ->get();
        $this->assertNotEmpty($childTrails);
    }

    /**
     * 7. Manual stock adjustment remains visible as its own business event.
     */
    public function test_manual_stock_adjustment_remains_visible_as_its_own_event(): void
    {
        // Standalone manual stock edit
        $this->itemA->update(['stock' => 140]);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?view_mode=business');
        $items = $response->viewData('page')['props']['logs']['data'];

        $adjEvent = collect($items)->firstWhere('action', 'Adjusted Item Stock');
        $this->assertNotNull($adjEvent);
        $this->assertEquals('Inventory', $adjEvent['module']);
        $this->assertStringContainsString('Adjusted stock for \'Record Book 300 Pages\'', $adjEvent['details']);
    }

    /**
     * 8. Audit pagination counts grouped transactions correctly.
     */
    public function test_audit_pagination_counts_grouped_transactions_correctly(): void
    {
        $issuanceService = app(InventoryIssuanceService::class);

        // 1 issuance generates 1 parent + ~5 child events (6 total DB rows)
        $issuanceService->issue([
            'recipient' => 'Personnel 1',
            'department' => 'Dept A',
            'date_issued' => '2026-09-13',
        ], [
            ['item_id' => $this->itemA->id, 'quantity' => 2],
            ['item_id' => $this->itemB->id, 'quantity' => 3],
        ], $this->adminUser->id);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?view_mode=business');
        $props = $response->viewData('page')['props'];

        // Pagination total should count 1, not 6
        $this->assertEquals(1, $props['logs']['total']);
        $this->assertEquals(1, $props['summary']['total']);
    }

    /**
     * 9. Missing audit_group_id renders legacy records cleanly without fabricating relationships.
     */
    public function test_missing_audit_group_id_renders_legacy_records_safely(): void
    {
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Legacy Standalone Operation',
            'resource_ref' => 'LEGACY-001',
            'details' => 'Legacy details without group id',
            'status' => 'Verified',
            'audit_group_id' => null,
            'is_parent' => true,
        ]);

        $response = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?view_mode=business');
        $items = $response->viewData('page')['props']['logs']['data'];

        $legacy = collect($items)->firstWhere('resource_ref', 'LEGACY-001');
        $this->assertNotNull($legacy);
        $this->assertEquals('Legacy Standalone Operation', $legacy['action']);
        $this->assertEmpty($legacy['children']);
    }

    /**
     * 10. Sensitive fields are redacted and not exposed in technical metadata.
     */
    public function test_sensitive_fields_are_redacted_in_audit_records(): void
    {
        $payload = [
            'name' => 'John Doe',
            'password' => 'super-secret-password-123',
            'api_token' => 'secret-api-token',
            'nested' => [
                'auth_key' => 'nested-secret-key',
                'description' => 'Safe description',
            ],
        ];

        $sanitized = AuditLogFormatter::sanitizeValues($payload);

        $this->assertEquals('John Doe', $sanitized['name']);
        $this->assertEquals('[REDACTED]', $sanitized['password']);
        $this->assertEquals('[REDACTED]', $sanitized['api_token']);
        $this->assertEquals('[REDACTED]', $sanitized['nested']['auth_key']);
        $this->assertEquals('Safe description', $sanitized['nested']['description']);
    }

    /**
     * 11. Technical mode displays the complete flat event stream when toggled.
     */
    public function test_technical_mode_shows_raw_event_stream(): void
    {
        $issuanceService = app(InventoryIssuanceService::class);

        $issuanceService->issue([
            'recipient' => 'Personnel 1',
            'department' => 'Dept A',
            'date_issued' => '2026-09-13',
        ], [
            ['item_id' => $this->itemA->id, 'quantity' => 2],
        ], $this->adminUser->id);

        // In business mode: 1 top-level transaction
        $businessResponse = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?view_mode=business');
        $this->assertEquals(1, $businessResponse->viewData('page')['props']['logs']['total']);

        // In technical mode: all individual raw events
        $techResponse = $this->actingAs($this->adminUser)->get('/audit-logs/transaction-trails?view_mode=technical');
        $techTotal = $techResponse->viewData('page')['props']['logs']['total'];
        $this->assertGreaterThan(1, $techTotal);
    }
}
