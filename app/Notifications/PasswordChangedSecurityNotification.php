<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordChangedSecurityNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly ?string $ipAddress = null)
    {
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $timeStr = now()->timezone(config('app.timezone', 'Asia/Manila'))->format('F d, Y \a\t h:i A');

        $mail = (new MailMessage)
            ->subject('[SPMO Security] Account Password Changed Successfully')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('This is a security alert from the UCN Supply and Property Management Office (SPMO) System.')
            ->line("The password for your SPMO account ({$notifiable->email}) was successfully updated on {$timeStr}.");

        if ($this->ipAddress) {
            $mail->line("Request originated from IP Address: {$this->ipAddress}");
        }

        return $mail
            ->line('If you made this change, no further action is required.')
            ->line('If you did NOT authorize this change, please immediately contact your System Administrator to secure your account.')
            ->salutation("This is an automated security notice from the UCN SPMO System. Please do not reply directly to this email.\n\nSupply & Property Management Office (SPMO)");
    }
}
