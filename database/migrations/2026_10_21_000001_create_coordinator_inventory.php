<?php

use App\Services\CoordinatorInventoryService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Models\SupplyRequest;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coordinator_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coordinator_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();
            $table->string('name');
            $table->string('sku');
            $table->string('unit');
            $table->integer('quantity')->default(0);
            $table->decimal('value', 18, 2)->default(0);
            $table->timestamps();
            $table->unique(['coordinator_id', 'item_id']);
        });
        Schema::create('coordinator_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coordinator_stock_id')->constrained('coordinator_stocks')->restrictOnDelete();
            $table->foreignId('supply_request_item_id')->nullable()->unique()->constrained('supply_request_items')->restrictOnDelete();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->date('date');
            $table->string('type');
            $table->integer('quantity');
            $table->decimal('unit_cost', 18, 4);
            $table->string('reference');
            $table->string('office');
            $table->string('fund_cluster')->nullable();
            $table->timestamps();
            $table->index(['coordinator_stock_id', 'date']);
        });

        foreach (['index', 'issue', 'stock-card'] as $action) {
            $permission = Permission::firstOrCreate(['name' => 'route:coordinator.inventory.'.$action, 'guard_name' => 'web']);
            Role::firstOrCreate(['name' => 'Supply Coordinator', 'guard_name' => 'web'])->givePermissionTo($permission);
        }

        // Existing releases are opening receipts, preserving their original release dates.
        DB::table('supply_requests')->where('status', 'Issued')->whereNotNull('issuance_id')
            ->orderBy('id')->each(function ($row) {
                $request = SupplyRequest::find($row->id);
                if ($request?->requester?->usesCoordinatorInventory()) {
                    app(CoordinatorInventoryService::class)->receiveRelease($request, $request->issuance?->issued_by ?: ($row->reviewed_by ?: $row->requested_by));
                }
            });
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Schema::dropIfExists('coordinator_movements');
        Schema::dropIfExists('coordinator_stocks');
    }
};
