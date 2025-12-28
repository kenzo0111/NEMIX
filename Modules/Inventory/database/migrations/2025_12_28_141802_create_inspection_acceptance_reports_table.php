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
        Schema::create('inspection_acceptance_reports', function (Blueprint $table) {
            $table->id();
            $table->string('entity_name')->nullable();
            $table->string('fund_cluster')->nullable();
            $table->string('supplier')->nullable();
            $table->string('iar_no')->nullable();
            $table->string('po_no')->nullable();
            $table->date('po_date')->nullable();
            $table->date('iar_date')->nullable();
            $table->string('invoice_no')->nullable();
            $table->string('requisitioning_office')->nullable();
            $table->string('responsibility_center_code')->nullable();
            $table->date('responsibility_date')->nullable();
            // Inspection
            $table->date('date_inspected')->nullable();
            $table->enum('inspection_status', ['verified', ''])->nullable();
            $table->string('inspection_officer_name')->nullable();
            $table->string('inspection_officer_position')->nullable();
            // Acceptance
            $table->date('date_received')->nullable();
            $table->enum('acceptance_status', ['complete', 'partial', ''])->nullable();
            $table->string('partial_quantity')->nullable();
            $table->string('acceptance_officer_name')->nullable();
            $table->string('acceptance_officer_position')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspection_acceptance_reports');
    }
};
