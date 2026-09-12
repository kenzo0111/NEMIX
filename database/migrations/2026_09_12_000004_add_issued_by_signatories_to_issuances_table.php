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
        if (Schema::hasTable('issuances')) {
            Schema::table('issuances', function (Blueprint $table) {
                if (!Schema::hasColumn('issuances', 'issued_by_name')) {
                    $table->string('issued_by_name')->nullable()->after('approved_by_designation');
                }
                if (!Schema::hasColumn('issuances', 'issued_by_position')) {
                    $table->string('issued_by_position')->nullable()->after('issued_by_name');
                }
                if (!Schema::hasColumn('issuances', 'snapshot')) {
                    $table->json('snapshot')->nullable()->after('issued_by_position');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('issuances')) {
            Schema::table('issuances', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('issuances', 'issued_by_name')) {
                    $columns[] = 'issued_by_name';
                }
                if (Schema::hasColumn('issuances', 'issued_by_position')) {
                    $columns[] = 'issued_by_position';
                }
                if (Schema::hasColumn('issuances', 'snapshot')) {
                    $columns[] = 'snapshot';
                }
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
