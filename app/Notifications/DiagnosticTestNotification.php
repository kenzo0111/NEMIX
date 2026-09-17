<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DiagnosticTestNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Email delivery test');

        $mail->viewData['title'] = 'Email delivery test';

        return $mail
            ->line('This test email was delivered successfully. Outgoing email notifications are working.');
    }
}
