@props([
    'url',
    'color' => 'primary',
    'align' => 'left',
])
@php
    $bgColor = match ($color) {
        'success' => '#16a34a',
        'error' => '#dc2626',
        default => '#9B111E',
    };
@endphp
<table class="action" align="{{ $align }}" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 22px 0; padding: 0; text-align: {{ $align }}; width: 100%;">
<tr>
<td align="{{ $align }}" style="text-align: {{ $align }};">
<table border="0" cellpadding="0" cellspacing="0" role="presentation" align="{{ $align }}" style="margin: 0; border-collapse: separate;">
<tr>
<td align="center" style="background-color: {{ $bgColor }}; border-radius: 5px; mso-padding-alt: 0;">
    <a href="{{ $url }}" class="button button-{{ $color }}" target="_blank" rel="noopener" style="box-sizing: border-box; display: inline-block; background-color: {{ $bgColor }}; border: 1px solid {{ $bgColor }}; border-radius: 5px; color: #ffffff !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; line-height: 1.2; padding: 12px 22px; text-decoration: none !important; text-align: center; -webkit-text-size-adjust: none;">
        {{ $slot }}
    </a>
</td>
</tr>
</table>
</td>
</tr>
</table>
