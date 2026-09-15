@extends('compliance.pdf.layout')

@section('title', 'Purchase Order (PO)')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm;
    }

    .po-container {
        font-family: 'DejaVu Sans', 'Times-Roman', serif;
        font-size: 8.5pt;
        line-height: 1.15;
    }

    .po-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 1.5px solid #000000;
    }

    .po-table th,
    .po-table td {
        border: 1px solid #000000;
        padding: 0.6mm 1mm;
        font-size: 8pt;
        vertical-align: top;
        line-height: 1.1;
        word-wrap: break-word;
    }

    .po-table th {
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

    .signature-line {
        width: 160px;
        margin: 0 auto 3px;
        height: 18px;
        border-bottom: 1.5px solid #000000;
    }
</style>
@endsection

@section('content')
<div class="report-page po-container">
    <div style="text-align: center; margin-bottom: 4px; position: relative;">
        <div style="position: absolute; top: 0; right: 0; font-size: 9pt; font-weight: bold; font-style: italic;">Appendix 6.1</div>
        <h1 style="font-size: 11.5pt; font-weight: bold; margin: 0 0 2px 0; letter-spacing: 0.3px;">PURCHASE ORDER</h1>
        <div style="font-size: 9.5pt; text-decoration: underline; font-weight: bold;">{{ data_get($po, 'entity_name') ?? data_get($po, 'entityName') ?? 'UNIVERSITY OF CAMARINES NORTE' }}</div>
        <div style="font-size: 8pt; font-style: italic; color: #444;">{{ data_get($po, 'entity_address') ?? 'lot 8, F. Pimentel' }}</div>
    </div>

    @php
        $itemsList = $items ?? [];
        $targetRows = 10;
        $paddedItems = array_merge($itemsList, array_fill(0, max(0, $targetRows - count($itemsList)), []));
        
        $grandTotal = data_get($po, 'grand_total') ?? data_get($po, 'grandTotal') ?? 0;
        if(!$grandTotal) {
            foreach($itemsList as $it) {
                $grandTotal += (float)(data_get($it, 'amount') ?? (data_get($it, 'quantity', 0) * data_get($it, 'unit_cost', 0)));
            }
        }
        $procurementMode = data_get($po, 'mode_of_procurement') ?? data_get($po, 'mode_of_payment') ?? '';
    @endphp

    <table class="po-table">
        <colgroup>
            <col style="width: 13%;">
            <col style="width: 8%;">
            <col style="width: 39%;">
            <col style="width: 10%;">
            <col style="width: 15%;">
            <col style="width: 15%;">
        </colgroup>
        <tbody>
            <tr>
                <td style="font-weight: bold; width: 15%;">Supplier:</td>
                <td colspan="3" style="width: 45%;">{{ data_get($po, 'supplier') ?? '' }}</td>
                <td style="font-weight: bold; width: 15%;">P.O. No.:</td>
                <td style="width: 25%;">{{ data_get($po, 'po_number') ?? data_get($po, 'po_no') ?? data_get($dataset, 'reference') ?? '' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Address:</td>
                <td colspan="3">{{ data_get($po, 'supplier_address') ?? '' }}</td>
                <td style="font-weight: bold;">Date:</td>
                <td>{{ data_get($po, 'date_of_purchase') ? \Carbon\Carbon::parse(data_get($po, 'date_of_purchase'))->format('F d, Y') : '' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">TIN:</td>
                <td colspan="3">{{ data_get($po, 'tin_number') ?? '' }}</td>
                <td style="font-weight: bold;">Mode of Procurement:</td>
                <td>{{ $procurementMode }}</td>
            </tr>
            <tr>
                <td colspan="6" style="padding: 4px 6px;">
                    <strong style="font-size: 8.5pt;">Gentlemen:</strong><br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Please furnish this Office the following articles subject to the terms and conditions contained herein:
                </td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Place of Delivery:</td>
                <td colspan="2">{{ data_get($po, 'place_of_delivery') ?? '' }}</td>
                <td style="font-weight: bold;">Delivery Term:</td>
                <td colspan="2">{{ data_get($po, 'delivery_term') ?? '' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Date of Delivery:</td>
                <td colspan="2">{{ data_get($po, 'date_of_delivery') ? \Carbon\Carbon::parse(data_get($po, 'date_of_delivery'))->format('F d, Y') : '' }}</td>
                <td style="font-weight: bold;">Payment Term:</td>
                <td colspan="2">{{ data_get($po, 'payment_term') ?? '' }}</td>
            </tr>
            <tr>
                <th style="text-align: center;">Stock/Property Number</th>
                <th style="text-align: center;">Unit</th>
                <th style="text-align: center;">Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: center;">Unit Cost</th>
                <th style="text-align: center;">Amount</th>
            </tr>

            @foreach($paddedItems as $item)
                <tr class="{{ empty($item) ? 'empty-row' : '' }}">
                    <td class="text-center">{{ data_get($item, 'stock_number') ?? data_get($item, 'stock_no') ?? data_get($item, 'supplier_stock_no') ?? '' }}</td>
                    <td class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                    <td class="text-left">{!! nl2br(e(data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                    <td class="text-center">{{ data_get($item, 'quantity') ?? '' }}</td>
                    <td class="text-right">
                        @if(is_numeric(data_get($item, 'unit_cost')))
                            ₱{{ number_format((float)data_get($item, 'unit_cost'), 2) }}
                        @else
                            {{ data_get($item, 'unit_cost') ?? '' }}
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

            <tr>
                <td colspan="5" class="text-right font-bold" style="padding: 0.6mm 1mm;">Grand Total:</td>
                <td class="text-right font-bold" style="padding: 0.6mm 1mm;">₱{{ number_format($grandTotal, 2) }}</td>
            </tr>

            <tr>
                <td colspan="3" style="text-align: center; padding: 4px 6px;">
                    <p style="margin-bottom: 3px; font-style: italic; font-size: 7.5pt; line-height: 1.1;">
                        In case of failure to make the total delivery within the time specified above, a penalty of one percent (1%) of the total contract price shall be imposed for each day of delay, until the obligation is fully complied with.
                    </p>
                    <p style="margin-bottom: 3px; font-style: italic; font-size: 7.5pt; line-height: 1.1;">
                        Conforme:
                    </p>
                    <div class="signature-line"></div>
                    <p style="font-size: 7.5pt; font-style: italic; line-height: 1.1;">
                        signature over printed name of supplier
                    </p>
                    <div style="margin-top: 3px;">
                        <span style="font-size: 7.5pt; margin-right: 4px;">Date:</span>
                        <span style="border-bottom: 1px solid #000; display: inline-block; width: 70px;"></span>
                    </div>
                </td>
                <td colspan="3" style="text-align: center; padding: 4px 6px;">
                    <div style="margin-top: 6px;">
                        <p style="margin-bottom: 3px; font-style: italic; font-size: 7.5pt; line-height: 1.1;">
                            Very truly yours,
                        </p>
                        <div class="signature-line"></div>
                        <p style="font-size: 7.5pt; font-style: italic; line-height: 1.1;">
                            signature over printed name of authorization
                        </p>
                        <p style="font-size: 7.5pt; font-style: italic; line-height: 1.1;">College President</p>
                    </div>
                </td>
            </tr>

            <tr>
                <td style="font-weight: bold; width: 15%;">Fund Cluster:</td>
                <td colspan="2" style="width: 35%;">{{ data_get($po, 'fund_cluster') ?? '01 - Regular Agency Fund' }}</td>
                <td style="font-weight: bold; width: 15%;">ORS/BURS No.:</td>
                <td colspan="2">{{ data_get($po, 'ors_burs_no') ?? '' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Funds Available:</td>
                <td colspan="2">{{ data_get($po, 'funds_available') ?? '' }}</td>
                <td style="font-weight: bold;">Date of ORS/BURS:</td>
                <td colspan="2">{{ data_get($po, 'ors_burs_date') ? \Carbon\Carbon::parse(data_get($po, 'ors_burs_date'))->format('m/d/Y') : '' }} &nbsp;&nbsp;&nbsp; <strong>Amount:</strong> {{ data_get($po, 'ors_burs_amount') ? '₱'.number_format((float)data_get($po, 'ors_burs_amount'), 2) : '' }}</td>
            </tr>
            <tr>
                <td colspan="6" style="text-align: center; padding: 4px 6px;">
                    <div style="border-bottom: 1.5px solid #000; margin: 0 auto 2px; width: 160px; height: 20px;">
                        {{ data_get($po, 'accountant_signature') ?? '' }}
                    </div>
                    <p style="font-size: 8pt; font-weight: bold; margin: 2px 0 0;">
                        Accountant's Signature
                    </p>
                </td>
            </tr>
        </tbody>
    </table>
</div>
@endsection

