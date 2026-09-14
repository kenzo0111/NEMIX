<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();
        $rpciSettings = [
            [
                'category' => 'signatories',
                'key' => 'signatories.rpci_certified_by_name',
                'value' => json_encode(''),
                'data_type' => 'string',
                'label' => 'RPCI Certified Correct By - Name',
                'description' => 'Name of the Inventory Committee Chair or certifying signatory on the Report on Physical Count of Inventories.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.rpci_certified_by_position',
                'value' => json_encode('Inventory Committee Chair and Members'),
                'data_type' => 'string',
                'label' => 'RPCI Certified Correct By - Designation',
                'description' => 'Designation of the certifying committee on the Report on Physical Count of Inventories.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.rpci_verified_by_name',
                'value' => json_encode(''),
                'data_type' => 'string',
                'label' => 'RPCI Verified By - Name',
                'description' => 'Name of the COA representative or verifying official on the Report on Physical Count of Inventories.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.rpci_verified_by_position',
                'value' => json_encode('COA Representative'),
                'data_type' => 'string',
                'label' => 'RPCI Verified By - Designation',
                'description' => 'Designation of the verifying official on the Report on Physical Count of Inventories.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
        ];

        foreach ($rpciSettings as $s) {
            $exists = DB::table('system_settings')->where('key', $s['key'])->exists();
            if (! $exists) {
                $s['created_at'] = $now;
                $s['updated_at'] = $now;
                DB::table('system_settings')->insert($s);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('system_settings')->whereIn('key', [
            'signatories.rpci_certified_by_name',
            'signatories.rpci_certified_by_position',
            'signatories.rpci_verified_by_name',
            'signatories.rpci_verified_by_position',
        ])->delete();
    }
};
