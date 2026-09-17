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
                ->subject('Reset your password');

            $mail->viewData['title'] = 'Reset your password';

            return $mail
                ->greeting('Hello '.$notifiable->name.',')
                ->line('We received a request to reset your password.')
                ->action('Reset My Password', $resetUrl)
                ->line('This link expires in 60 minutes. If you did not request a reset, you can ignore this email.');
        });

        VerifyEmail::toMailUsing(function (object $notifiable, string $url): MailMessage {
            $mail = (new MailMessage)
                ->subject('Verify your email address');

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
