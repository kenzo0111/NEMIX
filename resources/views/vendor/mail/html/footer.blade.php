@php
    $institutionName = 'University of Camarines Norte';

    try {
        if (class_exists(\App\Models\SystemSetting::class)) {
            $dbInstName = \App\Models\SystemSetting::get('institution.name');
            if (!empty($dbInstName)) {
                $institutionName = $dbInstName;
            }
        }
    } catch (\Throwable $e) {
        // Fallback gracefully
    }
@endphp
<tr>
<td align="center" style="padding: 0;">
<table class="footer" align="center" width="820" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; max-width: 820px; margin: 0 auto; padding: 12px 16px 20px; text-align: center;">
<tr>
<td align="center" style="padding: 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="font-size: 11px; color: #64748b; line-height: 1.5;">
        Automated message from {{ $institutionName }}. Please do not reply.
    </div>
</td>
</tr>
</table>
</td>
</tr>
