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
                $table->string('audit_group_id', 120)->nullable()->index('transaction_trails_audit_group_idx');
                $table->boolean('is_parent')->default(true)->index('transaction_trails_is_parent_idx');
                $table->string('event_key', 120)->nullable()->index('transaction_trails_event_key_idx');
                $table->string('subject_type', 150)->nullable();
                $table->string('subject_id', 60)->nullable();
                $table->json('old_values')->nullable();
                $table->json('new_values')->nullable();
                $table->json('metadata')->nullable();

                // Composite index for efficient business-event pagination and filtering
                $table->index(['is_parent', 'created_at'], 'transaction_trails_parent_created_idx');
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
                $table->dropIndex('transaction_trails_audit_group_idx');
                $table->dropIndex('transaction_trails_is_parent_idx');
                $table->dropIndex('transaction_trails_event_key_idx');
                $table->dropIndex('transaction_trails_parent_created_idx');

                $table->dropColumn([
                    'audit_group_id',
                    'is_parent',
                    'event_key',
                    'subject_type',
                    'subject_id',
                    'old_values',
                    'new_values',
                    'metadata',
                ]);
            });
        }
    }
};
