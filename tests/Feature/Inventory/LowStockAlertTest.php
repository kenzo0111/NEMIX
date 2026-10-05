<?php

namespace Tests\Feature\Inventory;

use App\Models\SystemSetting;
use App\Models\User;
use App\Notifications\LowStockNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\Item;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LowStockAlertTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh', ['--force' => true])->run();
    }

    private function item(): Item
    {
        return Item::create([
            'name' => 'Copy Paper', 'sku' => 'PAPER-LOW', 'stock' => 20,
            'unit_cost' => 5, 'amount' => 100, 'status' => 'Available',
        ]);
    }

    public function test_threshold_crossing_sends_once_until_stock_recovers(): void
    {
        Notification::fake();
        SystemSetting::set('inventory.low_stock_threshold', 10);
        SystemSetting::set('mail.low_stock_email_alerts', true);
        SystemSetting::set('mail.alert_recipient_email', 'alerts@example.com');
        $item = $this->item();

        $item->update(['stock' => 10]);
        Notification::assertSentOnDemand(LowStockNotification::class, 1);
        $item->update(['stock' => 8]);
        Notification::assertSentOnDemand(LowStockNotification::class, 1);
        $item->update(['stock' => 20]);
        $item->update(['stock' => 9]);
        Notification::assertSentOnDemand(LowStockNotification::class, 2);
    }

    public function test_disabled_alerts_send_nothing(): void
    {
        Notification::fake();
        SystemSetting::set('inventory.low_stock_threshold', 10);
        SystemSetting::set('mail.low_stock_email_alerts', false);
        SystemSetting::set('mail.alert_recipient_email', 'alerts@example.com');

        $this->item()->update(['stock' => 10]);
        Notification::assertNothingSent();
    }

    public function test_blank_recipient_uses_active_system_administrator(): void
    {
        Notification::fake();
        SystemSetting::set('inventory.low_stock_threshold', 10);
        SystemSetting::set('mail.low_stock_email_alerts', true);
        SystemSetting::set('mail.alert_recipient_email', '');
        Role::firstOrCreate(['name' => 'System Admin', 'guard_name' => 'web']);
        $admin = User::factory()->create(['is_active' => true]);
        $admin->assignRole('System Admin');

        $this->item()->update(['stock' => 10]);
        Notification::assertSentOnDemand(LowStockNotification::class, function ($notification, $channels, $notifiable) use ($admin) {
            return $notifiable->routes['mail'] === $admin->email && $notification->stock === 10;
        });
    }

    public function test_rolled_back_stock_change_sends_no_email(): void
    {
        Notification::fake();
        SystemSetting::set('inventory.low_stock_threshold', 10);
        SystemSetting::set('mail.low_stock_email_alerts', true);
        SystemSetting::set('mail.alert_recipient_email', 'alerts@example.com');
        $item = $this->item();

        DB::beginTransaction();
        $item->update(['stock' => 10]);
        DB::rollBack();

        Notification::assertNothingSent();
        $this->assertSame(20, $item->fresh()->stock);
    }
}
