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
        Schema::table('issuances', function (Blueprint $table) {
            if (!Schema::hasColumn('issuances', 'department')) {
                $table->string('department')->nullable()->after('recipient');
            }
            if (!Schema::hasColumn('issuances', 'fund_cluster')) {
                $table->string('fund_cluster')->nullable()->after('department');
            }
            if (!Schema::hasColumn('issuances', 'recipient_designation')) {
                $table->string('recipient_designation')->nullable()->after('fund_cluster');
            }
            if (!Schema::hasColumn('issuances', 'purpose')) {
                $table->text('purpose')->nullable()->after('recipient_designation');
            }
            if (!Schema::hasColumn('issuances', 'approved_by')) {
                $table->string('approved_by')->nullable()->after('purpose');
            }
            if (!Schema::hasColumn('issuances', 'approved_by_designation')) {
                $table->string('approved_by_designation')->nullable()->after('approved_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('issuances', function (Blueprint $table) {
            $table->dropColumn([
                'department',
                'fund_cluster',
                'recipient_designation',
                'purpose',
                'approved_by',
                'approved_by_designation',
            ]);
        });
    }
};