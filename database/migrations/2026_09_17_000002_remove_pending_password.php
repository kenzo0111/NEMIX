<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Invalidate old requests and erase their recoverable password material.
        DB::table('password_change_requests')->where('is_used', false)->update(['is_used' => true]);
        Schema::table('password_change_requests', fn (Blueprint $table) => $table->dropColumn('pending_password'));
    }

    public function down(): void
    {
        Schema::table('password_change_requests', fn (Blueprint $table) => $table->text('pending_password')->nullable());
    }
};
