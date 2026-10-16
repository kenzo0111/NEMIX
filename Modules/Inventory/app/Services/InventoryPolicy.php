<?php

namespace Modules\Inventory\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\Item;

class InventoryPolicy
{
    public const DEFAULT_UNITS = ['piece', 'box', 'ream', 'pack', 'roll', 'bottle', 'gallon', 'liter', 'tube', 'pad', 'set'];

    public static function units(): array
    {
        return array_values(array_unique(array_filter(array_map(
            fn ($unit) => strtolower(trim((string) $unit)),
            SystemSetting::get('inventory.units_of_issue', self::DEFAULT_UNITS)
        ))));
    }

    public static function strict(): bool
    {
        return (bool) SystemSetting::get('inventory.strict_stock_enforcement', true);
    }

    public static function criticalThreshold(): int
    {
        return min((int) SystemSetting::get('inventory.critical_stock_threshold', 3), self::lowThreshold());
    }

    public static function lowThreshold(): int
    {
        return (int) SystemSetting::get('inventory.low_stock_threshold', 10);
    }

    public static function refreshStatuses(): void
    {
        // Reclassify existing stock immediately without emitting stock-movement emails.
        $critical = self::criticalThreshold();
        $low = self::lowThreshold();
        Item::query()->update(['status' => DB::raw("CASE WHEN stock <= 0 THEN 'Out of Stock' WHEN stock <= {$critical} THEN 'Critical Stock' WHEN stock <= {$low} THEN 'Low Stock' ELSE 'Available' END")]);
    }

    public static function unitRule(?string $existing = null): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) use ($existing) {
            $unit = strtolower(trim((string) $value));
            // A retired unit may stay on its existing item, but cannot be selected for a new item.
            if (!in_array($unit, self::units(), true) && ($existing === null || $unit !== strtolower(trim($existing)))) {
                $fail('Select a recognized unit of issue configured in System Settings.');
            }
        };
    }
}
