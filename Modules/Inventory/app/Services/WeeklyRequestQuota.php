<?php

namespace Modules\Inventory\Services;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Models\Item;

class WeeklyRequestQuota
{
    public static function week(): string
    {
        return now(config('app.timezone'))->startOfWeek(Carbon::MONDAY)->toDateString();
    }

    // The persisted user row is the quota mutex, including the first request of a week.
    // All mutations acquire it before request/item locks, so split requests serialize.
    public static function lockUser(int $userId): void
    {
        User::whereKey($userId)->lockForUpdate()->firstOrFail();
    }

    public static function usage(int $userId, ?string $week = null, ?int $exceptRequestId = null): array
    {
        return DB::table('supply_request_items as lines')
            ->join('supply_requests as requests', 'requests.id', '=', 'lines.supply_request_id')
            ->where('requests.requested_by', $userId)
            ->where('requests.quota_week_start', $week ?? self::week())
            ->whereIn('requests.status', ['Pending', 'Pending Verification', 'For Correction', 'Under Review', 'Approved', 'Ready for Pickup', 'Issued', 'Released'])
            ->when($exceptRequestId, fn ($query) => $query->where('requests.id', '<>', $exceptRequestId))
            ->groupBy('lines.item_id')
            ->selectRaw("lines.item_id, SUM(CASE WHEN requests.status IN ('Pending', 'Pending Verification', 'For Correction', 'Under Review') THEN lines.quantity ELSE COALESCE(lines.approved_quantity, 0) END) as used")
            ->pluck('used', 'lines.item_id')->map(fn ($value) => (int) $value)->all();
    }

    public static function remaining(Item $item, array $usage): int
    {
        return $item->weekly_request_limit === null ? 0 : max(0, $item->weekly_request_limit - ($usage[$item->id] ?? 0));
    }

    public static function validate(Item $item, int $quantity, array $usage, string $key): void
    {
        if ($item->weekly_request_limit === null) {
            throw ValidationException::withMessages([$key => "The weekly request limit for {$item->name} has not been configured. Contact Inventory Staff."]);
        }
        $remaining = self::remaining($item, $usage);
        if ($quantity > $remaining) {
            throw ValidationException::withMessages([$key => "You have {$remaining} {$item->unit_of_issue} remaining this request week for {$item->name} (weekly limit: {$item->weekly_request_limit})."]);
        }
    }

    public static function decorate(Item $item, array $usage, ?string $week = null): Item
    {
        $stockMaximum = SupplyRequestService::requestableQuantity($item->stock, SupplyRequestService::reservedQuantity($item->id));
        $item->setAttribute('quota_remaining', self::remaining($item, $usage));
        $item->setAttribute('max_request_quantity', min($stockMaximum, self::remaining($item, $usage)));
        $item->setAttribute('quota_week_end', Carbon::parse($week ?? self::week(), config('app.timezone'))->addWeek()->toIso8601String());

        return $item;
    }
}
