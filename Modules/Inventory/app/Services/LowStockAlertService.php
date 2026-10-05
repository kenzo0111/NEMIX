<?php

namespace Modules\Inventory\Services;

use App\Models\SystemSetting;
use App\Models\User;
use App\Notifications\LowStockNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Modules\Inventory\Models\Item;

class LowStockAlertService
{
    public function scheduleIfThresholdCrossed(Item $item, int $previousStock, int $currentStock): void
    {
        $threshold = (int) SystemSetting::get('inventory.low_stock_threshold', 10);
        if ($previousStock <= $threshold || $currentStock > $threshold ||
            ! (bool) SystemSetting::get('mail.low_stock_email_alerts', true)) {
            return;
        }

        $recipient = trim((string) SystemSetting::get('mail.alert_recipient_email', ''));
        if ($recipient === '') {
            $currentUser = auth()->user();
            $recipient = $currentUser?->is_active && $currentUser->isSystemAdmin()
                ? (string) $currentUser->email
                : (string) (User::query()->where('is_active', true)
                    ->whereHas('roles', fn ($query) => $query->whereIn('name', ['System Admin', 'System Administrator']))
                    ->orderBy('id')->value('email') ?? '');
        }

        if ($recipient === '') {
            Log::warning('Low-stock alert has no configured recipient or active system administrator.', ['item_id' => $item->id]);
            return;
        }

        $itemId = $item->id;
        $itemName = $item->name;
        $sku = $item->sku;
        DB::afterCommit(function () use ($recipient, $itemId, $itemName, $sku, $currentStock, $threshold): void {
            try {
                Notification::route('mail', $recipient)
                    ->notify(new LowStockNotification($itemName, $sku, $currentStock, $threshold));
            } catch (\Throwable $exception) {
                Log::error('Low-stock email delivery failed.', [
                    'item_id' => $itemId,
                    'exception' => $exception->getMessage(),
                ]);
            }
        });
    }
}
