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
        if (Schema::hasTable('items') && !Schema::hasColumn('items', 'created_by')) {
            Schema::table('items', function (Blueprint $table) {
                $table->foreignId('created_by')->nullable()->after('rfid_tag')->constrained('users')->nullOnDelete();
            });
        }

        if (Schema::hasTable('receivings') && !Schema::hasColumn('receivings', 'created_by')) {
            Schema::table('receivings', function (Blueprint $table) {
                $table->foreignId('created_by')->nullable()->after('date_received')->constrained('users')->nullOnDelete();
            });
        }

        if (Schema::hasTable('suppliers') && !Schema::hasColumn('suppliers', 'created_by')) {
            Schema::table('suppliers', function (Blueprint $table) {
                $table->foreignId('created_by')->nullable()->after('amount')->constrained('users')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('items') && Schema::hasColumn('items', 'created_by')) {
            Schema::table('items', function (Blueprint $table) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            });
        }

        if (Schema::hasTable('receivings') && Schema::hasColumn('receivings', 'created_by')) {
            Schema::table('receivings', function (Blueprint $table) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            });
        }

        if (Schema::hasTable('suppliers') && Schema::hasColumn('suppliers', 'created_by')) {
            Schema::table('suppliers', function (Blueprint $table) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            });
        }
    }
};
