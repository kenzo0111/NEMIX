@extends('compliance.pdf.layout')

@section('title', 'Stock Card Report')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm 8mm 8mm 8mm;
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
        padding: 3px 4px;
        font-size: 7.5pt;
        vertical-align: middle;
        line-height: 1.15;
        word-wrap: break-word;
    }

    .sc-table th {
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
    <div class="official-appendix">Appendix 58</div>
    <div class="official-title">STOCK CARD</div>

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
                <td class="form-label">Entity Name:</td>
                <td class="form-value">{{ data_get($stockCard, 'entity_name') ?? data_get($dataset, 'entity_name') ?? 'UNIVERSITY OF CAMARINES NORTE' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">Fund Cluster:</td>
                <td class="form-value">{{ data_get($stockCard, 'fund_cluster') ?? data_get($dataset, 'fund_cluster') ?? '01 - Regular Agency Fund' }}</td>
            </tr>
            <tr>
                <td class="form-label">Item:</td>
                <td class="form-value">{{ data_get($stockCard, 'item') ?? data_get($stockCard, 'item_name') ?? '' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">Stock No.:</td>
                <td class="form-value">{{ data_get($stockCard, 'supplier_stock_no') ?? data_get($stockCard, 'stock_no') ?? '' }}</td>
            </tr>
            <tr>
                <td class="form-label">Description:</td>
                <td class="form-value">{{ data_get($stockCard, 'description') ?? data_get($stockCard, 'item') ?? '' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">Re-order Point:</td>
                <td class="form-value">{{ data_get($stockCard, 're_order_point') ?? '' }}</td>
            </tr>
            <tr>
                <td class="form-label">Unit of Measure:</td>
                <td class="form-value">{{ data_get($stockCard, 'unit_of_measurement') ?? data_get($stockCard, 'unit') ?? 'pc' }}</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
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
            <col style="width: 12%;"> {{-- Date --}}
            <col style="width: 18%;"> {{-- Reference --}}
            <col style="width: 12%;"> {{-- Receipt Qty --}}
            <col style="width: 12%;"> {{-- Issue Qty --}}
            <col style="width: 22%;"> {{-- Office --}}
            <col style="width: 12%;"> {{-- Balance Qty --}}
            <col style="width: 12%;"> {{-- Days to Consume --}}
        </colgroup>
        <thead>
            <tr>
                <th rowspan="2">Date</th>
                <th rowspan="2">Reference</th>
                <th>Receipt</th>
                <th colspan="2">Issue</th>
                <th>Balance</th>
                <th rowspan="2">No. of Days<br>to Consume</th>
            </tr>
            <tr>
                <th>Qty</th>
                <th>Qty</th>
                <th>Office</th>
                <th>Qty</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paddedEntries as $entry)
                <tr class="{{ empty($entry) ? 'empty-row' : '' }}">
                    <td class="text-center">{{ data_get($entry, 'date') ? \Carbon\Carbon::parse(data_get($entry, 'date'))->format('m/d/Y') : '' }}</td>
                    <td class="text-center">{{ data_get($entry, 'reference') ?? '' }}</td>
                    <td class="text-right">{{ data_get($entry, 'receipt_qty') ?? '' }}</td>
                    <td class="text-right">{{ data_get($entry, 'issue_qty') ?? '' }}</td>
                    <td class="text-left">{{ data_get($entry, 'issue_office') ?? data_get($entry, 'department') ?? '' }}</td>
                    <td class="text-right">{{ data_get($entry, 'balance_qty') ?? '' }}</td>
                    <td class="text-center">{{ data_get($entry, 'days_to_consume') ?? '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection
