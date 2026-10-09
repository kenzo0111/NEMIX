<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // Earlier heartbeats stored local wall time in a UTC timestamptz column.
            // Only fix future values; new UTC heartbeats and already expired rows are safe.
            DB::statement(
                'UPDATE rfid_devices SET last_seen_at = (last_seen_at AT TIME ZONE ?) AT TIME ZONE ? WHERE last_seen_at > CURRENT_TIMESTAMP',
                ['UTC', config('app.timezone')],
            );
        }
    }

    public function down(): void
    {
        // Keep corrected historical timestamps when rolling back application code.
    }
};
