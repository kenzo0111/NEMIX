<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'is_demo_account')) {
            return;
        }

        DB::table('users')
            ->where('is_demo_account', true)
            ->whereRaw('LOWER(email) NOT LIKE ?', ['%@unc-nemix.com'])
            ->whereRaw('LOWER(email) NOT LIKE ?', ['%@example.com'])
            ->update(['is_demo_account' => false]);
    }

    public function down(): void
    {
        // This correction is intentionally not reversed. Only explicitly
        // recognized demo-domain accounts may carry the demo flag.
    }
};
