<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

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
        $timeStr = now()->timezone(config('app.timezone', 'Asia/Manila'))->format('F d, Y, h:i A (T)');

        $rows = '<tr>' .
                '<td class="event-label" style="padding: 10px 16px 10px 0; font-weight: 600; color: #64748b; font-size: 13px; width: 140px; vertical-align: middle;">' .
                '<table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>' .
                '<td style="width: 18px; padding-right: 8px; vertical-align: middle;"><img src="https://ucn-nemix.com/images/mail/icon-calendar.png" width="14" height="14" alt="" style="display: block; border: 0;"></td>' .
                '<td style="vertical-align: middle; color: #64748b; font-size: 13px; font-weight: 600;">Date &amp; Time</td>' .
                '</tr></table>' .
                '</td>' .
                '<td class="event-value" style="padding: 10px 0; color: #111827; font-size: 13px; font-weight: 500; vertical-align: middle;">' . e($timeStr) . '</td>' .
                '</tr>';

        if ($this->ipAddress) {
            $rows .= '<tr>' .
                    '<td class="event-label" style="padding: 10px 16px 10px 0; font-weight: 600; color: #64748b; font-size: 13px; width: 140px; vertical-align: middle;">' .
                    '<table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>' .
                    '<td style="width: 18px; padding-right: 8px; vertical-align: middle;"><img src="https://ucn-nemix.com/images/mail/icon-location.png" width="14" height="14" alt="" style="display: block; border: 0;"></td>' .
                    '<td style="vertical-align: middle; color: #64748b; font-size: 13px; font-weight: 600;">Originating IP</td>' .
                    '</tr></table>' .
                    '</td>' .
                    '<td class="event-value" style="padding: 10px 0; color: #111827; font-size: 13px; font-weight: 500; vertical-align: middle;">' . e($this->ipAddress) . '</td>' .
                    '</tr>';
        }

        $eventTable = new HtmlString(
            '<table class="event-table" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 20px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; width: 100%;">' .
            '<tr><td class="event-cell" style="padding: 14px 18px;">' .
            '<table width="100%" cellpadding="0" cellspacing="0" role="presentation">' . $rows . '</table>' .
            '</td></tr></table>'
        );

        $securityNotice = new HtmlString(
            '<table class="notice notice-info callout callout-info" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 20px 0; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; width: 100%;">' .
            '<tr><td class="notice-cell notice-info callout-cell callout-info" style="padding: 12px 16px; vertical-align: middle;">' .
            '<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; margin: 0;"><tr>' .
            '<td style="width: 20px; vertical-align: middle; padding-right: 10px;"><img src="https://ucn-nemix.com/images/mail/icon-info.png" width="16" height="16" alt="Info" style="width: 16px; height: 16px; display: block; border: 0;"></td>' .
            '<td style="vertical-align: middle; font-size: 13px; color: #1e40af; line-height: 1.45;">If you did not make this change, please secure your account immediately by contacting the SPMO administrator.</td>' .
            '</tr></table>' .
            '</td></tr></table>'
        );

        $mail = (new MailMessage)
            ->subject('[UCN SPMO] Password Changed');

        $mail->viewData['title'] = 'Password Changed Successfully';
        $mail->viewData['icon'] = 'check';

        return $mail
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('This is a confirmation that the password for your UCN SPMO account has been changed.')
            ->line($eventTable)
            ->line($securityNotice)
            ->line('For your security, review your account activity and ensure that your account credentials are kept confidential.');
    }
}
