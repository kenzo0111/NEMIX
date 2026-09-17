@props([
    'url',
    'color' => 'primary',
    'align' => 'center',
])
<table class="action" align="{{ $align }}" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 26px auto; padding: 0; text-align: {{ $align }}; width: 100%;">
<tr>
<td align="{{ $align }}">
<table border="0" cellpadding="0" cellspacing="0" role="presentation" align="{{ $align }}" style="margin: 0 auto;">
<tr>
<td align="center" style="border-radius: 6px; background-color: #800000;">
    <a href="{{ $url }}" class="button button-{{ $color }}" target="_blank" rel="noopener" style="background-color: #800000; border: 12px 28px solid #800000; border-radius: 6px; color: #ffffff !important; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; line-height: 20px; min-height: 44px; text-decoration: none !important; text-align: center; -webkit-text-size-adjust: none;">
        {!! $slot !!}
    </a>
</td>
</tr>
</table>
</td>
</tr>
</table>
