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
        // 1. Items table
        if (Schema::hasTable('items')) {
            Schema::table('items', function (Blueprint $table) {
                if (!Schema::hasColumn('items', 'deleted_at')) {
                    $table->softDeletes();
                }
                $table->index('status', 'items_status_idx');
                $table->index('created_by', 'items_created_by_idx');
            });
        }

        // 2. Receivings table
        if (Schema::hasTable('receivings')) {
            Schema::table('receivings', function (Blueprint $table) {
                if (!Schema::hasColumn('receivings', 'deleted_at')) {
                    $table->softDeletes();
                }
                $table->index('date_received', 'receivings_date_received_idx');
                $table->index('created_by', 'receivings_created_by_idx');
            });
        }

        // 3. Issuances table
        if (Schema::hasTable('issuances')) {
            Schema::table('issuances', function (Blueprint $table) {
                if (!Schema::hasColumn('issuances', 'deleted_at')) {
                    $table->softDeletes();
                }
                $table->index('date_issued', 'issuances_date_issued_idx');
                $table->index('recipient', 'issuances_recipient_idx');
                $table->index('status', 'issuances_status_idx');
            });
        }

        // 4. Suppliers table
        if (Schema::hasTable('suppliers')) {
            Schema::table('suppliers', function (Blueprint $table) {
                if (!Schema::hasColumn('suppliers', 'deleted_at')) {
                    $table->softDeletes();
                }
                $table->index('status', 'suppliers_status_idx');
                $table->index('created_by', 'suppliers_created_by_idx');
            });
        }

        // 5. Transaction Trails table
        if (Schema::hasTable('transaction_trails')) {
            Schema::table('transaction_trails', function (Blueprint $table) {
                $table->index(['module', 'created_at'], 'transaction_trails_module_created_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('items')) {
            Schema::table('items', function (Blueprint $table) {
                if (Schema::hasColumn('items', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
                $table->dropIndex('items_status_idx');
                $table->dropIndex('items_created_by_idx');
            });
        }

        if (Schema::hasTable('receivings')) {
            Schema::table('receivings', function (Blueprint $table) {
                if (Schema::hasColumn('receivings', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
                $table->dropIndex('receivings_date_received_idx');
                $table->dropIndex('receivings_created_by_idx');
            });
        }

        if (Schema::hasTable('issuances')) {
            Schema::table('issuances', function (Blueprint $table) {
                if (Schema::hasColumn('issuances', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
                $table->dropIndex('issuances_date_issued_idx');
                $table->dropIndex('issuances_recipient_idx');
                $table->dropIndex('issuances_status_idx');
            });
        }

        if (Schema::hasTable('suppliers')) {
            Schema::table('suppliers', function (Blueprint $table) {
                if (Schema::hasColumn('suppliers', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
                $table->dropIndex('suppliers_status_idx');
                $table->dropIndex('suppliers_created_by_idx');
            });
        }

        if (Schema::hasTable('transaction_trails')) {
            Schema::table('transaction_trails', function (Blueprint $table) {
                $table->dropIndex('transaction_trails_module_created_idx');
            });
        }
    }
};
