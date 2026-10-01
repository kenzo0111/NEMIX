<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('supply_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->string('recipient')->nullable();
            $table->string('recipient_designation')->nullable();
            $table->string('fund_cluster')->nullable()->default('01');
            $table->date('date_requested')->nullable();
            $table->string('department');
            $table->text('purpose');
            $table->string('status')->default('Pending')->index();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_remarks')->nullable();
            $table->string('ris_number')->nullable()->unique();
            $table->foreignId('issuance_id')->nullable()->unique()->constrained('issuances')->nullOnDelete();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();
        });

        Schema::create('supply_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supply_request_id')->constrained('supply_requests')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('approved_quantity')->nullable();
            $table->unique(['supply_request_id', 'item_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supply_request_items');
        Schema::dropIfExists('supply_requests');
    }
};
