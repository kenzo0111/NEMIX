<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rfid_devices', function (Blueprint $table) {
            $table->id();
            $table->uuid('device_uuid')->unique();
            $table->string('device_name', 100);
            $table->string('device_token_hash');
            $table->string('firmware_version', 50)->nullable();
            $table->string('status', 20)->default('offline')->index();
            $table->ipAddress('ip_address')->nullable();
            $table->integer('wifi_rssi')->nullable();
            $table->unsignedBigInteger('uptime_seconds')->nullable();
            $table->boolean('scanner_ready')->default(false);
            $table->timestampTz('last_seen_at')->nullable()->index();
            $table->unsignedBigInteger('config_version')->default(1);
            $table->timestamps();
        });

        Schema::create('rfid_device_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->unique()->constrained('rfid_devices')->cascadeOnDelete();
            $table->string('wifi_ssid', 32)->nullable();
            $table->text('wifi_password_encrypted')->nullable();
            $table->string('server_url', 2048);
            $table->string('scan_mode', 30)->default('single');
            $table->unsignedTinyInteger('rf_power')->default(20);
            $table->unsignedInteger('scan_timeout')->default(3000);
            $table->unsignedInteger('heartbeat_interval')->default(30);
            $table->boolean('buzzer_enabled')->default(true);
            $table->boolean('auto_reconnect')->default(true);
            $table->unsignedBigInteger('configuration_version')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rfid_device_settings');
        Schema::dropIfExists('rfid_devices');
    }
};
