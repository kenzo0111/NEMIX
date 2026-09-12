<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\ComplianceReport;
use App\Policies\ResourceOwnershipPolicy;
use App\Services\Compliance\ComplianceReportDataService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ComplianceReportController extends Controller
{
    public function index(): Response
    {
        $items = class_exists(\Modules\Inventory\Models\Item::class)
            ? \Modules\Inventory\Models\Item::all()
            : [];

        $tz = config('app.timezone', 'Asia/Manila');

        $issuances = class_exists(\Modules\Inventory\Models\Issuance::class)
            ? \Modules\Inventory\Models\Issuance::with(['item', 'issuer'])->latest()->get()->map(function ($issuance) use ($tz) {
                $rawDate = $issuance->date_issued ?? $issuance->created_at;
                $formattedDate = $rawDate instanceof \DateTimeInterface
                    ? $rawDate->timezone($tz)->format('Y-m-d')
                    : ($rawDate ? Carbon::parse($rawDate)->timezone($tz)->format('Y-m-d') : null);

                $data = $issuance->toArray();
                $data['date_issued'] = $formattedDate;
                $data['date'] = $formattedDate;
                return $data;
            })->values()
            : collect();

        $receivings = class_exists(\Modules\Inventory\Models\Receiving::class)
            ? \Modules\Inventory\Models\Receiving::with(['item', 'supplier'])->latest()->get()->map(function ($receiving) use ($tz) {
                $rawDate = $receiving->date_received ?? $receiving->created_at;
                $formattedDate = $rawDate instanceof \DateTimeInterface
                    ? $rawDate->timezone($tz)->format('Y-m-d')
                    : ($rawDate ? Carbon::parse($rawDate)->timezone($tz)->format('Y-m-d') : null);

                $data = $receiving->toArray();
                $data['date_received'] = $formattedDate;
                $data['date'] = $formattedDate;
                return $data;
            })->values()
            : collect();

        $migratedRecords = collect();

        if (\Illuminate\Support\Facades\Schema::hasTable('rsmi_migrated_records')) {
            $rsmiRecords = \App\Models\Compliance\RsmiMigratedRecord::query()->latest()->get()->map(function ($record) {
                $raw = $record->raw_data ?? [];
                $recordDate = $record->date instanceof \DateTimeInterface
                    ? $record->date->format('Y-m-d')
                    : ($record->date ? (string) $record->date : data_get($raw, 'date'));

                return [
                    'id' => $record->id,
                    'form_type' => 'RSMI',
                    'source' => $record->source_file ?? $record->source_sheet ?? 'historical_migration',
                    'reference' => $record->ris_no ?? $record->serial_no ?? ('RSMI-HIST-' . $record->id),
                    'ris_no' => $record->ris_no ?? $record->serial_no,
                    'serial_no' => $record->serial_no,
                    'item_name' => $record->item ?? data_get($raw, 'item_name'),
                    'item' => $record->item ?? data_get($raw, 'item_name'),
                    'quantity' => (int) ($record->quantity_issued ?? data_get($raw, 'quantity') ?? 0),
                    'quantity_issued' => (int) ($record->quantity_issued ?? data_get($raw, 'quantity') ?? 0),
                    'recipient' => $record->center_code ?? $record->entity_name ?? data_get($raw, 'recipient'),
                    'department' => $record->center_code ?? $record->entity_name ?? data_get($raw, 'department'),
                    'responsibility_center_code' => $record->center_code ?? data_get($raw, 'responsibility_center_code'),
                    'center_code' => $record->center_code,
                    'entity_name' => $record->entity_name ?? data_get($raw, 'entity_name') ?? \App\Models\SystemSetting::get('institution.name', 'University of Camarines Norte'),
                    'stock_no' => $record->stock_no ?? data_get($raw, 'stock_no'),
                    'unit' => $record->unit ?? data_get($raw, 'unit') ?? 'pc',
                    'unit_cost' => $record->unit_cost ?? data_get($raw, 'unit_cost'),
                    'amount' => $record->amount ?? data_get($raw, 'amount'),
                    'fund_cluster' => $record->fund_cluster ?? data_get($raw, 'fund_cluster') ?? '01 - Regular Agency Fund',
                    'designation' => data_get($raw, 'designation'),
                    'remarks' => $record->remarks ?? data_get($raw, 'remarks'),
                    'date' => $recordDate,
                    'status' => 'historical_migration',
                    'payload' => array_merge($raw, [
                        'stock_no' => $record->stock_no ?? data_get($raw, 'stock_no'),
                        'unit' => $record->unit ?? data_get($raw, 'unit') ?? 'pc',
                        'unit_cost' => $record->unit_cost ?? data_get($raw, 'unit_cost'),
                        'amount' => $record->amount ?? data_get($raw, 'amount'),
                        'fund_cluster' => $record->fund_cluster ?? data_get($raw, 'fund_cluster') ?? '01 - Regular Agency Fund',
                        'center_code' => $record->center_code,
                        'responsibility_center_code' => $record->center_code,
                        'entity_name' => $record->entity_name ?? \App\Models\SystemSetting::get('institution.name', 'University of Camarines Norte'),
                        'quantity_issued' => $record->quantity_issued,
                        'item_name' => $record->item,
                        'ris_no' => $record->ris_no ?? $record->serial_no,
                    ]),
                ];
            });
            $migratedRecords = $migratedRecords->concat($rsmiRecords);
        }

        if (\Illuminate\Support\Facades\Schema::hasTable('rpci_migrated_records')) {
            $rpciRecords = \App\Models\Compliance\RpcIMigratedRecord::query()->latest()->get()->map(function ($record) {
                $raw = $record->raw_data ?? [];
                $itemName = $record->item ?? data_get($raw, 'item_name') ?? data_get($raw, 'description') ?? data_get($raw, 'article') ?? 'Inventory Item';
                $unitCost = (float) ($record->unit_cost ?? data_get($raw, 'unit_cost') ?? data_get($raw, 'unit_value') ?? 0);
                $qtyBooks = (int) ($record->quantity_per_books ?? data_get($raw, 'quantity') ?? data_get($raw, 'balance_per_card') ?? 0);
                $physCount = (int) ($record->physical_count ?? data_get($raw, 'on_hand_count') ?? data_get($raw, 'physical_count') ?? $qtyBooks);
                $shortageQty = $record->variance ?? data_get($raw, 'shortage_qty') ?? data_get($raw, 'variance');
                $shortageVal = data_get($raw, 'shortage_value') ?? ($shortageQty ? ((float)$shortageQty * $unitCost) : null);
                $totalVal = (float) ($record->total_value ?? data_get($raw, 'amount') ?? data_get($raw, 'total_value') ?? ($qtyBooks * $unitCost));
                $recordDate = $record->date instanceof \DateTimeInterface
                    ? $record->date->format('Y-m-d')
                    : ($record->date ? (string) $record->date : data_get($raw, 'date'));

                return [
                    'id' => $record->id,
                    'form_type' => 'RPCI',
                    'source' => $record->source_file ?? $record->source_sheet ?? 'historical_migration',
                    'reference' => $record->serial_no ?? $record->stock_no ?? ('RPCI-HIST-' . $record->id),
                    'serial_no' => $record->serial_no,
                    'stock_no' => $record->stock_no ?? data_get($raw, 'stock_no'),
                    'item_name' => $itemName,
                    'item' => $itemName,
                    'article' => data_get($raw, 'article') ?? $itemName,
                    'description' => data_get($raw, 'description') ?? $itemName,
                    'unit' => $record->unit ?? data_get($raw, 'unit') ?? 'pc',
                    'unit_cost' => $unitCost,
                    'unit_value' => $unitCost,
                    'quantity' => $qtyBooks,
                    'quantity_per_books' => $qtyBooks,
                    'balance_per_card' => $qtyBooks,
                    'physical_count' => $physCount,
                    'on_hand_count' => $physCount,
                    'variance' => $shortageQty,
                    'shortage_qty' => $shortageQty,
                    'shortage_value' => $shortageVal,
                    'total_value' => $totalVal,
                    'amount' => $totalVal,
                    'recipient' => data_get($raw, 'recipient') ?? data_get($raw, 'accountable_officer'),
                    'accountable_officer' => data_get($raw, 'recipient') ?? data_get($raw, 'accountable_officer'),
                    'department' => $record->location ?? $record->entity_name ?? data_get($raw, 'department'),
                    'location' => $record->location,
                    'designation' => data_get($raw, 'designation'),
                    'condition' => $record->condition,
                    'remarks' => $record->remarks ?? data_get($raw, 'remarks'),
                    'entity_name' => $record->entity_name ?? data_get($raw, 'entity_name') ?? \App\Models\SystemSetting::get('institution.name', 'University of Camarines Norte'),
                    'fund_cluster' => $record->fund_cluster ?? data_get($raw, 'fund_cluster') ?? '01 - Regular Agency Fund',
                    'date' => $recordDate,
                    'status' => 'historical_migration',
                    'payload' => array_merge($raw, [
                        'fund_cluster' => $record->fund_cluster ?? data_get($raw, 'fund_cluster') ?? '01 - Regular Agency Fund',
                        'stock_no' => $record->stock_no ?? data_get($raw, 'stock_no'),
                        'unit' => $record->unit ?? data_get($raw, 'unit') ?? 'pc',
                        'unit_cost' => $unitCost,
                        'unit_value' => $unitCost,
                        'total_value' => $totalVal,
                        'physical_count' => $physCount,
                        'on_hand_count' => $physCount,
                        'balance_per_card' => $qtyBooks,
                        'quantity_per_books' => $qtyBooks,
                        'variance' => $shortageQty,
                        'shortage_qty' => $shortageQty,
                        'shortage_value' => $shortageVal,
                        'location' => $record->location,
                        'condition' => $record->condition,
                        'remarks' => $record->remarks,
                        'item_name' => $itemName,
                    ]),
                ];
            });
            $migratedRecords = $migratedRecords->concat($rpciRecords);
        }

        if (\Illuminate\Support\Facades\Schema::hasTable('stock_card_migrated_records')) {
            $stockCardRecords = \App\Models\Compliance\StockCardMigratedRecord::query()->latest()->get()->map(function ($record) {
                $raw = $record->raw_data ?? [];
                $itemName = $record->item ?? data_get($raw, 'item_name') ?? data_get($raw, 'item') ?? 'Stock Item';
                $receiptQty = (int) ($record->receipt_quantity ?? data_get($raw, 'receipt_qty') ?? data_get($raw, 'receipt_quantity') ?? 0);
                $issueQty = (int) ($record->issue_quantity ?? data_get($raw, 'issue_qty') ?? data_get($raw, 'issue_quantity') ?? data_get($raw, 'quantity') ?? 0);
                $balanceQty = (int) ($record->balance ?? data_get($raw, 'balance_qty') ?? data_get($raw, 'balance') ?? 0);
                $recordDate = $record->date instanceof \DateTimeInterface
                    ? $record->date->format('Y-m-d')
                    : ($record->date ? (string) $record->date : data_get($raw, 'date'));

                return [
                    'id' => $record->id,
                    'form_type' => 'STOCK_CARD',
                    'source' => $record->source_file ?? $record->source_sheet ?? 'historical_migration',
                    'reference' => $record->reference_no ?? ('SC-HIST-' . $record->id),
                    'reference_no' => $record->reference_no,
                    'item_name' => $itemName,
                    'item' => $itemName,
                    'stock_no' => $record->stock_no ?? data_get($raw, 'stock_no'),
                    'unit' => $record->unit ?? data_get($raw, 'unit') ?? 'Pieces',
                    'quantity' => $issueQty,
                    'issue_quantity' => $issueQty,
                    'issue_qty' => $issueQty,
                    'receipt_quantity' => $receiptQty,
                    'receipt_qty' => $receiptQty,
                    'balance' => $balanceQty,
                    'balance_qty' => $balanceQty,
                    'recipient' => $record->office_end_user ?? data_get($raw, 'recipient') ?? data_get($raw, 'issue_office'),
                    'office_end_user' => $record->office_end_user ?? data_get($raw, 'recipient') ?? data_get($raw, 'issue_office'),
                    'department' => $record->supplier_source ?? data_get($raw, 'department') ?? data_get($raw, 'supplier_source'),
                    'supplier_source' => $record->supplier_source,
                    'unit_cost' => $record->unit_cost ?? data_get($raw, 'unit_cost'),
                    'total_cost' => $record->total_cost ?? data_get($raw, 'total_cost') ?? data_get($raw, 'amount'),
                    'designation' => null,
                    'remarks' => $record->remarks ?? data_get($raw, 'remarks'),
                    'date' => $recordDate,
                    'status' => 'historical_migration',
                    'fund_cluster' => data_get($raw, 'fund_cluster') ?? '01 - Regular Agency Fund',
                    'payload' => array_merge($raw, [
                        'fund_cluster' => data_get($raw, 'fund_cluster') ?? '01 - Regular Agency Fund',
                        'stock_no' => $record->stock_no ?? data_get($raw, 'stock_no'),
                        'unit' => $record->unit ?? data_get($raw, 'unit') ?? 'Pieces',
                        'receipt_qty' => $receiptQty,
                        'receipt_quantity' => $receiptQty,
                        'issue_qty' => $issueQty,
                        'issue_quantity' => $issueQty,
                        'balance_qty' => $balanceQty,
                        'balance' => $balanceQty,
                        'unit_cost' => $record->unit_cost,
                        'total_cost' => $record->total_cost,
                        'item_name' => $itemName,
                        'office_end_user' => $record->office_end_user,
                        'supplier_source' => $record->supplier_source,
                    ]),
                ];
            });
            $migratedRecords = $migratedRecords->concat($stockCardRecords);
        }

        if (\Illuminate\Support\Facades\Schema::hasTable('memorandum_receipt_migrated_records')) {
            $mrRecords = \App\Models\Compliance\MemorandumReceiptMigratedRecord::query()->latest()->get()->map(function ($record) {
                $raw = $record->raw_data ?? [];
                $itemName = data_get($raw, 'item_name') ?? data_get($raw, 'item') ?? data_get($raw, 'description') ?? $record->remarks ?? 'Property Item';
                $qty = (int) (data_get($raw, 'quantity') ?? data_get($raw, 'qty') ?? 1);
                $cost = (float) (data_get($raw, 'unit_cost') ?? data_get($raw, 'unit_value') ?? data_get($raw, 'cost') ?? 0);
                $totalVal = (float) (data_get($raw, 'amount') ?? data_get($raw, 'total_value') ?? ($qty * $cost));
                $unit = data_get($raw, 'unit') ?? 'pc';
                $propNo = data_get($raw, 'stock_no') ?? data_get($raw, 'property_no') ?? $record->memorial_no ?? ('MR-HIST-' . $record->id);
                $recipient = $record->received_by ?? data_get($raw, 'recipient') ?? data_get($raw, 'received_by') ?? 'Accountable Officer';
                $dept = $record->received_from ?? $record->received_for ?? data_get($raw, 'department') ?? data_get($raw, 'office') ?? 'Official Business';
                $desig = data_get($raw, 'designation') ?? data_get($raw, 'position') ?? $record->received_for ?? 'Property Custodian';
                $recordDate = $record->date_received instanceof \DateTimeInterface
                    ? $record->date_received->format('Y-m-d')
                    : ($record->date_received ? (string) $record->date_received : data_get($raw, 'date'));

                return [
                    'id' => $record->id,
                    'form_type' => 'MR',
                    'source' => $record->source_file ?? $record->source_sheet ?? 'historical_migration',
                    'reference' => $record->memorial_no ?? ('MR-HIST-' . $record->id),
                    'item_name' => $itemName,
                    'item' => $itemName,
                    'quantity' => $qty,
                    'unit' => $unit,
                    'unit_cost' => $cost,
                    'unit_value' => $cost,
                    'amount' => $totalVal,
                    'total_value' => $totalVal,
                    'stock_no' => $propNo,
                    'property_no' => $propNo,
                    'recipient' => $recipient,
                    'received_by' => $recipient,
                    'department' => $dept,
                    'received_from' => $record->received_from,
                    'received_for' => $record->received_for,
                    'designation' => $desig,
                    'remarks' => $record->remarks ?? data_get($raw, 'remarks'),
                    'date' => $recordDate,
                    'status' => 'historical_migration',
                    'fund_cluster' => data_get($raw, 'fund_cluster') ?? '01 - Regular Agency Fund',
                    'payload' => array_merge($raw, [
                        'fund_cluster' => data_get($raw, 'fund_cluster') ?? '01 - Regular Agency Fund',
                        'item_name' => $itemName,
                        'quantity' => $qty,
                        'unit' => $unit,
                        'unit_cost' => $cost,
                        'unit_value' => $cost,
                        'amount' => $totalVal,
                        'total_value' => $totalVal,
                        'property_no' => $propNo,
                        'stock_no' => $propNo,
                        'recipient' => $recipient,
                        'received_by' => $recipient,
                        'department' => $dept,
                        'designation' => $desig,
                    ]),
                ];
            });
            $migratedRecords = $migratedRecords->concat($mrRecords);
        }

        if (\Illuminate\Support\Facades\Schema::hasTable('compliance_migrated_records')) {
            $legacyRecords = \App\Models\ComplianceMigratedRecord::query()
                ->latest()
                ->get()
                ->map(function ($record) {
                    $raw = $record->payload ?? [];
                    $recordDate = $record->date instanceof \DateTimeInterface
                        ? $record->date->format('Y-m-d')
                        : ($record->date ? (string) $record->date : data_get($raw, 'date'));

                    return [
                        'id' => $record->id,
                        'form_type' => $record->form_type,
                        'source' => $record->source,
                        'reference' => $record->reference,
                        'item_name' => $record->item_name,
                        'quantity' => (int) ($record->quantity ?? 0),
                        'recipient' => $record->recipient,
                        'department' => $record->department,
                        'designation' => $record->designation,
                        'remarks' => $record->remarks,
                        'date' => $recordDate,
                        'status' => $record->status,
                        'payload' => $raw,
                    ];
                });
            $migratedRecords = $migratedRecords->concat($legacyRecords);
        }

        $reports = \Illuminate\Support\Facades\Schema::hasTable('compliance_reports')
            ? ResourceOwnershipPolicy::scopeQuery(ComplianceReport::query()->whereNull('archived_at'), request()->user(), 'created_by')
                ->latest()
                ->get()
                ->map(function ($report) {
                    $tz = config('app.timezone', 'Asia/Manila');
                    $supplierName = data_get($report->payload, 'supplierName');
                    $generatedDate = data_get($report->payload, 'generatedDate')
                        ?? ($report->created_at ? $report->created_at->timezone($tz)->format('Y-m-d') : null);

                    return [
                        'id' => $report->id,
                        'title' => $report->title,
                        'type' => $report->type,
                        'reference' => $report->reference,
                        'itemName' => $report->item_name,
                        'supplierId' => data_get($report->payload, 'supplierId') ?? null,
                        'supplierName' => is_string($supplierName) && trim($supplierName) ? trim($supplierName) : null,
                        'endUser' => data_get($report->payload, 'endUser') ?? null,
                        'payload' => $report->payload ?? [],
                        'date' => $report->coverage_label,
                        'periodType' => $report->period_type,
                        'dateValue' => optional($report->date)->format('Y-m-d'),
                        'startDate' => optional($report->start_date)->format('Y-m-d'),
                        'endDate' => optional($report->end_date)->format('Y-m-d'),
                        'selectedMonth' => $report->selected_month,
                        'selectedYear' => $report->selected_year,
                        'generatedDate' => $generatedDate,
                        'entity_name' => $report->entity_name,
                        'fund_cluster' => $report->fund_cluster,
                        'createdAt' => optional($report->created_at)->timezone($tz)->toIso8601String(),
                        'created_at' => optional($report->created_at)->timezone($tz)->toIso8601String(),
                    ];
                })
                ->values()
            : collect();

        $suppliers = class_exists(\Modules\Suppliers\Models\Supplier::class)
            ? \Modules\Suppliers\Models\Supplier::all()
            : [];

        return Inertia::render('Compliance/ManageReports', [
            'items' => $items,
            'reports' => $reports,
            'issuances' => $issuances,
            'receivings' => $receivings,
            'suppliers' => $suppliers,
            'migratedRecords' => $migratedRecords->values(),
        ]);
    }

    public static function generateReference(?string $dateStr = null): string
    {
        return app(ComplianceReportDataService::class)->generateUniqueReference($dateStr);
    }

    public function previewDataset(Request $request, ComplianceReportDataService $dataService): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'max:50'],
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
        ]);

        $dataset = $dataService->getReportDataset($validated);

        return response()->json($dataset);
    }

    public function store(Request $request, ComplianceReportDataService $dataService): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:50'],
            'reference' => ['nullable', 'string', 'max:100'],
            'itemName' => ['nullable', 'string', 'max:255'],
            'supplierId' => ['nullable', 'integer', 'exists:suppliers,id'],
            'supplierName' => ['nullable', 'string', 'max:255'],
            'periodType' => ['required', 'in:all,specific,range,monthly,yearly'],
            'date' => ['nullable', 'date'],
            'startDate' => ['nullable', 'date'],
            'endDate' => ['nullable', 'date'],
            'selectedMonth' => ['nullable', 'integer', 'between:1,12'],
            'selectedYear' => ['nullable', 'integer', 'between:2000,2100'],
            'coverageLabel' => ['nullable', 'string', 'max:255'],
            'generatedDate' => ['nullable', 'date'],
            'snapshot' => ['nullable', 'array'],
            'payload' => ['nullable', 'array'],
        ]);

        $tz = config('app.timezone', 'Asia/Manila');
        $normalizeDate = function ($val) use ($tz) {
            if (empty($val)) return null;
            try {
                return Carbon::parse($val)->timezone($tz)->format('Y-m-d');
            } catch (\Throwable $e) {
                return $val;
            }
        };

        $cleanDate = $normalizeDate($validated['date'] ?? null);
        $cleanStartDate = $normalizeDate($validated['startDate'] ?? null);
        $cleanEndDate = $normalizeDate($validated['endDate'] ?? null);
        $generatedDate = $normalizeDate($validated['generatedDate'] ?? null) ?? $cleanDate ?? now($tz)->format('Y-m-d');

        $coverageLabel = $validated['coverageLabel'] ?? null;

        if (!$coverageLabel) {
            if (($validated['periodType'] ?? null) === 'all') {
                $coverageLabel = 'All Records / Full Ledger';
            } elseif (($validated['periodType'] ?? null) === 'monthly' && !empty($validated['selectedMonth']) && !empty($validated['selectedYear'])) {
                $coverageLabel = Carbon::createFromDate((int) $validated['selectedYear'], (int) $validated['selectedMonth'], 1)->format('F Y');
            } elseif (($validated['periodType'] ?? null) === 'yearly' && !empty($validated['selectedYear'])) {
                $coverageLabel = 'Year ' . $validated['selectedYear'];
            } elseif (($validated['periodType'] ?? null) === 'range' && !empty($cleanStartDate) && !empty($cleanEndDate)) {
                $coverageLabel = $cleanStartDate . ' to ' . $cleanEndDate;
            } else {
                $coverageLabel = $cleanDate ?? null;
            }
        }

        $reference = !empty($validated['reference'])
            ? trim($validated['reference'])
            : $dataService->generateUniqueReference($generatedDate);

        // Concurrency protection: if reference is taken, generate next atomic sequence
        if (ComplianceReport::where('reference', $reference)->exists()) {
            $reference = $dataService->generateUniqueReference($generatedDate);
        }

        $rawPayload = $request->input('payload');
        $rawSnapshot = $request->input('snapshot')
            ?? data_get($rawPayload, 'snapshot')
            ?? data_get($rawPayload, 'dataset');

        $type = strtoupper((string)$validated['type']);

        // Check whether the client-provided payload or snapshot already contains generated rows
        $hasGeneratedRows = false;
        if (is_array($rawSnapshot) && !empty($rawSnapshot)) {
            if ($type === 'RSMI' && (!empty($rawSnapshot['issuedItems']) || !empty(data_get($rawSnapshot, 'rsmi.issuedItems')))) {
                $hasGeneratedRows = true;
            } elseif ($type === 'RPCI' && (!empty($rawSnapshot['items']) || !empty(data_get($rawSnapshot, 'rpci.items')))) {
                $hasGeneratedRows = true;
            } elseif (($type === 'STOCK_CARD' || $type === 'STOCKCARD') && (!empty($rawSnapshot['entries']) || !empty(data_get($rawSnapshot, 'stockCard.entries')))) {
                $hasGeneratedRows = true;
            } elseif (($type === 'MR' || $type === 'MOR') && (!empty($rawSnapshot['items']) || !empty(data_get($rawSnapshot, 'mr.items')))) {
                $hasGeneratedRows = true;
            } else {
                $hasGeneratedRows = true;
            }
        } elseif (is_array($rawPayload)) {
            if ($type === 'RSMI' && (!empty($rawPayload['issuedItems']) || !empty(data_get($rawPayload, 'rsmi.issuedItems')))) {
                $hasGeneratedRows = true;
            } elseif ($type === 'RPCI' && (!empty($rawPayload['items']) || !empty(data_get($rawPayload, 'rpci.items')))) {
                $hasGeneratedRows = true;
            } elseif (($type === 'STOCK_CARD' || $type === 'STOCKCARD') && (!empty($rawPayload['entries']) || !empty(data_get($rawPayload, 'stockCard.entries')))) {
                $hasGeneratedRows = true;
            } elseif (($type === 'MR' || $type === 'MOR') && (!empty($rawPayload['items']) || !empty(data_get($rawPayload, 'mr.items')))) {
                $hasGeneratedRows = true;
            }
        }

        // If no pre-rendered snapshot was supplied by the client, synthesize an authoritative snapshot
        $snapshot = $rawSnapshot;
        if (!$hasGeneratedRows || empty($snapshot)) {
            $synthFilters = array_merge($validated, [
                'reference' => $reference,
                'generatedDate' => $generatedDate,
                'coverageLabel' => $coverageLabel,
            ]);
            $snapshot = $dataService->getReportDataset($synthFilters);
        }

        $currentSystemEntity = \App\Models\SystemSetting::get('institution.name', 'University of Camarines Norte');
        $currentSystemFundCluster = \App\Models\SystemSetting::get('institution.default_fund_cluster', '01 - Regular Agency Fund');

        $activeEntityName = data_get($rawSnapshot, 'entity_name')
            ?? data_get($rawSnapshot, 'entityName')
            ?? data_get($rawPayload, 'entity_name')
            ?? data_get($rawPayload, 'entityName')
            ?? data_get($snapshot, 'entity_name')
            ?? data_get($snapshot, 'entityName')
            ?? $currentSystemEntity;

        $activeFundCluster = data_get($rawSnapshot, 'fund_cluster')
            ?? data_get($rawSnapshot, 'fundCluster')
            ?? data_get($rawPayload, 'fund_cluster')
            ?? data_get($rawPayload, 'fundCluster')
            ?? data_get($snapshot, 'fund_cluster')
            ?? data_get($snapshot, 'fundCluster')
            ?? $currentSystemFundCluster;

        // Build fully populated, standardized payload
        $payload = is_array($rawPayload) ? $rawPayload : [];
        $payload['generatedDate'] = $generatedDate;
        $payload['coverageLabel'] = $coverageLabel;
        $payload['reference'] = $reference;
        $payload['title'] = $validated['title'];
        $payload['type'] = $validated['type'];
        $payload['entity_name'] = $activeEntityName;
        $payload['entityName'] = $activeEntityName;
        $payload['fund_cluster'] = $activeFundCluster;
        $payload['fundCluster'] = $activeFundCluster;

        if (is_array($snapshot)) {
            $snapshot['entity_name'] = $activeEntityName;
            $snapshot['entityName'] = $activeEntityName;
            $snapshot['fund_cluster'] = $activeFundCluster;
            $snapshot['fundCluster'] = $activeFundCluster;
        }

        $payload['snapshot'] = $snapshot;
        $payload['dataset'] = $snapshot;

        if ($type === 'RSMI') {
            $rsmiData = data_get($snapshot, 'rsmi') ?? $snapshot;
            if (is_array($rsmiData)) {
                $rsmiData['entityName'] = $activeEntityName;
                $rsmiData['entity_name'] = $activeEntityName;
                $rsmiData['fundCluster'] = $activeFundCluster;
                $rsmiData['fund_cluster'] = $activeFundCluster;
            }
            $payload['rsmi'] = $rsmiData;
            $payload['issuedItems'] = data_get($rsmiData, 'issuedItems', data_get($payload, 'issuedItems', []));
            $payload['recapitulationItems'] = data_get($rsmiData, 'recapitulationItems', data_get($payload, 'recapitulationItems', []));
            $payload['summary'] = data_get($rsmiData, 'summary', data_get($snapshot, 'summary', []));
            $payload['entityName'] = $activeEntityName;
            $payload['entity_name'] = $activeEntityName;
            $payload['fundCluster'] = $activeFundCluster;
            $payload['fund_cluster'] = $activeFundCluster;
        } elseif ($type === 'RPCI') {
            $rpciData = data_get($snapshot, 'rpci') ?? $snapshot;
            if (is_array($rpciData)) {
                $rpciData['entity_name'] = $activeEntityName;
                $rpciData['entityName'] = $activeEntityName;
                $rpciData['fund_cluster'] = $activeFundCluster;
                $rpciData['fundCluster'] = $activeFundCluster;
            }
            $payload['rpci'] = $rpciData;
            $payload['items'] = data_get($rpciData, 'items', data_get($payload, 'items', []));
            $payload['summary'] = data_get($rpciData, 'summary', data_get($snapshot, 'summary', []));
            $payload['entity_name'] = $activeEntityName;
            $payload['entityName'] = $activeEntityName;
            $payload['fund_cluster'] = $activeFundCluster;
            $payload['fundCluster'] = $activeFundCluster;
        } elseif ($type === 'STOCK_CARD' || $type === 'STOCKCARD') {
            $scData = data_get($snapshot, 'stockCard') ?? $snapshot;
            if (is_array($scData)) {
                $scData['entity_name'] = $activeEntityName;
                $scData['entityName'] = $activeEntityName;
                $scData['fund_cluster'] = $activeFundCluster;
                $scData['fundCluster'] = $activeFundCluster;
            }
            $payload['stockCard'] = $scData;
            $payload['entries'] = data_get($scData, 'entries', data_get($payload, 'entries', []));
            $payload['summary'] = data_get($scData, 'summary', data_get($snapshot, 'summary', []));
            $payload['item'] = data_get($scData, 'item', data_get($payload, 'item', $validated['itemName'] ?? null));
            $payload['stock_no'] = data_get($scData, 'stock_no', data_get($payload, 'stock_no'));
            $payload['description'] = data_get($scData, 'description', data_get($payload, 'description'));
            $payload['re_order_point'] = data_get($scData, 're_order_point', data_get($payload, 're_order_point'));
            $payload['unit_of_measurement'] = data_get($scData, 'unit_of_measurement', data_get($payload, 'unit_of_measurement'));
            $payload['entity_name'] = $activeEntityName;
            $payload['entityName'] = $activeEntityName;
            $payload['fund_cluster'] = $activeFundCluster;
            $payload['fundCluster'] = $activeFundCluster;
        } elseif ($type === 'MR' || $type === 'MOR') {
            $mrData = data_get($snapshot, 'mr') ?? $snapshot;
            if (is_array($mrData)) {
                $mrData['entityName'] = $activeEntityName;
                $mrData['entity_name'] = $activeEntityName;
                $mrData['fundCluster'] = $activeFundCluster;
                $mrData['fund_cluster'] = $activeFundCluster;
            }
            $payload['mr'] = $mrData;
            $payload['items'] = data_get($mrData, 'items', data_get($payload, 'items', []));
            $payload['summary'] = data_get($mrData, 'summary', data_get($snapshot, 'summary', []));
            $payload['receivedByName'] = data_get($mrData, 'receivedByName', data_get($payload, 'receivedByName', data_get($payload, 'endUser')));
            $payload['receivedByPosition'] = data_get($mrData, 'receivedByPosition', data_get($payload, 'receivedByPosition'));
            $payload['receivedByOffice'] = data_get($mrData, 'receivedByOffice', data_get($payload, 'receivedByOffice'));
            $payload['grandTotal'] = data_get($mrData, 'grandTotal', data_get($payload, 'grandTotal'));
            $payload['entityName'] = $activeEntityName;
            $payload['entity_name'] = $activeEntityName;
            $payload['fundCluster'] = $activeFundCluster;
            $payload['fund_cluster'] = $activeFundCluster;
        }

        ComplianceReport::create([
            'title' => $validated['title'],
            'type' => $validated['type'],
            'reference' => $reference,
            'item_name' => $validated['itemName'] ?? null,
            'period_type' => $validated['periodType'],
            'date' => $cleanDate,
            'start_date' => $cleanStartDate,
            'end_date' => $cleanEndDate,
            'selected_month' => $validated['selectedMonth'] ?? null,
            'selectedYear' => $validated['selectedYear'] ?? null,
            'coverage_label' => $coverageLabel,
            'payload' => $payload,
            'created_by' => optional($request->user())->id,
        ]);

        return redirect()->route('compliance.reports')->with('success', 'Compliance report created successfully.');
    }

    public function update(Request $request, ComplianceReport $report): RedirectResponse
    {
        ResourceOwnershipPolicy::authorize($request->user(), $report, 'created_by');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:50'],
            'reference' => ['required', 'string', 'max:100'],
            'itemName' => ['nullable', 'string', 'max:255'],
            'supplierId' => ['nullable', 'integer', 'exists:suppliers,id'],
            'supplierName' => ['nullable', 'string', 'max:255'],
            'periodType' => ['required', 'in:all,specific,range,monthly,yearly'],
            'date' => ['nullable', 'date'],
            'startDate' => ['nullable', 'date'],
            'endDate' => ['nullable', 'date'],
            'selectedMonth' => ['nullable', 'integer', 'between:1,12'],
            'selectedYear' => ['nullable', 'integer', 'between:2000,2100'],
            'coverageLabel' => ['nullable', 'string', 'max:255'],
            'generatedDate' => ['nullable', 'date'],
            'snapshot' => ['nullable', 'array'],
            'payload' => ['nullable', 'array'],
        ]);

        $tz = config('app.timezone', 'Asia/Manila');
        $normalizeDate = function ($val) use ($tz) {
            if (empty($val)) return null;
            try {
                return Carbon::parse($val)->timezone($tz)->format('Y-m-d');
            } catch (\Throwable $e) {
                return $val;
            }
        };

        $cleanDate = $normalizeDate($validated['date'] ?? null);
        $cleanStartDate = $normalizeDate($validated['startDate'] ?? null);
        $cleanEndDate = $normalizeDate($validated['endDate'] ?? null);
        $cleanGeneratedDate = $normalizeDate($validated['generatedDate'] ?? null);

        $coverageLabel = $validated['coverageLabel'] ?? null;

        if (!$coverageLabel) {
            if (($validated['periodType'] ?? null) === 'all') {
                $coverageLabel = 'All Records / Full Ledger';
            } elseif (($validated['periodType'] ?? null) === 'monthly' && !empty($validated['selectedMonth']) && !empty($validated['selectedYear'])) {
                $coverageLabel = Carbon::createFromDate((int) $validated['selectedYear'], (int) $validated['selectedMonth'], 1)->format('F Y');
            } elseif (($validated['periodType'] ?? null) === 'yearly' && !empty($validated['selectedYear'])) {
                $coverageLabel = 'Year ' . $validated['selectedYear'];
            } elseif (($validated['periodType'] ?? null) === 'range' && !empty($cleanStartDate) && !empty($cleanEndDate)) {
                $coverageLabel = $cleanStartDate . ' to ' . $cleanEndDate;
            } else {
                $coverageLabel = $cleanDate ?? null;
            }
        }

        $existingPayload = is_array($report->payload) ? $report->payload : [];
        $newPayload = $validated['payload'] ?? [];

        // Preserve existing snapshot and row arrays unless updated snapshot is provided
        $snapshot = $request->input('snapshot')
            ?? data_get($newPayload, 'snapshot')
            ?? data_get($existingPayload, 'snapshot')
            ?? data_get($existingPayload, 'dataset');

        $mergedPayload = array_merge($existingPayload, $newPayload);
        if (!empty($cleanGeneratedDate)) {
            $mergedPayload['generatedDate'] = $cleanGeneratedDate;
        }
        if ($snapshot) {
            $mergedPayload['snapshot'] = $snapshot;
            $mergedPayload['dataset'] = $snapshot;
        }

        $report->update([
            'title' => $validated['title'],
            'type' => $validated['type'],
            'reference' => $validated['reference'],
            'item_name' => $validated['itemName'] ?? null,
            'period_type' => $validated['periodType'],
            'date' => $cleanDate,
            'start_date' => $cleanStartDate,
            'end_date' => $cleanEndDate,
            'selected_month' => $validated['selectedMonth'] ?? null,
            'selected_year' => $validated['selectedYear'] ?? null,
            'coverage_label' => $coverageLabel,
            'payload' => $mergedPayload,
        ]);

        return redirect()->route('compliance.reports')->with('success', 'Compliance report updated successfully.');
    }

    public function archive(Request $request, ComplianceReport $report): RedirectResponse
    {
        ResourceOwnershipPolicy::authorize($request->user(), $report, 'created_by');

        $report->update([
            'archived_at' => now(),
        ]);

        return redirect()->route('compliance.reports')->with('success', 'Compliance report archived.');
    }
}
