@extends('compliance.pdf.layout')

@section('title', 'Report of Supplies and Materials Issued (RSMI)')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm;
    }

    .rsmi-container {
        font-family: 'Times-Roman', 'Times New Roman', Times, serif;
        font-size: 8.5pt;
        line-height: 1.15;
        color: #000000;
        background: #ffffff;
        width: 100%;
        margin: 0 auto;
    }

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

    .header-italic {
        font-style: italic;
        font-weight: normal !important;
        padding: 0.8mm 1mm !important;
        line-height: 1.1;
    }

    .responsibility-center-code,
    .rsmi-responsibility-center-code {
        text-align: center !important;
        vertical-align: middle !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: clip !important;
    }

    .stock-no-cell {
        text-align: center !important;
        vertical-align: middle !important;
        white-space: nowrap !important;
    }

    .rsmi-group-cell {
        text-align: center !important;
        vertical-align: middle !important;
    }

    .border-bottom-bold {
        border-bottom: 1.5px solid #000000 !important;
    }

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
                'displayCode' => $rcc ?: '&nbsp;',
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
        if ($len > 22) return 'font-size: 7.5pt; white-space: nowrap;';
        return 'font-size: ' . $defaultSize . '; white-space: nowrap;';
    };
@endphp

<div class="report-page rsmi-container">
    <div class="official-form-header">
        <div class="official-form-appendix">Appendix 64</div>
        <div class="official-form-title-row">
            <h1 class="official-form-title">REPORT OF SUPPLIES AND MATERIALS ISSUED</h1>
        </div>
    </div>

    {{-- Top Info Grid --}}
    <table class="rsmi-top-info">
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
                <td style="font-weight: bold; padding: 1.5px 0;">Serial No. :</td>
                <td style="border-bottom: 1px solid #000000; padding: 1.5px 4px;">{{ $serialNo }}</td>
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

    {{-- Main 9-Column Grid Table --}}
    <table class="main-table">
        <colgroup>
            <col style="width: 8%;">  {{-- C1: RIS No. --}}
            <col style="width: 10%;"> {{-- C2: RCC --}}
            <col style="width: 14%;"> {{-- C3: Stock No. --}}
            <col style="width: 25%;"> {{-- C4: Item --}}
            <col style="width: 6%;">  {{-- C5: Unit --}}
            <col style="width: 8%;">  {{-- C6: Qty Issued --}}
            <col style="width: 11%;"> {{-- C7: Unit Cost --}}
            <col style="width: 11%;"> {{-- C8: Amount --}}
            <col style="width: 7%;">  {{-- C9: UACS --}}
        </colgroup>
        <thead>
            <tr>
                <th colspan="6" class="header-italic">To be filled up by the Supply and/or Property Division/Unit</th>
                <th colspan="3" class="header-italic">To be filled up by the Accounting Division/Unit</th>
            </tr>
            <tr>
                <th>RIS No.</th>
                <th>Responsibility<br>Center Code</th>
                <th>Stock No.</th>
                <th>Item</th>
                <th>Unit</th>
                <th>Quantity<br>Issued</th>
                <th>Unit Cost</th>
                <th colspan="2">Amount</th>
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
                            <td class="text-center rsmi-group-cell" rowspan="{{ count($group['items']) }}">
                                {{ data_get($group, 'risNo') ?: '&nbsp;' }}
                            </td>
                            <td class="responsibility-center-code text-center rsmi-group-cell" rowspan="{{ count($group['items']) }}">
                                {!! data_get($group, 'displayCode') ?: '&nbsp;' !!}
                            </td>
                        @endif
                        <td class="stock-no-cell">{{ data_get($item, 'supplier_stock_no') ?? data_get($item, 'stock_no') ?? data_get($item, 'stockNo') ?? '' }}</td>
                        <td class="text-left">{!! nl2br(e(data_get($item, 'itemDescription') ?? data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                        <td class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                        <td class="text-right">
                            @php $qty = data_get($item, 'quantityIssued') ?? data_get($item, 'quantity'); @endphp
                            {{ $qty !== null && $qty !== '' ? $qty : '' }}
                        </td>
                        <td class="text-right">
                            @php $uCost = data_get($item, 'unitCost') ?? data_get($item, 'unit_cost'); @endphp
                            @if(is_numeric($uCost))
                                ₱{{ number_format((float)$uCost, 2) }}
                            @else
                                {{ $uCost ?? '' }}
                            @endif
                        </td>
                        <td colspan="2" class="text-right">
                            @php $amt = data_get($item, 'amount'); @endphp
                            @if(is_numeric($amt))
                                ₱{{ number_format((float)$amt, 2) }}
                            @else
                                {{ $amt ?? '' }}
                            @endif
                        </td>
                    </tr>
                @endforeach
            @endforeach

            {{-- Padded Empty Rows --}}
            @for($i = $totalRenderedRows; $i < $targetRowCount; $i++)
                <tr class="empty-row">
                    <td class="text-center">&nbsp;</td>
                    <td class="responsibility-center-code text-center">&nbsp;</td>
                    <td class="stock-no-cell">&nbsp;</td>
                    <td class="text-left">&nbsp;</td>
                    <td class="text-center">&nbsp;</td>
                    <td class="text-right">&nbsp;</td>
                    <td class="text-right">&nbsp;</td>
                    <td colspan="2" class="text-right">&nbsp;</td>
                </tr>
            @endfor

            {{-- Lower Section: Recapitulation Headers --}}
            <tr class="border-bottom-bold">
                <td colspan="6" class="text-center font-bold" style="padding: 0.6mm 1mm;">Recapitulation:</td>
                <td colspan="3" class="text-center font-bold" style="padding: 0.6mm 1mm;">Recapitulation:</td>
            </tr>
            <tr>
                <td colspan="3" class="text-center font-bold">Stock No.</td>
                <td colspan="3" class="text-center font-bold">Quantity</td>
                <td class="text-center font-bold">Unit Cost</td>
                <td class="text-center font-bold">Total Cost</td>
                <td class="text-center font-bold">UACS Object Code</td>
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
                    <td colspan="3" class="stock-no-cell">{{ $rStockNo ?? '' }}</td>
                    <td colspan="3" class="text-center">{{ $rQty !== null && $rQty !== '' ? $rQty : '' }}</td>
                    <td class="text-right">
                        @if(is_numeric($rUnitCost))
                            ₱{{ number_format((float)$rUnitCost, 2) }}
                        @else
                            {{ $rUnitCost ?? '' }}
                        @endif
                    </td>
                    <td class="text-right">
                        @if(is_numeric($rTotalCost))
                            ₱{{ number_format((float)$rTotalCost, 2) }}
                        @else
                            {{ $rTotalCost ?? '' }}
                        @endif
                    </td>
                    <td class="text-center">{{ $rUacs ?? '' }}</td>
                </tr>
            @endforeach

            {{-- Footer / Signatures --}}
            <tr class="rsmi-signatures">
                <td colspan="9" style="padding: 0; border: none; border-top: 1.5px solid #000000;">
                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                        <colgroup>
                            <col style="width: 50%;">
                            <col style="width: 50%;">
                        </colgroup>
                        <tbody>
                            <tr>
                                <td class="footer-cell" style="border: none; border-right: 1.5px solid #000000; vertical-align: top; padding: 3px 8px;">
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
                                                    Signature over Printed Name of Supply and/or<br>Property Custodian
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td class="footer-cell" style="border: none; vertical-align: top; padding: 3px 8px;">
                                    <div class="posted-text">Posted by:</div>
                                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                                        <colgroup>
                                            <col style="width: 68%;">
                                            <col style="width: 4%;">
                                            <col style="width: 28%;">
                                        </colgroup>
                                        <tbody>
                                            <tr>
                                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 2px 2px 2px; font-weight: bold; text-align: center; text-transform: uppercase; line-height: 1.15; {{ $getNameStyle($accountingStaffName, '8.5pt') }}">
                                                    {{ $accountingStaffName }}
                                                </td>
                                                <td style="border: none;">&nbsp;</td>
                                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 2px 2px 2px; text-align: center; font-size: 8pt; line-height: 1.15; white-space: nowrap;">
                                                    {{ $accountingDateDisplay }}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="border: none; text-align: center; font-size: 7pt; padding-top: 2px; line-height: 1.1;">
                                                    Signature over Printed Name of<br>Designated Accounting Staff
                                                </td>
                                                <td style="border: none;">&nbsp;</td>
                                                <td style="border: none; text-align: center; font-size: 7pt; padding-top: 2px; line-height: 1.1; vertical-align: top;">
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

