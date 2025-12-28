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
        Schema::create('requisition_issue_slips', function (Blueprint $table) {
            $table->id();
            $table->string('entity_name')->nullable();
            $table->string('fund_cluster')->nullable();
            $table->string('division')->nullable();
            $table->string('responsibility_center_code')->nullable();
            $table->string('office')->nullable();
            $table->string('ris_no')->nullable();
            $table->text('purpose')->nullable();
            // Requested by
            $table->string('requested_by_name')->nullable();
            $table->string('requested_by_designation')->nullable();
            $table->date('requested_by_date')->nullable();
            // Approved by
            $table->string('approved_by_name')->nullable();
            $table->string('approved_by_designation')->nullable();
            $table->date('approved_by_date')->nullable();
            // Issued by
            $table->string('issued_by_name')->nullable();
            $table->string('issued_by_designation')->nullable();
            $table->date('issued_by_date')->nullable();
            // Received by
            $table->string('received_by_name')->nullable();
            $table->string('received_by_designation')->nullable();
            $table->date('received_by_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requisition_issue_slips');
    }
};
