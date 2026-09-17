@props(['url'])
@php
    $institutionName = 'University of Camarines Norte';
    $officeName = 'Supply & Property Management Office';
    $productionBaseUrl = 'https://unc-nemix.com';
    $fallbackLogoUrl = $productionBaseUrl . '/images/ucnlogo.png';
    $logoUrl = $fallbackLogoUrl;

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
                if (filter_var($dbLogo, FILTER_VALIDATE_URL)) {
                    $parsed = parse_url($dbLogo);
                    $scheme = strtolower($parsed['scheme'] ?? '');
                    $host = strtolower($parsed['host'] ?? '');
                    if ($scheme === 'https' && !in_array($host, ['localhost', '127.0.0.1', '::1', '0.0.0.0'])) {
                        $logoUrl = $dbLogo;
                    } elseif (in_array($host, ['localhost', '127.0.0.1', '::1', '0.0.0.0']) && !empty($parsed['path'])) {
                        $logoUrl = $productionBaseUrl . '/' . ltrim($parsed['path'], '/');
                    } else {
                        $logoUrl = $fallbackLogoUrl;
                    }
                } else {
                    $cleanPath = ltrim($dbLogo, '/');
                    $appUrl = config('app.url');
                    $appHost = parse_url((string) $appUrl, PHP_URL_HOST);
                    $appScheme = parse_url((string) $appUrl, PHP_URL_SCHEME);

                    if ($appScheme === 'https' && !in_array($appHost, ['localhost', '127.0.0.1', '::1', '0.0.0.0'])) {
                        $logoUrl = rtrim($appUrl, '/') . '/' . $cleanPath;
                    } else {
                        $logoUrl = $productionBaseUrl . '/' . $cleanPath;
                    }
                }
            }
        }
    } catch (\Throwable $e) {
        $logoUrl = $fallbackLogoUrl;
    }

    if (!str_starts_with($logoUrl, 'https://')) {
        $logoUrl = $fallbackLogoUrl;
    }

    $headerLinkUrl = $url ?? $productionBaseUrl;
    if (in_array(parse_url((string) $headerLinkUrl, PHP_URL_HOST), ['localhost', '127.0.0.1', '::1', '0.0.0.0'])) {
        $headerLinkUrl = $productionBaseUrl;
    }
@endphp
<tr>
<td class="header" style="background-color: #ffffff; border-top: 3px solid #800000; border-bottom: 1px solid #e2e8f0; border-radius: 8px 8px 0 0; padding: 24px 32px; text-align: left;">
    <table cellpadding="0" cellspacing="0" border="0" align="left" style="margin: 0; width: 100%;">
        <tr>
            <td style="width: 50px; vertical-align: middle; padding-right: 18px;">
                <a href="{{ $headerLinkUrl }}" target="_blank" style="display: block; text-decoration: none;">
                    <img src="{{ $logoUrl }}" class="logo" alt="University of Camarines Norte" width="50" style="width: 50px; max-width: 50px; height: auto; display: block; border: 0;">
                </a>
            </td>
            <td style="vertical-align: middle; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <div class="header-institution" style="font-size: 15px; font-weight: 700; color: #1e293b; line-height: 1.3; letter-spacing: -0.01em; margin: 0;">
                    {{ $institutionName }}
                </div>
                <div class="header-office" style="margin-top: 3px; font-size: 11px; font-weight: 600; color: #64748b; line-height: 1.3; text-transform: uppercase; letter-spacing: 0.05em;">
                    {{ $officeName }}
                </div>
            </td>
        </tr>
    </table>
</td>
</tr>
