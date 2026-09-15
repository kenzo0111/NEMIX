@extends('compliance.pdf.layout')

@section('title', 'Memorandum Receipt for Property')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm 8mm 8mm 8mm;
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
        padding: 3px 4px;
        font-size: 7.5pt;
        vertical-align: middle;
        line-height: 1.15;
        word-wrap: break-word;
    }

    .mr-table th {
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
    <div class="official-appendix">{{ data_get($mr, 'appendixNumber') ?? 'Appendix 59' }}</div>
    <div class="official-title">MEMORANDUM RECEIPT FOR PROPERTY</div>

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
                <td class="form-value">{{ data_get($mr, 'entityName') ?? data_get($mr, 'entity_name') ?? 'UNIVERSITY OF CAMARINES NORTE' }}</td>
                <td>&nbsp;</td>
                <td class="form-label">MR No.:</td>
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

    {{-- Purpose statement if any --}}
    @if(!empty(data_get($mr, 'purpose')))
        <div style="font-size: 8pt; margin-bottom: 6px; text-align: justify; line-height: 1.2;">
            {{ data_get($mr, 'purpose') }}
        </div>
    @endif

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
            <col style="width: 10%;"> {{-- Qty --}}
            <col style="width: 8%;">  {{-- Unit --}}
            <col style="width: 38%;"> {{-- Description --}}
            <col style="width: 16%;"> {{-- Property No --}}
            <col style="width: 14%;"> {{-- Unit Value --}}
            <col style="width: 14%;"> {{-- Total Value --}}
        </colgroup>
        <thead>
            <tr>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Description</th>
                <th>Property No.</th>
                <th>Unit Value</th>
                <th>Total Value</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paddedItems as $item)
                <tr class="{{ empty($item) ? 'empty-row' : '' }}">
                    <td class="text-center">{{ data_get($item, 'quantity') ?? '' }}</td>
                    <td class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                    <td class="text-left">{!! nl2br(e(data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                    <td class="text-center">{{ data_get($item, 'propertyNo') ?? data_get($item, 'supplier_stock_no') ?? data_get($item, 'stock_no') ?? '' }}</td>
                    <td class="text-right">
                        @if(is_numeric(data_get($item, 'unitValue') ?? data_get($item, 'unit_cost')))
                            ₱{{ number_format((float)(data_get($item, 'unitValue') ?? data_get($item, 'unit_cost')), 2) }}
                        @else
                            {{ data_get($item, 'unitValue') ?? data_get($item, 'unit_cost') ?? '' }}
                        @endif
                    </td>
                    <td class="text-right">
                        @if(is_numeric(data_get($item, 'totalValue') ?? data_get($item, 'amount')))
                            ₱{{ number_format((float)(data_get($item, 'totalValue') ?? data_get($item, 'amount')), 2) }}
                        @else
                            {{ data_get($item, 'totalValue') ?? data_get($item, 'amount') ?? '' }}
                        @endif
                    </td>
                </tr>
            @endforeach

            {{-- Grand Total Row --}}
            <tr>
                <td colspan="5" class="text-right font-bold" style="padding: 4px;">Grand Total:</td>
                <td class="text-right font-bold" style="padding: 4px;">
                    ₱{{ number_format($grandTotal, 2) }}
                </td>
            </tr>
        </tbody>
    </table>

    {{-- Signatories Section --}}
    <table class="signatory-box" style="margin-top: 10px;">
        <colgroup>
            <col style="width: 50%;">
            <col style="width: 50%;">
        </colgroup>
        <tbody>
            <tr>
                <td class="signatory-cell" style="padding-right: 12px;">
                    <div class="signatory-header">Received by:</div>
                    <table style="width: 90%; margin: 0 auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td class="signatory-name">
                                    {{ $receivedByName ?: "\u{00A0}" }}
                                </td>
                            </tr>
                            <tr>
                                <td class="signatory-caption">
                                    Signature over Printed Name of End-User
                                </td>
                            </tr>
                            @if(!empty($receivedByPosition))
                                <tr>
                                    <td class="signatory-caption" style="font-size: 7.5pt; font-weight: normal; padding-top: 2px;">
                                        {{ $receivedByPosition }}
                                    </td>
                                </tr>
                            @endif
                            @if(!empty($receivedByOffice))
                                <tr>
                                    <td class="signatory-caption" style="font-size: 7pt; font-weight: normal;">
                                        {{ $receivedByOffice }}
                                    </td>
                                </tr>
                            @endif
                        </tbody>
                    </table>
                </td>
                <td class="signatory-cell" style="padding-left: 12px;">
                    <div class="signatory-header">Issued by:</div>
                    <table style="width: 90%; margin: 0 auto; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td class="signatory-name">
                                    {{ $issuedByName ?: 'ARSENIO GEM A. GARCILLANOSA' }}
                                </td>
                            </tr>
                            <tr>
                                <td class="signatory-caption">
                                    Signature over Printed Name of Property Officer
                                </td>
                            </tr>
                            @if(!empty($issuedByPosition))
                                <tr>
                                    <td class="signatory-caption" style="font-size: 7.5pt; font-weight: normal; padding-top: 2px;">
                                        {{ $issuedByPosition }}
                                    </td>
                                </tr>
                            @endif
                            @if(!empty($issuedByOffice))
                                <tr>
                                    <td class="signatory-caption" style="font-size: 7pt; font-weight: normal;">
                                        {{ $issuedByOffice }}
                                    </td>
                                </tr>
                            @endif
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</div>
@endsection
