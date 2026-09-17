@php
    $institutionName = 'University of Camarines Norte';
    $officeName = 'Supply & Property Management Office';
    $productionBaseUrl = 'https://ucn-nemix.com';
    $watermarkUrl = $productionBaseUrl . '/images/mail/campus-watermark.png';

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
<td class="footer" style="background-color: #ffffff; border-top: 1px solid #f1f5f9; padding: 22px 32px; text-align: left;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="width: 100%; margin: 0;">
        <tr>
            <td class="footer-content" style="vertical-align: bottom; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <div style="font-size: 13px; font-weight: 700; color: #9B111E; line-height: 1.3;">
                    {{ $officeName }}
                </div>
                <div style="font-size: 12px; font-weight: 600; color: #374151; line-height: 1.3; margin-top: 2px;">
                    {{ $institutionName }}
                </div>
                <div style="font-size: 11px; color: #94a3b8; line-height: 1.45; margin-top: 6px;">
                    This is an automated system notification.<br>
                    Please do not reply directly to this email.
                </div>
            </td>
            <td class="footer-watermark" align="right" style="vertical-align: bottom; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; white-space: nowrap; padding-left: 16px;">
                <table cellpadding="0" cellspacing="0" border="0" align="right" role="presentation" style="margin: 0;">
                    <tr>
                        <td align="right" style="text-align: right; vertical-align: bottom;">
                            <img src="{{ $watermarkUrl }}" alt="UCN Campus" width="120" style="width: 120px; max-width: 120px; height: auto; display: block; border: 0; opacity: 0.55;">
                            <div style="font-size: 11px; font-weight: 700; color: #9B111E; opacity: 0.7; margin-top: 3px; line-height: 1.2; text-align: right;">
                                UCN <span style="font-weight: 500; font-size: 9px; color: #64748b;">Camarines Norte</span>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</td>
</tr>
