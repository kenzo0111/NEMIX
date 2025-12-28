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
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->string('entity_name')->nullable();
            $table->string('fund_cluster')->nullable();
            $table->string('pr_no')->nullable();
            $table->string('responsibility_center_code')->nullable();
            $table->date('date')->nullable();
            $table->text('purpose')->nullable();
            $table->string('requested_by')->nullable();
            $table->string('requested_designation')->nullable();
            $table->string('approved_by')->nullable();
            $table->string('approved_designation')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_requests');
    }
};
