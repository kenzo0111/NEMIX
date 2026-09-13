<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\AuditLogs\Models\TransactionTrail;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DashboardRecentActivityNormalizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'System Admin', 'guard_name' => 'web']);

        $this->adminUser = User::factory()->create([
            'name' => 'Dr. Admin Officer',
            'email' => 'spmo.officer@ucn.edu.ph',
            'is_active' => true,
        ]);
        $this->adminUser->assignRole($adminRole);
    }

    public function test_issuance_raw_json_is_normalized_to_human_readable_activity_without_raw_json(): void
    {
        TransactionTrail::query()->delete();

        $rawJson = json_encode([
            'issuance_id' => 36,
            'ris_number' => 'RIS-2026-09-0015',
            'recipient' => 'JONARD GAN',
            'department' => 'Research Services Division (RSD)',
            'total_quantity' => 4065,
            'items_count' => 2,
        ]);

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Created Stock Issuance',
            'resource_ref' => 'RIS-2026-09-0015',
            'details' => $rawJson,
            'status' => 'Success',
            'is_parent' => true,
            'event_key' => 'inventory.issuance.created',
            'created_at' => now()->subMinutes(15),
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('dashboard'));
        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) {
            $page->component('Dashboard')
                ->has('recentActivity', 1)
                ->where('recentActivity.0.title', 'Created Stock Issuance')
                ->where('recentActivity.0.reference', 'RIS-2026-09-0015')
                ->where('recentActivity.0.module', 'Inventory')
                ->where('recentActivity.0.context.department', 'Research Services Division (RSD)');

            $activity = $page->toArray()['props']['recentActivity'][0];

            // Summary must be human-readable and contain formatted numbers and names
            $this->assertStringContainsString('2 items', $activity['summary']);
            $this->assertStringContainsString('4,065 units', $activity['summary']);
            $this->assertStringContainsString('JONARD GAN', $activity['summary']);

            // Raw JSON strings or internal keys must NEVER leak into display fields
            $this->assertStringNotContainsString('{"issuance_id":36', $activity['summary']);
            $this->assertStringNotContainsString('{"issuance_id":36', $activity['details']);
            $this->assertStringNotContainsString('issuance_id', $activity['summary']);
            $this->assertStringNotContainsString('issuance_id', $activity['title']);
            $this->assertStringNotContainsString('issuance_id', $activity['reference']);
        });
    }

    public function test_receiving_activity_normalization_formats_supplier_and_stock_no(): void
    {
        TransactionTrail::query()->delete();

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Recorded Receiving',
            'resource_ref' => 'RR-42',
            'details' => 'Receiving batch processed',
            'status' => 'Success',
            'is_parent' => true,
            'event_key' => 'inventory.receiving.created',
            'metadata' => [
                'receiving_id' => 42,
                'item_name' => 'A4 Bond Paper 80 GSM',
                'supplier_name' => 'Advance Paper Corporation',
                'supplier_stock_no' => 'APC-26-09-001-0001',
                'quantity_received' => 5000,
                'unit' => 'reams',
            ],
            'created_at' => now()->subMinutes(30),
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('dashboard'));
        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) {
            $activity = $page->toArray()['props']['recentActivity'][0];

            $this->assertEquals('Recorded Inventory Receiving', $activity['title']);
            $this->assertEquals('Stock No. APC-26-09-001-0001', $activity['reference']);
            $this->assertStringContainsString('5,000 reams', $activity['summary']);
            $this->assertStringContainsString('Advance Paper Corporation', $activity['summary']);
            $this->assertEquals('Inventory', $activity['module']);
        });
    }

    public function test_technical_child_events_are_excluded_from_dashboard_feed(): void
    {
        TransactionTrail::query()->delete();

        // Parent Business Event
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Created Stock Issuance',
            'resource_ref' => 'RIS-2026-09-0099',
            'details' => 'Stock issuance to Engineering Department',
            'status' => 'Success',
            'audit_group_id' => 'grp-001',
            'is_parent' => true,
            'event_key' => 'inventory.issuance.created',
            'created_at' => now()->subMinutes(10),
        ]);

        // Technical Child Events (must be hidden from Dashboard)
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Created Issuance Item',
            'resource_ref' => 'RIS-ITEM-1',
            'details' => 'Batch allocation row',
            'status' => 'Success',
            'audit_group_id' => 'grp-001',
            'is_parent' => false,
            'event_key' => 'inventory.issuance_item.created',
            'created_at' => now()->subMinutes(9),
        ]);

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Allocated Inventory Batch',
            'resource_ref' => 'ALLOC-1',
            'details' => 'Batch reservation',
            'status' => 'Success',
            'audit_group_id' => 'grp-001',
            'is_parent' => false,
            'event_key' => 'inventory.issuance_batch_allocation.created',
            'created_at' => now()->subMinutes(8),
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('dashboard'));
        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) {
            $activities = $page->toArray()['props']['recentActivity'];

            // Only the 1 parent event should be returned, 0 child events
            $this->assertCount(1, $activities);
            $this->assertEquals('RIS-2026-09-0099', $activities[0]['reference']);
        });
    }

    public function test_safe_fallback_for_corrupted_or_plain_string_details(): void
    {
        TransactionTrail::query()->delete();

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'System',
            'action' => 'Legacy Audit Event',
            'resource_ref' => 'TRX-LEGACY-01',
            'details' => '{corrupted_json: true, invalid',
            'status' => 'Logged',
            'is_parent' => true,
            'created_at' => now()->subHours(1),
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('dashboard'));
        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) {
            $activity = $page->toArray()['props']['recentActivity'][0];

            // Should safely fallback without throwing an exception or leaking corrupted json
            $this->assertNotEmpty($activity['title']);
            $this->assertStringNotContainsString('{corrupted_json', $activity['summary']);
        });
    }

    public function test_sensitive_metadata_is_sanitized(): void
    {
        TransactionTrail::query()->delete();

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Access Control',
            'action' => 'Updated Staff Account',
            'resource_ref' => 'USR-12',
            'details' => 'Staff profile updated',
            'status' => 'Success',
            'is_parent' => true,
            'metadata' => [
                'name' => 'Prof. Santos',
                'password' => 'secret12345',
                'remember_token' => 'tok-abcdef',
                'api_key' => 'live_sec_123',
            ],
            'created_at' => now()->subHours(2),
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('dashboard'));
        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) {
            $activity = $page->toArray()['props']['recentActivity'][0];
            $serialized = json_encode($activity);

            $this->assertStringNotContainsString('secret12345', $serialized);
            $this->assertStringNotContainsString('tok-abcdef', $serialized);
            $this->assertStringNotContainsString('live_sec_123', $serialized);
        });
    }

    public function test_ordinary_authentication_events_are_excluded_from_dashboard_activity(): void
    {
        TransactionTrail::query()->delete();

        // 1. Ordinary authentication events (must be excluded from Dashboard)
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Audit Logs',
            'action' => 'User Login',
            'resource_ref' => 'AUTH-' . $this->adminUser->id,
            'details' => "User '{$this->adminUser->name}' logged in",
            'status' => 'Verified',
            'event_key' => 'auth.login',
            'is_parent' => true,
            'created_at' => now()->subMinutes(5),
        ]);

        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Auth',
            'action' => 'Failed Login Attempt',
            'resource_ref' => 'AUTH-FAILED',
            'details' => 'Invalid credentials attempt',
            'status' => 'Flagged',
            'event_key' => 'auth.failed',
            'is_parent' => true,
            'created_at' => now()->subMinutes(4),
        ]);

        // 2. Legitimate business event (must appear on Dashboard)
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Created Stock Issuance',
            'resource_ref' => 'RIS-2026-09-0019',
            'details' => 'Issuance to Sports and Development Office',
            'status' => 'Success',
            'event_key' => 'inventory.issuance.created',
            'metadata' => [
                'ris_number' => 'RIS-2026-09-0019',
                'items_count' => 1,
                'department' => 'Sports and Development Office',
            ],
            'is_parent' => true,
            'created_at' => now()->subMinutes(2),
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('dashboard'));
        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) {
            $activities = $page->toArray()['props']['recentActivity'];

            // Only the business issuance event should be returned
            $this->assertCount(1, $activities);
            $this->assertEquals('Created Stock Issuance', $activities[0]['title']);
            $this->assertEquals('RIS-2026-09-0019', $activities[0]['reference']);
            $this->assertEquals('Issued 1 item to Sports and Development Office.', $activities[0]['summary']);
        });

        // Ensure authentication audit logs still exist in database for forensic compliance
        $this->assertDatabaseHas('transaction_trails', [
            'action' => 'User Login',
        ]);
        $this->assertDatabaseHas('transaction_trails', [
            'action' => 'Failed Login Attempt',
        ]);
    }

    public function test_compliance_report_types_produce_domain_specific_titles_and_natural_summaries(): void
    {
        TransactionTrail::query()->delete();

        // Memorandum Receipt
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Compliance',
            'action' => 'Generated Compliance Report',
            'resource_ref' => 'REP-62',
            'details' => "Generated compliance report 'Memorandum Receipt - ANNE JANELLE GARCIA'",
            'status' => 'Success',
            'is_parent' => true,
            'created_at' => now()->subMinutes(15),
        ]);

        // RSMI Report
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Compliance',
            'action' => 'Generated Compliance Report',
            'resource_ref' => 'REP-61',
            'details' => "Generated compliance report 'RSMI' (RSMI)",
            'metadata' => [
                'report_number' => 'REP-61',
                'month' => 'September 2026',
            ],
            'status' => 'Success',
            'is_parent' => true,
            'created_at' => now()->subMinutes(10),
        ]);

        // RPCI Report
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Compliance',
            'action' => 'Generated Compliance Report',
            'resource_ref' => 'REP-63',
            'details' => "Generated compliance report 'RPCI' (RPCI)",
            'metadata' => [
                'report_number' => 'REP-63',
                'as_of' => '2026-09-13',
            ],
            'status' => 'Success',
            'is_parent' => true,
            'created_at' => now()->subMinutes(5),
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('dashboard'));
        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) {
            $activities = $page->toArray()['props']['recentActivity'];
            $this->assertCount(3, $activities);

            // RPCI (latest)
            $this->assertEquals('Generated RPCI Report', $activities[0]['title']);
            $this->assertEquals('REP-63', $activities[0]['reference']);
            $this->assertEquals('Physical Count of Inventories as of Sep 13, 2026.', $activities[0]['summary']);
            $this->assertEquals('Compliance', $activities[0]['module']);

            // RSMI
            $this->assertEquals('Generated RSMI Report', $activities[1]['title']);
            $this->assertEquals('REP-61', $activities[1]['reference']);
            $this->assertEquals('September 2026 reporting period.', $activities[1]['summary']);
            $this->assertEquals('Compliance', $activities[1]['module']);

            // Memorandum Receipt
            $this->assertEquals('Generated Memorandum Receipt', $activities[2]['title']);
            $this->assertEquals('REP-62', $activities[2]['reference']);
            $this->assertEquals('Prepared for ANNE JANELLE GARCIA.', $activities[2]['summary']);
            $this->assertEquals('Compliance', $activities[2]['module']);
        });
    }

    public function test_duplicate_business_events_sharing_audit_group_id_are_deduplicated(): void
    {
        TransactionTrail::query()->delete();

        $groupId = 'RFID-TAG-TX-999';

        // Secondary / generic audit event created in same operation
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'Inventory',
            'action' => 'Updated Inventory Item Details (RFID Tag)',
            'resource_ref' => 'TEST',
            'details' => 'RFID tag updated in inventory item',
            'status' => 'Success',
            'audit_group_id' => $groupId,
            'is_parent' => false,
            'created_at' => now()->subMinutes(3),
        ]);

        // Primary meaningful parent business event
        TransactionTrail::create([
            'user_id' => $this->adminUser->id,
            'module' => 'RFID',
            'action' => 'Assigned RFID Tag',
            'resource_ref' => 'TEST',
            'details' => 'RFID tag assigned successfully',
            'status' => 'Success',
            'audit_group_id' => $groupId,
            'event_key' => 'rfid.tag.assigned',
            'is_parent' => true,
            'created_at' => now()->subMinutes(2),
        ]);

        $response = $this->actingAs($this->adminUser)->get(route('dashboard'));
        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) {
            $activities = $page->toArray()['props']['recentActivity'];

            // Only 1 event must appear on Dashboard
            $this->assertCount(1, $activities);
            $this->assertEquals('Assigned RFID Tag', $activities[0]['title']);
            $this->assertEquals('TEST', $activities[0]['reference']);
            $this->assertEquals('RFID tag assigned successfully.', $activities[0]['summary']);
            $this->assertEquals('RFID', $activities[0]['module']);
        });

        // Full audit records remain in database
        $this->assertEquals(2, TransactionTrail::where('audit_group_id', $groupId)->count());
    }
}
