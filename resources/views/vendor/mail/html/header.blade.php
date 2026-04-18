@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block; text-decoration: none;">
    <img src="{{ asset('images/cnscrefine.png') }}" class="logo" alt="CNSC Logo">
    <div style="margin-top: 12px; font-size: 18px; font-weight: 700; color: #7f1d1d; line-height: 1.2;">{{ config('app.name') }}</div>
    <div style="margin-top: 4px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #b45309;">Supply and Property Management Office</div>
</a>
</td>
</tr>
