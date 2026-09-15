@extends('compliance.pdf.layout')

@section('title', 'Report on the Physical Count of Inventories (RPCI)')

@section('styles')
<style>
    @page {
        size: A4 landscape;
        margin: 8mm;
    }

    .rpci-container {
        font-family: 'Times-Roman', 'Times New Roman', Times, serif;
        font-size: 8.5pt;
        line-height: 1.15;
        color: #000000;
        background: #ffffff;
        width: 100%;
        margin: 0 auto;
    }

    .rpci-header { margin-bottom: 1.5mm; width: 100%; }
    .rpci-appendix { text-align: right; font-weight: bold; font-size: 8.5pt; line-height: 1; }
    .rpci-title-row { min-height: 8mm; padding: 1mm 0; line-height: 1.05; text-align: center; }
    .rpci-title { margin: 0; font-size: 12pt; font-weight: bold; line-height: 1.05; text-align: center; }

    .rpci-top-info {
        width: 100%;
        margin-bottom: 4px;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .rpci-top-info td {
        vertical-align: middle;
        font-size: 8.5pt;
        line-height: 1.1;
    }

    .accountability-table {
        width: 100%;
        margin-bottom: 6px;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 6pt;
        line-height: 1.05;
    }

    .accountability-table td {
        vertical-align: bottom;
        font-size: 6pt;
        line-height: 1.05;
        padding: 0;
        white-space: nowrap;
    }

    .accountability-entity,
    .accountability-date { font-size: 5.3pt !important; }

    .rpci-money { font-family: 'DejaVu Serif', serif; }

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
        text-align: center;
        vertical-align: middle;
        line-height: 1.1;
    }

    .main-table th {
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

    .footer-table {
        margin-top: 1.5mm;
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        page-break-inside: avoid;
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
@php
    $rpciData = $rpci ?? $dataset ?? [];
    $inventoryType = data_get($rpciData, 'inventory_type') ?? data_get($rpciData, 'inventoryType') ?? '';
    
    $rawAsAtDate = data_get($rpciData, 'as_at_date') ?? data_get($rpciData, 'date');
    $asAtDateDisplay = '';
    if ($rawAsAtDate) {
        try {
            $asAtDateDisplay = \Carbon\Carbon::parse($rawAsAtDate)->format('F d, Y');
        } catch (\Throwable $e) {
            $asAtDateDisplay = $rawAsAtDate;
        }
    }

    $fundCluster = data_get($rpciData, 'fund_cluster') ?? data_get($rpciData, 'fundCluster') ?? '01 - Regular Agency Fund';
    if ($fundCluster === '01' || $fundCluster === 'General Fund' || $fundCluster === 'Regular Agency Fund') {
        $fundCluster = '01 - Regular Agency Fund';
    }

    $accountableOfficer = data_get($rpciData, 'accountable_officer') ?? 'Arsenio Gem A. Garcillanosa';
    $designation = data_get($rpciData, 'designation') ?? 'Supply Custodian';
    $entityName = data_get($rpciData, 'entity_name') ?? data_get($rpciData, 'entityName') ?? 'UNIVERSITY OF CAMARINES NORTE';
    
    $rawDateAssumption = data_get($rpciData, 'date_assumption');
    $dateAssumptionDisplay = '';
    if ($rawDateAssumption) {
        try {
            $dateAssumptionDisplay = \Carbon\Carbon::parse($rawDateAssumption)->format('m/d/Y');
        } catch (\Throwable $e) {
            $dateAssumptionDisplay = $rawDateAssumption;
        }
    }

    $itemsList = $items ?? data_get($rpciData, 'items') ?? [];
    $targetRowCount = 6;
    $paddedItems = array_merge($itemsList, array_fill(0, max(0, $targetRowCount - count($itemsList)), []));

    // Signatories resolution
    $certName = strtoupper((string)($certifiedByName ?? data_get($rpciData, 'certified_by_name') ?? data_get($rpciData, 'signatories.certified_by.name') ?? ''));
    $apprName = strtoupper((string)($approvedByName ?? data_get($rpciData, 'approved_by_name') ?? data_get($rpciData, 'signatories.approved_by.name') ?? $accountableOfficer));
    $verName = strtoupper((string)($verifiedByName ?? data_get($rpciData, 'verified_by_name') ?? data_get($rpciData, 'signatories.verified_by.name') ?? ''));
    $verPos = $verifiedByPosition ?? data_get($rpciData, 'verified_by_position') ?? data_get($rpciData, 'signatories.verified_by.position') ?? '';
@endphp

<div class="report-page rpci-container">
    <div class="rpci-header">
        <div class="rpci-appendix">Appendix 66</div>
        <div class="rpci-title-row">
            <h1 class="rpci-title">REPORT ON THE PHYSICAL COUNT OF INVENTORIES</h1>
        </div>
    </div>

    {{-- Subtitle / Type of Inventory Item --}}
    <div style="text-align: center; margin-bottom: 1.5mm; line-height: 1.15;">
        <div style="display: inline-block; border-bottom: 1px solid #000000; padding: 0 6px 1.5px 6px; min-width: 240px; font-weight: bold; font-size: 8.5pt; text-align: center;">
            @if(!empty($inventoryType)){{ $inventoryType }}@endif
        </div>
        <div style="margin-top: 1px; font-size: 7.5pt; font-style: italic;">(Type of Inventory Item)</div>
        <div style="margin-top: 3px; font-size: 8.5pt;">
            As at 
            <div style="display: inline-block; border-bottom: 1px solid #000000; padding: 0 6px 1.5px 6px; min-width: 150px; font-weight: bold; font-size: 8.5pt; text-align: center;">
                @if(!empty($asAtDateDisplay)){{ $asAtDateDisplay }}@endif
            </div>
        </div>
    </div>

    {{-- Top Info Grid --}}
    <table class="rpci-top-info">
        <colgroup>
            <col width="85" style="width: 85px;">
            <col width="280" style="width: 280px;">
            <col style="width: auto;">
        </colgroup>
        <tbody>
            <tr>
                <td style="font-weight: bold; white-space: nowrap; padding: 1.5px 0;">Fund Cluster:</td>
                <td style="border-bottom: 1px solid #000000; padding: 1.5px 4px; line-height: 1.1;">{{ $fundCluster }}</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    {{-- Accountability Statement Table --}}
    <table class="accountability-table">
        <colgroup>
            <col width="5%" style="width: 5%;">
            <col width="14%" style="width: 14%;">
            <col width="1%" style="width: 1%;">
            <col width="16%" style="width: 16%;">
            <col width="1%" style="width: 1%;">
            <col width="18%" style="width: 18%;">
            <col width="32%" style="width: 32%;">
            <col width="12%" style="width: 12%;">
            <col width="1%" style="width: 1%;">
        </colgroup>
        <tbody>
            <tr>
                <td style="white-space: nowrap;">For which</td>
                <td style="border-bottom: 1px solid #000000; font-weight: bold; text-align: center; padding: 0 3px 1px 3px;">{{ $accountableOfficer }}</td>
                <td style="text-align: center;">,</td>
                <td style="border-bottom: 1px solid #000000; font-weight: bold; text-align: center; padding: 0 3px 1px 3px;">{{ $designation }}</td>
                <td style="text-align: center;">,</td>
                <td class="accountability-entity" style="border-bottom: 1px solid #000000; font-weight: bold; text-align: center; padding: 0 3px 1px 3px;">{{ $entityName }}</td>
                <td style="white-space: nowrap; padding: 0 3px;">is accountable, having assumed such accountability on</td>
                <td class="accountability-date" style="border-bottom: 1px solid #000000; font-weight: bold; text-align: center; padding: 0 3px 1px 3px;">@if(!empty($dateAssumptionDisplay)){{ $dateAssumptionDisplay }}@endif</td>
                <td>.</td>
            </tr>
        </tbody>
    </table>

    {{-- Main RPCI Table --}}
    <table class="main-table">
        <colgroup>
            <col width="8%" style="width: 8%;">  {{-- Article --}}
            <col width="20%" style="width: 20%;"> {{-- Description --}}
            <col width="12%" style="width: 12%;"> {{-- Stock Number --}}
            <col width="6%" style="width: 6%;">  {{-- Unit of Measure --}}
            <col width="8%" style="width: 8%;">  {{-- Unit Value --}}
            <col width="8%" style="width: 8%;">  {{-- Balance Per Card --}}
            <col width="8%" style="width: 8%;">  {{-- On Hand Per Count --}}
            <col width="7%" style="width: 7%;">  {{-- Shortage Qty --}}
            <col width="7%" style="width: 7%;">  {{-- Shortage Value --}}
            <col width="16%" style="width: 16%;"> {{-- Remarks --}}
        </colgroup>
        <thead>
            <tr>
                <th width="8%" rowspan="2">Article</th>
                <th width="20%" rowspan="2">Description</th>
                <th width="12%" rowspan="2">Stock Number</th>
                <th width="6%" rowspan="2">Unit of<br>Measure</th>
                <th width="8%" rowspan="2">Unit Value</th>
                <th width="8%">Balance Per Card</th>
                <th width="8%">On Hand Per Count</th>
                <th width="14%" colspan="2">Shortage/Overage</th>
                <th width="16%" rowspan="2">Remarks</th>
            </tr>
            <tr>
                <th>(Quantity)</th>
                <th>(Quantity)</th>
                <th width="7%">Quantity</th>
                <th width="7%">Value</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paddedItems as $item)
                @php $isEmpty = empty($item); @endphp
                <tr class="{{ $isEmpty ? 'empty-row' : '' }}">
                    <td>{{ data_get($item, 'article') ?? '' }}</td>
                    <td class="text-left">{!! nl2br(e(data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                    <td style="white-space: nowrap;">{{ data_get($item, 'supplier_stock_no') ?? data_get($item, 'stock_no') ?? '' }}</td>
                    <td>{{ data_get($item, 'unit') ?? '' }}</td>
                    <td class="text-right">
                        @php $uVal = data_get($item, 'unit_value') ?? data_get($item, 'unit_cost'); @endphp
                        <span class="rpci-money">@if(is_numeric($uVal))₱{{ number_format((float)$uVal, 2) }}@else{{ $uVal ?? '' }}@endif</span>
                    </td>
                    <td class="text-right">
                        @php $bCard = data_get($item, 'balance_per_card') ?? data_get($item, 'quantity'); @endphp
                        {{ $bCard !== null && $bCard !== '' ? $bCard : '' }}
                    </td>
                    <td class="text-right">
                        @php $oHand = data_get($item, 'on_hand_count') ?? data_get($item, 'physical_count'); @endphp
                        {{ $oHand !== null && $oHand !== '' ? $oHand : '' }}
                    </td>
                    <td class="text-right">
                        @php $sQty = data_get($item, 'shortage_qty') ?? data_get($item, 'variance'); @endphp
                        {{ $sQty !== null && $sQty !== '' ? $sQty : '' }}
                    </td>
                    <td class="text-right">
                        @php $sVal = data_get($item, 'shortage_value'); @endphp
                        <span class="rpci-money">@if(is_numeric($sVal))₱{{ number_format((float)$sVal, 2) }}@else{{ $sVal ?? '' }}@endif</span>
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
                {{-- Certified Correct --}}
                <td>
                    <div style="margin-bottom: 4.5mm; font-weight: bold;">Certified Correct by:</div>
                    <table style="width: 90%; margin: 0 auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 3px 2px 3px; font-weight: bold; text-align: center; font-size: 8pt; text-transform: uppercase;">
                                    @if(!empty($certName)){{ $certName }}@endif
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

                {{-- Approved by --}}
                <td>
                    <div style="margin-bottom: 4.5mm; font-weight: bold;">Approved by:</div>
                    <table style="width: 90%; margin: 0 auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 3px 2px 3px; font-weight: bold; text-align: center; font-size: 8pt; text-transform: uppercase;">
                                    {{ $apprName ?: 'ARSENIO GEM A. GARCILLANOSA' }}
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

                {{-- Verified by --}}
                <td>
                    <div style="margin-bottom: 4.5mm; font-weight: bold;">Verified by:</div>
                    <table style="width: 90%; margin: 0 auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 3px 2px 3px; font-weight: bold; text-align: center; font-size: 8pt; text-transform: uppercase;">
                                    @if(!empty($verName)){{ $verName }}@endif
                                </td>
                            </tr>
                            @if(!empty($verPos) && strtolower(trim($verPos)) !== 'coa representative')
                                <tr>
                                    <td style="border: none; text-align: center; font-size: 7.5pt; padding-top: 1px; line-height: 1.1;">
                                        {{ $verPos }}
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
