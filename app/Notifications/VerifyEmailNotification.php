<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends Notification
{
    use Queueable;

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
        $verificationUrl = $this->verificationUrl($notifiable);

        $mail = (new MailMessage)
            ->subject('[SPMO System] Automated Email Verification Request');

        $mail->viewData['title'] = 'Verify Your Email Address';

        return $mail
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('This is an automated notification from the UCN Supply and Property Management Office (SPMO) System.')
            ->line('Please verify your email address to complete your account setup.')
            ->action('Verify Email Address', $verificationUrl)
            ->line(new \Illuminate\Support\HtmlString('<table class="callout callout-info" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="callout-cell callout-info" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; border-radius: 6px; padding: 12px 16px; font-size: 14px; color: #1e40af; line-height: 1.5;"><strong>Notice:</strong> For security purposes, this verification link will expire in 60 minutes.</td></tr></table>'))
            ->line('If you did not request this verification or believe it was sent in error, please disregard this email.')
            ->salutation("Supply & Property Management Office (SPMO)\nUniversity of Camarines Norte");
    }

    /**
     * Get the verification URL for the given notifiable.
     */
    protected function verificationUrl(object $notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }
}
