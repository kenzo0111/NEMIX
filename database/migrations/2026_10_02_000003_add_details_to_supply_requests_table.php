<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('supply_requests')) {
            Schema::table('supply_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('supply_requests', 'recipient')) {
                    $table->string('recipient')->nullable()->after('requested_by');
                }
                if (!Schema::hasColumn('supply_requests', 'recipient_designation')) {
                    $table->string('recipient_designation')->nullable()->after('recipient');
                }
                if (!Schema::hasColumn('supply_requests', 'fund_cluster')) {
                    $table->string('fund_cluster')->nullable()->default('01')->after('recipient_designation');
                }
                if (!Schema::hasColumn('supply_requests', 'date_requested')) {
                    $table->date('date_requested')->nullable()->after('fund_cluster');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('supply_requests')) {
            Schema::table('supply_requests', function (Blueprint $table) {
                $columnsToDrop = array_filter(
                    ['recipient', 'recipient_designation', 'fund_cluster', 'date_requested'],
                    fn ($col) => Schema::hasColumn('supply_requests', $col)
                );
                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }
};
