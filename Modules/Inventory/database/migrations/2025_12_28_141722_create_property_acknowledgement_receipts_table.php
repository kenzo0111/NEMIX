<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('property_acknowledgement_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('entity_name')->nullable();
            $table->string('fund_cluster')->nullable();
            $table->string('par_no')->nullable();
            $table->decimal('grand_total', 15, 2)->nullable();
            // Received by
            $table->string('received_by_name')->nullable();
            $table->string('received_by_position')->nullable();
            $table->date('received_date')->nullable();
            // Issued by
            $table->string('issued_by_name')->nullable();
            $table->string('issued_by_position')->nullable();
            $table->date('issued_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_acknowledgement_receipts');
    }
};
