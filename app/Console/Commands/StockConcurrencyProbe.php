<?php

namespace App\Console\Commands;

use App\Models\CoordinatorStock;
use App\Models\Signatory;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Http\Controllers\SupplyRequestController;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Models\SupplyRequestItem;
use Modules\Inventory\Services\InventoryReceivingService;
use Modules\Inventory\Services\SupplyRequestService;
use Modules\Inventory\Services\WeeklyRequestQuota;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;

/** Internal integration-test worker; unavailable outside the isolated testing database. */
class StockConcurrencyProbe extends Command
{
    protected $signature = 'inventory:test-concurrency {job}';

    protected $description = 'Run one isolated PostgreSQL concurrency test operation';

    protected $hidden = true;

    public function handle(): int
    {
        if (! app()->environment('testing') || config('database.default') !== 'pgsql' || config('database.connections.pgsql.host') !== '127.0.0.1' || config('database.connections.pgsql.database') !== 'supplysync_stock_tests' || (int) config('database.connections.pgsql.port') !== 55439) {
            $this->error('An isolated stock test database is required.');

            return self::FAILURE;
        }
        $job = json_decode(base64_decode($this->argument('job'), true), true, flags: JSON_THROW_ON_ERROR);
        if ($job['action'] === 'setup') {
            $this->callSilent('migrate:fresh', ['--force' => true]);
            SystemSetting::set('mail.low_stock_email_alerts', false);
            SystemSetting::set('inventory.low_stock_threshold', 10);
            Schema::create('stock_test_barrier', fn ($table) => $table->boolean('released')->default(false));
            DB::table('stock_test_barrier')->insert(['released' => false]);
            $head = Signatory::firstOrCreate(['name' => 'Concurrency Head'], ['designation' => 'Head', 'is_active' => true]);
            $users = [];
            for ($index = 0; $index < 2; $index++) {
                $user = User::factory()->create(['department' => 'Registrar', 'office_head_id' => $head->id, 'is_active' => true]);
                $user->assignRole(Role::firstOrCreate(['name' => 'Supply Coordinator', 'guard_name' => 'web']));
                $users[] = $user;
            }
            $items = [];
            for ($index = 0; $index < ($job['case'] === 'reverse' ? 2 : 1); $index++) {
                $items[] = Item::create(['name' => 'Race Pens '.$index, 'sku' => 'RACE-'.$index, 'stock' => 100,
                    'unit_cost' => 2, 'amount' => 200, 'unit_of_issue' => 'piece', 'weekly_request_limit' => $job['case'] === 'split' ? 20 : 1000]);
            }
            $requests = [];
            $receiving = null;
            if ($job['case'] === 'receiving') {
                $supplier = Supplier::create(['name' => 'Concurrency Supplier', 'tin' => '111-222-333-000',
                    'reg_number' => 'STOCK-TEST', 'category' => 'Office Supplies']);
                $receipt = app(InventoryReceivingService::class)->record(['item_id' => $items[0]->id, 'supplier_id' => $supplier->id,
                    'date_received' => now()->toDateString(), 'quantity' => 20, 'unit_cost' => 2], $users[0]->id);
                $receiving = $receipt['receiving']->id;
            }
            if (! in_array($job['case'], ['split', 'duplicate'], true)) {
                for ($index = 0; $index < (in_array($job['case'], ['oversell', 'reverse'], true) ? 2 : 1); $index++) {
                    $record = SupplyRequest::create(['requested_by' => $users[$index]->id, 'department' => 'Registrar', 'purpose' => 'Concurrent request', 'status' => 'Pending']);
                    foreach ($index === 1 ? array_reverse($items) : $items as $item) {
                        $record->items()->create(['item_id' => $item->id, 'quantity' => match ($job['case']) {
                            'oversell' => 60, 'reverse' => 30, 'release' => 20, 'receiving' => 110, default => 15
                        }]);
                    }
                    $requests[] = $record;
                }
                if ($job['case'] === 'release') {
                    app(SupplyRequestService::class)->approve($requests[0], [$requests[0]->items->first()->id => 10], $users[0]->id, null);
                }
            }
            $this->line(json_encode(['users' => array_map(fn ($user) => $user->id, $users), 'items' => array_map(fn ($item) => $item->id, $items), 'requests' => array_map(fn ($record) => $record->id, $requests), 'receiving' => $receiving]));

            return self::SUCCESS;
        }
        if ($job['action'] === 'go') {
            DB::table('stock_test_barrier')->update(['released' => true]);

            return self::SUCCESS;
        }
        if ($job['action'] === 'inspect') {
            $this->line(json_encode([
                'stock' => Item::orderBy('id')->pluck('stock')->all(),
                'status' => SupplyRequest::orderBy('id')->pluck('status')->all(),
                'approved' => SupplyRequestItem::orderBy('id')->pluck('approved_quantity')->all(),
                'quota' => WeeklyRequestQuota::usage($job['user']),
                'unit' => (int) CoordinatorStock::where('coordinator_id', $job['user'])->sum('quantity'),
                'issuances' => Issuance::count(),
            ]));

            return self::SUCCESS;
        }
        $this->line('READY');
        $deadline = microtime(true) + 15;
        while (! DB::table('stock_test_barrier')->value('released')) {
            if (microtime(true) > $deadline) {
                throw new \RuntimeException('Test barrier timed out.');
            }
            usleep(10000);
        }
        try {
            $service = app(SupplyRequestService::class);
            if ($job['action'] === 'submit') {
                $user = User::findOrFail($job['user']);
                Auth::login($user);
                $request = Request::create('/inventory/my-requests', 'POST', ['department' => 'Registrar', 'purpose' => 'Concurrent request',
                    'items' => [['item_id' => $job['item'], 'quantity' => $job['quantity']]], 'submission_key' => $job['key'] ?? null]);
                $request->setUserResolver(fn () => $user);
                $request->setRouteResolver(fn () => app('router')->getRoutes()->getByName('inventory.requests.store'));
                $request->setLaravelSession(app('session')->driver());
                app()->instance('request', $request);
                app(SupplyRequestController::class)->store($request);
            } elseif ($job['action'] === 'receiving') {
                app(InventoryReceivingService::class)->update(Receiving::findOrFail($job['receiving']), ['quantity' => 5], $job['actor']);
            } else {
                $request = SupplyRequest::findOrFail($job['request']);
                match ($job['action']) {
                    'approve' => $service->approve($request, $request->items->mapWithKeys(fn ($line) => [$line->id => $job['quantity']])->all(), $job['actor'], 'Concurrent approval'),
                    'cancel' => $service->cancel($request, $job['actor']),
                    'release' => $service->release($request, $job['actor']),
                    default => throw new \InvalidArgumentException('Unsupported test action.'),
                };
            }
            $this->line('SUCCESS');
        } catch (ValidationException $error) {
            $this->line('REJECTED');
        }

        return self::SUCCESS;
    }
}
