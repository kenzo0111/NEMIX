<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<title>{{ config('app.name') }}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style type="text/css">
@media only screen and (max-width: 600px) {
    .wrapper {
        padding: 0 0 16px !important;
    }
    .content,
    .inner-body,
    .header,
    .footer {
        width: 100% !important;
        max-width: 100% !important;
    }
    .inner-body {
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
    }
    .content-cell {
        padding: 22px 18px !important;
    }
    .header {
        border-radius: 0 !important;
        padding: 14px 18px !important;
    }
    .otp-card {
        width: 100% !important;
        max-width: 100% !important;
    }
    .otp-code {
        font-size: 26px !important;
        letter-spacing: 5px !important;
    }
    .event-label {
        width: auto !important;
        display: block !important;
        padding-bottom: 2px !important;
    }
    .event-value {
        display: block !important;
        padding-bottom: 8px !important;
    }
}

@media only screen and (max-width: 500px) {
    .button {
        width: 100% !important;
        box-sizing: border-box !important;
        display: block !important;
        text-align: center !important;
        padding: 12px 16px !important;
    }
}
</style>
{!! $head ?? '' !!}
</head>
<body style="margin: 0; padding: 0; background-color: #f6f7f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

<table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f6f7f9; width: 100%; margin: 0; padding: 16px 0 24px;">
<tr>
<td align="center" style="padding: 0 8px;">
<!--[if (gte mso 9)|(IE)]>
<table width="820" align="center" cellpadding="0" cellspacing="0" border="0" role="presentation">
<tr>
<td>
<![endif]-->
<table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; max-width: 820px; margin: 0 auto; padding: 0;">

<!-- Email Card -->
<tr>
<td class="body" width="100%" cellpadding="0" cellspacing="0" align="center" style="border: hidden !important; padding: 0;">
<table class="inner-body" align="center" width="820" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; max-width: 820px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 0 auto;">

{!! $header ?? '' !!}

<!-- Body content -->
<tr>
<td class="content-cell" style="padding: 28px 32px; text-align: left;">
{!! Illuminate\Mail\Markdown::parse($slot) !!}

{!! $subcopy ?? '' !!}
</td>
</tr>
</table>
</td>
</tr>

{!! $footer ?? '' !!}
</table>
<!--[if (gte mso 9)|(IE)]>
</td>
</tr>
</table>
<![endif]-->
</td>
</tr>
</table>
</body>
</html>
