<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('supply_requests')) {
            Schema::table('supply_requests', function (Blueprint $table) {
                if (! Schema::hasColumn('supply_requests', 'request_type')) {
                    $table->string('request_type', 30)->default('requisition')->index()->after('purpose');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('supply_requests')) {
            Schema::table('supply_requests', function (Blueprint $table) {
                if (Schema::hasColumn('supply_requests', 'request_type')) {
                    $table->dropColumn('request_type');
                }
            });
        }
    }
};
