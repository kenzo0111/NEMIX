@extends('compliance.pdf.layout')

@section('title', 'Memorandum Receipt for Property')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm;
    }

    .mr-container {
        font-family: 'Times-Roman', 'Times New Roman', Times, serif;
        font-size: 8.5pt;
        line-height: 1.15;
        color: #000000;
        background: #ffffff;
        width: 100%;
        margin: 0 auto;
    }

    .mr-top-info {
        width: 100%;
        margin-bottom: 6px;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .mr-top-info td {
        vertical-align: middle;
        font-size: 8.5pt;
        line-height: 1.1;
    }

    .purpose-statement {
        margin-bottom: 1.5mm;
        line-height: 1.2;
        text-align: justify;
        font-size: 8.5pt;
    }

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
        vertical-align: middle;
        line-height: 1.1;
    }

    .main-table th {
        text-align: center;
        font-weight: bold;
        background-color: #ffffff;
        padding: 0.8mm 1mm;
    }

    .empty-row td {
        height: 4mm !important;
        min-height: 4mm !important;
        padding: 0 1mm !important;
        line-height: 1 !important;
    }

    .signatures-table {
        width: 100%;
        border-collapse: collapse;
        border: 1.5px solid #000000;
        border-top: none;
        table-layout: fixed;
        page-break-inside: avoid;
    }

    .sig-cell {
        width: 50%;
        vertical-align: top;
        padding: 1.5mm 2.5mm;
        box-sizing: border-box;
    }

    .sig-header {
        font-weight: bold;
        margin-bottom: 4.5mm;
        font-size: 8.5pt;
        line-height: 1.1;
    }
</style>
@endsection

@section('content')
@php
    $mrData = $mr ?? $dataset ?? [];
    $appendixNumber = data_get($mrData, 'appendixNumber') ?? data_get($mrData, 'appendix_number') ?? 'Appendix 59-A';
    
    $entityName = data_get($mrData, 'entityName') ?? data_get($mrData, 'entity_name') ?? 'UNIVERSITY OF CAMARINES NORTE';
    $mrNo = data_get($mrData, 'mrNo') ?? data_get($mrData, 'mr_no') ?? data_get($dataset, 'reference') ?? '';
    
    $fundCluster = data_get($mrData, 'fundCluster') ?? data_get($mrData, 'fund_cluster') ?? '01 - Regular Agency Fund';
    if ($fundCluster === '01' || $fundCluster === 'General Fund' || $fundCluster === 'Regular Agency Fund') {
        $fundCluster = '01 - Regular Agency Fund';
    }

    $rawDate = data_get($mrData, 'date');
    $displayDate = '';
    if ($rawDate) {
        try {
            $displayDate = \Carbon\Carbon::parse($rawDate)->format('m/d/Y');
        } catch (\Throwable $e) {
            $displayDate = $rawDate;
        }
    }

    $issuedName = strtoupper((string)($issuedByName ?? data_get($mrData, 'issuedByName') ?? data_get($mrData, 'issued_by_name') ?? 'ARSENIO GEM A. GARCILLANOSA'));
    $issuedPos = $issuedByPosition ?? data_get($mrData, 'issuedByPosition') ?? data_get($mrData, 'issued_by_position') ?? 'SUPPLY OFFICER III / PROPERTY CUSTODIAN';
    $issuedDateDisplay = data_get($mrData, 'issuedByDate') ?? data_get($mrData, 'issued_by_date') ?? $displayDate;

    $receivedName = strtoupper((string)($receivedByName ?? data_get($mrData, 'receivedByName') ?? data_get($mrData, 'received_by_name') ?? ''));
    $receivedPos = $receivedByPosition ?? data_get($mrData, 'receivedByPosition') ?? data_get($mrData, 'received_by_position') ?? '';
    $receivedOff = $receivedByOffice ?? data_get($mrData, 'receivedByOffice') ?? data_get($mrData, 'received_by_office') ?? data_get($mrData, 'purpose') ?? 'Official Business';
    $receivedDateDisplay = data_get($mrData, 'receivedByDate') ?? data_get($mrData, 'received_by_date') ?? $displayDate;

    $itemsList = $items ?? data_get($mrData, 'items') ?? [];
    $targetRowCount = 10;
    $paddedItems = array_merge($itemsList, array_fill(0, max(0, $targetRowCount - count($itemsList)), []));

    $computedTotal = 0;
    foreach ($itemsList as $it) {
        $val = data_get($it, 'totalValue') ?? (data_get($it, 'quantity', 0) * (float)data_get($it, 'unitValue', 0));
        if (is_numeric($val)) {
            $computedTotal += (float)$val;
        }
    }
    $grandTotalVal = data_get($mrData, 'grandTotal') ?? $computedTotal;

    $getNameStyle = function($name, $defaultSize = '9pt') {
        if (!$name) return 'font-size: ' . $defaultSize . '; white-space: nowrap;';
        $len = strlen(trim($name));
        if ($len > 30) return 'font-size: 7.2pt; white-space: nowrap;';
        if ($len > 22) return 'font-size: 8pt; white-space: nowrap;';
        return 'font-size: ' . $defaultSize . '; white-space: nowrap;';
    };
@endphp

<div class="report-page mr-container">
    <div class="official-form-header">
        <div class="official-form-appendix">{{ $appendixNumber }}</div>
        <div class="official-form-title-row">
            <h1 class="official-form-title">MEMORANDUM RECEIPT FOR PROPERTY</h1>
        </div>
        <div class="official-form-subtitle">(MEMORANDUM OF RECEIPT)</div>
    </div>

    {{-- Top Info Grid --}}
    <table class="mr-top-info">
        <colgroup>
            <col style="width: 12%;">
            <col style="width: 40%;">
            <col style="width: 3%;">
            <col style="width: 12%;">
            <col style="width: 33%;">
        </colgroup>
        <tbody>
            <tr>
                <td style="font-weight: bold; padding: 1.5px 0;">Entity Name:</td>
                <td style="border-bottom: 1px solid #000000; padding: 1.5px 4px;">{{ $entityName }}</td>
                <td>&nbsp;</td>
                <td style="font-weight: bold; padding: 1.5px 0;">MR No. :</td>
                <td style="border-bottom: 1px solid #000000; padding: 1.5px 4px;">{{ $mrNo }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; padding: 3px 0 1.5px 0;">Fund Cluster:</td>
                <td style="border-bottom: 1px solid #000000; padding: 3px 4px 1.5px 4px;">{{ $fundCluster }}</td>
                <td>&nbsp;</td>
                <td style="font-weight: bold; padding: 3px 0 1.5px 0;">Date :</td>
                <td style="border-bottom: 1px solid #000000; padding: 3px 4px 1.5px 4px;">{{ $displayDate }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Purpose Statement --}}
    <div class="purpose-statement">
        I hereby acknowledge to have received from <strong>{{ $issuedName }}</strong>, {{ $issuedPos }}, the following property for which I am responsible, subject to the provisions of law, and which will be used in <strong>{{ $receivedOff }}</strong>:
    </div>

    {{-- Main Items Table --}}
    <table class="main-table">
        <colgroup>
            <col style="width: 6%;">  {{-- Qty --}}
            <col style="width: 7%;">  {{-- Unit --}}
            <col style="width: 36%;"> {{-- Description --}}
            <col style="width: 21%;"> {{-- Property No --}}
            <col style="width: 14%;"> {{-- Date Acquired --}}
            <col style="width: 16%;"> {{-- Unit Value --}}
        </colgroup>
        <thead>
            <tr>
                <th>Qty.</th>
                <th>Unit</th>
                <th>Description / Item Name</th>
                <th>Property No. / Serial No.</th>
                <th>Date Acquired</th>
                <th>Unit Value / Cost</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paddedItems as $item)
                @php
                    $isEmpty = empty($item);
                    $qty = data_get($item, 'quantity');
                    $rawItemDate = data_get($item, 'dateAcquired') ?? data_get($item, 'date_acquired');
                    $itemDateDisplay = '';
                    if ($rawItemDate) {
                        try {
                            $itemDateDisplay = \Carbon\Carbon::parse($rawItemDate)->format('m/d/Y');
                        } catch (\Throwable $e) {
                            $itemDateDisplay = $rawItemDate;
                        }
                    }
                    $uVal = data_get($item, 'unitValue') ?? data_get($item, 'unit_cost');
                @endphp
                <tr class="{{ $isEmpty ? 'empty-row' : '' }}">
                    <td class="text-center">{{ $qty !== null && $qty !== '' ? $qty : '' }}</td>
                    <td class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                    <td class="text-left">{!! nl2br(e(data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                    <td class="text-center" style="white-space: nowrap;">{{ data_get($item, 'propertyNo') ?? data_get($item, 'property_number') ?? data_get($item, 'supplier_stock_no') ?? data_get($item, 'stock_no') ?? '' }}</td>
                    <td class="text-center">{{ $itemDateDisplay }}</td>
                    <td class="text-right">
                        @if(is_numeric($uVal))
                            ₱{{ number_format((float)$uVal, 2) }}
                        @else
                            {{ $uVal ?? '' }}
                        @endif
                    </td>
                </tr>
            @endforeach

            {{-- Grand Total Row --}}
            <tr>
                <td colspan="5" class="text-right font-bold" style="padding: 0.6mm 1mm;">Grand Total Value:</td>
                <td class="text-right font-bold" style="padding: 0.6mm 1mm;">
                    @if(is_numeric($grandTotalVal))
                        ₱{{ number_format((float)$grandTotalVal, 2) }}
                    @else
                        {{ $grandTotalVal }}
                    @endif
                </td>
            </tr>
        </tbody>
    </table>

    {{-- Signatures Section --}}
    <table class="signatures-table">
        <tbody>
            <tr>
                {{-- Issued / Released by --}}
                <td class="sig-cell" style="border-right: 1px solid #000000;">
                    <div class="sig-header">Issued / Released by:</div>
                    <table style="width: 85%; margin: 0 auto 4px auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 2px 2px 2px; font-weight: bold; text-align: center; text-transform: uppercase; line-height: 1.15; {{ $getNameStyle($issuedName, '9pt') }}">
                                    {{ $issuedName }}
                                </td>
                            </tr>
                            <tr>
                                <td style="border: none; text-align: center; font-size: 7pt; padding-top: 2px; line-height: 1.1;">
                                    Signature over Printed Name of Supply and/or<br>Property Custodian
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table style="width: 100%; margin-top: 4px; border-collapse: collapse; table-layout: fixed;">
                        <colgroup>
                            <col style="width: 60px;">
                            <col style="width: 220px;">
                        </colgroup>
                        <tbody>
                            <tr>
                                <td style="border: none; font-weight: bold; font-size: 8pt; vertical-align: middle; padding: 1.5px 0;">Position:</td>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 1.5px 4px; vertical-align: middle; font-size: 8pt; line-height: 1.1;">
                                    {{ $issuedPos }}
                                </td>
                            </tr>
                            <tr>
                                <td style="border: none; font-weight: bold; font-size: 8pt; vertical-align: middle; padding: 3px 0 1.5px 0;">Date:</td>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 3px 4px 1.5px 4px; vertical-align: middle; font-size: 8pt; line-height: 1.1;">
                                    {{ $issuedDateDisplay }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>

                {{-- Received by --}}
                <td class="sig-cell">
                    <div class="sig-header">Received by:</div>
                    <table style="width: 85%; margin: 0 auto 4px auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 2px 2px 2px; font-weight: bold; text-align: center; text-transform: uppercase; line-height: 1.15; {{ $getNameStyle($receivedName, '9pt') }}">
                                    {{ $receivedName }}
                                </td>
                            </tr>
                            <tr>
                                <td style="border: none; text-align: center; font-size: 7pt; padding-top: 2px; line-height: 1.1;">
                                    Signature over Printed Name of End-User /<br>Accountable Officer
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table style="width: 100%; margin-top: 4px; border-collapse: collapse; table-layout: fixed;">
                        <colgroup>
                            <col style="width: 60px;">
                            <col style="width: 220px;">
                        </colgroup>
                        <tbody>
                            <tr>
                                <td style="border: none; font-weight: bold; font-size: 8pt; vertical-align: middle; padding: 1.5px 0;">Position:</td>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 1.5px 4px; vertical-align: middle; font-size: 8pt; line-height: 1.1;">
                                    {{ $receivedPos }}
                                </td>
                            </tr>
                            <tr>
                                <td style="border: none; font-weight: bold; font-size: 8pt; vertical-align: middle; padding: 3px 0 1.5px 0;">Office:</td>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 3px 4px 1.5px 4px; vertical-align: middle; font-size: 8pt; line-height: 1.1;">
                                    {{ $receivedOff }}
                                </td>
                            </tr>
                            <tr>
                                <td style="border: none; font-weight: bold; font-size: 8pt; vertical-align: middle; padding: 3px 0 1.5px 0;">Date:</td>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 3px 4px 1.5px 4px; vertical-align: middle; font-size: 8pt; line-height: 1.1;">
                                    {{ $receivedDateDisplay }}
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

