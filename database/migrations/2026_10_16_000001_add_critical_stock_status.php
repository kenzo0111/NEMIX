<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE items DROP CONSTRAINT IF EXISTS items_status_check');
            DB::statement("ALTER TABLE items ADD CONSTRAINT items_status_check CHECK (status IN ('Available', 'Low Stock', 'Critical Stock', 'Out of Stock'))");
        } else {
            Schema::table('items', fn (Blueprint $table) => $table->string('status')->default('Available')->change());
        }
        \Modules\Inventory\Services\InventoryPolicy::refreshStatuses();
    }

    public function down(): void
    {
        DB::table('items')->where('status', 'Critical Stock')->update(['status' => 'Low Stock']);
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE items DROP CONSTRAINT IF EXISTS items_status_check');
            DB::statement("ALTER TABLE items ADD CONSTRAINT items_status_check CHECK (status IN ('Available', 'Low Stock', 'Out of Stock'))");
        }
    }
};
