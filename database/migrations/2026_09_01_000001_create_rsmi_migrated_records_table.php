<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rsmi_migrated_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('migration_id')->nullable()->constrained('compliance_migration_logs')->nullOnDelete();
            $table->string('migration_batch_id')->nullable();
            $table->string('source_file')->nullable();
            $table->string('source_sheet')->nullable();
            $table->unsignedInteger('source_row')->nullable();
            $table->string('form_identifier')->nullable();
            $table->string('serial_no')->nullable();
            $table->date('date')->nullable();
            $table->string('entity_name')->nullable();
            $table->string('fund_cluster')->nullable();
            $table->string('ris_no')->nullable();
            $table->string('center_code')->nullable();
            $table->string('stock_no')->nullable();
            $table->string('item')->nullable();
            $table->string('unit')->nullable();
            $table->integer('quantity_issued')->nullable();
            $table->decimal('unit_cost', 15, 2)->nullable();
            $table->decimal('amount', 15, 2)->nullable();
            $table->json('raw_data')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rsmi_migrated_records');
    }
};
