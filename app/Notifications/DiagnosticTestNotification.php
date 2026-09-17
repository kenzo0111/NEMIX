<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DiagnosticTestNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('[SPMO System] SMTP Configuration Test');

        $mail->viewData['title'] = 'SMTP Configuration Test';

        return $mail
            ->greeting('Hello Administrator,')
            ->line('This is an automated diagnostic test message from the UCN Supply & Property Management Office (SPMO) System.')
            ->line(new \Illuminate\Support\HtmlString('<table class="notice notice-success callout callout-success" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="notice-cell notice-success callout-cell callout-success" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 6px; padding: 12px 18px; font-size: 14px; color: #166534; line-height: 1.5;"><strong>Status: Operational</strong> &mdash; Your outgoing mail service is connected and delivering notifications successfully.</td></tr></table>'))
            ->line('The notification layout utilizes the official UCN institutional design system (expanded 820px desktop width, balanced responsive styling, and institutional branding).')
            ->salutation("Supply & Property Management Office\nUniversity of Camarines Norte");
    }
}
