<?php

namespace Modules\Inventory\Services;

use Modules\Inventory\Models\Item;

class InventoryDuplicateDetectionService
{
    /**
     * Normalizes a string for comparison.
     */
    protected function normalize(string $text): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', $text)));
    }

    /**
     * Checks if a candidate item is a duplicate of an existing Item Master.
     * Checks canonical identity attributes:
     * 1. Exact SKU / Stock Number match
     * 2. Exact match of normalized (name + unit_of_issue + description)
     *
     * Note: Does NOT check supplier or price!
     */
    public function findDuplicate(array $attributes, ?int $excludeId = null): ?Item
    {
        $name = trim($attributes['name'] ?? '');
        $sku = trim($attributes['sku'] ?? '');
        $unit = trim($attributes['unit_of_issue'] ?? '');
        $description = trim($attributes['description'] ?? '');

        if ($name === '') {
            return null;
        }

        // 1. Direct SKU match if provided
        if ($sku !== '') {
            $query = Item::where('sku', $sku);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }
            $existingSkuItem = $query->first();
            if ($existingSkuItem) {
                return $existingSkuItem;
            }
        }

        // 2. Canonical identity comparison (Name + Unit + Description)
        $query = Item::query();
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $normalizedTargetName = $this->normalize($name);
        $normalizedTargetUnit = $this->normalize($unit);
        $normalizedTargetDesc = $this->normalize($description);

        // Fetch candidate matches with matching normalized name
        $candidates = $query->whereRaw('LOWER(TRIM(name)) = ?', [$normalizedTargetName])->get();

        foreach ($candidates as $candidate) {
            $candUnit = $this->normalize((string) ($candidate->unit_of_issue ?? ''));
            $candDesc = $this->normalize((string) ($candidate->description ?? ''));

            // Unit matches if either is empty or both are identical
            $unitMatches = ($normalizedTargetUnit === '' || $candUnit === '' || $normalizedTargetUnit === $candUnit);

            // Description matches if either is empty or both are identical
            $descMatches = ($normalizedTargetDesc === '' || $candDesc === '' || $normalizedTargetDesc === $candDesc);

            if ($unitMatches && $descMatches) {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * Comprehensive duplicate check returning structured result.
     */
    public function checkDuplicate(array $attributes, ?int $excludeId = null): array
    {
        $existing = $this->findDuplicate($attributes, $excludeId);

        if ($existing) {
            return [
                'is_duplicate' => true,
                'reason' => 'exact_match',
                'existing_item' => $existing,
                'message' => $this->buildDuplicateMessage($existing),
            ];
        }

        return [
            'is_duplicate' => false,
            'reason' => null,
            'existing_item' => null,
            'message' => null,
        ];
    }

    /**
     * Constructs the official duplicate warning message.
     */
    public function buildDuplicateMessage(Item $existing): string
    {
        $unit = $existing->unit_of_issue ?: 'units';
        $stock = $existing->stock;
        $sku = $existing->sku ?: 'N/A';

        return "A matching inventory item already exists: \"{$existing->name}\" (Stock No.: {$sku}). Current Stock: {$stock} {$unit}. Additional stock from another supplier or at another unit cost must be recorded through the Receiving module.";
    }
}
