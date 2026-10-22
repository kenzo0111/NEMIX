<?php

use App\Models\DeliveryUnitHead;
use App\Models\Signatory;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Signatory::whereIn('id', DeliveryUnitHead::query()->select('office_head_id'))->each(function (Signatory $head) {
            $name = preg_replace('/^(?:(?:Dr|Engr)\.?\s+)+/iu', '', trim($head->name));
            $head->update(['name' => mb_strtoupper($name, 'UTF-8'), 'designation' => 'DEAN']);
        });
    }

    public function down(): void
    {
        // Original capitalization and titles cannot be inferred safely.
    }
};
