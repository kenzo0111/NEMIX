@extends('compliance.pdf.layout')

@section('title', 'Inventory Custodian Slip (ICS)')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm;
    }

    .ics-container {
        font-family: 'Times-Roman', 'Times New Roman', Times, serif;
        font-size: 8.5pt;
        line-height: 1.15;
        color: #000000;
        background: #ffffff;
        width: 100%;
        margin: 0 auto;
    }

    .ics-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 1.5px solid #000000;
    }

    .ics-table th,
    .ics-table td {
        border: 1px solid #000000;
        padding: 0.6mm 1mm;
        font-size: 8pt;
        vertical-align: middle;
        line-height: 1.1;
        word-wrap: break-word;
    }

    .ics-table th {
        font-weight: bold;
        text-align: center;
        background-color: #f2f2f2;
        padding: 0.8mm 1mm;
    }

    .empty-row td {
        height: 4mm !important;
        min-height: 4mm !important;
        padding: 0 1mm !important;
        line-height: 1 !important;
    }

    .sig-block {
        width: 50%;
        padding: 0 8px;
        vertical-align: top;
        box-sizing: border-box;
    }

    .sig-label {
        text-align: left;
        font-weight: bold;
        margin-bottom: 12px;
        font-size: 8.5pt;
        line-height: 1.1;
    }

    .sig-name {
        font-weight: bold;
        font-size: 8.5pt;
        text-align: center;
        margin-bottom: 1px;
        text-transform: uppercase;
        line-height: 1.15;
        border-bottom: 1px solid #000000;
        width: 85%;
        margin: 0 auto;
    }

    .sig-subtext {
        font-size: 7pt;
        line-height: 1.15;
        text-align: center;
    }
</style>
@endsection

@section('content')
<div class="report-page ics-container">
    <div style="margin-bottom: 2px; text-align: right; font-style: italic; font-weight: bold; font-size: 16pt;">
        Appendix 59
    </div>

    <div class="official-title" style="margin: 1px 0 3px 0; font-size: 11.5pt; text-align: center; font-weight: bold; letter-spacing: 0.3px;">
        INVENTORY CUSTODIAN SLIP
    </div>

    {{-- Meta Info Row --}}
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
        <colgroup>
            <col style="width: 65%;">
            <col style="width: 35%;">
        </colgroup>
        <tbody>
            <tr>
                <td style="border: none; padding: 1.5px 4px; vertical-align: middle; text-align: left; line-height: 1.1; font-size: 8.5pt;">
                    <div><strong>Entity Name :</strong> <span style="border-bottom: 1px solid #000; padding: 0 4px; display: inline-block; min-width: 180px;">{{ data_get($ics, 'entityName') ?? data_get($ics, 'entity_name') ?? 'UNIVERSITY OF CAMARINES NORTE' }}</span></div>
                    <div style="margin-top: 2px;"><strong>Fund Cluster :</strong> <span style="border-bottom: 1px solid #000; padding: 0 4px; display: inline-block; min-width: 180px;">{{ data_get($ics, 'fundCluster') ?? data_get($ics, 'fund_cluster') ?? '01 - Regular Agency Fund' }}</span></div>
                </td>
                <td style="border: none; padding: 1.5px 4px; vertical-align: middle; text-align: right; line-height: 1.1; font-size: 8.5pt;">
                    <strong>ICS No. :</strong> <span style="border-bottom: 1px solid #000; padding: 0 4px; display: inline-block; min-width: 120px; text-align: center;">{{ data_get($ics, 'icsNo') ?? data_get($ics, 'ics_no') ?? data_get($dataset, 'reference') ?? '' }}</span>
                </td>
            </tr>
        </tbody>
    </table>

    {{-- Main Items Table --}}
    @php
        $itemsList = $items ?? [];
        $targetRows = 10;
        $paddedItems = array_merge($itemsList, array_fill(0, max(0, $targetRows - count($itemsList)), []));
    @endphp

    <table class="ics-table">
        <colgroup>
            <col style="width: 6%;">  {{-- Quantity --}}
            <col style="width: 8%;">  {{-- Unit --}}
            <col style="width: 11%;"> {{-- Unit Cost --}}
            <col style="width: 11%;"> {{-- Total Cost --}}
            <col style="width: 38%;"> {{-- Description --}}
            <col style="width: 13%;"> {{-- Inventory Item No. --}}
            <col style="width: 13%;"> {{-- Estimated Useful Life --}}
        </colgroup>
        <thead>
            <tr>
                <th rowspan="2">Quantity</th>
                <th rowspan="2">Unit</th>
                <th colspan="2">Amount</th>
                <th rowspan="2">Description</th>
                <th rowspan="2">Inventory Item No.</th>
                <th rowspan="2">Estimated Useful Life</th>
            </tr>
            <tr>
                <th>Unit Cost</th>
                <th>Total Cost</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paddedItems as $item)
                <tr class="{{ empty($item) ? 'empty-row' : '' }}">
                    <td class="text-center">{{ data_get($item, 'quantity') ?? '' }}</td>
                    <td class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                    <td class="text-right">
                        @if(is_numeric(data_get($item, 'unitCost') ?? data_get($item, 'unit_cost')))
                            ₱{{ number_format((float)(data_get($item, 'unitCost') ?? data_get($item, 'unit_cost')), 2) }}
                        @else
                            {{ data_get($item, 'unitCost') ?? data_get($item, 'unit_cost') ?? '' }}
                        @endif
                    </td>
                    <td class="text-right">
                        @if(is_numeric(data_get($item, 'totalCost') ?? data_get($item, 'total_cost')))
                            ₱{{ number_format((float)(data_get($item, 'totalCost') ?? data_get($item, 'total_cost')), 2) }}
                        @else
                            {{ data_get($item, 'totalCost') ?? data_get($item, 'total_cost') ?? '' }}
                        @endif
                    </td>
                    <td class="text-left">{!! nl2br(e(data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                    <td class="text-center" style="white-space: nowrap;">{{ data_get($item, 'itemNo') ?? data_get($item, 'supplier_stock_no') ?? data_get($item, 'stock_no') ?? '' }}</td>
                    <td class="text-center">{{ data_get($item, 'usefulLife') ?? data_get($item, 'useful_life') ?? '' }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="7" style="padding: 4px 6px;">
                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                        <colgroup>
                            <col style="width: 50%;">
                            <col style="width: 50%;">
                        </colgroup>
                        <tbody>
                            <tr>
                                <td class="sig-block" style="border-right: 1px solid #000000; padding-right: 10px;">
                                    <div class="sig-label">Received from :</div>
                                    <div class="sig-name">
                                        {{ data_get($ics, 'receivedFromName') ?? 'ARSENIO GEM A. GARCILLANOSA' }}
                                    </div>
                                    <div class="sig-subtext">Signature Over Printed Name</div>
                                    <div class="sig-subtext" style="padding-top: 2px;">
                                        {{ data_get($ics, 'receivedFromPosition') ?? 'SUPPLY OFFICER III/ADMIN OFFICER V' }}
                                    </div>
                                    <div class="sig-subtext" style="padding-top: 2px;">
                                        Date: {{ data_get($ics, 'receivedFromDate') ?? '' }}
                                    </div>
                                </td>
                                <td class="sig-block" style="padding-left: 10px;">
                                    <div class="sig-label">Received by:</div>
                                    <div class="sig-name">
                                        {{ data_get($ics, 'receivedByName') ?? "&nbsp;" }}
                                    </div>
                                    <div class="sig-subtext">Signature Over Printed Name</div>
                                    <div class="sig-subtext" style="padding-top: 2px;">
                                        Position: {{ data_get($ics, 'receivedByPosition') ?? '' }}
                                    </div>
                                    <div class="sig-subtext" style="padding-top: 2px;">
                                        Date: {{ data_get($ics, 'receivedByDate') ?? '' }}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tfoot>
    </table>
</div>
@endsection

