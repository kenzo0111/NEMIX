<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('system_configurations', function (Blueprint $table) {
            $table->id();
            $table->string('active_mode')->default('LIVE PRODUCTION');
            $table->string('previous_mode')->nullable();
            $table->string('status')->default('OPERATIONAL');
            $table->string('environment')->default('Production Database (Primary)');
            $table->string('server_node')->default('PH-MNL-PRM01');
            $table->integer('ping_ms')->default(12);
            $table->string('security_status')->default('256-BIT TLS (STRICT ENFORCED)');
            $table->foreignId('changed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('changed_at')->nullable();
            $table->string('change_reason')->nullable();
            $table->timestamps();
        });

        // Seed initial system configuration record
        DB::table('system_configurations')->insert([
            'active_mode' => 'LIVE PRODUCTION',
            'previous_mode' => null,
            'status' => 'OPERATIONAL',
            'environment' => 'Production Database (Primary)',
            'server_node' => 'PH-MNL-PRM01',
            'ping_ms' => 12,
            'security_status' => '256-BIT TLS (STRICT ENFORCED)',
            'changed_by_user_id' => null,
            'changed_at' => now(),
            'change_reason' => 'Initial System Initialization',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_configurations');
    }
};
