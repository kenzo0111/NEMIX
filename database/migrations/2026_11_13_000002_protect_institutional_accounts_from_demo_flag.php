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
            ->whereRaw('LOWER(email) LIKE ?', ['%@ucn.edu.ph'])
            ->update(['is_demo_account' => false]);
    }

    public function down(): void
    {
        // This data correction is intentionally not reversed. An institutional
        // account must never be changed back into a demo account implicitly.
    }
};
