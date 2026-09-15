@extends('compliance.pdf.layout')

@section('title', 'Report on the Physical Count of Inventories (RPCI)')

@section('styles')
<style>
    @page {
        size: A4 landscape;
        margin: 8mm 8mm 8mm 8mm;
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
        padding: 3px 4px;
        font-size: 7.5pt;
        vertical-align: middle;
        line-height: 1.15;
        word-wrap: break-word;
    }

    .rpci-table th {
        font-weight: bold;
        text-align: center;
        background-color: #ffffff;
        padding: 4px 3px;
    }

    .empty-row td {
        height: 16px;
        line-height: 1;
    }
</style>
@endsection

@section('content')
<div class="report-page">
    <div class="official-appendix">Appendix 66</div>
    <div class="official-title">REPORT ON THE PHYSICAL COUNT OF INVENTORIES</div>

    {{-- Subtitle / Purpose Line --}}
    <div style="text-align: center; font-size: 8.5pt; margin-bottom: 8px; line-height: 1.2;">
        <span style="font-weight: bold;">{{ data_get($rpci, 'inventory_type') ?? 'Inventory Items' }}</span><br>
        (Type of Inventory Item)<br>
        As at <span style="font-weight: bold; border-bottom: 1px solid #000; padding: 0 4px;">{{ data_get($rpci, 'as_at_date') ? \Carbon\Carbon::parse(data_get($rpci, 'as_at_date'))->format('F d, Y') : (data_get($rpci, 'date') ? \Carbon\Carbon::parse(data_get($rpci, 'date'))->format('F d, Y') : '') }}</span>
    </div>

    {{-- Top Info Grid --}}
    <table class="form-table" style="margin-bottom: 8px;">
        <colgroup>
            <col style="width: 15%;">
            <col style="width: 40%;">
            <col style="width: 5%;">
            <col style="width: 15%;">
            <col style="width: 25%;">
        </colgroup>
        <tbody>
            <tr>
                <td class="form-label">Fund Cluster:</td>
                <td class="form-value">{{ data_get($rpci, 'fund_cluster') ?? '01 - Regular Agency Fund' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">Entity Name:</td>
                <td class="form-value">{{ data_get($rpci, 'entity_name') ?? 'UNIVERSITY OF CAMARINES NORTE' }}</td>
            </tr>
            <tr>
                <td class="form-label">Accountable Officer:</td>
                <td class="form-value">{{ data_get($rpci, 'accountable_officer') ?? 'Arsenio Gem A. Garcillanosa' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">Date of Assumption:</td>
                <td class="form-value">{{ data_get($rpci, 'date_assumption') ? \Carbon\Carbon::parse(data_get($rpci, 'date_assumption'))->format('m/d/Y') : '' }}</td>
            </tr>
            <tr>
                <td class="form-label">Official Designation:</td>
                <td class="form-value">{{ data_get($rpci, 'designation') ?? 'Supply Custodian / Supply Officer III' }}</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
            </tr>
        </tbody>
    </table>

    {{-- Main RPCI Table --}}
    @php
        $itemsList = $items ?? [];
        $targetRows = 8;
        $paddedItems = array_merge($itemsList, array_fill(0, max(0, $targetRows - count($itemsList)), []));
    @endphp

    <table class="rpci-table">
        <colgroup>
            <col style="width: 8%;">  {{-- Article --}}
            <col style="width: 20%;"> {{-- Description --}}
            <col style="width: 12%;"> {{-- Stock Number --}}
            <col style="width: 6%;">  {{-- Unit --}}
            <col style="width: 8%;">  {{-- Unit Value --}}
            <col style="width: 8%;">  {{-- Balance Per Card --}}
            <col style="width: 8%;">  {{-- On Hand Count --}}
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
                    <td class="text-left">{{ data_get($item, 'description') ?? data_get($item, 'item_name') ?? '' }}</td>
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
    <table class="signatory-box">
        <colgroup>
            <col style="width: 33%;">
            <col style="width: 34%;">
            <col style="width: 33%;">
        </colgroup>
        <tbody>
            <tr>
                <td class="signatory-cell">
                    <div class="signatory-header">Certified Correct by:</div>
                    <table style="width: 90%; margin: 0 auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td class="signatory-name">
                                    {{ $certifiedByName ?: "\u{00A0}" }}
                                </td>
                            </tr>
                            <tr>
                                <td class="signatory-caption">
                                    Signature over Printed Name of Inventory Committee Chair and Members
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
                <td class="signatory-cell">
                    <div class="signatory-header">Approved by:</div>
                    <table style="width: 90%; margin: 0 auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td class="signatory-name">
                                    {{ $approvedByName ?: 'ARSENIO GEM A. GARCILLANOSA' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="signatory-caption">
                                    Signature over Printed Name of Head of Agency/Entity or Authorized Representative
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
                <td class="signatory-cell">
                    <div class="signatory-header">Verified by:</div>
                    <table style="width: 90%; margin: 0 auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td class="signatory-name">
                                    {{ $verifiedByName ?: "\u{00A0}" }}
                                </td>
                            </tr>
                            @if(!empty($verifiedByPosition) && strtolower(trim($verifiedByPosition)) !== 'coa representative')
                                <tr>
                                    <td class="signatory-caption" style="font-size: 7.5pt; font-weight: normal; padding-bottom: 2px;">
                                        {{ $verifiedByPosition }}
                                    </td>
                                </tr>
                            @endif
                            <tr>
                                <td class="signatory-caption">
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
