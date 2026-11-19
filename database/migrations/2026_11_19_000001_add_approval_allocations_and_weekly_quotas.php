<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->unsignedInteger('weekly_request_limit')->nullable();
        });
        Schema::table('supply_requests', function (Blueprint $table) {
            $table->timestamp('stock_allocated_at')->nullable();
            $table->date('quota_week_start')->nullable();
            $table->uuid('submission_key')->nullable();
            $table->unique(['requested_by', 'submission_key']);
            $table->index(['requested_by', 'quota_week_start', 'status'], 'request_weekly_usage');
        });
        Schema::create('request_batch_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supply_request_item_id')->constrained('supply_request_items')->restrictOnDelete();
            $table->foreignId('inventory_batch_id')->constrained('inventory_batches')->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->decimal('unit_cost', 15, 2);
            $table->decimal('amount', 15, 2);
            $table->string('state', 16)->default('allocated');
            $table->timestamps();
            $table->index(['supply_request_item_id', 'state']);
            $table->index(['inventory_batch_id', 'state']);
        });
        DB::table('supply_requests')->orderBy('id')->chunkById(200, function ($requests) {
            foreach ($requests as $request) {
                $week = Carbon::parse($request->created_at, config('app.timezone'))->startOfWeek(Carbon::MONDAY)->toDateString();
                DB::table('supply_requests')->where('id', $request->id)->update(['quota_week_start' => $week]);
            }
        });
        // Existing approvals remain legacy reservations until the explicit, rerunnable conversion command.
    }

    public function down(): void
    {
        if (DB::table('request_batch_allocations')->where('state', 'allocated')->exists()) {
            throw new RuntimeException('Restore outstanding approval allocations before rolling back this migration.');
        }
        Schema::dropIfExists('request_batch_allocations');
        Schema::table('supply_requests', function (Blueprint $table) {
            $table->dropUnique(['requested_by', 'submission_key']);
            $table->dropIndex('request_weekly_usage');
            $table->dropColumn(['stock_allocated_at', 'quota_week_start', 'submission_key']);
        });
        Schema::table('items', fn (Blueprint $table) => $table->dropColumn('weekly_request_limit'));
    }
};
