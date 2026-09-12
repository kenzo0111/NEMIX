<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComplianceReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'type',
        'reference',
        'item_name',
        'period_type',
        'date',
        'start_date',
        'end_date',
        'selected_month',
        'selected_year',
        'coverage_label',
        'payload',
        'created_by',
        'archived_at',
    ];

    protected $casts = [
        'date' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'payload' => 'array',
        'archived_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getEntityNameAttribute(): ?string
    {
        return data_get($this->payload, 'entity_name')
            ?? data_get($this->payload, 'entityName')
            ?? data_get($this->payload, 'snapshot.entity_name')
            ?? data_get($this->payload, 'snapshot.entityName')
            ?? data_get($this->payload, 'dataset.entity_name')
            ?? data_get($this->payload, 'dataset.entityName');
    }

    public function getFundClusterAttribute(): ?string
    {
        return data_get($this->payload, 'fund_cluster')
            ?? data_get($this->payload, 'fundCluster')
            ?? data_get($this->payload, 'snapshot.fund_cluster')
            ?? data_get($this->payload, 'snapshot.fundCluster');
    }

    public function getSnapshotDataAttribute(): array
    {
        return data_get($this->payload, 'snapshot')
            ?? data_get($this->payload, 'dataset')
            ?? [];
    }
}
