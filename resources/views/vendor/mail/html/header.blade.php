@props(['url'])
@php
    $institutionName = 'University of Camarines Norte';
    $officeName = 'SUPPLY & PROPERTY MANAGEMENT OFFICE';
    $fallbackLogoUrl = \App\Services\MailAssetService::url('images/ucnlogo.png');
    $logoUrl = $fallbackLogoUrl;

    try {
        if (class_exists(\App\Models\SystemSetting::class)) {
            $dbInstName = \App\Models\SystemSetting::get('institution.name');
            if (!empty($dbInstName)) {
                $institutionName = $dbInstName;
            }
            $dbOffice = \App\Models\SystemSetting::get('institution.custodial_office');
            if (!empty($dbOffice)) {
                $officeName = strtoupper($dbOffice);
            }
            $dbLogo = \App\Models\SystemSetting::get('institution.logo_path');
            if (!empty($dbLogo)) {
                if (filter_var($dbLogo, FILTER_VALIDATE_URL)) {
                    $parsed = parse_url($dbLogo);
                    $scheme = strtolower($parsed['scheme'] ?? '');
                    $host = strtolower($parsed['host'] ?? '');
                    if ($scheme === 'https' && !in_array($host, ['localhost', '127.0.0.1', '::1', '0.0.0.0'])) {
                        $logoUrl = $dbLogo;
                    } elseif (in_array($host, ['localhost', '127.0.0.1', '::1', '0.0.0.0']) && !empty($parsed['path'])) {
                        $logoUrl = \App\Services\MailAssetService::url($parsed['path']);
                    } else {
                        $logoUrl = $fallbackLogoUrl;
                    }
                } else {
                    $cleanPath = ltrim($dbLogo, '/');
                    if ($cleanPath === 'images/ucn-crest.png' || empty($cleanPath)) {
                        $cleanPath = 'images/ucnlogo.png';
                    }
                    $logoUrl = \App\Services\MailAssetService::url($cleanPath);
                }
            }
        }
    } catch (\Throwable $e) {
        $logoUrl = $fallbackLogoUrl;
    }

    if (!str_starts_with($logoUrl, 'https://')) {
        $logoUrl = $fallbackLogoUrl;
    }

    $headerLinkUrl = $url ?? \App\Services\MailAssetService::baseUrl();
    if (in_array(parse_url((string) $headerLinkUrl, PHP_URL_HOST), ['localhost', '127.0.0.1', '::1', '0.0.0.0'])) {
        $headerLinkUrl = \App\Services\MailAssetService::baseUrl();
    }
@endphp
<tr>
<td class="header" style="background-color: #ffffff; border-top: 3px solid #9B111E; border-bottom: 1px solid #f1f5f9; padding: 22px 32px; text-align: left;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="width: 100%; margin: 0;">
        <tr>
            <td class="header-left" style="vertical-align: middle; text-align: left;">
                <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 0;">
                    <tr>
                        <td style="width: 54px; vertical-align: middle; padding-right: 16px;">
                            <a href="{{ $headerLinkUrl }}" target="_blank" rel="noopener" style="display: block; text-decoration: none;">
                                <img src="{{ $logoUrl }}" class="logo" alt="University of Camarines Norte" width="52" style="width: 52px; max-width: 52px; height: auto; display: block; border: 0;">
                            </a>
                        </td>
                        <td style="vertical-align: middle; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                            <div class="header-institution" style="font-size: 16px; font-weight: 700; color: #9B111E; line-height: 1.25; margin: 0; letter-spacing: -0.01em;">
                                {{ $institutionName }}
                            </div>
                            <div class="header-office" style="margin-top: 3px; font-size: 11px; font-weight: 600; color: #6b7280; line-height: 1.3; text-transform: uppercase; letter-spacing: 0.06em;">
                                {{ $officeName }}
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
            <td class="header-values" align="right" style="vertical-align: middle; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; white-space: nowrap; padding-left: 16px;">
                <div style="font-size: 11px; font-weight: 500; color: #94a3b8; line-height: 1.35;">
                    Reliable<br>Accountable<br>Service-Driven
                </div>
            </td>
        </tr>
    </table>
</td>
</tr>
