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

            $mail = (new MailMessage)
                ->subject('[SPMO System] Password Reset Request');

            $mail->viewData['title'] = 'Password Reset Request';

            return $mail
                ->greeting('Hello '.$notifiable->name.',')
                ->line('We received a request to reset the password associated with your UCN Supply & Property Management Office account.')
                ->action('Reset My Password', $resetUrl)
                ->line(new \Illuminate\Support\HtmlString('<table class="notice notice-warning callout callout-warning" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="notice-cell notice-warning callout-cell callout-warning" style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #ca8a04; border-radius: 6px; padding: 12px 18px; font-size: 14px; color: #92400e; line-height: 1.5;"><strong>Notice:</strong> This password reset link will expire in 60 minutes.</td></tr></table>'))
                ->line('If you did not request a password reset, you may safely ignore this email. Your password will remain unchanged.')
                ->line('For your security, do not forward or share this email or password reset link with anyone.')
                ->salutation("Supply & Property Management Office\nUniversity of Camarines Norte");
        });

        VerifyEmail::toMailUsing(function (object $notifiable, string $url): MailMessage {
            $mail = (new MailMessage)
                ->subject('[SPMO System] Automated Email Verification Request');

            $mail->viewData['title'] = 'Verify Your Email Address';

            return $mail
                ->greeting('Hello '.$notifiable->name.',')
                ->line('This is an automated notification from the UCN Supply and Property Management Office (SPMO) System.')
                ->line('Please verify your email address to complete your account setup.')
                ->action('Verify Email Address', $url)
                ->line(new \Illuminate\Support\HtmlString('<table class="notice notice-info callout callout-info" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="notice-cell notice-info callout-cell callout-info" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; border-radius: 6px; padding: 12px 18px; font-size: 14px; color: #1e40af; line-height: 1.5;"><strong>Notice:</strong> For security purposes, this verification link will expire in 60 minutes.</td></tr></table>'))
                ->line('If you did not request this verification or believe it was sent in error, please disregard this email.')
                ->salutation("Supply & Property Management Office (SPMO)\nUniversity of Camarines Norte");
        });

        Vite::prefetch(concurrency: 3);
    }
}
