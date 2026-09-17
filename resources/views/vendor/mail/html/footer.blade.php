@php
    $institutionName = 'University of Camarines Norte';
    $officeName = 'Supply & Property Management Office';

    try {
        if (class_exists(\App\Models\SystemSetting::class)) {
            $dbInstName = \App\Models\SystemSetting::get('institution.name');
            if (!empty($dbInstName)) {
                $institutionName = $dbInstName;
            }
            $dbOffice = \App\Models\SystemSetting::get('institution.custodial_office');
            if (!empty($dbOffice)) {
                $officeName = $dbOffice;
            }
        }
    } catch (\Throwable $e) {
        // Fallback gracefully
    }
@endphp
<tr>
<td align="center" style="padding: 0;">
<table class="footer" align="center" width="820" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; max-width: 820px; margin: 0 auto; padding: 24px 16px 32px; text-align: center;">
<tr>
<td class="content-cell" align="center" style="padding: 16px 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="font-size: 13px; font-weight: 700; color: #475569; margin: 0 0 2px 0;">
        {{ $officeName }}
    </div>
    <div style="font-size: 12px; color: #64748b; margin: 0 0 8px 0;">
        {{ $institutionName }}
    </div>
    <div style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0 0 4px 0;">
        This is an automated system notification. Please do not reply directly to this email.
    </div>
    <div style="font-size: 11px; color: #cbd5e1; margin-top: 6px;">
        &copy; {{ date('Y') }} {{ $institutionName }}. All rights reserved.
    </div>
</td>
</tr>
</table>
</td>
</tr>
