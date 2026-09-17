@props([
    'url',
    'color' => 'primary',
    'align' => 'center',
])
<table class="action" align="{{ $align }}" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 24px auto; padding: 0; text-align: {{ $align }}; width: 100%;">
<tr>
<td align="{{ $align }}">
<table border="0" cellpadding="0" cellspacing="0" role="presentation" align="{{ $align }}" style="margin: 0 auto;">
<tr>
<td align="center">
    <a href="{{ $url }}" class="button button-{{ $color }}" target="_blank" rel="noopener" style="box-sizing: border-box; display: inline-block; background-color: #8B0000; border: 1px solid #8B0000; border-radius: 6px; color: #ffffff !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; line-height: 1.2; padding: 12px 22px; text-decoration: none !important; text-align: center; -webkit-text-size-adjust: none;">
        {!! $slot !!}
    </a>
</td>
</tr>
</table>
</td>
</tr>
</table>
