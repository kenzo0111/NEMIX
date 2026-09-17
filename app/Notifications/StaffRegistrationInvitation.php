<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

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

        $mail = (new MailMessage)
            ->subject('[SPMO System] Staff Account Invitation');

        $mail->viewData['title'] = 'Staff Account Invitation';

        return $mail
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('You have been authorized and invited to register your account for the UCN Supply & Property Management Office System.')
            ->action('Accept Invitation', $registrationUrl)
            ->line(new \Illuminate\Support\HtmlString('<table class="callout callout-warning" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="callout-cell callout-warning" style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #ca8a04; border-radius: 6px; padding: 12px 16px; font-size: 14px; color: #92400e; line-height: 1.5;"><strong>Notice:</strong> This invitation link will expire in 60 minutes.</td></tr></table>'))
            ->line('If you were not expecting this invitation, you may safely ignore this email.')
            ->salutation("Supply & Property Management Office\nUniversity of Camarines Norte");
    }
}