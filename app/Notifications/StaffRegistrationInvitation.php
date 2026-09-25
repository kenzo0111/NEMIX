<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

class StaffRegistrationInvitation extends Notification
{
    use Queueable;

    public function __construct(public readonly string $token)
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
        $registrationUrl = rtrim(config('app.url'), '/') . route('register.invitation', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false);

        $clockIconUrl = \App\Services\MailAssetService::url('images/mail/icon-clock.png');

        $expirationNotice = new HtmlString(
            '<table class="notice notice-expiration callout callout-expiration" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 20px 0; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; width: 100%;">' .
            '<tr><td class="notice-cell notice-expiration callout-cell callout-expiration" style="padding: 12px 16px; vertical-align: middle;">' .
            '<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; margin: 0;"><tr>' .
            '<td style="width: 20px; vertical-align: middle; padding-right: 10px;"><img src="' . $clockIconUrl . '" width="16" height="16" alt="Clock" style="width: 16px; height: 16px; display: block; border: 0;"></td>' .
            '<td style="vertical-align: middle; font-size: 13px; font-weight: 500; color: #991b1b; line-height: 1.4;">This invitation link will expire in 60 minutes.</td>' .
            '</tr></table>' .
            '</td></tr></table>'
        );

        $mail = (new MailMessage)
            ->subject('[UCN SPMO] Staff Account Invitation');

        $mail->viewData['title'] = 'Staff Account Invitation';
        $mail->viewData['icon'] = 'user';

        return $mail
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('You have been invited to register your account for the UCN Supply & Property Management Office System.')
            ->action('Accept Invitation', $registrationUrl)
            ->line($expirationNotice)
            ->line('If you were not expecting this invitation, you may safely ignore this email.')
            ->line('For any concerns, please contact the SPMO administrator.');
    }
}
