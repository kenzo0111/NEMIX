@props(['url'])
@php
    $institutionName = 'University of Camarines Norte';
    $officeName = 'Supply & Property Management Office';
    $logoUrl = asset('images/ucnlogo.png');

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
            $dbLogo = \App\Models\SystemSetting::get('institution.logo_path');
            if (!empty($dbLogo)) {
                $logoUrl = filter_var($dbLogo, FILTER_VALIDATE_URL) ? $dbLogo : asset(ltrim($dbLogo, '/'));
            }
        }
    } catch (\Throwable $e) {
        // Fallback gracefully
    }
@endphp
<tr>
<td class="header" style="background-color: #ffffff; border-top: 3px solid #800000; border-bottom: 1px solid #e2e8f0; border-radius: 8px 8px 0 0; padding: 20px 34px; text-align: left;">
    <table cellpadding="0" cellspacing="0" border="0" align="left" style="margin: 0; width: 100%;">
        <tr>
            <td style="width: 52px; vertical-align: middle; padding-right: 18px;">
                <a href="{{ $url ?? config('app.url') }}" target="_blank" style="display: block; text-decoration: none;">
                    <img src="{{ $logoUrl }}" class="logo" alt="UCN Logo" width="52" style="width: 52px; max-width: 52px; height: auto; display: block; border: 0;">
                </a>
            </td>
            <td style="vertical-align: middle; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <div class="header-institution" style="font-size: 16px; font-weight: 700; color: #1e293b; line-height: 1.3; margin: 0; letter-spacing: -0.01em;">
                    {{ $institutionName }}
                </div>
                <div class="header-office" style="margin-top: 3px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #800000; line-height: 1.25;">
                    {{ $officeName }}
                </div>
            </td>
        </tr>
    </table>
</td>
</tr>