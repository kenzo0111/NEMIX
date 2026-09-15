<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\ComplianceReport;
use App\Services\Compliance\ComplianceReportDataService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class CompliancePdfController extends Controller
{
    public function exportPdf(Request $request, ComplianceReportDataService $dataService)
    {
        $validated = $request->validate([
            'report_id' => ['nullable', 'integer'],
            'reportId' => ['nullable', 'integer'],
            'type' => ['nullable', 'string', 'max:100'],
            'title' => ['nullable', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:100'],
            'itemName' => ['nullable', 'string', 'max:255'],
            'supplierId' => ['nullable', 'integer'],
            'endUser' => ['nullable', 'string', 'max:255'],
            'periodType' => ['nullable', 'string', 'in:all,specific,range,monthly,yearly'],
            'date' => ['nullable', 'date'],
            'startDate' => ['nullable', 'date'],
            'endDate' => ['nullable', 'date'],
            'selectedMonth' => ['nullable', 'integer', 'between:1,12'],
            'selectedYear' => ['nullable', 'integer', 'between:2000,2100'],
            'generatedDate' => ['nullable', 'date'],
            'payload' => ['nullable', 'array'],
            'snapshot' => ['nullable', 'array'],
        ]);

        $reportId = $validated['report_id'] ?? $validated['reportId'] ?? null;
        $reportModel = null;
        if ($reportId) {
            $reportModel = ComplianceReport::find($reportId);
        }

        $type = strtoupper(str_replace([' ', '-'], '_', (string) ($validated['type'] ?? $reportModel?->type ?? 'RSMI')));
        $title = $validated['title'] ?? $reportModel?->title ?? 'Compliance Report';
        $reference = $validated['reference'] ?? $reportModel?->reference ?? 'REF-' . time();

        // Retrieve or synthesize dataset
        if ($reportModel && !empty($reportModel->payload)) {
            $dataset = data_get($reportModel->payload, 'snapshot')
                ?? data_get($reportModel->payload, 'dataset')
                ?? $reportModel->payload;
        } else {
            $filters = array_merge($validated, [
                'type' => $type,
                'title' => $title,
                'reference' => $reference,
            ]);
            $dataset = $dataService->getReportDataset($filters);
        }

        // Normalize basic entity info
        $entityName = data_get($dataset, 'entity_name')
            ?? data_get($dataset, 'entityName')
            ?? \App\Models\SystemSetting::get('institution.name', 'University of Camarines Norte');

        $fundCluster = data_get($dataset, 'fund_cluster')
            ?? data_get($dataset, 'fundCluster')
            ?? \App\Models\SystemSetting::get('institution.default_fund_cluster', '01 - Regular Agency Fund');

        $dataset['entity_name'] = $entityName;
        $dataset['entityName'] = $entityName;
        $dataset['fund_cluster'] = $fundCluster;
        $dataset['fundCluster'] = $fundCluster;

        $safeName = preg_replace('/[^a-z0-9_-]+/i', '_', "{$type}_{$reference}");
        $fileName = "{$safeName}.pdf";

        switch ($type) {
            case 'RSMI':
                return $this->generateRsmiPdf($dataset, $fileName, $request);

            case 'RPCI':
                return $this->generateRpciPdf($dataset, $fileName, $request);

            case 'STOCK_CARD':
            case 'STOCKCARD':
                return $this->generateStockCardPdf($dataset, $fileName, $request);

            case 'MR':
            case 'MOR':
            case 'MEMORANDUM_RECEIPT':
                return $this->generateMemorandumReceiptPdf($dataset, $fileName, $request);

            case 'ICS':
            case 'INVENTORY_CUSTODIAN_SLIP':
                return $this->generateGenericPdf('compliance.pdf.inventory_custodian_slip', 'ics', $dataset, 'portrait', $fileName, $request);

            case 'PAR':
            case 'PROPERTY_ACKNOWLEDGEMENT_RECEIPT':
            case 'PROPERTY_ACKNOWLEDGMENT_RECEIPT':
                return $this->generateGenericPdf('compliance.pdf.property_acknowledgement_receipt', 'par', $dataset, 'portrait', $fileName, $request);

            case 'RIS':
            case 'REQUISITION_ISSUE_SLIP':
            case 'REQUISITION_AND_ISSUE_SLIP':
                return $this->generateGenericPdf('compliance.pdf.requisition_issue_slip', 'ris', $dataset, 'portrait', $fileName, $request);

            case 'IAR':
            case 'INSPECTION_ACCEPTANCE_REPORT':
            case 'INSPECTION_AND_ACCEPTANCE_REPORT':
                return $this->generateGenericPdf('compliance.pdf.inspection_acceptance_report', 'iar', $dataset, 'portrait', $fileName, $request);

            case 'PO':
            case 'PURCHASE_ORDER':
                return $this->generateGenericPdf('compliance.pdf.purchase_order', 'po', $dataset, 'portrait', $fileName, $request);

            default:
                return $this->generateRsmiPdf($dataset, $fileName, $request);
        }
    }

    protected function generateRsmiPdf(array $dataset, string $fileName, Request $request)
    {
        $rsmiData = data_get($dataset, 'rsmi') ?? $dataset;
        $forms = [];

        if (!empty($dataset['yearly']['months']) && is_array($dataset['yearly']['months'])) {
            $months = collect($dataset['yearly']['months'])
                ->sortBy(fn (array $monthData) => (int) ($monthData['month'] ?? 0))
                ->values();

            foreach ($months as $monthData) {
                if (!empty($monthData['forms']) && is_array($monthData['forms'])) {
                    foreach ($monthData['forms'] as $form) {
                        $forms[] = $this->normalizeRsmiFormData($form, $dataset);
                    }
                } elseif (!empty($monthData['issuedItems'])) {
                    $forms[] = $this->normalizeRsmiFormData($monthData, $dataset);
                }
            }
        } elseif (!empty($rsmiData['forms']) && is_array($rsmiData['forms'])) {
            foreach ($rsmiData['forms'] as $form) {
                $forms[] = $this->normalizeRsmiFormData($form, $dataset);
            }
        } else {
            $forms[] = $this->normalizeRsmiFormData($rsmiData, $dataset);
        }

        $viewData = [
            'forms' => $forms,
            'dataset' => $dataset,
        ];

        $pdf = Pdf::loadView('compliance.pdf.rsmi', $viewData)
            ->setPaper('A4', 'portrait')
            ->setOption([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'defaultFont' => 'DejaVu Serif',
            ]);

        if ($request->query('inline') === '1' || $request->input('inline') === true) {
            return $pdf->stream($fileName);
        }

        return $pdf->download($fileName);
    }

    protected function normalizeRsmiFormData(array $form, array $parentDataset): array
    {
        $entityName = data_get($form, 'entityName')
            ?? data_get($form, 'entity_name')
            ?? data_get($parentDataset, 'entityName')
            ?? \App\Models\SystemSetting::get('institution.name', 'University of Camarines Norte');

        $fundCluster = data_get($form, 'fundCluster')
            ?? data_get($form, 'fund_cluster')
            ?? data_get($parentDataset, 'fundCluster')
            ?? \App\Models\SystemSetting::get('institution.default_fund_cluster', '01 - Regular Agency Fund');

        $serialNo = data_get($form, 'serialNo')
            ?? data_get($form, 'serial_no')
            ?? data_get($parentDataset, 'reference')
            ?? 'RSMI-' . date('Y-m-0001');

        $date = data_get($form, 'date')
            ?? data_get($parentDataset, 'generatedDate')
            ?? date('Y-m-d');

        $supplyCustodianName = data_get($form, 'supplyCustodianName')
            ?? data_get($form, 'supply_custodian_name')
            ?? data_get($parentDataset, 'signatories.supply_custodian.name')
            ?? \App\Models\SystemSetting::get('signatories.rsmi_custodian_name', 'ALBERTO DE VERA JR');

        $accountingStaffName = data_get($form, 'accountingStaffName')
            ?? data_get($form, 'accounting_staff_name')
            ?? data_get($parentDataset, 'signatories.accounting_staff.name')
            ?? \App\Models\SystemSetting::get('signatories.rsmi_accounting_name', 'ALBERTO DE VERA JR');

        $accountingDate = data_get($form, 'accountingDate')
            ?? data_get($form, 'accounting_date')
            ?? $date;

        $issuedItems = data_get($form, 'issuedItems') ?? data_get($form, 'issued_items') ?? [];
        $recapitulationItems = data_get($form, 'recapitulationItems') ?? data_get($form, 'recapitulation_items') ?? [];

        return [
            'entityName' => $entityName,
            'fundCluster' => $fundCluster,
            'serialNo' => $serialNo,
            'date' => $date,
            'issuedItems' => $issuedItems,
            'recapitulationItems' => $recapitulationItems,
            'supplyCustodianName' => strtoupper((string) $supplyCustodianName),
            'accountingStaffName' => strtoupper((string) $accountingStaffName),
            'accountingDate' => $accountingDate,
        ];
    }

    protected function generateRpciPdf(array $dataset, string $fileName, Request $request)
    {
        $rpciData = data_get($dataset, 'rpci') ?? $dataset;

        $certifiedByName = data_get($rpciData, 'certified_by_name')
            ?? data_get($rpciData, 'signatories.certified_by.name')
            ?? data_get($dataset, 'signatories.certified_by.name')
            ?? \App\Models\SystemSetting::get('signatories.rpci_certified_by_name')
            ?: \App\Models\SystemSetting::get('signatories.rpci_committee_chair', '');

        $approvedByName = data_get($rpciData, 'approved_by_name')
            ?? data_get($rpciData, 'signatories.approved_by.name')
            ?? data_get($rpciData, 'accountable_officer')
            ?? \App\Models\SystemSetting::get('signatories.rpci_accountable_officer_name', 'Arsenio Gem A. Garcillanosa');

        $approvedByPosition = data_get($rpciData, 'approved_by_position')
            ?? data_get($rpciData, 'signatories.approved_by.position')
            ?? data_get($rpciData, 'designation')
            ?? \App\Models\SystemSetting::get('signatories.rpci_accountable_officer_designation', 'Supply Custodian / Supply Officer III');

        $verifiedByName = data_get($rpciData, 'verified_by_name')
            ?? data_get($rpciData, 'signatories.verified_by.name')
            ?? \App\Models\SystemSetting::get('signatories.rpci_verified_by_name', '');

        $verifiedByPosition = data_get($rpciData, 'verified_by_position')
            ?? data_get($rpciData, 'signatories.verified_by.position')
            ?? \App\Models\SystemSetting::get('signatories.rpci_verified_by_position', 'COA Representative');

        // Mirror the browser normalizer so Preview/Print and Download PDF consume
        // the same official header values, including historical saved reports.
        $rpciData['inventory_type'] = data_get($rpciData, 'inventory_type')
            ?? data_get($dataset, 'title')
            ?? 'RPCI - Physical Count of Inventories';
        $rpciData['as_at_date'] = data_get($rpciData, 'as_at_date')
            ?? data_get($dataset, 'generatedDate')
            ?? date('Y-m-d');
        $rpciData['accountable_officer'] = $approvedByName;
        $rpciData['designation'] = $approvedByPosition;
        $rpciData['entity_name'] = data_get($rpciData, 'entity_name')
            ?? data_get($dataset, 'entity_name')
            ?? data_get($dataset, 'entityName');
        $rpciData['fund_cluster'] = data_get($rpciData, 'fund_cluster')
            ?? data_get($dataset, 'fund_cluster')
            ?? data_get($dataset, 'fundCluster');

        $viewData = [
            'rpci' => $rpciData,
            'dataset' => $dataset,
            'items' => data_get($rpciData, 'items') ?? [],
            'certifiedByName' => strtoupper((string) $certifiedByName),
            'approvedByName' => strtoupper((string) $approvedByName),
            'approvedByPosition' => $approvedByPosition,
            'verifiedByName' => strtoupper((string) $verifiedByName),
            'verifiedByPosition' => $verifiedByPosition,
        ];

        $pdf = Pdf::loadView('compliance.pdf.rpci', $viewData)
            ->setPaper('A4', 'landscape')
            ->setOption([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
            ]);

        if ($request->query('inline') === '1' || $request->input('inline') === true) {
            return $pdf->stream($fileName);
        }

        return $pdf->download($fileName);
    }

    protected function generateStockCardPdf(array $dataset, string $fileName, Request $request)
    {
        $scData = data_get($dataset, 'stockCard') ?? $dataset;

        $viewData = [
            'stockCard' => $scData,
            'dataset' => $dataset,
            'entries' => data_get($scData, 'entries') ?? [],
        ];

        $pdf = Pdf::loadView('compliance.pdf.stock_card', $viewData)
            ->setPaper('A4', 'portrait')
            ->setOption([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
            ]);

        if ($request->query('inline') === '1' || $request->input('inline') === true) {
            return $pdf->stream($fileName);
        }

        return $pdf->download($fileName);
    }

    protected function generateMemorandumReceiptPdf(array $dataset, string $fileName, Request $request)
    {
        $mrData = data_get($dataset, 'mr') ?? $dataset;

        // The TSX preview normalizer promotes these report-level values into the
        // MR form. Do the same before rendering the DomPDF replica.
        $mrData['mrNo'] = data_get($mrData, 'mrNo')
            ?? data_get($mrData, 'mr_no')
            ?? data_get($dataset, 'reference');
        $mrData['date'] = data_get($mrData, 'date')
            ?? data_get($dataset, 'generatedDate')
            ?? date('Y-m-d');
        $mrData['issuedByDate'] = data_get($mrData, 'issuedByDate')
            ?? data_get($mrData, 'issued_by_date')
            ?? $mrData['date'];
        $mrData['receivedByDate'] = data_get($mrData, 'receivedByDate')
            ?? data_get($mrData, 'received_by_date')
            ?? $mrData['date'];

        $receivedByName = data_get($mrData, 'receivedByName')
            ?? data_get($mrData, 'received_by_name')
            ?? data_get($dataset, 'endUser')
            ?? '';

        $receivedByPosition = data_get($mrData, 'receivedByPosition')
            ?? data_get($mrData, 'received_by_position')
            ?? '';

        $receivedByOffice = data_get($mrData, 'receivedByOffice')
            ?? data_get($mrData, 'received_by_office')
            ?? '';

        $issuedByName = data_get($mrData, 'issuedByName')
            ?? data_get($mrData, 'issued_by_name')
            ?? \App\Models\SystemSetting::get('signatories.mr_issued_by_name', 'Arsenio Gem A. GARCILLANOSA');

        $issuedByPosition = data_get($mrData, 'issuedByPosition')
            ?? data_get($mrData, 'issued_by_position')
            ?? \App\Models\SystemSetting::get('signatories.mr_issued_by_position', 'Supply Officer III');

        $issuedByOffice = data_get($mrData, 'issuedByOffice')
            ?? data_get($mrData, 'issued_by_office')
            ?? \App\Models\SystemSetting::get('institution.name', 'University of Camarines Norte');

        $viewData = [
            'mr' => $mrData,
            'dataset' => $dataset,
            'items' => data_get($mrData, 'items') ?? [],
            'receivedByName' => strtoupper((string) $receivedByName),
            'receivedByPosition' => $receivedByPosition,
            'receivedByOffice' => $receivedByOffice,
            'issuedByName' => strtoupper((string) $issuedByName),
            'issuedByPosition' => $issuedByPosition,
            'issuedByOffice' => $issuedByOffice,
        ];

        $pdf = Pdf::loadView('compliance.pdf.memorandum_receipt', $viewData)
            ->setPaper('A4', 'portrait')
            ->setOption([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
            ]);

        if ($request->query('inline') === '1' || $request->input('inline') === true) {
            return $pdf->stream($fileName);
        }

        return $pdf->download($fileName);
    }

    protected function generateGenericPdf(string $viewPath, string $dataKey, array $dataset, string $paperOrientation, string $fileName, Request $request)
    {
        $formGroup = data_get($dataset, $dataKey) ?? $dataset;
        $items = data_get($formGroup, 'items') ?? data_get($dataset, 'items') ?? [];

        $viewData = [
            $dataKey => $formGroup,
            'dataset' => $dataset,
            'items' => $items,
        ];

        $pdf = Pdf::loadView($viewPath, $viewData)
            ->setPaper('A4', $paperOrientation)
            ->setOption([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
            ]);

        if ($request->query('inline') === '1' || $request->input('inline') === true) {
            return $pdf->stream($fileName);
        }

        return $pdf->download($fileName);
    }
}
