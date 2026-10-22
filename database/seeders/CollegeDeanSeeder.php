<?php

namespace Database\Seeders;

use App\Models\DeliveryUnitHead;
use App\Models\Signatory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CollegeDeanSeeder extends Seeder
{
    // UCN College Officials directory, checked 2026-10-22:
    // https://ucn.edu.ph/UCN/main-home-page-copy/administration/the-college-officials/
    public function run(): void
    {
        $deans = [
            ['College of Agriculture and Natural Resources (CANR) - Labo Campus', 'Dr. Alvin P. Musca', 'DEAN'],
            ['College of Arts and Sciences (CAS) - Main Campus', 'Dr. Jocelyn E. Trinidad', 'DEAN'],
            ['College of Business and Public Administration (CBPA) - Main Campus', 'Dr. Gehana D. Lamug', 'DEAN'],
            ['College of Computing and Multimedia Studies (CCMS) - Main Campus', 'Dr. Daniel E. Maligat Jr.', 'DEAN'],
            ['College of Education (CoEd) - Abaño Campus', 'Dr. Edgar P. Aban', 'DEAN'],
            ['College of Engineering - Main Campus', 'Engr. Joselito A. Olalo', 'DEAN'],
            ['College of Fisheries, Aquatic Sciences, & Technology (CFAST) - Mercedes Campus', 'Anne Marie Carreon-Arevalo', 'DEAN'],
            ['College of Trades and Technology (CoTT) - Jose Panganiban Campus', 'Dr. Jerome H. Baldemoro', 'DEAN'],
            ['Graduate School (GS) - Main Campus', 'Dr. Eduardo M. Abad', 'DEAN'],
            ['Ret. Judge Antonio C. Entienza Campus', 'Dr. Fernando H. Coratchea', 'DEAN'],
        ];

        DB::transaction(function () use ($deans) {
            foreach ($deans as [$department, $name, $designation]) {
                // Reuse titled or untitled directory entries without replacing verified details.
                $bareName = preg_replace('/^(Dr\.|Engr\.)\s+/i', '', $name);
                $aliases = array_map([Signatory::class, 'normalizeName'], [$name, $bareName]);
                $head = Signatory::whereIn('normalized_name', $aliases)->orderBy('id')->first();
                if (!$head) {
                    $head = Signatory::create(['name' => mb_strtoupper($bareName, 'UTF-8'), 'designation' => $designation,
                        'department' => $department, 'office' => $department, 'is_active' => true]);
                }
                DeliveryUnitHead::firstOrCreate(['department' => $department], ['office_head_id' => $head->id]);
            }
        });
    }
}
