<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;

class SupplyRequestItem extends Model
{
    protected $fillable = ['supply_request_id', 'item_id', 'quantity', 'approved_quantity'];
    protected $casts = ['quantity' => 'integer', 'approved_quantity' => 'integer'];

    public function request() { return $this->belongsTo(SupplyRequest::class, 'supply_request_id'); }
    public function item() { return $this->belongsTo(Item::class); }
}
