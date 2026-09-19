<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('rfid_scan_events', function (Blueprint $table) {
            $table->string('device_uuid', 100)->nullable()->index()->after('tag');
            $table->string('station_id', 100)->nullable()->index()->after('device_uuid');
        });
    }

    public function down(): void
    {
        Schema::table('rfid_scan_events', function (Blueprint $table) {
            $table->dropIndex(['device_uuid']);
            $table->dropIndex(['station_id']);
            $table->dropColumn(['device_uuid', 'station_id']);
        });
    }
};
