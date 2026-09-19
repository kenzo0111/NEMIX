<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('receivings', function (Blueprint $table) {
            // A snapshot of the item-type tag presented at receiving time.
            $table->string('scanned_rfid_tag', 100)->nullable()->index();
        });

        Schema::create('rfid_receiving_submissions', function (Blueprint $table) {
            $table->uuid('submission_key')->primary();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('payload_hash', 64);
            $table->timestamps();
        });
        Schema::create('rfid_scan_events', function (Blueprint $table) {
            $table->id();
            $table->string('tag', 100);
            $table->double('occurred_at');
            $table->timestamp('created_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rfid_scan_events');
        Schema::dropIfExists('rfid_receiving_submissions');
        Schema::table('receivings', fn (Blueprint $table) => $table->dropColumn('scanned_rfid_tag'));
    }
};
