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
        Schema::create('inventory_custodian_slips', function (Blueprint $table) {
            $table->id();
            $table->string('entity_name')->nullable();
            $table->string('fund_cluster')->nullable();
            $table->string('ics_no')->nullable();
            $table->text('not_found_message')->nullable();
            // Received from
            $table->string('received_from_name')->nullable();
            $table->string('received_from_position')->nullable();
            $table->date('received_from_date')->nullable();
            // Received by
            $table->string('received_by_name')->nullable();
            $table->string('received_by_position')->nullable();
            $table->date('received_by_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_custodian_slips');
    }
};
