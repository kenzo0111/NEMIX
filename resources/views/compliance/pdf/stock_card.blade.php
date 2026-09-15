@extends('compliance.pdf.layout')

@section('title', 'Stock Card Report')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm;
    }

    .sc-container {
        font-family: 'Times-Roman', 'Times New Roman', Times, serif;
        font-size: 8.5pt;
        line-height: 1.15;
        color: #000000;
        background: #ffffff;
        width: 100%;
        max-width: 194mm;
        margin: 0 auto;
    }

    .sc-header { margin-bottom: 1.5mm; width: 100%; }
    .sc-appendix { text-align: right; font-weight: bold; font-size: 8.5pt; line-height: 1; }
    .sc-title-row { min-height: 8mm; padding: 1mm 0; line-height: 1.05; text-align: center; }
    .sc-title { margin: 0; font-size: 12pt; font-weight: bold; line-height: 1.05; text-align: center; }

    .sc-top-info {
        width: 100%;
        margin-bottom: 6px;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .sc-top-info td {
        vertical-align: middle;
        font-size: 8.5pt;
        line-height: 1.1;
    }

    .sc-field-group { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .sc-field-label { width: 33%; padding: 1.5px 0; font-weight: bold; white-space: nowrap; }
    .sc-field-value { width: 67%; border-bottom: 1px solid #000000; padding: 1.5px 4px; font-size: 8pt !important; white-space: nowrap; }

    .main-table {
        width: 100%;
        border-collapse: collapse;
        border: 1.5px solid #000000;
        table-layout: fixed;
    }

    .main-table th,
    .main-table td {
        border: 1px solid #000000;
        padding: 0.6mm 1mm;
        font-size: 8pt;
        word-wrap: break-word;
        overflow-wrap: anywhere;
        vertical-align: middle;
        line-height: 1.1;
        box-sizing: border-box;
    }

    .main-table th {
        font-weight: bold;
        text-align: center;
        background-color: #ffffff;
        padding: 0.8mm 1mm;
    }

    .sc-header-box td {
        padding: 2px 4px;
        font-size: 8pt;
        line-height: 1.1;
    }

    .empty-row td {
        height: 4mm !important;
        min-height: 4mm !important;
        padding: 0 1mm !important;
        line-height: 1 !important;
    }

    .text-center { text-align: center !important; }
    .text-left { text-align: left !important; }
    .text-right { text-align: right !important; }
</style>
@endsection

@section('content')
@php
    $scData = $stockCard ?? $dataset ?? [];
    $entityName = data_get($scData, 'entity_name') ?? data_get($scData, 'entityName') ?? 'UNIVERSITY OF CAMARINES NORTE';
    
    $fundCluster = data_get($scData, 'fund_cluster') ?? data_get($scData, 'fundCluster') ?? '01 - Regular Agency Fund';
    if ($fundCluster === '01' || $fundCluster === 'General Fund' || $fundCluster === 'Regular Agency Fund') {
        $fundCluster = '01 - Regular Agency Fund';
    }

    $itemTitle = data_get($scData, 'item') ?? data_get($scData, 'item_name') ?? '';
    $stockNo = data_get($scData, 'supplier_stock_no') ?? data_get($scData, 'stock_no') ?? '';
    $description = data_get($scData, 'description') ?? '';
    $reOrderPoint = data_get($scData, 're_order_point') ?? data_get($scData, 'reorder_point') ?? '';
    $unitOfMeasurement = data_get($scData, 'unit_of_measurement') ?? data_get($scData, 'unit') ?? '';

    $entriesList = $entries ?? data_get($scData, 'entries') ?? [];
    $targetRowCount = 12;
    $paddedEntries = array_merge($entriesList, array_fill(0, max(0, $targetRowCount - count($entriesList)), []));
@endphp

<div class="report-page sc-container">
    <div class="sc-header">
        <div class="sc-appendix">Appendix 58</div>
        <div class="sc-title-row">
            <h1 class="sc-title">STOCK CARD</h1>
        </div>
    </div>

    {{-- Top Info Grid with explicit column widths to prevent header wrapping --}}
    <table class="sc-top-info">
        <colgroup>
            <col width="12%" style="width: 12%;">
            <col width="40%" style="width: 40%;">
            <col width="4%" style="width: 4%;">
            <col width="12%" style="width: 12%;">
            <col width="32%" style="width: 32%;">
        </colgroup>
        <tbody>
            <tr>
                <td width="12%" style="font-weight: bold; white-space: nowrap; padding: 1.5px 0;">Entity Name:</td>
                <td width="40%" style="border-bottom: 1px solid #000000; padding: 1.5px 4px; font-size: 8.5pt; line-height: 1.1;">{{ $entityName }}</td>
                <td width="4%">&nbsp;</td>
                <td width="12%" style="font-weight: bold; white-space: nowrap; padding: 1.5px 0;">Fund Cluster:</td>
                <td width="32%" style="border-bottom: 1px solid #000000; padding: 1.5px 4px; font-size: 8.5pt; line-height: 1.1;">{{ $fundCluster }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Boxed Header Info Table --}}
    <table class="main-table sc-header-box" style="border-bottom: none;">
        <colgroup>
            <col width="14%" style="width: 14%;">
            <col width="38%" style="width: 38%;">
            <col width="16%" style="width: 16%;">
            <col width="32%" style="width: 32%;">
        </colgroup>
        <tbody>
            <tr>
                <td width="14%" style="text-align: center; font-weight: normal;">Item:</td>
                <td width="38%" style="text-align: center; font-weight: bold;">{{ $itemTitle }}</td>
                <td width="16%" style="text-align: center; font-weight: normal;">Stock No.:</td>
                <td width="32%" style="text-align: center; font-weight: bold;">{{ $stockNo }}</td>
            </tr>
            <tr>
                <td style="text-align: center;">Description:</td>
                <td style="text-align: center;">{{ $description }}</td>
                <td style="text-align: center;">Re-order Point:</td>
                <td style="text-align: center;">{{ $reOrderPoint }}</td>
            </tr>
            <tr>
                <td style="text-align: center; line-height: 1.1;">Unit of<br>Measurement:</td>
                <td style="text-align: center;">{{ $unitOfMeasurement }}</td>
                <td colspan="2" style="background-color: #ffffff;"></td>
            </tr>
        </tbody>
    </table>

    {{-- Main Ledger Table --}}
    <table class="main-table">
        <colgroup>
            <col width="11%" style="width: 11%;"> {{-- Date --}}
            <col width="15%" style="width: 15%;"> {{-- Reference --}}
            <col width="10%" style="width: 10%;"> {{-- Receipt Qty --}}
            <col width="10%" style="width: 10%;"> {{-- Issue Qty --}}
            <col width="26%" style="width: 26%;"> {{-- Issue Office --}}
            <col width="11%" style="width: 11%;"> {{-- Balance Qty --}}
            <col width="17%" style="width: 17%;"> {{-- Days to Consume --}}
        </colgroup>
        <thead>
            <tr>
                <th width="11%" rowspan="2">Date</th>
                <th width="15%" rowspan="2">Reference</th>
                <th width="10%" rowspan="2">Receipt<br>Qty.</th>
                <th width="36%" colspan="2">Issue</th>
                <th width="11%" rowspan="2">Balance<br>Qty.</th>
                <th width="17%" rowspan="2">No. of Days<br>to Consume</th>
            </tr>
            <tr>
                <th width="10%">Qty.</th>
                <th width="26%">Office</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paddedEntries as $entry)
                @php
                    $isEmpty = empty($entry);
                    $rawDate = data_get($entry, 'date');
                    $dateDisplay = '';
                    if ($rawDate) {
                        try {
                            $dateDisplay = \Carbon\Carbon::parse($rawDate)->format('m/d/Y');
                        } catch (\Throwable $e) {
                            $dateDisplay = $rawDate;
                        }
                    }
                    $receiptQty = data_get($entry, 'receipt_qty');
                    $issueQty = data_get($entry, 'issue_qty');
                    $balanceQty = data_get($entry, 'balance_qty');
                @endphp
                <tr class="{{ $isEmpty ? 'empty-row' : '' }}">
                    <td class="text-center">{{ $dateDisplay }}</td>
                    <td class="text-center">{{ data_get($entry, 'reference') ?? '' }}</td>
                    <td class="text-center">{{ $receiptQty !== null && $receiptQty !== '' ? $receiptQty : '' }}</td>
                    <td class="text-center">{{ $issueQty !== null && $issueQty !== '' ? $issueQty : '' }}</td>
                    <td class="text-center">{{ data_get($entry, 'issue_office') ?? data_get($entry, 'department') ?? '' }}</td>
                    <td class="text-center">{{ $balanceQty !== null && $balanceQty !== '' ? $balanceQty : '' }}</td>
                    <td class="text-center">{{ data_get($entry, 'days_to_consume') ?? '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection
