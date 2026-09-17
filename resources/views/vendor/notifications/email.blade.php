<x-mail::message>
{{-- Notification Title --}}
@isset($title)
<h1 class="email-title" style="font-size: 21px; font-weight: 700; color: #1e293b; margin: 0 0 20px 0; line-height: 1.35;">
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
<div style="margin-top: 20px; font-size: 13px; color: #64748b; line-height: 1.5;">
{!! nl2br(e($salutation)) !!}
</div>
@else
<div style="margin-top: 20px; font-size: 13px; color: #64748b; line-height: 1.5;">
Supply &amp; Property Management Office
</div>
@endif

{{-- Subcopy / Fallback Link --}}
@isset($actionText)
<x-slot:subcopy>
<p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0 0 6px 0;">Button not working? Copy this link into your browser:</p>
<a href="{{ $actionUrl }}" target="_blank" rel="noopener" class="subcopy-link" style="color: #64748b; font-size: 12px; line-height: 1.5; text-decoration: underline; word-break: break-all;">{{ $displayableActionUrl }}</a>
</x-slot:subcopy>
@endisset
</x-mail::message>
