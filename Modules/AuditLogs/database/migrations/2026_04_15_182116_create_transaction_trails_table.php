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
        Schema::create('transaction_trails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('module')->nullable();
            $table->string('action')->nullable(); // e.g. Create, Update, Delete
            $table->string('resource_ref')->nullable(); // e.g. TRX-1001 or ID
            $table->text('details')->nullable();
            $table->string('status')->nullable(); // e.g. Verified, Logged, Flagged
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_trails');
    }
};