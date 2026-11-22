<?php

namespace Modules\Inventory\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemPreOrder extends Model
{
    protected $fillable = [
        'item_id',
        'user_id',
        'delivery_unit',
        'quantity_requested',
        'urgency',
        'purpose',
        'status',
        'notified_at',
        'fulfilled_at',
    ];

    protected $casts = [
        'quantity_requested' => 'integer',
        'notified_at' => 'datetime',
        'fulfilled_at' => 'datetime',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeUrgent(Builder $query): Builder
    {
        return $query->where('urgency', 'urgent');
    }
}
