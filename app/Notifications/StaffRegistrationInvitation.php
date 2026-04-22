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
        $registrationUrl = route('register', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        return (new MailMessage)
            ->subject('Invitation: CNSC SPMO System Access')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('You have been invited to access the newly established CNSC Supply and Property Management Office system.')
            ->line('Please complete your registration using the link below.')
            ->action('Register Account', $registrationUrl)
            ->line('For security purposes, this registration link will expire in 60 minutes.')
            ->line('If you did not request this invitation or believe it was sent in error, please disregard this email.');
    }
}