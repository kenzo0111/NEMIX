@props(['url'])
<tr>
<td class="header" style="background-color: #ffffff; border-top: 4px solid #800000; border-bottom: 1px solid #e2e8f0; border-radius: 8px 8px 0 0; padding: 18px 24px; text-align: left;">
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; width: 100%;">
        <tr>
            <td style="width: 82px; vertical-align: middle; padding-right: 14px;">
                <a href="{{ $url ?? config('app.url') }}" target="_blank" style="display: block; text-decoration: none;">
                    <img src="{{ asset('images/ucnlogo.png') }}" class="logo" alt="UCN Logo" style="width: 78px; max-width: 78px; height: auto; display: block; border: 0;">
                </a>
            </td>
            <td style="vertical-align: middle; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <div style="font-size: 15px; font-weight: 700; color: #1e293b; line-height: 1.25; margin: 0; letter-spacing: -0.01em;">
                    University of Camarines Norte
                </div>
                <div style="margin-top: 3px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #800000; line-height: 1.2;">
                    Supply & Property Management Office
                </div>
            </td>
        </tr>
    </table>
</td>
</tr>