<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Services\SupplyRequestService;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('supply_requests')) {
            return;
        }

        // Find requests without an official RIS number or with the legacy RIS-REQ format
        $requests = DB::table('supply_requests')
            ->whereNull('ris_number')
            ->orWhere('ris_number', 'like', 'RIS-REQ-%')
            ->orderBy('id', 'asc')
            ->get();

        foreach ($requests as $req) {
            $date = $req->date_requested ?? ($req->created_at ? substr($req->created_at, 0, 10) : null);
            $officialRisNo = SupplyRequestService::generateOfficialRisNumber($date);

            DB::table('supply_requests')
                ->where('id', $req->id)
                ->update(['ris_number' => $officialRisNo]);

            // If an issuance was linked and had legacy or empty ris_number, keep it in sync
            if ($req->issuance_id && Schema::hasTable('issuances')) {
                DB::table('issuances')
                    ->where('id', $req->issuance_id)
                    ->where(function ($query) {
                        $query->whereNull('ris_number')
                            ->orWhere('ris_number', 'like', 'RIS-REQ-%');
                    })
                    ->update(['ris_number' => $officialRisNo]);
            }
        }
    }

    public function down(): void
    {
        // No-op: backfilling numbers does not need reversal.
    }
};
