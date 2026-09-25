<?php

namespace App\Providers;

use App\Listeners\LogAuthenticationActivity;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Mail\Markdown;
use App\Models\User;
use App\Services\AccessControl\PermissionResolver;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->environment('production') || config('app.force_https', false)) {
            URL::forceScheme('https');
        }

        Gate::before(function (User $user, string $ability) {
            if ($user->isSystemAdmin()) {
                return true;
            }

            if (PermissionResolver::hasPermission($user, $ability)) {
                return true;
            }

            return null;
        });

        Event::subscribe(LogAuthenticationActivity::class);

        app(Markdown::class)->theme('ucn');

        Password::defaults(function () {
            $rule = Password::min(12);

            return app()->environment('testing')
                ? $rule
                : $rule->mixedCase()->numbers()->symbols()->uncompromised();
        });

        ResetPassword::toMailUsing(function (object $notifiable, string $token): MailMessage {
            $resetUrl = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            $expirationNotice = new \Illuminate\Support\HtmlString(
                '<table class="notice notice-expiration callout callout-expiration" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 20px 0; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; width: 100%;">' .
                '<tr><td class="notice-cell notice-expiration callout-cell callout-expiration" style="padding: 12px 16px; vertical-align: middle;">' .
                '<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; margin: 0;"><tr>' .
                '<td style="width: 20px; vertical-align: middle; padding-right: 10px;"><img src="' . \App\Services\MailAssetService::url('images/mail/icon-clock.png') . '" width="16" height="16" alt="Clock" style="width: 16px; height: 16px; display: block; border: 0;"></td>' .
                '<td style="vertical-align: middle; font-size: 13px; font-weight: 500; color: #991b1b; line-height: 1.4;">This password reset link will expire in 60 minutes.</td>' .
                '</tr></table>' .
                '</td></tr></table>'
            );

            $mail = (new MailMessage)
                ->subject('[UCN SPMO] Password Reset Request');

            $mail->viewData['title'] = 'Password Reset Request';
            $mail->viewData['icon'] = 'lock';

            return $mail
                ->greeting('Hello '.$notifiable->name.',')
                ->line('We received a request to reset the password associated with your UCN SPMO account.')
                ->action('Reset My Password', $resetUrl)
                ->line($expirationNotice)
                ->line('If you did not request a password reset, you may safely ignore this email. Your password will remain unchanged.')
                ->line('For your security, do not forward or share this email or reset link with anyone.');
        });

        VerifyEmail::toMailUsing(function (object $notifiable, string $url): MailMessage {
            $mail = (new MailMessage)
                ->subject('[UCN SPMO] Verify Email Address');

            $mail->viewData['title'] = 'Verify Your Email Address';

            return $mail
                ->greeting('Hello '.$notifiable->name.',')
                ->line('Verify your email address to finish setting up your account.')
                ->action('Verify Email Address', $url)
                ->line('This link expires in 60 minutes. If you did not request it, you can ignore this email.');
        });

        Vite::prefetch(concurrency: 3);
    }
}
