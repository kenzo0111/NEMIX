@extends('compliance.pdf.layout')

@section('title', 'Requisition and Issue Slip (RIS)')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm;
    }

    .ris-container {
        font-family: 'DejaVu Sans', 'Times-Roman', serif;
        font-size: 8.5pt;
        line-height: 1.15;
    }

    .ris-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 1px solid #000000;
    }

    .ris-table th,
    .ris-table td {
        border: 1px solid #000000;
        padding: 0.6mm 1mm;
        font-size: 8pt;
        vertical-align: middle;
        line-height: 1.1;
        word-wrap: break-word;
    }

    .ris-table th {
        font-weight: bold;
        text-align: center;
        background-color: #f0f0f0;
        padding: 0.8mm 1mm;
    }

    .empty-row td {
        height: 4mm !important;
        min-height: 4mm !important;
        padding: 0 1mm !important;
        line-height: 1 !important;
    }

    .sig-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        margin: 0;
    }

    .sig-table th, .sig-table td {
        border: 1px solid #000000;
        padding: 1.5px 2px;
        font-size: 8pt;
        vertical-align: middle;
        overflow: hidden;
        line-height: 1.1;
    }
</style>
@endsection

@section('content')
<div class="report-page ris-container">
    <div style="text-align: right; font-style: italic; font-size: 9pt; margin-bottom: 1mm;">Appendix 63</div>
    <div class="official-title" style="margin-bottom: 1.2mm; letter-spacing: 0.3px;">REQUISITION AND ISSUE SLIP</div>

    {{-- Top Info Table --}}
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
        <tbody>
            <tr>
                <td style="width: 80px; font-size: 8.5pt; vertical-align: bottom;">Entity Name :</td>
                <td style="border-bottom: 1px solid #000; font-weight: bold; padding: 0 3px 1px 3px; font-size: 8.5pt;">{{ data_get($ris, 'entity_name') ?? data_get($ris, 'entityName') ?? 'UNIVERSITY OF CAMARINES NORTE' }}</td>
                <td style="width: 40px;"></td>
                <td style="width: 80px; font-size: 8.5pt; vertical-align: bottom;">Fund Cluster :</td>
                <td style="border-bottom: 1px solid #000; font-weight: bold; padding: 0 3px 1px 3px; font-size: 8.5pt;">{{ data_get($ris, 'fund_cluster') ?? data_get($ris, 'fundCluster') ?? '01 - Regular Agency Fund' }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Main Content Table --}}
    @php
        $itemsList = $items ?? [];
        $targetRows = 20;
        $paddedItems = array_merge($itemsList, array_fill(0, max(0, $targetRows - count($itemsList)), []));
    @endphp

    <table class="ris-table">
        <thead>
            {{-- Meta Headers --}}
            <tr>
                <td colspan="4" class="text-left" style="border-right: 1px solid #000;">
                    Division : {{ data_get($ris, 'division') ?? '' }}
                </td>
                <td colspan="4" class="text-left">
                    Responsibility Center Code : {{ data_get($ris, 'responsibility_center_code') ?? data_get($ris, 'responsibilityCenterCode') ?? '' }}
                </td>
            </tr>
            <tr>
                <td colspan="4" class="text-left" style="border-right: 1px solid #000;">
                    Office : {{ data_get($ris, 'office') ?? '' }}
                </td>
                <td colspan="4" class="text-left">
                    RIS No. : {{ data_get($ris, 'ris_no') ?? data_get($ris, 'risNo') ?? data_get($dataset, 'reference') ?? '' }}
                </td>
            </tr>

            {{-- Column Headers --}}
            <tr>
                <th colspan="4" style="background-color: #ffffff; font-style: italic;">Requisition</th>
                <th colspan="2" style="background-color: #f0f0f0;">Stock Available?</th>
                <th colspan="2" style="background-color: #ffffff; font-style: italic;">Issue</th>
            </tr>
            <tr>
                <th style="width: 10%;">Stock No.</th>
                <th style="width: 8%;">Unit</th>
                <th style="width: 32%;">Description</th>
                <th style="width: 8%;">Quantity</th>
                <th style="width: 5%;">Yes</th>
                <th style="width: 5%;">No</th>
                <th style="width: 10%;">Quantity</th>
                <th style="width: 22%;">Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paddedItems as $item)
                <tr class="{{ empty($item) ? 'empty-row' : '' }}">
                    <td class="text-center">{{ data_get($item, 'stock_no') ?? data_get($item, 'stockNo') ?? data_get($item, 'supplier_stock_no') ?? '' }}</td>
                    <td class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                    <td class="text-left">{!! nl2br(e(data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                    <td class="text-center">{{ data_get($item, 'quantity') ?? '' }}</td>
                    <td class="text-center">
                        @if(data_get($item, 'stock_available', true) && !empty(data_get($item, 'quantity')))
                            ✓
                        @endif
                    </td>
                    <td class="text-center">
                        @if(data_get($item, 'stock_available') === false && !empty(data_get($item, 'quantity')))
                            ✓
                        @endif
                    </td>
                    <td class="text-center">{{ data_get($item, 'issue_quantity') ?? data_get($item, 'quantity') ?? '' }}</td>
                    <td class="text-left">{{ data_get($item, 'remarks') ?? '' }}</td>
                </tr>
            @endforeach

            {{-- Purpose Row --}}
            <tr>
                <td colspan="8" style="padding: 2.5px 4px; text-align: left; vertical-align: top;">
                    Purpose: {{ data_get($ris, 'purpose') ?? '' }}
                </td>
            </tr>

            {{-- Signatories Section --}}
            <tr>
                <td colspan="8" style="padding: 0; border: none;">
                    <table class="sig-table">
                        <colgroup>
                            <col style="width: 12%;">
                            <col style="width: 22%;">
                            <col style="width: 22%;">
                            <col style="width: 22%;">
                            <col style="width: 22%;">
                        </colgroup>
                        <thead>
                            <tr>
                                <th style="border-left: none; border-top: none; background-color: #ffffff;"></th>
                                <th style="border-top: none; background-color: #ffffff; text-align: center; font-weight: bold;">Requested by:</th>
                                <th style="border-top: none; background-color: #ffffff; text-align: center; font-weight: bold;">Approved by:</th>
                                <th style="border-top: none; background-color: #ffffff; text-align: center; font-weight: bold;">Issued by:</th>
                                <th style="border-right: none; border-top: none; background-color: #ffffff; text-align: center; font-weight: bold;">Received by:</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border-left: none;">Signature :</td>
                                <td class="text-center">{{ data_get($ris, 'requested_by_signature') ?? '' }}</td>
                                <td class="text-center">{{ data_get($ris, 'approved_by_signature') ?? '' }}</td>
                                <td class="text-center">{{ data_get($ris, 'issued_by_signature') ?? '' }}</td>
                                <td class="text-center" style="border-right: none;">{{ data_get($ris, 'received_by_signature') ?? '' }}</td>
                            </tr>
                            <tr>
                                <td style="border-left: none;">Printed Name :</td>
                                <td class="text-center font-bold" style="font-size: 8.5pt;">{{ data_get($ris, 'requested_by_name') ?? "\u{00A0}" }}</td>
                                <td class="text-center font-bold" style="font-size: 8.5pt;">{{ data_get($ris, 'approved_by_name') ?? 'ARSENIO GEM A. GARCILLANOSA' }}</td>
                                <td class="text-center font-bold" style="font-size: 8.5pt;">{{ data_get($ris, 'issued_by_name') ?? '' }}</td>
                                <td class="text-center font-bold" style="font-size: 8.5pt; border-right: none;">{{ data_get($ris, 'received_by_name') ?? "\u{00A0}" }}</td>
                            </tr>
                            <tr>
                                <td style="border-left: none;">Designation :</td>
                                <td class="text-center" style="font-size: 7.5pt;">{{ data_get($ris, 'requested_by_designation') ?? '' }}</td>
                                <td class="text-center" style="font-size: 7.5pt;">{{ data_get($ris, 'approved_by_designation') ?? 'SUPPLY OFFICER III/ADMIN OFFICER V' }}</td>
                                <td class="text-center" style="font-size: 7.5pt;">{{ data_get($ris, 'issued_by_designation') ?? '' }}</td>
                                <td class="text-center" style="font-size: 7.5pt; border-right: none;">{{ data_get($ris, 'received_by_designation') ?? '' }}</td>
                            </tr>
                            <tr>
                                <td style="border-left: none; border-bottom: none;">Date :</td>
                                <td class="text-center" style="border-bottom: none;">{{ data_get($ris, 'requested_by_date') ? \Carbon\Carbon::parse(data_get($ris, 'requested_by_date'))->format('m/d/Y') : '' }}</td>
                                <td class="text-center" style="border-bottom: none;">{{ data_get($ris, 'approved_by_date') ? \Carbon\Carbon::parse(data_get($ris, 'approved_by_date'))->format('m/d/Y') : '' }}</td>
                                <td class="text-center" style="border-bottom: none;">{{ data_get($ris, 'issued_by_date') ? \Carbon\Carbon::parse(data_get($ris, 'issued_by_date'))->format('m/d/Y') : '' }}</td>
                                <td class="text-center" style="border-right: none; border-bottom: none;">{{ data_get($ris, 'received_by_date') ? \Carbon\Carbon::parse(data_get($ris, 'received_by_date'))->format('m/d/Y') : '' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</div>
@endsection

