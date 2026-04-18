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
        Schema::create('compliance_reports', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('type', 50);
            $table->string('reference', 100);
            $table->string('item_name')->nullable();
            $table->string('period_type', 30)->default('specific');
            $table->date('date')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedTinyInteger('selected_month')->nullable();
            $table->unsignedSmallInteger('selected_year')->nullable();
            $table->string('coverage_label')->nullable();
            $table->json('payload')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'created_at']);
            $table->index('reference');
            $table->index('archived_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compliance_reports');
    }
};
