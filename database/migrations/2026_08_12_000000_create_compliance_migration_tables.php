<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
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

        Schema::create('compliance_migration_logs', function (Blueprint $table) {
            $table->id();
            $table->string('form_type', 50);
            $table->string('source', 100)->nullable();
            $table->unsignedInteger('records_count')->default(0);
            $table->string('status', 30)->default('completed');
            $table->text('message')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compliance_migration_logs');
        Schema::dropIfExists('compliance_migrated_records');
    }
};
