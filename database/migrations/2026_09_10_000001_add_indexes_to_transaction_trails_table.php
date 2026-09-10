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
        if (Schema::hasTable('transaction_trails')) {
            Schema::table('transaction_trails', function (Blueprint $table) {
                // Index for sorting and standalone date filtering
                $table->index('created_at', 'transaction_trails_created_at_idx');
                // Compound index for status-based summary counting and filtering
                $table->index(['status', 'created_at'], 'transaction_trails_status_created_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('transaction_trails')) {
            Schema::table('transaction_trails', function (Blueprint $table) {
                $table->dropIndex('transaction_trails_created_at_idx');
                $table->dropIndex('transaction_trails_status_created_idx');
            });
        }
    }
};
