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
        Schema::create('inventory_custodian_slip_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_custodian_slip_id')->constrained('inventory_custodian_slips')->onDelete('cascade');
            $table->integer('quantity')->nullable();
            $table->string('unit')->nullable();
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->decimal('total_cost', 10, 2)->nullable();
            $table->text('description')->nullable();
            $table->string('item_no')->nullable();
            $table->string('useful_life')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_custodian_slip_items');
    }
};
