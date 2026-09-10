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
        Schema::table('login_trails', function (Blueprint $table) {
            $table->index('created_at', 'login_trails_created_at_index');
            $table->index('status', 'login_trails_status_index');
            $table->index('ip_address', 'login_trails_ip_address_index');
            $table->index('email', 'login_trails_email_index');
            $table->index(['created_at', 'status'], 'login_trails_created_at_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('login_trails', function (Blueprint $table) {
            $table->dropIndex('login_trails_created_at_index');
            $table->dropIndex('login_trails_status_index');
            $table->dropIndex('login_trails_ip_address_index');
            $table->dropIndex('login_trails_email_index');
            $table->dropIndex('login_trails_created_at_status_index');
        });
    }
};
