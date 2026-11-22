<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('item_pre_orders')) {
            Schema::create('item_pre_orders', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('delivery_unit', 150);
                $table->unsignedInteger('quantity_requested');
                $table->string('urgency', 20)->default('normal'); // 'normal', 'urgent'
                $table->text('purpose')->nullable();
                $table->string('status', 30)->default('pending'); // 'pending', 'notified', 'fulfilled', 'cancelled'
                $table->timestamp('notified_at')->nullable();
                $table->timestamp('fulfilled_at')->nullable();
                $table->timestamps();

                $table->index(['item_id', 'status']);
                $table->index(['user_id', 'status']);
                $table->index(['delivery_unit', 'status']);
            });
        }

        // Setup permissions
        $storePerm = Permission::firstOrCreate(['name' => 'route:inventory.pre-orders.store', 'guard_name' => 'web']);
        $destroyPerm = Permission::firstOrCreate(['name' => 'route:inventory.pre-orders.destroy', 'guard_name' => 'web']);
        $indexPerm = Permission::firstOrCreate(['name' => 'route:inventory.pre-orders.index', 'guard_name' => 'web']);

        foreach (['Supply Coordinator', 'Authorized Personnel'] as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'web')->first();
            if ($role) {
                $role->givePermissionTo([$storePerm, $destroyPerm]);
            }
        }

        foreach (['Inventory Staff', 'Property Custodian', 'Property Staff'] as $staffRoleName) {
            $staffRole = Role::where('name', $staffRoleName)->where('guard_name', 'web')->first();
            if ($staffRole) {
                $staffRole->givePermissionTo($indexPerm);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_pre_orders');

        $permissions = Permission::whereIn('name', [
            'route:inventory.pre-orders.store',
            'route:inventory.pre-orders.destroy',
            'route:inventory.pre-orders.index',
        ])->where('guard_name', 'web')->get();

        foreach ($permissions as $permission) {
            $permission->delete();
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
