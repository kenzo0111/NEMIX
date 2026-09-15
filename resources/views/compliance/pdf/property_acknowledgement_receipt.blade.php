@extends('compliance.pdf.layout')

@section('title', 'Property Acknowledgment Receipt (PAR)')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm;
    }

    .par-container {
        font-family: 'Times-Roman', 'Times New Roman', Times, serif;
        font-size: 8.5pt;
        line-height: 1.15;
        color: #000000;
        background: #ffffff;
        width: 100%;
        margin: 0 auto;
    }

    .par-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 1.5px solid #000000;
    }

    .par-table th,
    .par-table td {
        border: 1px solid #000000;
        padding: 0.6mm 1mm;
        font-size: 8pt;
        vertical-align: middle;
        line-height: 1.1;
        word-wrap: break-word;
    }

    .par-table th {
        font-weight: bold;
        text-align: center;
        background-color: #f2f2f2;
        padding: 0.8mm 1mm;
    }

    .empty-row td {
        height: 4mm !important;
        min-height: 4mm !important;
        padding: 0 1mm !important;
        line-height: 1 !important;
    }

    .sign-line {
        border-bottom: 1px solid #000000;
        width: 85%;
        margin: 2px auto 0;
        display: block;
    }

    .sig-name {
        margin-top: 2px;
        font-weight: bold;
        font-size: 8.5pt;
        line-height: 1.15;
        text-align: center;
    }

    .small-caption {
        font-size: 7pt;
        line-height: 1.1;
        text-align: center;
    }
</style>
@endsection

@section('content')
<div class="report-page par-container">
    <div style="margin-bottom: 2px; text-align: right; font-style: italic; font-weight: bold; font-size: 9pt;">
        Appendix 71
    </div>

    <div class="official-title" style="margin: 1px 0 3px 0; font-size: 11.5pt; text-align: center; font-weight: bold; letter-spacing: 0.3px;">
        PROPERTY ACKNOWLEDGMENT RECEIPT
    </div>

    {{-- Meta Data --}}
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
        <tbody>
            <tr>
                <td style="width: 65%; border: none; padding: 1.5px 0; font-size: 8.5pt; line-height: 1.1;">
                    <strong>Entity Name :</strong> <span style="border-bottom: 1px solid #000; padding: 0 4px 1px 4px; min-height: 16px; display: inline-block; min-width: 220px;">{{ data_get($par, 'entityName') ?? data_get($par, 'entity_name') ?? 'UNIVERSITY OF CAMARINES NORTE' }}</span>
                </td>
                <td style="width: 35%; border: none; padding: 1.5px 0; font-size: 8.5pt; line-height: 1.1;"></td>
            </tr>
            <tr>
                <td style="width: 65%; border: none; padding: 1.5px 0; font-size: 8.5pt; line-height: 1.1;">
                    <strong>Fund Cluster:</strong> <span style="border-bottom: 1px solid #000; padding: 0 4px 1px 4px; min-height: 16px; display: inline-block; min-width: 220px;">{{ data_get($par, 'fundCluster') ?? data_get($par, 'fund_cluster') ?? '01 - Regular Agency Fund' }}</span>
                </td>
                <td style="width: 35%; border: none; padding: 1.5px 0; font-size: 8.5pt; line-height: 1.1; text-align: right;">
                    <strong>PAR No.:</strong> <span style="border-bottom: 1px solid #000; padding: 0 4px 1px 4px; min-height: 16px; display: inline-block; min-width: 120px; text-align: center;">{{ data_get($par, 'parNo') ?? data_get($par, 'par_no') ?? data_get($dataset, 'reference') ?? '' }}</span>
                </td>
            </tr>
        </tbody>
    </table>

    {{-- Main Items Table --}}
    @php
        $itemsList = $items ?? [];
        $targetRows = 18;
        $paddedItems = array_merge($itemsList, array_fill(0, max(0, $targetRows - count($itemsList)), []));
        
        $totalAmount = data_get($par, 'grandTotal') ?? 0;
        if(!$totalAmount) {
            foreach($itemsList as $it) {
                $totalAmount += (float)(data_get($it, 'amount') ?? 0);
            }
        }
    @endphp

    <table class="par-table">
        <colgroup>
            <col style="width: 6%;">  {{-- Quantity --}}
            <col style="width: 8%;">  {{-- Unit --}}
            <col style="width: 36%;"> {{-- Description --}}
            <col style="width: 20%;"> {{-- Property Number --}}
            <col style="width: 15%;"> {{-- Date Acquired --}}
            <col style="width: 15%;"> {{-- Amount --}}
        </colgroup>
        <thead>
            <tr>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Description</th>
                <th>Property Number</th>
                <th>Date Acquired</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paddedItems as $item)
                <tr class="{{ empty($item) ? 'empty-row' : '' }}">
                    <td class="text-center">{{ data_get($item, 'quantity') ?? '' }}</td>
                    <td class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                    <td class="text-left">{!! nl2br(e(data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                    <td class="text-center" style="white-space: nowrap;">{{ data_get($item, 'property_number') ?? data_get($item, 'propertyNo') ?? data_get($item, 'supplier_stock_no') ?? data_get($item, 'stock_no') ?? '' }}</td>
                    <td class="text-center">
                        {{ data_get($item, 'date_acquired') ? \Carbon\Carbon::parse(data_get($item, 'date_acquired'))->format('Y-m-d') : (data_get($item, 'dateAcquired') ? \Carbon\Carbon::parse(data_get($item, 'dateAcquired'))->format('Y-m-d') : '') }}
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

            @if($totalAmount > 0)
                <tr>
                    <td colspan="5" class="text-right font-bold" style="padding: 0.6mm 1mm;">Grand Total:</td>
                    <td class="text-right font-bold" style="padding: 0.6mm 1mm;">
                        ₱{{ number_format($totalAmount, 2) }}
                    </td>
                </tr>
            @endif
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" style="vertical-align: top; padding: 4px 6px;">
                    <div style="text-align: left; font-weight: bold;">Received by:</div>
                    <div style="height: 16px;"></div>
                    <div class="sign-line"></div>
                    <div class="sig-name">
                        {{ data_get($par, 'receivedByName') ?? "&nbsp;" }}
                    </div>
                    <div class="small-caption">Signature over Printed Name of End User</div>
                    <div style="height: 2px;"></div>
                    <div style="font-size: 8pt; line-height: 1.1; text-align: center;">{{ data_get($par, 'receivedByPosition') ?? '' }}</div>
                    <div class="small-caption">Position/Office</div>
                    <div style="height: 2px;"></div>
                    <div style="font-size: 8pt; line-height: 1.1; text-align: center;">{{ data_get($par, 'receivedDate') ?? '' }}</div>
                    <div class="small-caption">Date</div>
                </td>
                <td colspan="3" style="vertical-align: top; padding: 4px 6px;">
                    <div style="text-align: left; font-weight: bold;">Issued by:</div>
                    <div style="height: 16px;"></div>
                    <div class="sign-line"></div>
                    <div class="sig-name">
                        {{ data_get($par, 'issuedByName') ?? 'ARSENIO GEM A. GARCILLANOSA' }}
                    </div>
                    <div class="small-caption">Signature over Printed Name of Supply and/or Property Custodian</div>
                    <div style="height: 2px;"></div>
                    <div style="font-size: 8pt; line-height: 1.1; text-align: center;">{{ data_get($par, 'issuedByPosition') ?? 'SUPPLY OFFICER III/ADMIN OFFICER V' }}</div>
                    <div class="small-caption">Position/Office</div>
                    <div style="height: 2px;"></div>
                    <div style="font-size: 8pt; line-height: 1.1; text-align: center;">{{ data_get($par, 'issuedDate') ?? '' }}</div>
                    <div class="small-caption">Date</div>
                </td>
            </tr>
        </tfoot>
    </table>
</div>
@endsection


