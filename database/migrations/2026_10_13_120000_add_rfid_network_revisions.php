<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rfid_device_settings', function (Blueprint $table) {
            $table->unsignedInteger('network_version')->default(0);
        });
        DB::table('rfid_device_settings')->whereNotNull('wifi_ssid')->where('wifi_ssid', '<>', '')
            ->update(['network_version' => DB::raw('configuration_version')]);
        Schema::table('rfid_devices', function (Blueprint $table) {
            $table->string('connected_ssid', 32)->nullable();
            $table->unsignedInteger('reported_network_version')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('rfid_devices', fn (Blueprint $table) => $table->dropColumn(['connected_ssid', 'reported_network_version']));
        Schema::table('rfid_device_settings', fn (Blueprint $table) => $table->dropColumn('network_version'));
    }
};
