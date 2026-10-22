<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryUnitHead extends Model
{
    protected $fillable = ['department', 'office_head_id'];

    public function officeHead()
    {
        return $this->belongsTo(Signatory::class, 'office_head_id');
    }

    public static function activeAssignments(): array
    {
        return static::query()->whereHas('officeHead', fn ($query) => $query
            ->where('is_active', true)->whereNotNull('designation')->where('designation', '!=', ''))
            ->pluck('office_head_id', 'department')->all();
    }
}
