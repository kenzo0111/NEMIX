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
            ->subject('[UCN SPMO] Staff Account Invitation');

        $mail->viewData['title'] = 'Staff Account Invitation';

        return $mail
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('You have been invited to create your Supply & Property Management Office account.')
            ->action('Accept Invitation', $registrationUrl)
            ->line('This invitation link expires in 60 minutes. If you were not expecting it, you can ignore this email.');
    }
}
