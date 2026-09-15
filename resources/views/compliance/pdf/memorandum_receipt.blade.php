@extends('compliance.pdf.layout')

@section('title', 'Memorandum Receipt for Property')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm;
    }

    .mr-container {
        font-family: 'DejaVu Sans', 'Times-Roman', serif;
        font-size: 8.5pt;
        line-height: 1.15;
    }

    .purpose-statement {
        margin-bottom: 2mm;
        line-height: 1.2;
        text-align: justify;
        font-size: 8.5pt;
    }

    .mr-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 1.5px solid #000000;
    }

    .mr-table th,
    .mr-table td {
        border: 1px solid #000000;
        padding: 0.6mm 1mm;
        font-size: 8pt;
        vertical-align: middle;
        line-height: 1.1;
        word-wrap: break-word;
    }

    .mr-table th {
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

    .signatures-table {
        width: 100%;
        border-collapse: collapse;
        border: 1.5px solid #000000;
        border-top: none;
        table-layout: fixed;
    }

    .sig-cell {
        width: 50%;
        vertical-align: top;
        padding: 1.5mm 2.5mm;
        box-sizing: border-box;
    }

    .sig-cell:first-child {
        border-right: 1px solid #000000;
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
<div class="report-page mr-container">
    <div class="official-header">
        <div class="official-appendix">{{ data_get($mr, 'appendixNumber') ?? 'Appendix 59-A' }}</div>
        <div class="official-title">MEMORANDUM RECEIPT FOR PROPERTY</div>
        <div class="official-subtitle">(MEMORANDUM OF RECEIPT)</div>
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
                <td class="form-value">{{ data_get($mr, 'entityName') ?? data_get($mr, 'entity_name') ?? 'UNIVERSITY OF CAMARINES NORTE' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">MR No. :</td>
                <td class="form-value">{{ data_get($mr, 'mrNo') ?? data_get($mr, 'mr_no') ?? data_get($dataset, 'reference') ?? '' }}</td>
            </tr>
            <tr>
                <td class="form-label">Fund Cluster:</td>
                <td class="form-value">{{ data_get($mr, 'fundCluster') ?? data_get($mr, 'fund_cluster') ?? '01 - Regular Agency Fund' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">Date :</td>
                <td class="form-value">{{ data_get($mr, 'date') ? \Carbon\Carbon::parse(data_get($mr, 'date'))->format('m/d/Y') : '' }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Purpose Statement --}}
    <div class="purpose-statement">
        I hereby acknowledge to have received from <strong>{{ data_get($mr, 'issuedByName') ?? 'ARSENIO GEM A. GARCILLANOSA' }}</strong>, {{ data_get($mr, 'issuedByPosition') ?? 'SUPPLY OFFICER III / PROPERTY CUSTODIAN' }}, the following property for which I am responsible, subject to the provisions of law, and which will be used in <strong>{{ data_get($mr, 'receivedByOffice') ?? data_get($mr, 'purpose') ?? 'Official Business' }}</strong>:
    </div>

    {{-- Main MR Items Table --}}
    @php
        $itemsList = $items ?? [];
        $targetRows = 10;
        $paddedItems = array_merge($itemsList, array_fill(0, max(0, $targetRows - count($itemsList)), []));
        
        $grandTotal = 0;
        foreach($itemsList as $it) {
            $val = data_get($it, 'totalValue') ?? (data_get($it, 'quantity', 0) * data_get($it, 'unitValue', 0));
            if(is_numeric($val)) {
                $grandTotal += (float)$val;
            }
        }
    @endphp

    <table class="mr-table">
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
                <tr class="{{ empty($item) ? 'empty-row' : '' }}">
                    <td class="text-center">{{ data_get($item, 'quantity') ?? '' }}</td>
                    <td class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                    <td class="text-left">{!! nl2br(e(data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                    <td class="text-center">{{ data_get($item, 'propertyNo') ?? data_get($item, 'property_number') ?? data_get($item, 'supplier_stock_no') ?? data_get($item, 'stock_no') ?? '' }}</td>
                    <td class="text-center">{{ data_get($item, 'dateAcquired') ? \Carbon\Carbon::parse(data_get($item, 'dateAcquired'))->format('m/d/Y') : (data_get($item, 'date_acquired') ? \Carbon\Carbon::parse(data_get($item, 'date_acquired'))->format('m/d/Y') : '') }}</td>
                    <td class="text-right">
                        @if(is_numeric(data_get($item, 'unitValue') ?? data_get($item, 'unit_cost')))
                            ₱{{ number_format((float)(data_get($item, 'unitValue') ?? data_get($item, 'unit_cost')), 2) }}
                        @else
                            {{ data_get($item, 'unitValue') ?? data_get($item, 'unit_cost') ?? '' }}
                        @endif
                    </td>
                </tr>
            @endforeach

            {{-- Grand Total Row --}}
            <tr>
                <td colspan="5" class="text-right font-bold" style="padding: 0.6mm 1mm;">Grand Total Value:</td>
                <td class="text-right font-bold" style="padding: 0.6mm 1mm;">
                    ₱{{ number_format($grandTotal, 2) }}
                </td>
            </tr>
        </tbody>
    </table>

    {{-- Signatures Section --}}
    <table class="signatures-table">
        <tbody>
            <tr>
                {{-- Issued By (Property Custodian) --}}
                <td class="sig-cell">
                    <div class="sig-header">Issued / Released by:</div>
                    <table style="width: 85%; margin: 0 auto 4px auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 2px 2px 2px; font-weight: bold; text-align: center; text-transform: uppercase; font-size: 8.5pt; line-height: 1.15;">
                                    {{ data_get($mr, 'issuedByName') ?? $issuedByName ?? 'ARSENIO GEM A. GARCILLANOSA' }}
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
                                <td style="border: none; font-weight: bold; font-size: 8pt; vertical-align: middle; padding: 1.5px 0;">
                                    Position:
                                </td>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 1.5px 4px; vertical-align: middle; font-size: 8pt; line-height: 1.1;">
                                    {{ data_get($mr, 'issuedByPosition') ?? $issuedByPosition ?? 'SUPPLY OFFICER III / ADMIN OFFICER V' }}
                                </td>
                            </tr>
                            <tr>
                                <td style="border: none; font-weight: bold; font-size: 8pt; vertical-align: middle; padding: 3px 0 1.5px 0;">
                                    Date:
                                </td>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 3px 4px 1.5px 4px; vertical-align: middle; font-size: 8pt; line-height: 1.1;">
                                    {{ data_get($mr, 'issuedByDate') ?? '' }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>

                {{-- Received By (End User) --}}
                <td class="sig-cell">
                    <div class="sig-header">Received by:</div>
                    <table style="width: 85%; margin: 0 auto 4px auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 0 2px 2px 2px; font-weight: bold; text-align: center; text-transform: uppercase; font-size: 8.5pt; line-height: 1.15;">
                                    {{ data_get($mr, 'receivedByName') ?? $receivedByName ?? '' }}
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
                                <td style="border: none; font-weight: bold; font-size: 8pt; vertical-align: middle; padding: 1.5px 0;">
                                    Position:
                                </td>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 1.5px 4px; vertical-align: middle; font-size: 8pt; line-height: 1.1;">
                                    {{ data_get($mr, 'receivedByPosition') ?? $receivedByPosition ?? '' }}
                                </td>
                            </tr>
                            <tr>
                                <td style="border: none; font-weight: bold; font-size: 8pt; vertical-align: middle; padding: 3px 0 1.5px 0;">
                                    Office:
                                </td>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 3px 4px 1.5px 4px; vertical-align: middle; font-size: 8pt; line-height: 1.1;">
                                    {{ data_get($mr, 'receivedByOffice') ?? $receivedByOffice ?? '' }}
                                </td>
                            </tr>
                            <tr>
                                <td style="border: none; font-weight: bold; font-size: 8pt; vertical-align: middle; padding: 3px 0 1.5px 0;">
                                    Date:
                                </td>
                                <td style="border: none; border-bottom: 1px solid #000000; padding: 3px 4px 1.5px 4px; vertical-align: middle; font-size: 8pt; line-height: 1.1;">
                                    {{ data_get($mr, 'receivedByDate') ?? '' }}
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

