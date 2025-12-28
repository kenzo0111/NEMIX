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
        Schema::create('property_acknowledgement_receipt_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_acknowledgement_receipt_id')->constrained('property_acknowledgement_receipts')->onDelete('cascade');
            $table->integer('quantity')->nullable();
            $table->string('unit')->nullable();
            $table->text('description')->nullable();
            $table->string('property_number')->nullable();
            $table->date('date_acquired')->nullable();
            $table->decimal('amount', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_acknowledgement_receipt_items');
    }
};
