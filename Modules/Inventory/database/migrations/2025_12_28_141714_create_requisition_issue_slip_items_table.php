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
        Schema::create('requisition_issue_slip_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requisition_issue_slip_id')->constrained('requisition_issue_slips')->onDelete('cascade');
            $table->string('stock_no')->nullable();
            $table->string('unit')->nullable();
            $table->text('description')->nullable();
            $table->integer('quantity')->nullable();
            $table->boolean('stock_available')->default(false);
            $table->integer('issue_quantity')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requisition_issue_slip_items');
    }
};
