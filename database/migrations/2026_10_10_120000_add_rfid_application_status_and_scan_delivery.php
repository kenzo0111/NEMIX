<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rfid_devices', function (Blueprint $table) {
            $table->unsignedBigInteger('applied_config_version')->default(0);
            $table->string('configuration_status', 20)->default('pending');
            $table->unsignedBigInteger('configuration_status_version')->nullable();
            $table->string('configuration_message')->nullable();
            $table->timestampTz('configuration_reported_at')->nullable();
            $table->string('station_id', 100)->nullable();
        });
        Schema::table('rfid_scan_events', function (Blueprint $table) {
            $table->string('event_uuid', 32)->nullable();
            $table->unique(['device_uuid', 'event_uuid'], 'rfid_scan_delivery_unique');
        });
    }

    public function down(): void
    {
        Schema::table('rfid_scan_events', function (Blueprint $table) {
            $table->dropUnique('rfid_scan_delivery_unique');
            $table->dropColumn('event_uuid');
        });
        Schema::table('rfid_devices', function (Blueprint $table) {
            $table->dropColumn(['applied_config_version', 'configuration_status', 'configuration_status_version', 'configuration_message', 'configuration_reported_at', 'station_id']);
        });
    }
};
