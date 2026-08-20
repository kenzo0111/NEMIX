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
        Schema::create('stock_card_migrated_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('migration_id')
                ->nullable()
                ->constrained('compliance_migration_logs')
                ->nullOnDelete();
            $table->string('migration_batch_id')->nullable();
            $table->string('source_file')->nullable();
            $table->string('source_sheet')->nullable();
            $table->unsignedInteger('source_row')->nullable();
            $table->string('form_identifier')->nullable();
            $table->string('stock_no')->nullable();
            $table->string('item')->nullable();
            $table->string('unit')->nullable();
            $table->date('date')->nullable();
            $table->string('reference_no')->nullable();
            $table->integer('receipt_quantity')->nullable();
            $table->integer('issue_quantity')->nullable();
            $table->integer('balance')->nullable();
            $table->decimal('unit_cost', 15, 2)->nullable();
            $table->decimal('total_cost', 15, 2)->nullable();
            $table->string('supplier_source')->nullable();
            $table->string('office_end_user')->nullable();
            $table->text('remarks')->nullable();
            $table->json('raw_data')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_card_migrated_records');
    }
};
