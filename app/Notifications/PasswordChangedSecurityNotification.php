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

        $rows = '<tr><td class="event-label" style="padding: 8px 16px 8px 0; font-weight: 600; color: #64748b; font-size: 13px; width: 160px; vertical-align: top;">Date &amp; Time:</td><td class="event-value" style="padding: 8px 0; color: #1e293b; font-size: 13px; font-weight: 500; vertical-align: top;">' . e($timeStr) . '</td></tr>' .
                '<tr><td class="event-label" style="padding: 8px 16px 8px 0; font-weight: 600; color: #64748b; font-size: 13px; width: 160px; vertical-align: top;">Account Email:</td><td class="event-value" style="padding: 8px 0; color: #1e293b; font-size: 13px; font-weight: 500; vertical-align: top;">' . e($notifiable->email) . '</td></tr>';

        if ($this->ipAddress) {
            $rows .= '<tr><td class="event-label" style="padding: 8px 16px 8px 0; font-weight: 600; color: #64748b; font-size: 13px; width: 160px; vertical-align: top;">Originating IP:</td><td class="event-value" style="padding: 8px 0; color: #1e293b; font-size: 13px; font-weight: 500; vertical-align: top;">' . e($this->ipAddress) . '</td></tr>';
        }

        $eventTable = new \Illuminate\Support\HtmlString(
            '<table class="event-table" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; width: 100%;">' .
            '<tr><td class="event-cell" style="padding: 16px 20px;">' .
            '<table width="100%" cellpadding="0" cellspacing="0" role="presentation">' . $rows . '</table>' .
            '</td></tr></table>'
        );

        $securityAlert = new \Illuminate\Support\HtmlString(
            '<table class="notice notice-security callout callout-security" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="notice-cell notice-security callout-cell callout-security" style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #dc2626; border-radius: 6px; padding: 12px 18px; font-size: 14px; color: #991b1b; line-height: 1.5;">If you did not make this change, contact your system administrator immediately.</td></tr></table>'
        );

        $mail = (new MailMessage)
            ->subject('Your password was changed');

        $mail->viewData['title'] = 'Your password was changed';

        return $mail
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('The password for your account was changed.')
            ->line($eventTable)
            ->line($securityAlert);
    }
}
