<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
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
        $registrationUrl = url(route('register.invitation', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        return (new MailMessage)
            ->subject('Complete Your Staff Registration')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('You have been invited to join the Supply and Property Management Office system.')
            ->line('Complete your registration by setting your password through the link below.')
            ->action('Complete Registration', $registrationUrl)
            ->line('This registration link will expire in 60 minutes.')
            ->line('If you were not expecting this invitation, you can safely ignore this email.');
    }
}
