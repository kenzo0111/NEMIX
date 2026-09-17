<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

class DiagnosticTestNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $successPanel = new HtmlString(
            '<table class="notice notice-success callout callout-success" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 20px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; width: 100%;">' .
            '<tr><td class="notice-cell notice-success callout-cell callout-success" style="padding: 14px 18px; vertical-align: middle;">' .
            '<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; margin: 0;"><tr>' .
            '<td style="width: 24px; vertical-align: top; padding-right: 12px; padding-top: 2px;"><img src="https://ucn-nemix.com/images/mail/icon-check.png" width="18" height="18" alt="Success" style="width: 18px; height: 18px; display: block; border: 0;"></td>' .
            '<td style="vertical-align: middle; line-height: 1.45;">' .
            '<div style="font-size: 14px; font-weight: 700; color: #166534; margin-bottom: 3px;">Email sent successfully.</div>' .
            '<div style="font-size: 13px; color: #166534;">This confirms that your SMTP configuration is working as intended.</div>' .
            '</td>' .
            '</tr></table>' .
            '</td></tr></table>'
        );

        $mail = (new MailMessage)
            ->subject('[UCN SPMO] SMTP Configuration Test');

        $mail->viewData['title'] = 'SMTP Configuration Test';
        $mail->viewData['icon'] = 'paperplane';

        return $mail
            ->greeting('Hello,')
            ->line('This is a test email from the UCN Supply & Property Management Office System.')
            ->line('If you received this message successfully, the configured outgoing mail service is functioning correctly.')
            ->line($successPanel)
            ->line('You may ignore this message once verified.');
    }
}
