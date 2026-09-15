@extends('compliance.pdf.layout')

@section('title', 'Inspection and Acceptance Report (IAR)')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 8mm;
    }

    .iar-container {
        font-family: 'DejaVu Sans', 'Times-Roman', serif;
        font-size: 8.5pt;
        line-height: 1.15;
    }

    .iar-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 1px solid #000000;
    }

    .iar-table th,
    .iar-table td {
        border: 1px solid #000000;
        padding: 0.6mm 1mm;
        font-size: 8pt;
        vertical-align: middle;
        line-height: 1.1;
        word-wrap: break-word;
    }

    .iar-table th.col-header {
        background-color: #f2f2f2;
        font-weight: bold;
        text-align: center;
        padding: 0.8mm 1mm;
    }

    .empty-row td {
        height: 4mm !important;
        min-height: 4mm !important;
        padding: 0 1mm !important;
        line-height: 1 !important;
    }

    .checkbox {
        display: inline-block;
        width: 10px;
        height: 10px;
        border: 1px solid #000000;
        margin-right: 4px;
        text-align: center;
        line-height: 10px;
        font-size: 8px;
    }
</style>
@endsection

@section('content')
<div class="report-page iar-container">
    <div style="text-align: right; font-style: italic; font-size: 9pt; margin-bottom: 1mm;">Appendix 64</div>
    <div class="official-title" style="margin-bottom: 1.2mm; letter-spacing: 0.3px;">INSPECTION AND ACCEPTANCE REPORT</div>

    {{-- Info Row (Entity/Fund) --}}
    <table class="form-table" style="margin-bottom: 4px;">
        <colgroup>
            <col style="width: 12%;">
            <col style="width: 52%;">
            <col style="width: 12%;">
            <col style="width: 24%;">
        </colgroup>
        <tbody>
            <tr>
                <td class="form-label">Entity Name :</td>
                <td class="form-value">{{ data_get($iar, 'entityName') ?? data_get($iar, 'entity_name') ?? 'UNIVERSITY OF CAMARINES NORTE' }}</td>
                <td class="form-label">Fund Cluster :</td>
                <td class="form-value">{{ data_get($iar, 'fundCluster') ?? data_get($iar, 'fund_cluster') ?? '01 - Regular Agency Fund' }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Main Items Table with Embedded Metadata Header --}}
    @php
        $itemsList = $items ?? [];
        $targetRows = 8;
        $paddedItems = array_merge($itemsList, array_fill(0, max(0, $targetRows - count($itemsList)), []));
    @endphp

    <table class="iar-table">
        <colgroup>
            <col style="width: 12%;"> {{-- Stock No --}}
            <col style="width: 52%;"> {{-- Description --}}
            <col style="width: 12%;"> {{-- Unit --}}
            <col style="width: 24%;"> {{-- Quantity --}}
        </colgroup>
        <thead>
            <tr style="border-bottom: 1px solid #000;">
                <td colspan="2" style="border-right: 1px solid #000; padding: 2px 4px;">Supplier : {{ data_get($iar, 'supplier') ?? '' }}</td>
                <td colspan="2" style="padding: 2px 4px;">IAR No. : {{ data_get($iar, 'iarNo') ?? data_get($iar, 'iar_no') ?? data_get($dataset, 'reference') ?? '' }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #000;">
                <td colspan="2" style="border-right: 1px solid #000; padding: 2px 4px;">PO No./Date : {{ data_get($iar, 'poNo') ?? data_get($iar, 'po_no') ?? '' }} {{ data_get($iar, 'poDate') ? '/ ' . \Carbon\Carbon::parse(data_get($iar, 'poDate'))->format('m/d/Y') : '' }}</td>
                <td colspan="2" style="padding: 2px 4px;">Date : {{ data_get($iar, 'iarDate') ? \Carbon\Carbon::parse(data_get($iar, 'iarDate'))->format('m/d/Y') : '' }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #000;">
                <td colspan="2" style="border-right: 1px solid #000; padding: 2px 4px;">Requisitioning Office/Dept : {{ data_get($iar, 'requisitioningOffice') ?? data_get($iar, 'office') ?? '' }}</td>
                <td colspan="2" style="padding: 2px 4px;">Invoice No : {{ data_get($iar, 'invoiceNo') ?? data_get($iar, 'invoice_no') ?? '' }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #000;">
                <td colspan="2" style="border-right: 1px solid #000; padding: 2px 4px;">Responsibility Center Code : {{ data_get($iar, 'responsibilityCenterCode') ?? '' }}</td>
                <td colspan="2" style="padding: 2px 4px;">Date : {{ data_get($iar, 'responsibilityDate') ? \Carbon\Carbon::parse(data_get($iar, 'responsibilityDate'))->format('m/d/Y') : '' }}</td>
            </tr>
            <tr>
                <th class="col-header" style="text-align: center;">Stock/<br>Property No.</th>
                <th class="col-header" style="text-align: center;">Description</th>
                <th class="col-header" style="text-align: center;">Unit</th>
                <th class="col-header" style="text-align: center;">Quantity</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paddedItems as $item)
                <tr class="{{ empty($item) ? 'empty-row' : '' }}">
                    <td class="text-center">{{ data_get($item, 'stockNo') ?? data_get($item, 'stock_no') ?? data_get($item, 'supplier_stock_no') ?? '' }}</td>
                    <td class="text-left">{!! nl2br(e(data_get($item, 'description') ?? data_get($item, 'item_name') ?? '')) !!}</td>
                    <td class="text-center">{{ data_get($item, 'unit') ?? '' }}</td>
                    <td class="text-right">{{ data_get($item, 'quantity') ?? '' }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <th colspan="2" style="width: 64%; text-align: center; font-weight: bold; background: #ffffff;">INSPECTION</th>
                <th colspan="2" style="width: 36%; text-align: center; font-weight: bold; background: #ffffff;">ACCEPTANCE</th>
            </tr>
            <tr>
                <td colspan="2" style="vertical-align: top; padding: 4px 6px;">
                    <div style="margin-bottom: 3px;"><strong>Date Inspected :</strong> {{ data_get($iar, 'dateInspected') ? \Carbon\Carbon::parse(data_get($iar, 'dateInspected'))->format('m/d/Y') : '' }}</div>
                    <div style="margin-bottom: 4px;">
                        <span class="checkbox">
                            {{ data_get($iar, 'inspectionStatus') === 'verified' ? '✓' : '' }}
                        </span>
                        Inspected, verified and found in order as to quantity and specifications
                    </div>
                    <div style="margin-top: 14px; text-align: center;">
                        <div style="border-top: 1px solid #000; width: 80%; margin: 0 auto; padding-top: 2px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase;">
                            {{ data_get($iar, 'inspectionOfficerName') ?? 'Inspection Officer' }}
                        </div>
                        <div style="font-size: 7.5pt; text-align: center; margin-top: 2px;">
                            {{ data_get($iar, 'inspectionOfficerPosition') ?? 'Inspection Committee' }}
                        </div>
                    </div>
                </td>
                <td colspan="2" style="vertical-align: top; padding: 4px 6px;">
                    <div style="margin-bottom: 3px;"><strong>Date Received :</strong> {{ data_get($iar, 'dateReceived') ? \Carbon\Carbon::parse(data_get($iar, 'dateReceived'))->format('m/d/Y') : '' }}</div>
                    <div style="margin-bottom: 2px;">
                        <span class="checkbox">
                            {{ data_get($iar, 'acceptanceStatus') === 'complete' ? '✓' : '' }}
                        </span>
                        Complete
                    </div>
                    <div style="margin-bottom: 4px;">
                        <span class="checkbox">
                            {{ data_get($iar, 'acceptanceStatus') === 'partial' ? '✓' : '' }}
                        </span>
                        Partial {{ data_get($iar, 'acceptanceStatus') === 'partial' ? '(pls. specify quantity)' : '' }} {{ data_get($iar, 'partialQuantity') ?? '' }}
                    </div>
                    <div style="margin-top: 14px; text-align: center;">
                        <div style="border-top: 1px solid #000; width: 80%; margin: 0 auto; padding-top: 2px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase;">
                            {{ data_get($iar, 'acceptanceOfficerName') ?? 'ARSENIO GEM A. GARCILLANOSA' }}
                        </div>
                        <div style="font-size: 7.5pt; text-align: center; margin-top: 2px;">
                            {{ data_get($iar, 'acceptanceOfficerPosition') ?? 'Supply Officer III' }}
                        </div>
                    </div>
                </td>
            </tr>
        </tfoot>
    </table>
</div>
@endsection

