<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'is_demo_account')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_demo_account')->default(false)->after('is_active');
            });
        }

        if (! Schema::hasTable('roles') || ! Schema::hasTable('model_has_roles')) {
            return;
        }

        $demoRoleIds = DB::table('roles')
            ->whereIn('name', ['Supply Coordinator', 'Authorized Personnel'])
            ->pluck('id');

        if ($demoRoleIds->isEmpty()) {
            return;
        }

        $existingDemoUserIds = DB::table('model_has_roles')
            ->where('model_type', User::class)
            ->whereIn('role_id', $demoRoleIds)
            ->pluck('model_id');

        if ($existingDemoUserIds->isNotEmpty()) {
            DB::table('users')
                ->whereIn('id', $existingDemoUserIds)
                ->where(function ($query) {
                    $query->whereRaw('LOWER(email) LIKE ?', ['%@unc-nemix.com'])
                        ->orWhereRaw('LOWER(email) LIKE ?', ['%@example.com']);
                })
                ->update(['is_demo_account' => true]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'is_demo_account')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_demo_account');
            });
        }
    }
};
