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
        // 1. receivings table: item_id and supplier_id -> restrict
        if (Schema::hasTable('receivings')) {
            Schema::table('receivings', function (Blueprint $table) {
                try {
                    $table->dropForeign(['item_id']);
                } catch (\Throwable $e) {
                }
                try {
                    $table->dropForeign(['supplier_id']);
                } catch (\Throwable $e) {
                }
            });

            Schema::table('receivings', function (Blueprint $table) {
                $table->foreign('item_id')->references('id')->on('items')->onDelete('restrict');
                $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('restrict');
            });
        }

        // 2. issuances table: item_id and issued_by -> restrict
        if (Schema::hasTable('issuances')) {
            Schema::table('issuances', function (Blueprint $table) {
                try {
                    $table->dropForeign(['item_id']);
                } catch (\Throwable $e) {
                }
                try {
                    $table->dropForeign(['issued_by']);
                } catch (\Throwable $e) {
                }
            });

            Schema::table('issuances', function (Blueprint $table) {
                $table->foreign('item_id')->references('id')->on('items')->onDelete('restrict');
                $table->foreign('issued_by')->references('id')->on('users')->onDelete('restrict');
            });
        }

        // 3. issuance_items table: item_id -> restrict
        if (Schema::hasTable('issuance_items')) {
            Schema::table('issuance_items', function (Blueprint $table) {
                try {
                    $table->dropForeign(['item_id']);
                } catch (\Throwable $e) {
                }
            });

            Schema::table('issuance_items', function (Blueprint $table) {
                $table->foreign('item_id')->references('id')->on('items')->onDelete('restrict');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('issuance_items')) {
            Schema::table('issuance_items', function (Blueprint $table) {
                try {
                    $table->dropForeign(['item_id']);
                } catch (\Throwable $e) {
                }
            });
            Schema::table('issuance_items', function (Blueprint $table) {
                $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
            });
        }

        if (Schema::hasTable('issuances')) {
            Schema::table('issuances', function (Blueprint $table) {
                try {
                    $table->dropForeign(['item_id']);
                } catch (\Throwable $e) {
                }
                try {
                    $table->dropForeign(['issued_by']);
                } catch (\Throwable $e) {
                }
            });
            Schema::table('issuances', function (Blueprint $table) {
                $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
                $table->foreign('issued_by')->references('id')->on('users')->onDelete('cascade');
            });
        }

        if (Schema::hasTable('receivings')) {
            Schema::table('receivings', function (Blueprint $table) {
                try {
                    $table->dropForeign(['item_id']);
                } catch (\Throwable $e) {
                }
                try {
                    $table->dropForeign(['supplier_id']);
                } catch (\Throwable $e) {
                }
            });
            Schema::table('receivings', function (Blueprint $table) {
                $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
                $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('cascade');
            });
        }
    }
};
