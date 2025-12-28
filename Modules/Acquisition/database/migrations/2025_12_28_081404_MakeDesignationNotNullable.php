<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update any null designations to empty string
        DB::table('purchase_orders')->whereNull('designation')->update(['designation' => '']);

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->string('designation')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->string('designation')->nullable()->change();
        });
    }
};
