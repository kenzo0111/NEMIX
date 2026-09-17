<x-mail::message>
@php
    $productionBaseUrl = 'https://ucn-nemix.com';
    $appUrl = config('app.url');
    $baseUrl = (parse_url((string) $appUrl, PHP_URL_SCHEME) === 'https' && !in_array(parse_url((string) $appUrl, PHP_URL_HOST), ['localhost', '127.0.0.1', '::1', '0.0.0.0']))
        ? rtrim($appUrl, '/')
        : $productionBaseUrl;

    $iconType = $icon ?? null;
    if (!$iconType) {
        $searchString = strtolower(($title ?? '') . ' ' . ($subject ?? ''));
        if (str_contains($searchString, 'reset')) {
            $iconType = 'lock';
        } elseif (str_contains($searchString, 'verification code') || str_contains($searchString, 'otp')) {
            $iconType = 'shield';
        } elseif (str_contains($searchString, 'changed') || str_contains($searchString, 'security alert')) {
            $iconType = 'check';
        } elseif (str_contains($searchString, 'verify')) {
            $iconType = 'envelope';
        } elseif (str_contains($searchString, 'invitation') || str_contains($searchString, 'invite')) {
            $iconType = 'user';
        } elseif (str_contains($searchString, 'smtp') || str_contains($searchString, 'diagnostic') || str_contains($searchString, 'delivery test')) {
            $iconType = 'paperplane';
        }
    }

    $iconConfig = match ($iconType) {
        'lock' => ['bg' => '#fee2e2', 'img' => $baseUrl . '/images/mail/icon-lock.png', 'alt' => 'Security Lock'],
        'shield', 'otp' => ['bg' => '#fee2e2', 'img' => $baseUrl . '/images/mail/icon-shield.png', 'alt' => 'Verification Shield'],
        'check', 'security', 'success' => ['bg' => '#dcfce7', 'img' => $baseUrl . '/images/mail/icon-check.png', 'alt' => 'Success'],
        'envelope', 'verify' => ['bg' => '#fee2e2', 'img' => $baseUrl . '/images/mail/icon-envelope.png', 'alt' => 'Verify Email'],
        'user', 'user-plus', 'invite', 'invitation' => ['bg' => '#fee2e2', 'img' => $baseUrl . '/images/mail/icon-user.png', 'alt' => 'Staff Invitation'],
        'paperplane', 'paper-plane', 'smtp' => ['bg' => '#dbeafe', 'img' => $baseUrl . '/images/mail/icon-paperplane.png', 'alt' => 'SMTP Test'],
        default => null,
    };
@endphp

{{-- Circular Semantic Icon --}}
@if ($iconConfig)
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 0 0 20px 0;">
    <tr>
        <td align="center" valign="middle" style="width: 48px; height: 48px; background-color: {{ $iconConfig['bg'] }}; border-radius: 50%; text-align: center; vertical-align: middle;">
            <img src="{{ $iconConfig['img'] }}" alt="{{ $iconConfig['alt'] }}" width="24" height="24" style="width: 24px; height: 24px; display: block; margin: 0 auto; border: 0;">
        </td>
    </tr>
</table>
@endif

{{-- Notification Title --}}
@isset($title)
<h1 class="email-title" style="font-size: 21px; font-weight: 700; color: #111827; margin: 0 0 16px 0; line-height: 1.35;">
{{ $title }}
</h1>
@endisset

{{-- Greeting --}}
@if (! empty($greeting))
<p class="greeting" style="font-size: 15px; font-weight: 600; color: #111827; margin: 0 0 14px 0;">
{{ $greeting }}
</p>
@endif

{{-- Intro Lines --}}
@foreach ($introLines as $line)
{!! $line !!}

@endforeach

{{-- Action Button --}}
@isset($actionText)
<?php
    $color = match ($level) {
        'success', 'error' => $level,
        default => 'primary',
    };
    $buttonLabel = str_ends_with(trim($actionText), '→') ? $actionText : ($actionText . ' →');
?>
<x-mail::button :url="$actionUrl" :color="$color">
{{ $buttonLabel }}
</x-mail::button>
@endisset

{{-- Outro Lines --}}
@foreach ($outroLines as $line)
@php
    $lineStr = is_string($line) ? trim($line) : '';
    $clockImg = $baseUrl . '/images/mail/icon-clock.png';
@endphp
@if (str_starts_with($lineStr, 'This link expires in 60 minutes.'))
<table class="notice notice-expiration callout callout-expiration" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 20px 0; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; width: 100%;">
<tr>
<td class="notice-cell notice-expiration callout-cell callout-expiration" style="padding: 12px 16px; vertical-align: middle;">
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width: 100%; margin: 0;">
        <tr>
            <td style="width: 20px; vertical-align: middle; padding-right: 10px;">
                <img src="{{ $clockImg }}" width="16" height="16" alt="Clock" style="width: 16px; height: 16px; display: block; border: 0;">
            </td>
            <td style="vertical-align: middle; font-size: 13px; font-weight: 500; color: #991b1b; line-height: 1.4;">
                This verification link will expire in 60 minutes.
            </td>
        </tr>
    </table>
</td>
</tr>
</table>
<p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 14px 0;">
If you did not create an account, you may safely ignore this email.
</p>
@else
{!! $line !!}

@endif
@endforeach

{{-- Salutation --}}
@if (! empty($salutation))
<div style="margin-top: 20px; font-size: 13px; color: #64748b; line-height: 1.5;">
{!! nl2br(e($salutation)) !!}
</div>
@endif

{{-- Subcopy / Fallback Link --}}
@isset($actionText)
<x-slot:subcopy>
<div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Having trouble with the button?</div>
<div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">Copy and paste the following link into your browser:</div>
<div class="subcopy-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px 14px; word-break: break-all;">
    <a href="{{ $actionUrl }}" target="_blank" rel="noopener" class="subcopy-link" style="color: #475569; font-size: 12px; line-height: 1.45; text-decoration: none; word-break: break-all;">{{ $displayableActionUrl }}</a>
</div>
</x-slot:subcopy>
@endisset
</x-mail::message>
