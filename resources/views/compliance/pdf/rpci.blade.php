@extends('compliance.pdf.layout')

@section('title', 'Report on the Physical Count of Inventories (RPCI)')

@section('styles')
<style>
    @page {
        size: A4 landscape;
        margin: 8mm;
    }

    .rpci-container {
        font-family: 'DejaVu Sans', 'Times-Roman', serif;
        font-size: 8.5pt;
        line-height: 1.15;
    }

    .rpci-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 1.5px solid #000000;
    }

    .rpci-table th,
    .rpci-table td {
        border: 1px solid #000000;
        padding: 0.6mm 1mm;
        font-size: 8pt;
        vertical-align: middle;
        line-height: 1.1;
        word-wrap: break-word;
    }

    .rpci-table th {
        font-weight: bold;
        text-align: center;
        background-color: #ffffff;
        padding: 0.8mm 1mm;
    }

    .empty-row td {
        height: 4mm !important;
        min-height: 4mm !important;
        padding: 0 1mm !important;
        line-height: 1 !important;
    }

    .footer-table {
        margin-top: 1.5mm;
        width: 100%;
    }

    .footer-table td {
        width: 33.33%;
        padding: 1.5mm 2mm;
        vertical-align: top;
        font-size: 8pt;
        line-height: 1.1;
    }
</style>
@endsection

@section('content')
<div class="report-page rpci-container">
    <div class="official-header">
        <div class="official-appendix">Appendix 66</div>
        <div class="official-title">REPORT ON THE PHYSICAL COUNT OF INVENTORIES</div>
    </div>

    {{-- Subtitle / Purpose Line --}}
    <div style="text-align: center; font-size: 8.5pt; margin-bottom: 1.5mm; line-height: 1.2;">
        <div style="display: inline-block; border-bottom: 1px solid #000000; padding: 0 6px 1.5px 6px; min-width: 240px; font-weight: bold; font-size: 8.5pt; text-align: center;">
            {{ data_get($rpci, 'inventory_type') ?? data_get($rpci, 'inventoryType') ?? 'Inventory Items' }}
        </div>
        <div style="margin-top: 1px; font-size: 7.5pt; font-style: italic;">(Type of Inventory Item)</div>
        <div style="margin-top: 3px;">
            As at 
            <div style="display: inline-block; border-bottom: 1px solid #000000; padding: 0 6px 1.5px 6px; min-width: 150px; font-weight: bold; font-size: 8.5pt; text-align: center;">
                {{ data_get($rpci, 'as_at_date') ? \Carbon\Carbon::parse(data_get($rpci, 'as_at_date'))->format('F d, Y') : (data_get($rpci, 'date') ? \Carbon\Carbon::parse(data_get($rpci, 'date'))->format('F d, Y') : '') }}
            </div>
        </div>
    </div>

    {{-- Top Info Grid --}}
    <table class="form-table" style="margin-bottom: 4px;">
        <colgroup>
            <col style="width: 85px;">
            <col style="width: 280px;">
            <col>
        </colgroup>
        <tbody>
            <tr>
                <td class="form-label">Fund Cluster:</td>
                <td class="form-value">{{ data_get($rpci, 'fund_cluster') ?? data_get($rpci, 'fundCluster') ?? '01 - Regular Agency Fund' }}</td>
                <td>&nbsp;</td>
            </tr>
        </tbody>
    </table>

    {{-- Accountability Statement --}}
    <div style="margin-bottom: 6px; font-size: 8.5pt; line-height: 1.15;">
        For which <span style="border-bottom: 1px solid #000; padding: 0 4px; font-weight: bold;">{{ data_get($rpci, 'accountable_officer') ?? 'Arsenio Gem A. Garcillanosa' }}</span>, <span style="border-bottom: 1px solid #000; padding: 0 4px; font-weight: bold;">{{ data_get($rpci, 'designation') ?? 'Supply Custodian' }}</span>, <span style="border-bottom: 1px solid #000; padding: 0 4px; font-weight: bold;">{{ data_get($rpci, 'entity_name') ?? 'UNIVERSITY OF CAMARINES NORTE' }}</span> is accountable, having assumed such accountability on <span style="border-bottom: 1px solid #000; padding: 0 4px; font-weight: bold;">{{ data_get($rpci, 'date_assumption') ? \Carbon\Carbon::parse(data_get($rpci, 'date_assumption'))->format('m/d/Y') : '' }}</span>.
    </div>

    {{-- Main RPCI Table --}}
    @php
        $itemsList = $items ?? [];
        $targetRows = 6;
        $paddedItems = array_merge($itemsList, array_fill(0, max(0, $targetRows - count($itemsList)), []));

        $certifiedByName = data_get($rpci, 'certified_by_name') ?? data_get($rpci, 'signatories.certified_by.name') ?? data_get($rpci, 'committee_chair_name') ?? $certifiedByName ?? '';
        $approvedByName = data_get($rpci, 'approved_by_name') ?? data_get($rpci, 'signatories.approved_by.name') ?? data_get($rpci, 'accountable_officer') ?? $approvedByName ?? 'ARSENIO GEM A. GARCILLANOSA';
        $verifiedByName = data_get($rpci, 'verified_by_name') ?? data_get($rpci, 'signatories.verified_by.name') ?? data_get($rpci, 'coa_representative_name') ?? $verifiedByName ?? '';
        $verifiedByPosition = data_get($rpci, 'verified_by_position') ?? data_get($rpci, 'signatories.verified_by.position') ?? $verifiedByPosition ?? '';
    @endphp

    <table class="rpci-table">
        <colgroup>
            <col style="width: 8%;">  {{-- Article --}}
            <col style="width: 20%;"> {{-- Description --}}
            <col style="width: 12%;"> {{-- Stock Number --}}
            <col style="width: 6%;">  {{-- Unit of Measure --}}
            <col style="width: 8%;">  {{-- Unit Value --}}
            <col style="width: 8%;">  {{-- Balance Per Card --}}
            <col style="width: 8%;">  {{-- On Hand Per Count --}}
            <col style="width: 7%;">  {{-- Shortage Qty --}}
            <col style="width: 7%;">  {{-- Shortage Value --}}
            <col style="width: 16%;"> {{-- Remarks --}}
        </colgroup>
        <thead>
            <tr>
                <th rowspan="2">Article</th>
                <th rowspan="2">Description</th>
                <th rowspan="2">Stock Number</th>
                <th rowspan="2">Unit of<br>Measure</th>
                <th rowspan="2">Unit Value</th>
                <th>Balance Per Card</th>
                <th>On Hand Per Count</th>
                <th colspan="2">Shortage/Overage</th>
                <th rowspan="2">Remarks</th>
            </tr>
            <tr>
                <th>(Quantity)</th>
                <th>(Quantity)</th>
                <th>Quantity</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paddedItems as $item)
                <tr class="{{ empty($item) ? 'empty-row' : '' }}">
                    <td class="text-center">{{ data_get($item, 'article') ?? '' }}</td>
                    <td class="text-left">{!! nl2br(e(data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                    <td class="text-center">{{ data_get($item, 'supplier_stock_no') ?? data_get($item, 'stock_no') ?? '' }}</td>
                    <td class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                    <td class="text-right">
                        @if(is_numeric(data_get($item, 'unit_value') ?? data_get($item, 'unit_cost')))
                            ₱{{ number_format((float)(data_get($item, 'unit_value') ?? data_get($item, 'unit_cost')), 2) }}
                        @else
                            {{ data_get($item, 'unit_value') ?? data_get($item, 'unit_cost') ?? '' }}
                        @endif
                    </td>
                    <td class="text-right">{{ data_get($item, 'balance_per_card') ?? data_get($item, 'quantity') ?? '' }}</td>
                    <td class="text-right">{{ data_get($item, 'on_hand_count') ?? data_get($item, 'physical_count') ?? '' }}</td>
                    <td class="text-right">{{ data_get($item, 'shortage_qty') ?? data_get($item, 'variance') ?? '' }}</td>
                    <td class="text-right">
                        @if(is_numeric(data_get($item, 'shortage_value')))
                            ₱{{ number_format((float)data_get($item, 'shortage_value'), 2) }}
                        @else
                            {{ data_get($item, 'shortage_value') ?? '' }}
                        @endif
                    </td>
                    <td class="text-left">{{ data_get($item, 'remarks') ?? '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Signatories Section --}}
    <table class="footer-table">
        <tbody>
            <tr>
                <td>
                    <div style="margin-bottom: 4.5mm; font-weight: bold;">Certified Correct by:</div>
                    <table style="width: 90%; margin: 0 auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 3px 2px 3px; font-weight: bold; text-align: center; font-size: 8pt;">
                                    {{ $certifiedByName ?: "\u{00A0}" }}
                                </td>
                            </tr>
                            <tr>
                                <td style="border: none; text-align: center; font-size: 7pt; padding-top: 2px; line-height: 1.1;">
                                    Signature over Printed Name of Inventory Committee Chair and Members
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
                <td>
                    <div style="margin-bottom: 4.5mm; font-weight: bold;">Approved by:</div>
                    <table style="width: 90%; margin: 0 auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 3px 2px 3px; font-weight: bold; text-align: center; font-size: 8pt;">
                                    {{ $approvedByName ?: 'ARSENIO GEM A. GARCILLANOSA' }}
                                </td>
                            </tr>
                            <tr>
                                <td style="border: none; text-align: center; font-size: 7pt; padding-top: 2px; line-height: 1.1;">
                                    Signature over Printed Name of Head of Agency/Entity or Authorized Representative
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
                <td>
                    <div style="margin-bottom: 4.5mm; font-weight: bold;">Verified by:</div>
                    <table style="width: 90%; margin: 0 auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 3px 2px 3px; font-weight: bold; text-align: center; font-size: 8pt;">
                                    {{ $verifiedByName ?: "\u{00A0}" }}
                                </td>
                            </tr>
                            @if(!empty($verifiedByPosition) && strtolower(trim($verifiedByPosition)) !== 'coa representative')
                                <tr>
                                    <td style="border: none; text-align: center; font-size: 7.5pt; padding-top: 1px; line-height: 1.1;">
                                        {{ $verifiedByPosition }}
                                    </td>
                                </tr>
                            @endif
                            <tr>
                                <td style="border: none; text-align: center; font-size: 7pt; padding-top: 2px; line-height: 1.1;">
                                    Signature over Printed Name of COA Representative
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</div>
@endsection

