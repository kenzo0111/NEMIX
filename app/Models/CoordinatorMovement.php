<?php

namespace App\Models;

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

    public function stock()
    {
        return $this->belongsTo(CoordinatorStock::class, 'coordinator_stock_id');
    }
}
