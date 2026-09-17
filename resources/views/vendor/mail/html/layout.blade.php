<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<title>{{ config('app.name') }}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style type="text/css">
@media only screen and (max-width: 620px) {
    .wrapper {
        padding: 12px 0 20px !important;
    }
    .inner-body {
        width: 100% !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
    }
    .footer {
        width: 100% !important;
        padding: 16px 12px !important;
    }
    .content-cell {
        padding: 24px 18px !important;
    }
    .header {
        border-radius: 0 !important;
        padding: 14px 18px !important;
    }
    .otp-code {
        font-size: 26px !important;
        letter-spacing: 5px !important;
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
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

<table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc; width: 100%; margin: 0; padding: 24px 0 36px;">
<tr>
<td align="center" style="padding: 0;">
<table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; margin: 0; padding: 0;">

<!-- Email Card -->
<tr>
<td class="body" width="100%" cellpadding="0" cellspacing="0" align="center" style="border: hidden !important; padding: 0 12px;">
<table class="inner-body" align="center" width="600" cellpadding="0" cellspacing="0" role="presentation" style="width: 600px; max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">

{!! $header ?? '' !!}

<!-- Body content -->
<tr>
<td class="content-cell" style="padding: 32px 36px 28px; text-align: left;">
{!! Illuminate\Mail\Markdown::parse($slot) !!}

{!! $subcopy ?? '' !!}
</td>
</tr>
</table>
</td>
</tr>

{!! $footer ?? '' !!}
</table>
</td>
</tr>
</table>
</body>
</html>
