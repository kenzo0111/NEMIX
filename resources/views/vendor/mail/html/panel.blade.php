<table class="panel" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 20px 0; width: 100%;">
<tr>
<td class="panel-content" style="background-color: #fefce8; border-left: 4px solid #ca8a04; border-radius: 0 6px 6px 0; padding: 14px 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td class="panel-item" style="padding: 0; font-size: 14px; line-height: 1.5; color: #854d0e;">
{!! Illuminate\Mail\Markdown::parse($slot) !!}
</td>
</tr>
</table>
</td>
</tr>
</table>
