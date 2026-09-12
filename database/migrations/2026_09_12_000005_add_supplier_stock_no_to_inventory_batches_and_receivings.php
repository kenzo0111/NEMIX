<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('inventory_batches')) {
            Schema::table('inventory_batches', function (Blueprint $table) {
                if (!Schema::hasColumn('inventory_batches', 'supplier_stock_no')) {
                    $table->string('supplier_stock_no')->nullable()->after('supplier_id');
                    $table->index('supplier_stock_no');
                }
            });
        }

        if (Schema::hasTable('receivings')) {
            Schema::table('receivings', function (Blueprint $table) {
                if (!Schema::hasColumn('receivings', 'supplier_stock_no')) {
                    $table->string('supplier_stock_no')->nullable()->after('supplier_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('receivings')) {
            Schema::table('receivings', function (Blueprint $table) {
                if (Schema::hasColumn('receivings', 'supplier_stock_no')) {
                    $table->dropColumn('supplier_stock_no');
                }
            });
        }

        if (Schema::hasTable('inventory_batches')) {
            Schema::table('inventory_batches', function (Blueprint $table) {
                if (Schema::hasColumn('inventory_batches', 'supplier_stock_no')) {
                    $table->dropIndex(['supplier_stock_no']);
                    $table->dropColumn('supplier_stock_no');
                }
            });
        }
    }
};
