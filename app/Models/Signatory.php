<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Signatory extends Model
{
    use HasFactory;

    protected $table = 'signatories';

    protected $fillable = [
        'name',
        'normalized_name',
        'designation',
        'office',
        'department',
        'employee_no',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Normalize a name string for duplicate detection.
     * Lowercases, strips punctuation, trims, and collapses multiple whitespaces.
     */
    public static function normalizeName(string $name): string
    {
        $normalized = mb_strtolower(trim($name), 'UTF-8');
        $normalized = preg_replace('/[.,]/u', '', $normalized);
        $normalized = preg_replace('/\s+/u', ' ', $normalized);

        return trim($normalized);
    }

    protected static function booted(): void
    {
        static::saving(function (Signatory $signatory) {
            if ($signatory->name) {
                $signatory->normalized_name = static::normalizeName($signatory->name);
            }
        });
    }

    /**
     * Delivery unit head mapping if assigned to a college or department.
     */
    public function deliveryUnitHead(): HasOne
    {
        return $this->hasOne(DeliveryUnitHead::class, 'office_head_id');
    }

    /**
     * Scope query to only active signatories.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope query to exclude college deans and delivery unit heads,
     * keeping only institutional signatories added for system settings.
     */
    public function scopeExcludeDeans(Builder $query): Builder
    {
        return $query->whereDoesntHave('deliveryUnitHead')
            ->whereRaw('LOWER(designation) NOT LIKE ?', ['%dean%']);
    }
}
