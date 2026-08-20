<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('memorandum_receipt_migrated_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('migration_id')->nullable()->constrained('compliance_migration_logs')->nullOnDelete();
            $table->string('migration_batch_id')->nullable();
            $table->string('source_file')->nullable();
            $table->string('source_sheet')->nullable();
            $table->unsignedInteger('source_row')->nullable();
            $table->string('form_identifier')->nullable();
            $table->string('memorial_no')->nullable();
            $table->string('date_received')->nullable();
            $table->string('received_from')->nullable();
            $table->string('received_by')->nullable();
            $table->string('received_for')->nullable();
            $table->string('remarks')->nullable();
            $table->json('raw_data')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memorandum_receipt_migrated_records');
    }
};
