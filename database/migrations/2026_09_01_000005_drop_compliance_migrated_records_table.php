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
        Schema::dropIfExists('compliance_migrated_records');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('compliance_migrated_records', function (Blueprint $table) {
            $table->id();
            $table->string('form_type', 50);
            $table->string('source', 100)->nullable();
            $table->string('reference', 100)->nullable();
            $table->string('item_name')->nullable();
            $table->unsignedInteger('quantity')->nullable();
            $table->string('recipient')->nullable();
            $table->string('department')->nullable();
            $table->string('designation')->nullable();
            $table->text('remarks')->nullable();
            $table->date('date')->nullable();
            $table->string('status', 30)->default('migrated');
            $table->json('payload')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['form_type', 'reference']);
            $table->index('status');
        });
    }
};
