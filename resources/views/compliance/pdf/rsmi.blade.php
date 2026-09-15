@extends('compliance.pdf.layout')

@section('title', 'Report of Supplies and Materials Issued (RSMI)')

@section('styles')
<style>
    @page {
        size: A4 landscape;
        margin: 8mm 8mm 8mm 8mm;
    }

    .rsmi-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 1.5px solid #000000;
    }

    .rsmi-table th,
    .rsmi-table td {
        border: 1px solid #000000;
        padding: 3px 4px;
        font-size: 7.5pt;
        vertical-align: middle;
        line-height: 1.15;
        word-wrap: break-word;
    }

    .rsmi-table th {
        font-weight: bold;
        text-align: center;
        background-color: #ffffff;
        padding: 4px 3px;
    }

    .rsmi-group-cell {
        text-align: center;
        vertical-align: middle;
    }

    .empty-row td {
        height: 16px;
        line-height: 1;
    }

    .border-top-bold {
        border-top: 1.5px solid #000000 !important;
    }
</style>
@endsection

@section('content')
@foreach($forms as $formIndex => $form)
<div class="report-page">
    <div class="official-appendix">Appendix 64</div>
    <div class="official-title">REPORT OF SUPPLIES AND MATERIALS ISSUED</div>

    {{-- Header Info Table --}}
    <table class="form-table" style="margin-bottom: 8px;">
        <colgroup>
            <col style="width: 10%;">
            <col style="width: 44%;">
            <col style="width: 4%;">
            <col style="width: 10%;">
            <col style="width: 32%;">
        </colgroup>
        <tbody>
            <tr>
                <td class="form-label">Entity Name:</td>
                <td class="form-value">{{ $form['entityName'] ?? 'UNIVERSITY OF CAMARINES NORTE' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">Serial No. :</td>
                <td class="form-value">{{ $form['serialNo'] ?? '' }}</td>
            </tr>
            <tr>
                <td class="form-label">Fund Cluster:</td>
                <td class="form-value">{{ $form['fundCluster'] ?? '01 - Regular Agency Fund' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">Date :</td>
                <td class="form-value">{{ $form['date'] ? \Carbon\Carbon::parse($form['date'])->format('m/d/Y') : '' }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Main 9-Column Table --}}
    @php
        $issuedItems = $form['issuedItems'] ?? [];
        $targetRowCount = 8;
        
        // Group items by RIS No + RCC
        $groupsMap = [];
        foreach ($issuedItems as $item) {
            $risNo = data_get($item, 'risNo') ?? data_get($item, 'ris_no') ?? '-';
            $rcc = data_get($item, 'responsibilityCenterCode') ?? data_get($item, 'responsibility_center_code') ?? data_get($item, 'center_code') ?? '-';
            $key = $risNo . '___' . $rcc;
            if (!isset($groupsMap[$key])) {
                $groupsMap[$key] = [
                    'risNo' => $risNo,
                    'rcc' => $rcc,
                    'items' => []
                ];
            }
            $groupsMap[$key]['items'][] = $item;
        }
        $groups = array_values($groupsMap);
        
        $recapItems = $form['recapitulationItems'] ?? [];
        $recapTargetCount = 3;
        $paddedRecap = array_merge($recapItems, array_fill(0, max(0, $recapTargetCount - count($recapItems)), []));
    @endphp

    <table class="rsmi-table">
        <colgroup>
            <col style="width: 9%;">  {{-- RIS No. --}}
            <col style="width: 11%;"> {{-- RCC --}}
            <col style="width: 15%;"> {{-- Stock No. --}}
            <col style="width: 26%;"> {{-- Item --}}
            <col style="width: 7%;">  {{-- Unit --}}
            <col style="width: 8%;">  {{-- Qty --}}
            <col style="width: 10%;"> {{-- Unit Cost --}}
            <col style="width: 14%;"> {{-- Amount (colspan 2) --}}
        </colgroup>
        <thead>
            <tr>
                <th colspan="6" class="italic font-normal">To be filled up by the Supply and/or Property Division/Unit</th>
                <th colspan="2" class="italic font-normal">To be filled up by the Accounting Division/Unit</th>
            </tr>
            <tr>
                <th>RIS No.</th>
                <th>Responsibility<br>Center Code</th>
                <th>Stock No.</th>
                <th>Item</th>
                <th>Unit</th>
                <th>Quantity<br>Issued</th>
                <th>Unit Cost</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            {{-- Main Issuance Rows --}}
            @if(count($groups) > 0)
                @foreach($groups as $groupIdx => $group)
                    @foreach($group['items'] as $itemIdx => $item)
                        <tr>
                            @if($itemIdx === 0)
                                <td class="rsmi-group-cell" rowspan="{{ count($group['items']) }}">
                                    {{ data_get($group, 'risNo') }}
                                </td>
                                <td class="rsmi-group-cell" rowspan="{{ count($group['items']) }}">
                                    {{ data_get($group, 'rcc') }}
                                </td>
                            @endif
                            <td class="text-center">{{ data_get($item, 'supplier_stock_no') ?? data_get($item, 'stock_no') ?? data_get($item, 'stockNo') ?? '' }}</td>
                            <td class="text-left">{{ data_get($item, 'itemDescription') ?? data_get($item, 'item_name') ?? data_get($item, 'item') ?? '' }}</td>
                            <td class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                            <td class="text-right">{{ data_get($item, 'quantityIssued') ?? data_get($item, 'quantity') ?? '' }}</td>
                            <td class="text-right">
                                @if(is_numeric(data_get($item, 'unitCost')))
                                    ₱{{ number_format((float)data_get($item, 'unitCost'), 2) }}
                                @else
                                    {{ data_get($item, 'unitCost') ?? '' }}
                                @endif
                            </td>
                            <td class="text-right">
                                @if(is_numeric(data_get($item, 'amount')))
                                    ₱{{ number_format((float)data_get($item, 'amount'), 2) }}
                                @else
                                    {{ data_get($item, 'amount') ?? '' }}
                                @endif
                            </td>
                        </tr>
                    @endforeach
                @endforeach
            @else
                @for($i = 0; $i < $targetRowCount; $i++)
                    <tr class="empty-row">
                        <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                        <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                    </tr>
                @endfor
            @endif

            {{-- Recapitulation Header --}}
            <tr class="border-top-bold">
                <td colspan="6" class="text-center font-bold">Recapitulation:</td>
                <td colspan="2" class="text-center font-bold">Recapitulation:</td>
            </tr>
            <tr>
                <td colspan="3" class="text-center font-bold">Stock No.</td>
                <td colspan="2" class="text-center font-bold">Quantity</td>
                <td class="text-center font-bold">Unit Cost</td>
                <td class="text-center font-bold">Total Cost</td>
                <td class="text-center font-bold">UACS Object Code</td>
            </tr>

            {{-- Recapitulation Rows --}}
            @foreach($paddedRecap as $recap)
                <tr class="{{ empty($recap['stockNo']) && empty($recap['stock_no']) && empty($recap['supplier_stock_no']) ? 'empty-row' : '' }}">
                    <td colspan="3" class="text-center">{{ data_get($recap, 'supplier_stock_no') ?? data_get($recap, 'stock_no') ?? data_get($recap, 'stockNo') ?? '' }}</td>
                    <td colspan="2" class="text-center">{{ data_get($recap, 'quantity') ?? '' }}</td>
                    <td class="text-right">
                        @if(is_numeric(data_get($recap, 'unitCost')))
                            ₱{{ number_format((float)data_get($recap, 'unitCost'), 2) }}
                        @else
                            {{ data_get($recap, 'unitCost') ?? '' }}
                        @endif
                    </td>
                    <td class="text-right">
                        @if(is_numeric(data_get($recap, 'totalCost')))
                            ₱{{ number_format((float)data_get($recap, 'totalCost'), 2) }}
                        @else
                            {{ data_get($recap, 'totalCost') ?? '' }}
                        @endif
                    </td>
                    <td class="text-center">{{ data_get($recap, 'uacsObjectCode') ?? data_get($recap, 'uacs_code') ?? '' }}</td>
                </tr>
            @endforeach

            {{-- Signatures Footer --}}
            <tr>
                <td colspan="8" style="padding: 0; border-top: 1.5px solid #000000;">
                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                        <colgroup>
                            <col style="width: 50%;">
                            <col style="width: 50%;">
                        </colgroup>
                        <tbody>
                            <tr>
                                <td style="vertical-align: top; padding: 6px 12px; border-right: 1.5px solid #000000;">
                                    <div style="font-size: 8pt; margin-bottom: 14px;">I hereby certify to the correctness of the above information.</div>
                                    <table style="width: 85%; margin: 0 auto; border-collapse: collapse;">
                                        <tbody>
                                            <tr>
                                                <td class="signatory-name">
                                                    {{ $form['supplyCustodianName'] ?? 'ALBERTO DE VERA JR' }}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="signatory-caption">
                                                    Signature over Printed Name of Supply and/or<br>Property Custodian
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td style="vertical-align: top; padding: 6px 12px;">
                                    <div style="font-size: 8pt; margin-bottom: 14px;">Posted by:</div>
                                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                                        <colgroup>
                                            <col style="width: 70%;">
                                            <col style="width: 5%;">
                                            <col style="width: 25%;">
                                        </colgroup>
                                        <tbody>
                                            <tr>
                                                <td class="signatory-name">
                                                    {{ $form['accountingStaffName'] ?? 'ALBERTO DE VERA JR' }}
                                                </td>
                                                <td>&nbsp;</td>
                                                <td class="signatory-name" style="font-weight: normal;">
                                                    {{ $form['accountingDate'] ? \Carbon\Carbon::parse($form['accountingDate'])->format('m/d/Y') : '' }}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="signatory-caption">
                                                    Signature over Printed Name of<br>Designated Accounting Staff
                                                </td>
                                                <td>&nbsp;</td>
                                                <td class="signatory-caption" style="vertical-align: top;">
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
