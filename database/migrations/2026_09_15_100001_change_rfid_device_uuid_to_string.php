<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE rfid_devices ALTER COLUMN device_uuid TYPE VARCHAR(100)');
        } else {
            Schema::table('rfid_devices', function (Blueprint $table) {
                // ESP32 identifiers use the RFID-HH-XXXXXX format, not RFC 4122 UUIDs.
                $table->string('device_uuid', 100)->change();
            });
        }
    }

    public function down(): void
    {
        // Deliberately retain the string type. Converting RFID-HH-* identifiers
        // back to PostgreSQL UUID would fail and could destroy device identities.
    }
};
