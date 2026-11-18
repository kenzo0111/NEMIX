<?php

namespace App\Models;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class CoordinatorMovement extends Model
{
    public function scopeForCoordinator(Builder $query, int $coordinatorId): Builder
    {
        return $query->whereHas('stock', fn (Builder $stock) => $stock->where('coordinator_id', $coordinatorId));
    }

    protected $guarded = ['id'];

    protected $casts = ['date' => 'date:Y-m-d', 'quantity' => 'integer', 'unit_cost' => 'decimal:4'];

    public static function yearMonthSequenceReference(CarbonInterface|string $date, int $sequence): string
    {
        $day = $date instanceof CarbonInterface ? $date : Carbon::parse($date);

        return sprintf('%s-%04d', $day->format('Y-m'), $sequence);
    }

    /** Convert legacy UNIT-ISSUE-{id} values without rewriting historical rows. */
    public function officialReference(): string
    {
        $reference = (string) $this->getRawOriginal('reference');
        if ($this->type === 'issue' && preg_match('/^UNIT-ISSUE-(\d+)$/iD', $reference, $matches)) {
            return self::yearMonthSequenceReference($this->date, (int) $matches[1]);
        }

        return $reference;
    }

    public function stock()
    {
        return $this->belongsTo(CoordinatorStock::class, 'coordinator_stock_id');
    }
}
