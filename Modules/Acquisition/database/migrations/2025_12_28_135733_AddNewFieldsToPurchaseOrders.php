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
            $table->boolean('job_order')->default(false)->after('fund_cluster');
            $table->boolean('contract_agreement')->default(false)->after('job_order');
            $table->boolean('purchase_order')->default(false)->after('contract_agreement');
            $table->string('place_of_delivery')->nullable()->after('supplier');
            $table->date('date_of_delivery')->nullable()->after('place_of_delivery');
            $table->string('delivery_term')->nullable()->after('date_of_delivery');
            $table->string('payment_term')->nullable()->after('delivery_term');
            $table->string('delivery_status')->default('Pending')->after('payment_term');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn(['job_order', 'contract_agreement', 'purchase_order', 'place_of_delivery', 'date_of_delivery', 'delivery_term', 'payment_term', 'delivery_status']);
        });
    }
};
