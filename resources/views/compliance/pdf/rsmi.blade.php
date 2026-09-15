@extends('compliance.pdf.layout')

@section('title', 'Report of Supplies and Materials Issued (RSMI)')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm;
    }

    .rsmi-container {
        font-family: 'DejaVu Sans', 'Times-Roman', serif;
        font-size: 8.5pt;
        line-height: 1.15;
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
        padding: 0.6mm 1mm;
        font-size: 8pt;
        vertical-align: middle;
        line-height: 1.1;
        word-wrap: break-word;
    }

    .rsmi-table th {
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

    .header-italic {
        font-style: italic;
        font-weight: normal !important;
        padding: 0.8mm 1mm !important;
        line-height: 1.1;
    }

    .footer-cell {
        vertical-align: top !important;
        padding: 1.5mm 2.5mm !important;
    }

    .border-bottom-bold {
        border-bottom: 1.5px solid #000000 !important;
    }
</style>
@endsection

@section('content')
@foreach($forms as $formIndex => $form)
@php $rsmi = $form; @endphp
<div class="report-page rsmi-container">
    <div class="official-header">
        <div class="official-appendix">Appendix 64</div>
        <div class="official-title">REPORT OF SUPPLIES AND MATERIALS ISSUED</div>
    </div>

    {{-- Top Info Grid --}}
    <table class="form-table" style="margin-bottom: 6px;">
        <colgroup>
            <col style="width: 85px;">
            <col style="width: 280px;">
            <col style="width: 25px;">
            <col style="width: 85px;">
            <col style="width: 230px;">
        </colgroup>
        <tbody>
            <tr>
                <td class="form-label">Entity Name:</td>
                <td class="form-value">{{ data_get($rsmi, 'entityName') ?? data_get($rsmi, 'entity_name') ?? 'UNIVERSITY OF CAMARINES NORTE' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">Serial No. :</td>
                <td class="form-value">{{ data_get($rsmi, 'serialNo') ?? data_get($rsmi, 'serial_no') ?? data_get($dataset, 'reference') ?? '' }}</td>
            </tr>
            <tr>
                <td class="form-label">Fund Cluster:</td>
                <td class="form-value">{{ data_get($rsmi, 'fundCluster') ?? data_get($rsmi, 'fund_cluster') ?? '01 - Regular Agency Fund' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">Date :</td>
                <td class="form-value">{{ data_get($rsmi, 'date') ? \Carbon\Carbon::parse(data_get($rsmi, 'date'))->format('m/d/Y') : '' }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Main 9-Column Grid Table --}}
    @php
        $itemsList = $items ?? data_get($rsmi, 'issuedItems') ?? [];
        $targetRowCount = 10;

        // Group items by RIS No. and RCC
        $groupsMap = [];
        foreach ($itemsList as $item) {
            $risNo = data_get($item, 'risNo') ?? data_get($item, 'ris_no') ?? '';
            $rcc = data_get($item, 'responsibilityCenterCode') ?? data_get($item, 'responsibility_center_code') ?? '';
            $key = $risNo . '__' . $rcc;
            if (!isset($groupsMap[$key])) {
                $groupsMap[$key] = [
                    'risNo' => $risNo,
                    'displayCode' => $rcc,
                    'items' => [],
                ];
            }
            $groupsMap[$key]['items'][] = $item;
        }
        $groups = array_values($groupsMap);

        $recap = $recapitulationItems ?? data_get($rsmi, 'recapitulationItems') ?? [];
        $recapTargetCount = 3;
        $paddedRecap = array_merge($recap, array_fill(0, max(0, $recapTargetCount - count($recap)), []));
    @endphp

    <table class="rsmi-table">
        <colgroup>
            <col style="width: 8%;">  {{-- RIS No. --}}
            <col style="width: 10%;"> {{-- RCC --}}
            <col style="width: 14%;"> {{-- Stock No. --}}
            <col style="width: 25%;"> {{-- Item --}}
            <col style="width: 6%;">  {{-- Unit --}}
            <col style="width: 8%;">  {{-- Qty Issued --}}
            <col style="width: 11%;"> {{-- Unit Cost --}}
            <col style="width: 11%;"> {{-- Amount --}}
            <col style="width: 7%;">  {{-- UACS --}}
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
            @php $rowCount = 0; @endphp
            @if(count($groups) > 0)
                @foreach($groups as $groupIdx => $group)
                    @foreach($group['items'] as $itemIdx => $item)
                        @php $rowCount++; @endphp
                        <tr>
                            @if($itemIdx === 0)
                                <td class="text-center" rowspan="{{ count($group['items']) }}">
                                    {{ data_get($group, 'risNo') }}
                                </td>
                                <td class="text-center" rowspan="{{ count($group['items']) }}">
                                    {{ data_get($group, 'displayCode') ?? data_get($group, 'rcc') }}
                                </td>
                            @endif
                            <td class="text-center">{{ data_get($item, 'supplier_stock_no') ?? data_get($item, 'stock_no') ?? data_get($item, 'stockNo') ?? '' }}</td>
                            <td class="text-left">{!! nl2br(e(data_get($item, 'itemDescription') ?? data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                            <td class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                            <td class="text-right">{{ data_get($item, 'quantityIssued') ?? data_get($item, 'quantity') ?? '' }}</td>
                            <td class="text-right">
                                @if(is_numeric(data_get($item, 'unitCost') ?? data_get($item, 'unit_cost')))
                                    ₱{{ number_format((float)(data_get($item, 'unitCost') ?? data_get($item, 'unit_cost')), 2) }}
                                @else
                                    {{ data_get($item, 'unitCost') ?? data_get($item, 'unit_cost') ?? '' }}
                                @endif
                            </td>
                            <td colspan="2" class="text-right">
                                @if(is_numeric(data_get($item, 'amount')))
                                    ₱{{ number_format((float)data_get($item, 'amount'), 2) }}
                                @else
                                    {{ data_get($item, 'amount') ?? '' }}
                                @endif
                            </td>
                        </tr>
                    @endforeach
                @endforeach
            @endif

            {{-- Empty Padding Rows --}}
            @for($i = $rowCount; $i < $targetRowCount; $i++)
                <tr class="empty-row">
                    <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                    <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td colspan="2">&nbsp;</td>
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
            @foreach($paddedRecap as $recap)
                <tr class="{{ empty($recap['stockNo']) && empty($recap['stock_no']) && empty($recap['supplier_stock_no']) ? 'empty-row' : '' }}">
                    <td colspan="3" class="text-center">{{ data_get($recap, 'supplier_stock_no') ?? data_get($recap, 'stock_no') ?? data_get($recap, 'stockNo') ?? '' }}</td>
                    <td colspan="3" class="text-center">{{ data_get($recap, 'quantity') ?? '' }}</td>
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

            {{-- Footer / Signatures --}}
            <tr>
                <td colspan="9" style="padding: 0; border: none; border-top: 1.5px solid #000000;">
                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                        <colgroup>
                            <col style="width: 50%;">
                            <col style="width: 50%;">
                        </colgroup>
                        <tbody>
                            <tr>
                                <td style="vertical-align: top; padding: 1.5mm 2.5mm; border-right: 1.5px solid #000000;">
                                    <div style="font-size: 8pt; margin-bottom: 4.5mm; line-height: 1.1;">I hereby certify to the correctness of the above information.</div>
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
                                <td style="vertical-align: top; padding: 1.5mm 2.5mm;">
                                    <div style="font-size: 8pt; margin-bottom: 4.5mm; line-height: 1.1;">Posted by:</div>
                                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                                        <colgroup>
                                            <col style="width: 68%;">
                                            <col style="width: 4%;">
                                            <col style="width: 28%;">
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
