<x-mail::message>
{{-- Notification Title --}}
@isset($title)
<h1 class="email-title" style="font-size: 22px; font-weight: 700; color: #800000; margin: 0 0 16px 0; line-height: 1.3;">
{{ $title }}
</h1>
@endisset

{{-- Greeting --}}
@if (! empty($greeting))
<p class="greeting" style="font-size: 15px; font-weight: 600; color: #1e293b; margin: 0 0 16px 0;">
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
?>
<x-mail::button :url="$actionUrl" :color="$color">
{{ $actionText }}
</x-mail::button>
@endisset

{{-- Outro Lines --}}
@foreach ($outroLines as $line)
{!! $line !!}

@endforeach

{{-- Salutation --}}
@if (! empty($salutation))
<div style="margin-top: 24px; font-size: 14px; color: #475569; line-height: 1.5;">
{!! nl2br(e($salutation)) !!}
</div>
@else
<div style="margin-top: 24px; font-size: 14px; color: #475569; line-height: 1.5;">
Regards,<br>
<strong>Supply & Property Management Office</strong><br>
University of Camarines Norte
</div>
@endif

{{-- Subcopy / Fallback Link --}}
@isset($actionText)
<x-slot:subcopy>
<p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0 0 6px 0;">
    Having trouble with the button? Copy and paste the following link into your browser:
</p>
<div class="subcopy-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-top: 6px; word-break: break-all;">
    <a href="{{ $actionUrl }}" target="_blank" rel="noopener" class="subcopy-link" style="color: #475569; font-size: 12px; line-height: 1.5; text-decoration: underline; word-break: break-all;">{{ $displayableActionUrl }}</a>
</div>
</x-slot:subcopy>
@endisset
</x-mail::message>
