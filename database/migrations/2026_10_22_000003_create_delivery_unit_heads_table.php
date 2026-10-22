<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_unit_heads', function (Blueprint $table) {
            $table->id();
            $table->string('department')->unique();
            $table->foreignId('office_head_id')->nullable()->constrained('signatories')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_unit_heads');
    }
};
