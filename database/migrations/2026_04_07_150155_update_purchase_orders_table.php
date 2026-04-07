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
        Schema::table('purchase_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_orders', 'forms_header')) {
                $table->json('forms_header')->nullable();
            }
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_order_items', 'ris')) {
                $table->boolean('ris')->default(false);
                $table->boolean('par')->default(false);
                $table->boolean('ics')->default(false);
                $table->boolean('iar')->default(false);
                $table->string('ris_number')->nullable();
                $table->date('ris_date')->nullable();
                $table->string('par_number')->nullable();
                $table->date('par_date')->nullable();
                $table->string('ics_number')->nullable();
                $table->date('ics_date')->nullable();
                $table->string('iar_number')->nullable();
                $table->date('iar_date')->nullable();
                $table->json('ics_details')->nullable();
                $table->json('par_details')->nullable();
                $table->json('ris_details')->nullable();
                $table->json('iar_details')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropColumn([
                'ris', 'par', 'ics', 'iar', 
                'ris_number', 'ris_date', 'par_number', 'par_date', 
                'ics_number', 'ics_date', 'iar_number', 'iar_date', 
                'ics_details', 'par_details', 'ris_details', 'iar_details'
            ]);
        });
        
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn(['forms_header']);
        });
    }
};
