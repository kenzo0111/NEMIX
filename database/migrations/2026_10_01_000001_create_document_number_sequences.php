<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_number_sequences', function (Blueprint $table) {
            $table->string('series', 80)->primary();
            $table->unsignedBigInteger('last_number')->default(0);
        });
        Schema::create('document_number_reservations', function (Blueprint $table) {
            $table->string('number', 100)->primary();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_number_reservations');
        Schema::dropIfExists('document_number_sequences');
    }
};
