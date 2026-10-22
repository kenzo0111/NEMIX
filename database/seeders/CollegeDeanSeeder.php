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
            ['College of Agriculture and Natural Resources (CANR) - Labo Campus', 'Dr. Alvin P. Musca', 'Dean, College of Agriculture and Natural Resources'],
            ['College of Arts and Sciences (CAS) - Main Campus', 'Dr. Jocelyn E. Trinidad', 'Dean, College of Arts and Sciences'],
            ['College of Business and Public Administration (CBPA) - Main Campus', 'Dr. Gehana D. Lamug', 'Dean, College of Business and Public Administration'],
            ['College of Computing and Multimedia Studies (CCMS) - Main Campus', 'Dr. Daniel E. Maligat Jr.', 'Dean, College of Computing and Multimedia Studies'],
            ['College of Education (CoEd) - Abaño Campus', 'Dr. Edgar P. Aban', 'Dean, College of Education'],
            ['College of Engineering - Main Campus', 'Engr. Joselito A. Olalo', 'Dean, College of Engineering'],
            ['College of Fisheries, Aquatic Sciences, & Technology (CFAST) - Mercedes Campus', 'Anne Marie Carreon-Arevalo', 'Dean, College of Fisheries, Aquatic Sciences, and Technology'],
            ['College of Trades and Technology (CoTT) - Jose Panganiban Campus', 'Dr. Jerome H. Baldemoro', 'Dean, College of Trades and Technology'],
            ['Graduate School (GS) - Main Campus', 'Dr. Eduardo M. Abad', 'Dean, Graduate School'],
            ['Ret. Judge Antonio C. Entienza Campus', 'Dr. Fernando H. Coratchea', 'Director / Dean, Entienza Campus'],
        ];

        DB::transaction(function () use ($deans) {
            foreach ($deans as [$department, $name, $designation]) {
                // Reuse titled or untitled directory entries without replacing verified details.
                $bareName = preg_replace('/^(Dr\.|Engr\.)\s+/i', '', $name);
                $aliases = array_map([Signatory::class, 'normalizeName'], [$name, $bareName]);
                $head = Signatory::whereIn('normalized_name', $aliases)->orderBy('id')->first();
                if (!$head) {
                    $head = Signatory::create(['name' => $name, 'designation' => $designation,
                        'department' => $department, 'office' => $department, 'is_active' => true]);
                }
                DeliveryUnitHead::firstOrCreate(['department' => $department], ['office_head_id' => $head->id]);
            }
        });
    }
}
