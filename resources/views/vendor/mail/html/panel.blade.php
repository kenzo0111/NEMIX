<table class="panel" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 20px 0; width: 100%; border-collapse: separate;">
<tr>
<td class="panel-content" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #9B111E; border-radius: 6px; padding: 14px 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; margin: 0;">
<tr>
<td class="panel-item" style="padding: 0; font-size: 14px; line-height: 1.55; color: #374151;">
{!! Illuminate\Mail\Markdown::parse($slot) !!}
</td>
</tr>
</table>
</td>
</tr>
</table>
