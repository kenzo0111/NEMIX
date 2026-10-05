<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LowStockNotification extends Notification
{
    public function __construct(
        public readonly string $itemName,
        public readonly ?string $sku,
        public readonly int $stock,
        public readonly int $threshold,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Low-stock warning: '.$this->itemName)
            ->greeting('Low-stock warning')
            ->line('An inventory item has reached the low-stock threshold.')
            ->line('Item: '.$this->itemName)
            ->line('SKU: '.($this->sku ?: 'N/A'))
            ->line('Current balance: '.$this->stock)
            ->line('Low-stock threshold: '.$this->threshold)
            ->action('View inventory', route('inventory.index'));
    }
}
