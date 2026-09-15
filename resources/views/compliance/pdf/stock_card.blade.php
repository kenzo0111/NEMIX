@extends('compliance.pdf.layout')

@section('title', 'Stock Card Report')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm;
    }

    .sc-container {
        font-family: 'DejaVu Sans', 'Times-Roman', serif;
        font-size: 8.5pt;
        line-height: 1.15;
    }

    .sc-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 1.5px solid #000000;
    }

    .sc-table th,
    .sc-table td {
        border: 1px solid #000000;
        padding: 0.6mm 1mm;
        font-size: 8pt;
        vertical-align: middle;
        line-height: 1.1;
        word-wrap: break-word;
    }

    .sc-table th {
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
</style>
@endsection

@section('content')
<div class="report-page sc-container">
    <div class="official-header">
        <div class="official-appendix">Appendix 58</div>
        <div class="official-title">STOCK CARD</div>
    </div>

    {{-- Top Info Grid --}}
    <table class="form-table" style="margin-bottom: 6px;">
        <colgroup>
            <col style="width: 15%;">
            <col style="width: 40%;">
            <col style="width: 5%;">
            <col style="width: 15%;">
            <col style="width: 25%;">
        </colgroup>
        <tbody>
            <tr>
                <td class="form-label">Entity Name:</td>
                <td class="form-value">{{ data_get($stockCard, 'entity_name') ?? data_get($dataset, 'entity_name') ?? 'UNIVERSITY OF CAMARINES NORTE' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">Fund Cluster:</td>
                <td class="form-value">{{ data_get($stockCard, 'fund_cluster') ?? data_get($dataset, 'fund_cluster') ?? '01 - Regular Agency Fund' }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Boxed Header Info Table --}}
    <table class="sc-table" style="border-bottom: none; margin-bottom: 0;">
        <colgroup>
            <col style="width: 14%;">
            <col style="width: 38%;">
            <col style="width: 16%;">
            <col style="width: 32%;">
        </colgroup>
        <tbody>
            <tr>
                <td style="text-align: center;">Item:</td>
                <td style="text-align: center; font-weight: bold;">{{ data_get($stockCard, 'item') ?? data_get($stockCard, 'item_name') ?? '' }}</td>
                <td style="text-align: center;">Stock No.:</td>
                <td style="text-align: center; font-weight: bold;">{{ data_get($stockCard, 'supplier_stock_no') ?? data_get($stockCard, 'stock_no') ?? '' }}</td>
            </tr>
            <tr>
                <td style="text-align: center;">Description:</td>
                <td style="text-align: center;">{{ data_get($stockCard, 'description') ?? data_get($stockCard, 'item') ?? '' }}</td>
                <td style="text-align: center;">Re-order Point:</td>
                <td style="text-align: center;">{{ data_get($stockCard, 're_order_point') ?? '' }}</td>
            </tr>
            <tr>
                <td style="text-align: center; line-height: 1.1;">Unit of<br>Measurement:</td>
                <td style="text-align: center;">{{ data_get($stockCard, 'unit_of_measurement') ?? data_get($stockCard, 'unit') ?? 'pc' }}</td>
                <td colspan="2" style="background-color: #ffffff;">&nbsp;</td>
            </tr>
        </tbody>
    </table>

    {{-- Main Stock Card Ledger Table --}}
    @php
        $entriesList = $entries ?? [];
        $targetRows = 12;
        $paddedEntries = array_merge($entriesList, array_fill(0, max(0, $targetRows - count($entriesList)), []));
    @endphp

    <table class="sc-table">
        <colgroup>
            <col style="width: 11%;"> {{-- Date --}}
            <col style="width: 15%;"> {{-- Reference --}}
            <col style="width: 10%;"> {{-- Receipt Qty --}}
            <col style="width: 10%;"> {{-- Issue Qty --}}
            <col style="width: 26%;"> {{-- Office --}}
            <col style="width: 11%;"> {{-- Balance Qty --}}
            <col style="width: 17%;"> {{-- Days to Consume --}}
        </colgroup>
        <thead>
            <tr>
                <th rowspan="2">Date</th>
                <th rowspan="2">Reference</th>
                <th rowspan="2">Receipt<br>Qty.</th>
                <th colspan="2">Issue</th>
                <th rowspan="2">Balance<br>Qty.</th>
                <th rowspan="2">No. of Days<br>to Consume</th>
            </tr>
            <tr>
                <th>Qty.</th>
                <th>Office</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paddedEntries as $entry)
                <tr class="{{ empty($entry) ? 'empty-row' : '' }}">
                    <td class="text-center">{{ data_get($entry, 'date') ? \Carbon\Carbon::parse(data_get($entry, 'date'))->format('m/d/Y') : '' }}</td>
                    <td class="text-center">{{ data_get($entry, 'reference') ?? '' }}</td>
                    <td class="text-center">{{ data_get($entry, 'receipt_qty') ?? '' }}</td>
                    <td class="text-center">{{ data_get($entry, 'issue_qty') ?? '' }}</td>
                    <td class="text-center">{{ data_get($entry, 'issue_office') ?? data_get($entry, 'department') ?? '' }}</td>
                    <td class="text-center">{{ data_get($entry, 'balance_qty') ?? '' }}</td>
                    <td class="text-center">{{ data_get($entry, 'days_to_consume') ?? '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection

