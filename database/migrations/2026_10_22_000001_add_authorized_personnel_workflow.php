<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supply_requests', function (Blueprint $table) {
            $table->boolean('requires_supporting_document')->default(false);
            $table->string('supporting_document_type')->nullable();
            $table->string('supporting_document_path')->nullable();
            $table->string('supporting_document_name')->nullable();
            $table->string('supporting_document_mime')->nullable();
            $table->foreignId('document_verified_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('document_verified_at')->nullable();
            $table->text('document_verification_remarks')->nullable();
        });

        $role = Role::firstOrCreate(['name' => 'Authorized Personnel', 'guard_name' => 'web']);
        $coordinator = Role::where('name', 'Supply Coordinator')->where('guard_name', 'web')->first();
        if ($coordinator) {
            $role->givePermissionTo($coordinator->permissions);
        }
        foreach (['document', 'verify-document', 'ready'] as $action) {
            $permission = Permission::firstOrCreate(['name' => 'route:inventory.requests.'.$action, 'guard_name' => 'web']);
            if ($action === 'document') {
                $role->givePermissionTo($permission);
            }
            Role::where('name', 'Property Custodian')->where('guard_name', 'web')->first()?->givePermissionTo($permission);
        }
        foreach (['index', 'read'] as $action) {
            $role->givePermissionTo(Permission::firstOrCreate(['name' => 'route:inventory.request-alerts.'.$action, 'guard_name' => 'web']));
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Schema::table('supply_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('document_verified_by');
            $table->dropColumn(['requires_supporting_document', 'supporting_document_type', 'supporting_document_path', 'supporting_document_name', 'supporting_document_mime', 'document_verified_at', 'document_verification_remarks']);
        });
        // Preserve roles assigned to real users and their private files.
    }
};
