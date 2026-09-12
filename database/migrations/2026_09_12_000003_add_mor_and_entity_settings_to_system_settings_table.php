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
        $morSettings = [
            [
                'category' => 'institution',
                'key' => 'institution.default_fund_cluster',
                'value' => json_encode('01 - Regular Agency Fund'),
                'data_type' => 'string',
                'label' => 'Default Fund Cluster',
                'description' => 'Default government accounting fund cluster applied across compliance reports and forms.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.mor_issued_by_name',
                'value' => json_encode('ARSENIO GEM A. GARCILLANOSA'),
                'data_type' => 'string',
                'label' => 'MOR Issuing / Releasing Officer Name',
                'description' => 'Property Custodian or Supply Officer issuing equipment on Memorandum Receipt (MOR/MR) forms.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.mor_issued_by_designation',
                'value' => json_encode('SUPPLY OFFICER III / PROPERTY CUSTODIAN'),
                'data_type' => 'string',
                'label' => 'MOR Issuing Officer Designation',
                'description' => 'Official position of the supply/property officer releasing property under MOR.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.mor_issued_by_office',
                'value' => json_encode('Supply & Property Management Office (SPMO)'),
                'data_type' => 'string',
                'label' => 'MOR Custodial / Issuing Office',
                'description' => 'Default administrative office in custody of property issued on Memorandum Receipt.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'numbering',
                'key' => 'numbering.mor_prefix',
                'value' => json_encode('MR-'),
                'data_type' => 'string',
                'label' => 'Memorandum Receipt (MOR / MR) Prefix',
                'description' => 'Prefix code for generated Memorandum Receipt documents.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'compliance',
                'key' => 'compliance.mor_appendix_number',
                'value' => json_encode('Appendix 59-A'),
                'data_type' => 'string',
                'label' => 'MOR Form Appendix Number',
                'description' => 'Official COA appendix header printed on Memorandum Receipt for Property forms.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
        ];

        foreach ($morSettings as $s) {
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
            'institution.default_fund_cluster',
            'signatories.mor_issued_by_name',
            'signatories.mor_issued_by_designation',
            'signatories.mor_issued_by_office',
            'numbering.mor_prefix',
            'compliance.mor_appendix_number',
        ])->delete();
    }
};
