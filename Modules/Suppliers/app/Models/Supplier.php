<?php

namespace Modules\Suppliers\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'tin',
        'address',
        'reg_number',
        'category',
        'status',
    ];
}