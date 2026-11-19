<?php

namespace Tests\Feature;

use App\Models\CoordinatorMovement;
use App\Models\CoordinatorStock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Modules\AuditLogs\Models\LoginTrail;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Suppliers\Models\Supplier;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TableSortingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public static function pages(): array
    {
        return [
            'inventory' => ['inventory', 'inventory.index', ['id', 'sku', 'name', 'description', 'unit', 'stock', 'value', 'status'], 'filters', 'items', 'pagination', 'name', false],
            'receiving' => ['receiving', 'inventory.receiving', ['item', 'supplier', 'quantity', 'remaining', 'unit_cost', 'amount', 'date'], 'filters', 'receivings.data', 'receivings', 'quantity', false],
            'issuance' => ['issuance', 'inventory.issuance', ['ris_number', 'recipient', 'department', 'item', 'quantity', 'date', 'status'], 'filters', 'issuances.data', 'issuances', 'quantity', false],
            'requests' => ['requests', 'inventory.requests.index', ['reference', 'purpose', 'recipient', 'status', 'date', 'items'], 'requestFilters', 'requests.data', 'requests', 'date', false],
            'login audit' => ['login', 'audit-logs.login-trails', ['user', 'role', 'date', 'ip', 'result'], 'filters', 'loginData.data', 'loginData', 'date', false],
            'transaction audit' => ['transactions', 'audit-logs.transaction-trails', ['user', 'activity', 'module', 'result', 'date'], 'filters', 'logs.data', 'logs', 'date', false],
            'RFID' => ['rfid', 'rfid-scanner.index', ['name', 'sku', 'rfid', 'status', 'supplier', 'updated'], 'recordsFilters', 'records', 'recordsPagination', 'name', false],
            'catalog' => ['catalog', 'coordinator.catalog.index', ['name', 'sku', 'unit', 'on_hand', 'available'], 'filters', 'items.data', 'items', 'name', true],
            'history' => ['history', 'coordinator.inventory.index', ['date', 'item', 'type', 'quantity', 'source'], 'historyFilters', 'movements.data', 'movements', 'quantity', false],
        ];
    }

    private function actor(string $kind): User
    {
        $role = in_array($kind, ['requests', 'catalog', 'history']) ? 'Supply Coordinator'
            : (in_array($kind, ['receiving', 'issuance']) ? 'Property Custodian' : 'System Admin');
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole($role);
        if (in_array($kind, ['receiving', 'issuance'])) {
            $user->givePermissionTo(Permission::firstOrCreate(['name' => 'route:inventory.'.$kind, 'guard_name' => 'web']));
        }

        return $user;
    }

    private function item(User $actor, string $name = 'Sort record', array $overrides = []): Item
    {
        $supplier = Supplier::firstOrCreate(['name' => 'Sort supplier'], [
            'tin' => '123-456-789', 'address' => 'Test address', 'reg_number' => 'SORT-REG',
            'category' => 'Office Supplies', 'status' => 'active', 'created_by' => $actor->id,
        ]);

        return Item::create(array_merge([
            'name' => $name, 'sku' => 'SORT-'.uniqid(), 'supplier_id' => $supplier->id,
            'stock' => 20, 'unit_cost' => 10, 'amount' => 200, 'unit_of_issue' => 'piece',
            'status' => 'Available', 'description' => 'Test consumable', 'created_by' => $actor->id,
            'weekly_request_limit' => 100, 'rfid_tag' => null,
        ], $overrides));
    }

    private function seedRecords(string $kind, User $actor, int $count, string $label = 'Sort record'): array
    {
        if ($kind === 'transactions') TransactionTrail::query()->delete();
        $ids = [];
        for ($index = 0; $index < $count; $index++) {
            if (in_array($kind, ['inventory', 'rfid', 'catalog'])) {
                $record = $this->item($actor, $label);
            } elseif ($kind === 'receiving') {
                $item = $this->item($actor, $label);
                $record = Receiving::create(['item_id' => $item->id, 'supplier_id' => $item->supplier_id,
                    'quantity' => 20, 'date_received' => '2026-11-20', 'created_by' => $actor->id]);
                InventoryBatch::create(['item_id' => $item->id, 'supplier_id' => $item->supplier_id,
                    'receiving_id' => $record->id, 'quantity_received' => 20, 'quantity_remaining' => 10,
                    'unit_cost' => 10, 'date_received' => '2026-11-20', 'created_by' => $actor->id]);
            } elseif ($kind === 'issuance') {
                $item = $this->item($actor, $label);
                $record = Issuance::create(['ris_number' => 'SORT-'.uniqid(), 'item_id' => $item->id,
                    'quantity' => 20, 'recipient' => $label, 'department' => 'Test office',
                    'date_issued' => '2026-11-20', 'status' => 'Issued', 'issued_by' => $actor->id]);
                $record->items()->create(['item_id' => $item->id, 'quantity' => 20, 'unit_cost' => 10, 'amount' => 200]);
            } elseif ($kind === 'requests') {
                $item = $this->item($actor, $label);
                $record = SupplyRequest::create(['requested_by' => $actor->id, 'department' => 'Test office',
                    'purpose' => $label, 'recipient' => $label, 'status' => 'Pending', 'date_requested' => '2026-11-20']);
                $record->items()->create(['item_id' => $item->id, 'quantity' => 2]);
            } elseif ($kind === 'login') {
                $record = LoginTrail::create(['user_id' => $actor->id, 'name' => $label, 'email' => $actor->email,
                    'ip_address' => '192.0.2.10', 'user_agent' => 'Test browser', 'status' => 'Success']);
            } elseif ($kind === 'transactions') {
                $record = TransactionTrail::create(['user_id' => $actor->id, 'module' => 'Inventory',
                    'action' => $label, 'resource_ref' => 'SORT-'.uniqid(), 'details' => $label,
                    'status' => 'Success', 'is_parent' => true]);
            } else {
                $item = $this->item($actor, $label);
                $stock = CoordinatorStock::create(['coordinator_id' => $actor->id, 'item_id' => $item->id,
                    'name' => $label, 'sku' => $item->sku, 'unit' => 'piece', 'quantity' => 20, 'value' => 200]);
                $record = CoordinatorMovement::create(['coordinator_stock_id' => $stock->id, 'actor_id' => $actor->id,
                    'type' => 'issue', 'date' => '2026-11-20', 'quantity' => 2, 'unit_cost' => 10,
                    'reference' => 'SORT-'.uniqid(), 'office' => $label]);
            }
            $record->forceFill(['created_at' => '2026-11-20 10:00:00', 'updated_at' => '2026-11-20 10:00:00'])->saveQuietly();
            $ids[] = $record->id;
        }

        return $ids;
    }

    #[DataProvider('pages')]
    public function test_every_whitelisted_column_can_sort_in_both_directions(string $kind, string $route, array $columns, string $filters, string $rows): void
    {
        $actor = $this->actor($kind);
        $this->seedRecords($kind, $actor, 2);
        foreach ($columns as $column) {
            foreach (['asc', 'desc'] as $direction) {
                $this->actingAs($actor)->get(route($route, ['sort' => $column, 'direction' => $direction, 'view_mode' => 'technical']))
                    ->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
                        ->where($filters.'.sort', $column)->where($filters.'.direction', $direction)->has($rows, 2));
            }
        }
    }

    #[DataProvider('pages')]
    public function test_sort_identifiers_and_directions_are_rejected_before_sql_execution(string $kind, string $route, array $columns): void
    {
        $actor = $this->actor($kind);
        foreach ([
            ['sort' => 'name DESC; DROP TABLE users'], ['sort' => 'not_a_column'], ['sort' => [$columns[0]]],
            ['sort' => $columns[0], 'direction' => 'ASC'], ['sort' => $columns[0], 'direction' => 'desc; SELECT 1'],
            ['sort' => $columns[0], 'direction' => ['asc']],
        ] as $parameters) {
            $this->actingAs($actor)->getJson(route($route, $parameters))->assertUnprocessable()
                ->assertJsonValidationErrors(array_key_exists('direction', $parameters) ? 'direction' : 'sort');
        }
        $this->assertDatabaseCount('users', 1);
    }

    #[DataProvider('pages')]
    public function test_tied_values_have_stable_ids_across_pagination(string $kind, string $route, array $columns, string $filters, string $rows, string $pagination, string $tiedColumn, bool $ascendingId): void
    {
        $actor = $this->actor($kind);
        $ids = $this->seedRecords($kind, $actor, 12);
        foreach (['asc', 'desc'] as $direction) {
            $actual = [];
            for ($page = 1; $page <= 3; $page++) {
                $response = $this->actingAs($actor)->get(route($route, ['sort' => $tiedColumn,
                    'direction' => $direction, 'per_page' => 5, 'page' => $page, 'view_mode' => 'technical', 'search' => 'Sort record']))->assertOk();
                $props = $response->viewData('page')['props'];
                $this->assertSame(5, data_get($props, $pagination.'.per_page'));
                $actual = array_merge($actual, array_column(data_get($props, $rows), 'id'));
            }
            $this->assertSame($ascendingId ? $ids : array_reverse($ids), $actual);
            $this->assertCount(12, array_unique($actual));
        }
    }

    #[DataProvider('pages')]
    public function test_sorting_preserves_active_filters_and_page_size(string $kind, string $route, array $columns, string $filters, string $rows, string $pagination, string $tiedColumn): void
    {
        $actor = $this->actor($kind);
        $this->seedRecords($kind, $actor, 12);
        // A record outside the search ensures filtering happens before pagination.
        if ($kind !== 'transactions') $this->seedRecords($kind, $actor, 1, 'Other record');
        $parameters = ['search' => 'Sort record', 'sort' => $tiedColumn, 'direction' => 'asc', 'per_page' => 5];
        $parameters += match ($kind) {
            'inventory' => ['status' => 'Available', 'supplier' => Supplier::where('name', 'Sort supplier')->value('id')],
            'receiving' => ['supplier' => Supplier::where('name', 'Sort supplier')->value('id')],
            'issuance' => ['recipient' => 'Sort record'],
            'requests' => ['status' => 'Pending'],
            'login' => ['status' => 'login_success', 'role' => 'System Admin', 'date_from' => '2026-11-19', 'date_to' => '2026-11-21'],
            'transactions' => ['module' => 'Inventory', 'action' => 'Sort record', 'view_mode' => 'technical', 'date_from' => '2026-11-19'],
            'rfid' => ['status' => 'untagged'],
            'catalog' => ['availability' => 'available'],
            'history' => ['type' => 'issue', 'tab' => 'history'],
        };
        $props = $this->actingAs($actor)->get(route($route, $parameters))->assertOk()->viewData('page')['props'];
        $this->assertSame(12, data_get($props, $pagination.'.total'));
        $this->assertSame(1, data_get($props, $pagination.'.current_page'));
        $this->assertSame(5, data_get($props, $pagination.'.per_page'));
        $this->assertSame('Sort record', data_get($props, $filters.'.search'));
        $this->assertSame($tiedColumn, data_get($props, $filters.'.sort'));
        $this->assertSame('asc', data_get($props, $filters.'.direction'));
        if ($url = data_get($props, $pagination.'.next_page_url')) {
            parse_str(parse_url($url, PHP_URL_QUERY), $query);
            foreach ($parameters as $key => $value) $this->assertSame((string) $value, (string) $query[$key]);
            $this->assertSame('2', $query['page']);
        }
        foreach ([0, 101, 'unbounded', [10]] as $invalidPageSize) {
            $this->actingAs($actor)->getJson(route($route, ['per_page' => $invalidPageSize]))->assertUnprocessable()->assertJsonValidationErrors('per_page');
        }
    }

    public function test_receiving_sorts_the_displayed_batch_values_and_legacy_fallbacks(): void
    {
        $actor = $this->actor('receiving');
        $item = $this->item($actor, 'Sort record', ['unit_cost' => 100]);
        $legacy = Receiving::create(['item_id' => $item->id, 'supplier_id' => $item->supplier_id, 'quantity' => 7, 'date_received' => '2026-11-20', 'created_by' => $actor->id]);
        $batched = [];
        foreach ([[10, 9, 3], [3, 0, 20]] as [$quantity, $remaining, $cost]) {
            $receiving = Receiving::create(['item_id' => $item->id, 'supplier_id' => $item->supplier_id, 'quantity' => $quantity, 'date_received' => '2026-11-20', 'created_by' => $actor->id]);
            InventoryBatch::create(['item_id' => $item->id, 'supplier_id' => $item->supplier_id, 'receiving_id' => $receiving->id,
                'quantity_received' => $quantity, 'quantity_remaining' => $remaining, 'unit_cost' => $cost, 'date_received' => '2026-11-20']);
            $batched[] = $receiving;
        }
        foreach (['unit_cost' => [$batched[0]->id, $batched[1]->id, $legacy->id],
            'remaining' => [$batched[1]->id, $legacy->id, $batched[0]->id],
            'amount' => [$batched[0]->id, $batched[1]->id, $legacy->id]] as $column => $expected) {
            $props = $this->actingAs($actor)->get(route('inventory.receiving', ['sort' => $column, 'direction' => 'asc']))->assertOk()->viewData('page')['props'];
            $this->assertSame($expected, array_column($props['receivings']['data'], 'id'));
        }
    }

    public function test_inventory_value_sort_ignores_archived_batches_and_uses_legacy_values(): void
    {
        $actor = $this->actor('inventory');
        $legacy = $this->item($actor, 'Legacy', ['amount' => 50]);
        $batched = $this->item($actor, 'Batched', ['amount' => 9999]);
        $spent = $this->item($actor, 'Spent', ['amount' => 9999]);
        foreach ([[$batched, 2, 10], [$spent, 0, 100]] as [$item, $remaining, $cost]) {
            InventoryBatch::create(['item_id' => $item->id, 'supplier_id' => $item->supplier_id,
                'quantity_received' => 10, 'quantity_remaining' => $remaining, 'unit_cost' => $cost, 'date_received' => '2026-11-20']);
        }
        $archived = InventoryBatch::create(['item_id' => $batched->id, 'supplier_id' => $batched->supplier_id,
            'quantity_received' => 100, 'quantity_remaining' => 100, 'unit_cost' => 100, 'date_received' => '2026-11-20']);
        $archived->delete();
        $props = $this->actingAs($actor)->get(route('inventory.index', ['sort' => 'value', 'direction' => 'asc']))->assertOk()->viewData('page')['props'];
        $this->assertSame([$spent->id, $batched->id, $legacy->id], array_column($props['items'], 'id'));
        $this->assertSame([0.0, 20.0, 50.0], array_column($props['items'], 'inventory_value'));
    }

    public function test_rfid_status_groups_tagged_items_and_both_empty_tag_variants(): void
    {
        $actor = $this->actor('rfid');
        $null = $this->item($actor, 'Null tag');
        $empty = $this->item($actor, 'Empty tag', ['rfid_tag' => '']);
        $tagged = $this->item($actor, 'Tagged', ['rfid_tag' => 'TAG-Z']);
        $props = $this->actingAs($actor)->get(route('rfid-scanner.index', ['sort' => 'status', 'direction' => 'asc']))->assertOk()->viewData('page')['props'];
        $this->assertSame([$tagged->id, $empty->id, $null->id], array_column($props['records'], 'id'));
        $this->actingAs($actor)->get(route('rfid-scanner.index', ['status' => 'untagged']))->assertInertia(fn ($page) => $page->where('recordsPagination.total', 2));
    }

    public function test_sorting_keeps_coordinator_history_and_login_audit_ownership_and_admin_read_only_access(): void
    {
        $owner = $this->actor('history');
        $other = $this->actor('history');
        $mine = $this->seedRecords('history', $owner, 1);
        $this->seedRecords('history', $other, 1);
        $this->actingAs($owner)->get(route('coordinator.inventory.index', ['sort' => 'source', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page->where('movements.total', 1)->where('movements.data.0.id', $mine[0]));
        $owner->givePermissionTo(Permission::firstOrCreate(['name' => 'route:audit-logs.login-trails', 'guard_name' => 'web']));
        $mine = $this->seedRecords('login', $owner, 1);
        $this->seedRecords('login', $other, 1);
        $this->actingAs($owner)->get(route('audit-logs.login-trails', ['sort' => 'user', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page->where('loginData.total', 1)->where('loginData.data.0.id', $mine[0]));
        $admin = $this->actor('inventory');
        $item = $this->item($admin);
        $this->actingAs($admin)->get(route('inventory.index', ['sort' => 'name']))->assertInertia(fn ($page) => $page->where('readOnly', true));
        $this->actingAs($admin)->put(route('inventory.update', $item), ['stock' => 999])->assertForbidden();
        $this->assertSame(20, $item->fresh()->stock);
    }
}
