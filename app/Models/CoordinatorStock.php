<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoordinatorStock extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['quantity' => 'integer', 'value' => 'decimal:2'];

    public function movements()
    {
        return $this->hasMany(CoordinatorMovement::class);
    }
}
