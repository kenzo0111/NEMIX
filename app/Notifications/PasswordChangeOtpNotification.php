<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

class PasswordChangeOtpNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $otp,
        public readonly int $expiresInMinutes = 5
    ) {
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
        $digits = str_split($this->otp);
        $tds = '';
        foreach ($digits as $digit) {
            $tds .= '<td align="center" valign="middle" class="otp-box" style="width: 46px; height: 52px; background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 700; color: #111827; text-align: center; vertical-align: middle;">' . e($digit) . '</td>';
        }

        $otpTable = new HtmlString(
            '<table align="center" cellpadding="0" cellspacing="0" border="0" role="presentation" class="otp-card" style="margin: 22px auto; border-collapse: separate; border-spacing: 8px;">' .
            '<tr>' . $tds . '</tr>' .
            '</table>'
        );

        $clockIconUrl = \App\Services\MailAssetService::url('images/mail/icon-clock.png');

        $expirationNotice = new HtmlString(
            '<table class="notice notice-expiration callout callout-expiration" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 20px 0; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; width: 100%;">' .
            '<tr><td class="notice-cell notice-expiration callout-cell callout-expiration" style="padding: 12px 16px; vertical-align: middle;">' .
            '<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; margin: 0;"><tr>' .
            '<td style="width: 20px; vertical-align: middle; padding-right: 10px;"><img src="' . $clockIconUrl . '" width="16" height="16" alt="Clock" style="width: 16px; height: 16px; display: block; border: 0;"></td>' .
            '<td style="vertical-align: middle; font-size: 13px; font-weight: 500; color: #991b1b; line-height: 1.4;">This code will expire in ' . (int)$this->expiresInMinutes . ' minutes.</td>' .
            '</tr></table>' .
            '</td></tr></table>'
        );

        $mail = (new MailMessage)
            ->subject('[UCN SPMO] Password Change Verification');

        $mail->viewData['title'] = 'Password Change Verification Code';
        $mail->viewData['icon'] = 'shield';

        return $mail
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Use the verification code below to proceed with your password change.')
            ->line($otpTable)
            ->line($expirationNotice)
            ->line('If you did not request this code, you may safely ignore this email.')
            ->line('For your security, do not share this code with anyone.');
    }
}
