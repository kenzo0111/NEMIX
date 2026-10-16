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
        public readonly bool $critical = false,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $severity = $this->critical ? 'Critical-stock' : 'Low-stock';
        return (new MailMessage)
            ->subject($severity.' warning: '.$this->itemName)
            ->greeting($severity.' warning')
            ->line($this->critical ? 'An inventory item requires immediate replenishment.' : 'An inventory item has reached the low-stock threshold.')
            ->line('Item: '.$this->itemName)
            ->line('SKU: '.($this->sku ?: 'N/A'))
            ->line('Current balance: '.$this->stock)
            ->line(($this->critical ? 'Critical-stock' : 'Low-stock').' threshold: '.$this->threshold)
            ->action('View inventory', route('inventory.index'));
    }
}
