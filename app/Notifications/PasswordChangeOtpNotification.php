<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

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
        $formattedOtp = implode(' ', str_split($this->otp));

        $otpBlock = new \Illuminate\Support\HtmlString(
            '<table class="otp-card" align="center" width="380" cellpadding="0" cellspacing="0" role="presentation" style="margin: 24px auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; width: 100%; max-width: 380px;">' .
            '<tr><td class="otp-cell" style="padding: 24px 20px; text-align: center;">' .
            '<div class="otp-label" style="font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Your Verification Code</div>' .
            '<div class="otp-code" style="font-family: \'SFMono-Regular\', Consolas, \'Liberation Mono\', Menlo, Courier, monospace, sans-serif; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #800000; line-height: 1.2; margin: 10px 0;">' . e($formattedOtp) . '</div>' .
            '<div class="otp-note" style="font-size: 13px; color: #64748b; margin-top: 8px;">This single-use code expires in ' . (int)$this->expiresInMinutes . ' minutes.</div>' .
            '</td></tr></table>'
        );

        $securityNotice = new \Illuminate\Support\HtmlString(
            '<table class="notice notice-security callout callout-security" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="notice-cell notice-security callout-cell callout-security" style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #dc2626; border-radius: 6px; padding: 12px 18px; font-size: 14px; color: #991b1b; line-height: 1.5;">Never share this code. If you did not request a password change, contact your system administrator.</td></tr></table>'
        );

        $mail = (new MailMessage)
            ->subject('Your password verification code');

        $mail->viewData['title'] = 'Password Verification Code';

        return $mail
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Use this code to confirm your password change.')
            ->line($otpBlock)
            ->line($securityNotice);
    }
}
