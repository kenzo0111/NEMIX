@extends('compliance.pdf.layout')

@section('title', 'Report of Supplies and Materials Issued (RSMI)')

@section('styles')
<style>
    @page {
        size: A4 landscape;
        margin: 8mm;
    }

    .rsmi-container {
        font-family: 'Times-Roman', 'Times New Roman', Times, serif;
        font-size: 8.5pt;
        line-height: 1.15;
        color: #000000;
        background: #ffffff;
        width: 100%;
        max-width: 281mm;
        margin: 0 auto;
        box-sizing: border-box;
    }

    .rsmi-header { margin-bottom: 1.5mm; width: 100%; }
    .rsmi-appendix { text-align: right; font-weight: bold; font-style: italic; font-size: 16pt; line-height: 1; }
    .rsmi-title-row { min-height: 8mm; padding: 1mm 0; line-height: 1.05; text-align: center; }
    .rsmi-title { margin: 0; font-size: 12pt; font-weight: bold; line-height: 1.05; text-align: center; }

    .rsmi-top-info {
        width: 100%;
        margin-bottom: 6px;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .rsmi-top-info td {
        vertical-align: middle;
        font-size: 8.5pt;
        line-height: 1.1;
    }

    .rsmi-field-group { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .rsmi-field-group td { padding: 1.5px 0; }
    .rsmi-field-group tr + tr td { padding-top: 3px; }
    .rsmi-field-label { width: 33%; font-weight: bold; white-space: nowrap; }
    .rsmi-field-value { width: 67%; border-bottom: 1px solid #000000; padding-left: 4px !important; font-size: 8pt !important; white-space: nowrap; }

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
        box-sizing: border-box;
        vertical-align: middle;
        line-height: 1.1;
    }

    .main-table th {
        text-align: center;
        font-weight: bold;
        background-color: #ffffff;
        padding: 0.8mm 1mm;
    }

    .rsmi-continuation-table {
        margin-top: 0;
        border-top: none;
    }

    .rsmi-continuation-table > tbody > tr:first-child > td,
    .rsmi-continuation-table > thead > tr:first-child > th {
        border-top: none;
    }

    .empty-row td {
        height: 4mm !important;
        min-height: 4mm !important;
        padding: 0 1mm !important;
        line-height: 1 !important;
    }

    .header-italic {
        font-style: italic;
        font-weight: normal !important;
        padding: 0.8mm 1mm !important;
        line-height: 1.1;
    }

    .responsibility-center-code {
        text-align: center !important;
        vertical-align: middle !important;
        white-space: nowrap;
        overflow: hidden;
    }

    .stock-no-cell {
        text-align: center !important;
        vertical-align: middle !important;
        word-wrap: break-word;
        overflow-wrap: anywhere;
    }

    .rsmi-group-cell {
        text-align: center !important;
        vertical-align: middle !important;
    }

    .border-bottom-bold {
        border-bottom: 1.5px solid #000000 !important;
    }

    .rsmi-money { font-family: 'DejaVu Serif', serif; }

    .footer-cell {
        vertical-align: top !important;
        padding: 1.5mm 2.5mm !important;
    }

    .certify-text {
        margin-bottom: 4.5mm;
        font-size: 8pt;
        line-height: 1.1;
    }

    .posted-text {
        margin-bottom: 4.5mm;
        font-size: 8pt;
        line-height: 1.1;
    }

    .rsmi-signatures {
        page-break-inside: avoid;
    }
</style>
@endsection

@section('content')
@foreach($forms as $formIndex => $form)
@php
    $entityName = data_get($form, 'entityName') ?? data_get($form, 'entity_name') ?? 'UNIVERSITY OF CAMARINES NORTE';
    $fundCluster = data_get($form, 'fundCluster') ?? data_get($form, 'fund_cluster') ?? '01 - Regular Agency Fund';
    if ($fundCluster === '01' || $fundCluster === 'General Fund' || $fundCluster === 'Regular Agency Fund') {
        $fundCluster = '01 - Regular Agency Fund';
    }

    $serialNo = data_get($form, 'serialNo') ?? data_get($form, 'serial_no') ?? '';
    
    $rawDate = data_get($form, 'date');
    $displayDate = '';
    if ($rawDate) {
        try {
            $displayDate = \Carbon\Carbon::parse($rawDate)->format('m/d/Y');
        } catch (\Throwable $e) {
            $displayDate = $rawDate;
        }
    }

    $itemsList = data_get($form, 'issuedItems') ?? data_get($form, 'issued_items') ?? [];
    $targetRowCount = 10;

    // Group items by RIS No. and Responsibility Center Code
    $groupsMap = [];
    foreach ($itemsList as $item) {
        $risNo = data_get($item, 'risNo') ?? data_get($item, 'ris_no') ?? '';
        
        $rcObj = data_get($item, 'responsibility_center');
        $rcc = data_get($rcObj, 'code') 
            ?? data_get($rcObj, 'acronym') 
            ?? data_get($item, 'responsibilityCenterCode') 
            ?? data_get($item, 'responsibility_center_code') 
            ?? (is_string($rcObj) ? $rcObj : '');

        $key = $risNo . '__' . $rcc;
        if (!isset($groupsMap[$key])) {
            $groupsMap[$key] = [
                'risNo' => $risNo,
                'displayCode' => $rcc ?: '',
                'items' => [],
            ];
        }
        $groupsMap[$key]['items'][] = $item;
    }
    $groups = array_values($groupsMap);

    $recap = data_get($form, 'recapitulationItems') ?? data_get($form, 'recapitulation_items') ?? [];
    $recapTargetCount = 3;
    $paddedRecap = array_merge($recap, array_fill(0, max(0, $recapTargetCount - count($recap)), []));

    $supplyCustodianName = strtoupper((string)(data_get($form, 'supplyCustodianName') ?? 'ALBERTO DE VERA JR'));
    $accountingStaffName = strtoupper((string)(data_get($form, 'accountingStaffName') ?? 'ALBERTO DE VERA JR'));
    
    $rawAcctDate = data_get($form, 'accountingDate') ?? $rawDate;
    $accountingDateDisplay = '';
    if ($rawAcctDate) {
        try {
            $accountingDateDisplay = \Carbon\Carbon::parse($rawAcctDate)->format('m/d/Y');
        } catch (\Throwable $e) {
            $accountingDateDisplay = $rawAcctDate;
        }
    }

    $getNameStyle = function($name, $defaultSize = '8.5pt') {
        if (!$name) return 'font-size: ' . $defaultSize . '; white-space: nowrap;';
        $len = strlen(trim($name));
        if ($len > 30) return 'font-size: 6.8pt; white-space: nowrap;';
        if ($len > 18) return 'font-size: 7pt; white-space: nowrap;';
        return 'font-size: ' . $defaultSize . '; white-space: nowrap;';
    };
@endphp

<div class="report-page rsmi-container">
    <div class="rsmi-header">
        <div class="rsmi-appendix">Appendix 64</div>
        <div class="rsmi-title-row">
            <h1 class="rsmi-title">REPORT OF SUPPLIES AND MATERIALS ISSUED</h1>
        </div>
    </div>

    {{-- Top Info Grid --}}
    <table class="rsmi-top-info">
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
                <td width="12%" style="font-weight: bold; white-space: nowrap; padding: 1.5px 0;">Serial No. :</td>
                <td width="32%" style="border-bottom: 1px solid #000000; padding: 1.5px 4px; font-size: 8.5pt; line-height: 1.1;">{{ $serialNo }}</td>
            </tr>
            <tr>
                <td width="12%" style="font-weight: bold; white-space: nowrap; padding: 3px 0 1.5px 0;">Fund Cluster:</td>
                <td width="40%" style="border-bottom: 1px solid #000000; padding: 3px 4px 1.5px 4px; font-size: 8.5pt; line-height: 1.1;">{{ $fundCluster }}</td>
                <td width="4%">&nbsp;</td>
                <td width="12%" style="font-weight: bold; white-space: nowrap; padding: 3px 0 1.5px 0;">Date :</td>
                <td width="32%" style="border-bottom: 1px solid #000000; padding: 3px 4px 1.5px 4px; font-size: 8.5pt; line-height: 1.1;">{{ $displayDate }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Main Grid Section Labels --}}
    <table class="main-table">
        <colgroup>
            <col width="71%" style="width: 71%;">
            <col width="29%" style="width: 29%;">
        </colgroup>
        <tbody>
            <tr>
                <td width="71%" class="header-italic text-center">To be filled up by the Supply and/or Property Division/Unit</td>
                <td width="29%" class="header-italic text-center">To be filled up by the Accounting Division/Unit</td>
            </tr>
        </tbody>
    </table>

    {{-- Main Items Grid --}}
    <table class="main-table rsmi-continuation-table">
        <colgroup>
            <col width="8%" style="width: 8%;">
            <col width="10%" style="width: 10%;">
            <col width="14%" style="width: 14%;">
            <col width="25%" style="width: 25%;">
            <col width="6%" style="width: 6%;">
            <col width="8%" style="width: 8%;">
            <col width="11%" style="width: 11%;">
            <col width="18%" style="width: 18%;">
        </colgroup>
        <thead>
            <tr>
                <th width="8%">RIS No.</th>
                <th width="10%">Responsibility<br>Center Code</th>
                <th width="14%">Stock No.</th>
                <th width="25%">Item</th>
                <th width="6%">Unit</th>
                <th width="8%">Quantity<br>Issued</th>
                <th width="11%">Unit Cost</th>
                <th width="18%">Amount</th>
            </tr>
        </thead>
        <tbody>
            {{-- Upper Section: Main Items --}}
            @php $totalRenderedRows = 0; @endphp
            @foreach($groups as $groupIdx => $group)
                @foreach($group['items'] as $itemIdx => $item)
                    @php $totalRenderedRows++; @endphp
                    <tr>
                        @if($itemIdx === 0)
                            <td width="8%" class="text-center rsmi-group-cell" rowspan="{{ count($group['items']) }}">
                                {{ preg_replace('/^RIS-/i', '', (string) (data_get($group, 'risNo') ?: '')) }}
                            </td>
                            <td width="10%" class="responsibility-center-code text-center rsmi-group-cell" rowspan="{{ count($group['items']) }}">
                                {{ data_get($group, 'displayCode') ?: '' }}
                            </td>
                        @endif
                        <td width="14%" class="stock-no-cell">{{ data_get($item, 'supplier_stock_no') ?? data_get($item, 'stock_no') ?? data_get($item, 'stockNo') ?? '' }}</td>
                        <td width="25%" class="text-left">{!! nl2br(e(data_get($item, 'itemDescription') ?? data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                        <td width="6%" class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                        <td width="8%" class="text-right">
                            @php $qty = data_get($item, 'quantityIssued') ?? data_get($item, 'quantity'); @endphp
                            {{ $qty !== null && $qty !== '' ? $qty : '' }}
                        </td>
                        <td width="11%" class="text-right">
                            @php $uCost = data_get($item, 'unitCost') ?? data_get($item, 'unit_cost'); @endphp
                            <span class="rsmi-money">@if(is_numeric($uCost))₱{{ number_format((float)$uCost, 2) }}@else{{ $uCost ?? '' }}@endif</span>
                        </td>
                        <td width="18%" class="text-right">
                            @php $amt = data_get($item, 'amount'); @endphp
                            <span class="rsmi-money">@if(is_numeric($amt))₱{{ number_format((float)$amt, 2) }}@else{{ $amt ?? '' }}@endif</span>
                        </td>
                    </tr>
                @endforeach
            @endforeach

            {{-- Padded Empty Rows --}}
            @for($i = $totalRenderedRows; $i < $targetRowCount; $i++)
                <tr class="empty-row">
                    <td width="8%" class="text-center">&nbsp;</td>
                    <td width="10%" class="responsibility-center-code text-center">&nbsp;</td>
                    <td width="14%" class="stock-no-cell">&nbsp;</td>
                    <td width="25%" class="text-left">&nbsp;</td>
                    <td width="6%" class="text-center">&nbsp;</td>
                    <td width="8%" class="text-right">&nbsp;</td>
                    <td width="11%" class="text-right">&nbsp;</td>
                    <td width="18%" class="text-right">&nbsp;</td>
                </tr>
            @endfor
        </tbody>
    </table>

    {{-- Recapitulation Section Labels --}}
    <table class="main-table rsmi-continuation-table">
        <colgroup>
            <col width="71%" style="width: 71%;">
            <col width="29%" style="width: 29%;">
        </colgroup>
        <tbody>
            <tr class="border-bottom-bold">
                <td width="71%" class="text-center font-bold" style="padding: 0.6mm 1mm;">Recapitulation:</td>
                <td width="29%" class="text-center font-bold" style="padding: 0.6mm 1mm;">Recapitulation:</td>
            </tr>
        </tbody>
    </table>

    {{-- Recapitulation Grid --}}
    <table class="main-table rsmi-continuation-table">
        <colgroup>
            <col width="32%" style="width: 32%;">
            <col width="39%" style="width: 39%;">
            <col width="11%" style="width: 11%;">
            <col width="11%" style="width: 11%;">
            <col width="7%" style="width: 7%;">
        </colgroup>
        <tbody>
            <tr>
                <td width="32%" class="text-center font-bold">Stock No.</td>
                <td width="39%" class="text-center font-bold">Quantity</td>
                <td width="11%" class="text-center font-bold">Unit Cost</td>
                <td width="11%" class="text-center font-bold">Total Cost</td>
                <td width="7%" class="text-center font-bold">UACS Object Code</td>
            </tr>

            {{-- Lower Section: Recapitulation Rows --}}
            @foreach($paddedRecap as $r)
                @php
                    $rStockNo = data_get($r, 'supplier_stock_no') ?? data_get($r, 'stock_no') ?? data_get($r, 'stockNo');
                    $rQty = data_get($r, 'quantity');
                    $rUnitCost = data_get($r, 'unitCost') ?? data_get($r, 'unit_cost');
                    $rTotalCost = data_get($r, 'totalCost') ?? data_get($r, 'total_cost');
                    $rUacs = data_get($r, 'uacsObjectCode') ?? data_get($r, 'uacs_code');
                    $isEmptyRecap = empty($rStockNo) && empty($rQty) && empty($rUnitCost) && empty($rTotalCost);
                @endphp
                <tr class="{{ $isEmptyRecap ? 'empty-row' : '' }}">
                    <td width="32%" class="stock-no-cell">{{ $rStockNo ?? '' }}</td>
                    <td width="39%" class="text-center">{{ $rQty !== null && $rQty !== '' ? $rQty : '' }}</td>
                    <td width="11%" class="text-right">
                        <span class="rsmi-money">@if(is_numeric($rUnitCost))₱{{ number_format((float)$rUnitCost, 2) }}@else{{ $rUnitCost ?? '' }}@endif</span>
                    </td>
                    <td width="11%" class="text-right">
                        <span class="rsmi-money">@if(is_numeric($rTotalCost))₱{{ number_format((float)$rTotalCost, 2) }}@else{{ $rTotalCost ?? '' }}@endif</span>
                    </td>
                    <td width="7%" class="text-center">{{ $rUacs ?? '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Footer / Signatures --}}
    <table class="main-table rsmi-continuation-table">
        <tbody>
            <tr class="rsmi-signatures">
                <td style="padding: 0; border: none;">
                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                        <colgroup>
                            <col width="50%" style="width: 50%;">
                            <col width="50%" style="width: 50%;">
                        </colgroup>
                        <tbody>
                            <tr>
                                <td width="50%" class="footer-cell" style="border: none; border-right: 1.5px solid #000000; vertical-align: top; padding: 3px 8px;">
                                    <div class="certify-text">I hereby certify to the correctness of the above information.</div>
                                    <table style="width: 85%; margin: 0 auto; border-collapse: collapse;">
                                        <tbody>
                                            <tr>
                                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 2px 2px 2px; font-weight: bold; text-align: center; text-transform: uppercase; line-height: 1.15; {{ $getNameStyle($supplyCustodianName, '8.5pt') }}">
                                                    {{ $supplyCustodianName }}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="border: none; text-align: center; font-size: 7pt; padding-top: 2px; line-height: 1.1;">
                                                    <span style="white-space: nowrap;">Signature over Printed Name of Supply and/or</span><br><span style="white-space: nowrap;">Property Custodian</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td width="50%" class="footer-cell" style="border: none; vertical-align: top; padding: 3px 8px;">
                                    <div class="posted-text">Posted by:</div>
                                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                                        <colgroup>
                                            <col width="68%" style="width: 68%;">
                                            <col width="4%" style="width: 4%;">
                                            <col width="28%" style="width: 28%;">
                                        </colgroup>
                                        <tbody>
                                            <tr>
                                                <td width="68%" style="border: none; border-bottom: 1px solid #000000; padding: 0 2px 2px 2px; font-weight: bold; text-align: center; text-transform: uppercase; line-height: 1.15; {{ $getNameStyle($accountingStaffName, '8.5pt') }}">
                                                    {{ $accountingStaffName }}
                                                </td>
                                                <td width="4%" style="border: none;">&nbsp;</td>
                                                <td width="28%" style="border: none; border-bottom: 1px solid #000000; padding: 0 2px 2px 2px; text-align: center; font-size: 8pt; line-height: 1.15; white-space: nowrap;">
                                                    {{ $accountingDateDisplay }}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="68%" style="border: none; text-align: center; font-size: 7pt; padding-top: 2px; line-height: 1.1;">
                                                    <span style="white-space: nowrap;">Signature over Printed Name of</span><br><span style="white-space: nowrap;">Designated Accounting Staff</span>
                                                </td>
                                                <td width="4%" style="border: none;">&nbsp;</td>
                                                <td width="28%" style="border: none; text-align: center; font-size: 7pt; padding-top: 2px; line-height: 1.1; vertical-align: top;">
                                                    Date
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</div>
@endforeach
@endsection
