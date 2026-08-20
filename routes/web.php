<?php

use App\Http\Controllers\AccessControl\ManageRolePermissionController;
use App\Http\Controllers\AccessControl\ManageStaffController;
use App\Http\Controllers\ProfileController;
use App\Policies\ResourceOwnershipPolicy;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::post('/system/mode', [\App\Http\Controllers\SystemModeController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('system.mode.update');

Route::get('/system/mode', [\App\Http\Controllers\SystemModeController::class, 'show'])
    ->middleware(['auth', 'verified'])
    ->name('system.mode.show');

Route::get('/compliance/reports', function () {
    $items = class_exists(\Modules\Inventory\Models\Item::class)
        ? \Modules\Inventory\Models\Item::all()
        : [];

    $issuances = class_exists(\Modules\Inventory\Models\Issuance::class)
        ? \Modules\Inventory\Models\Issuance::with(['item', 'issuer'])->latest()->get()
        : [];

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
                'entity_name' => $record->entity_name ?? data_get($raw, 'entity_name') ?? 'University of Camarines Norte',
                'stock_no' => $record->stock_no ?? data_get($raw, 'stock_no'),
                'unit' => $record->unit ?? data_get($raw, 'unit') ?? 'pc',
                'unit_cost' => $record->unit_cost ?? data_get($raw, 'unit_cost'),
                'amount' => $record->amount ?? data_get($raw, 'amount'),
                'fund_cluster' => $record->fund_cluster ?? data_get($raw, 'fund_cluster') ?? 'General Fund',
                'designation' => data_get($raw, 'designation'),
                'remarks' => $record->remarks ?? data_get($raw, 'remarks'),
                'date' => $recordDate,
                'status' => 'historical_migration',
                'payload' => array_merge($raw, [
                    'stock_no' => $record->stock_no ?? data_get($raw, 'stock_no'),
                    'unit' => $record->unit ?? data_get($raw, 'unit') ?? 'pc',
                    'unit_cost' => $record->unit_cost ?? data_get($raw, 'unit_cost'),
                    'amount' => $record->amount ?? data_get($raw, 'amount'),
                    'fund_cluster' => $record->fund_cluster ?? data_get($raw, 'fund_cluster') ?? 'General Fund',
                    'center_code' => $record->center_code,
                    'responsibility_center_code' => $record->center_code,
                    'entity_name' => $record->entity_name ?? 'University of Camarines Norte',
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
                'entity_name' => $record->entity_name ?? data_get($raw, 'entity_name') ?? 'University of Camarines Norte',
                'fund_cluster' => $record->fund_cluster ?? data_get($raw, 'fund_cluster') ?? 'General Fund',
                'date' => $recordDate,
                'status' => 'historical_migration',
                'payload' => array_merge($raw, [
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
                'payload' => array_merge($raw, [
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
                'payload' => array_merge($raw, [
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
        ? ResourceOwnershipPolicy::scopeQuery(\App\Models\ComplianceReport::query()->whereNull('archived_at'), request()->user(), 'created_by')
            ->latest()
            ->get()
            ->map(function ($report) {
                $supplierName = data_get($report->payload, 'supplierName');
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
                    'dateValue' => optional($report->date)->toDateString(),
                    'startDate' => optional($report->start_date)->toDateString(),
                    'endDate' => optional($report->end_date)->toDateString(),
                    'selectedMonth' => $report->selected_month,
                    'selectedYear' => $report->selected_year,
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
        'suppliers' => $suppliers,
        'migratedRecords' => $migratedRecords->values(),
    ]);
})->middleware(['auth', 'verified'])->name('compliance.reports');

$processComplianceMigration = function (\Illuminate\Http\Request $request, ?string $forcedFormType = null) {
    @set_time_limit(300);
    @ini_set('memory_limit', '512M');

    $validated = $request->validate([
        'form_type' => [$forcedFormType ? 'nullable' : 'required', 'string', 'max:50'],
        'source' => ['nullable', 'string', 'max:100'],
        'records' => ['required', 'array', 'min:1'],
    ]);

    $rawFormType = $forcedFormType ?: ($validated['form_type'] ?? 'RSMI');
    $upperType = strtoupper(trim($rawFormType));

    $normalizedFormType = match ($upperType) {
        'RSMI' => 'RSMI',
        'RPCI' => 'RPCI',
        'STOCK_CARD', 'STOCKCARD', 'SC' => 'STOCK_CARD',
        'MR', 'MOR', 'MEMORANDUM_RECEIPT', 'MEMORANDUM RECEIPT' => 'MR',
        default => 'RSMI',
    };

    $source = $validated['source'] ?? 'historical_migration';
    $userId = optional($request->user())->id;
    $batchId = uniqid('batch_', true);
    $now = now();

    // Create central migration log
    $migrationLog = \App\Models\ComplianceMigrationLog::create([
        'form_type' => $normalizedFormType,
        'source' => $source,
        'records_count' => 0,
        'status' => 'processing',
        'message' => "Processing {$normalizedFormType} migration batch...",
        'created_by' => $userId,
    ]);

    $existingRefSet = [];
    $existingComboSet = [];

    // Pre-fetch references & combinations for duplicate detection based on form type
    if ($normalizedFormType === 'RSMI' && \Illuminate\Support\Facades\Schema::hasTable('rsmi_migrated_records')) {
        $existingRefSet = \App\Models\Compliance\RsmiMigratedRecord::query()
            ->pluck('ris_no')
            ->concat(\App\Models\Compliance\RsmiMigratedRecord::query()->pluck('serial_no'))
            ->filter()
            ->map(fn ($r) => strtolower(trim((string) $r)))
            ->flip()
            ->toArray();

        $existingComboSet = \App\Models\Compliance\RsmiMigratedRecord::query()
            ->select(['item', 'date', 'quantity_issued'])
            ->get()
            ->map(function ($r) {
                $item = strtolower(trim((string) ($r->item ?? '')));
                $dt = optional($r->date)->toDateString() ?? '';
                $qty = (int) ($r->quantity_issued ?? 0);
                return "{$item}||{$dt}||{$qty}";
            })
            ->filter()
            ->flip()
            ->toArray();
    } elseif ($normalizedFormType === 'RPCI' && \Illuminate\Support\Facades\Schema::hasTable('rpci_migrated_records')) {
        $existingRefSet = \App\Models\Compliance\RpcIMigratedRecord::query()
            ->pluck('serial_no')
            ->concat(\App\Models\Compliance\RpcIMigratedRecord::query()->pluck('stock_no'))
            ->filter()
            ->map(fn ($r) => strtolower(trim((string) $r)))
            ->flip()
            ->toArray();

        $existingComboSet = \App\Models\Compliance\RpcIMigratedRecord::query()
            ->select(['item', 'date', 'quantity_per_books'])
            ->get()
            ->map(function ($r) {
                $item = strtolower(trim((string) ($r->item ?? '')));
                $dt = optional($r->date)->toDateString() ?? '';
                $qty = (int) ($r->quantity_per_books ?? 0);
                return "{$item}||{$dt}||{$qty}";
            })
            ->filter()
            ->flip()
            ->toArray();
    } elseif ($normalizedFormType === 'STOCK_CARD' && \Illuminate\Support\Facades\Schema::hasTable('stock_card_migrated_records')) {
        $existingRefSet = \App\Models\Compliance\StockCardMigratedRecord::query()
            ->pluck('reference_no')
            ->concat(\App\Models\Compliance\StockCardMigratedRecord::query()->pluck('stock_no'))
            ->filter()
            ->map(fn ($r) => strtolower(trim((string) $r)))
            ->flip()
            ->toArray();

        $existingComboSet = \App\Models\Compliance\StockCardMigratedRecord::query()
            ->select(['item', 'date', 'issue_quantity', 'receipt_quantity'])
            ->get()
            ->map(function ($r) {
                $item = strtolower(trim((string) ($r->item ?? '')));
                $dt = optional($r->date)->toDateString() ?? '';
                $qty = (int) ($r->issue_quantity ?? $r->receipt_quantity ?? 0);
                return "{$item}||{$dt}||{$qty}";
            })
            ->filter()
            ->flip()
            ->toArray();
    } elseif ($normalizedFormType === 'MR' && \Illuminate\Support\Facades\Schema::hasTable('memorandum_receipt_migrated_records')) {
        $existingRefSet = \App\Models\Compliance\MemorandumReceiptMigratedRecord::query()
            ->pluck('memorial_no')
            ->filter()
            ->map(fn ($r) => strtolower(trim((string) $r)))
            ->flip()
            ->toArray();

        $existingComboSet = \App\Models\Compliance\MemorandumReceiptMigratedRecord::query()
            ->select(['received_by', 'date_received', 'remarks'])
            ->get()
            ->map(function ($r) {
                $user = strtolower(trim((string) ($r->received_by ?? '')));
                $dt = optional($r->date_received)->toDateString() ?? '';
                $rem = strtolower(trim((string) ($r->remarks ?? '')));
                return "{$user}||{$dt}||{$rem}";
            })
            ->filter()
            ->flip()
            ->toArray();
    }

    $parseValidDate = function ($dateInput) {
        if (empty($dateInput)) return null;
        $str = trim((string) $dateInput);
        if (!$str || $str === '-' || $str === 'N/A') return null;

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $str)) {
            return $str;
        }

        try {
            $carbon = \Carbon\Carbon::parse($str);
            if ($carbon->year >= 1970 && $carbon->year <= 2100) {
                return $carbon->toDateString();
            }
        } catch (\Throwable $e) {
            // Not parseable
        }

        return null;
    };

    $insertData = [];
    $saved = 0;
    $skipped = 0;

    foreach ($request->input('records', []) as $index => $recordInput) {
        if (!is_array($recordInput)) {
            $skipped++;
            continue;
        }

        $reference = trim((string) ($recordInput['reference'] ?? '')) ?: "{$normalizedFormType}-HIST-" . ($index + 1);
        $itemName = trim((string) ($recordInput['item_name'] ?? $recordInput['item'] ?? ''));
        $date = $parseValidDate($recordInput['date'] ?? $recordInput['date_received'] ?? null);
        $qty = (int) ($recordInput['quantity'] ?? $recordInput['issue_qty'] ?? $recordInput['quantity_issued'] ?? 0);

        if (empty($reference) && empty($itemName) && empty($recordInput['remarks'])) {
            $skipped++;
            continue;
        }

        $refLower = strtolower($reference);
        $comboKey = strtolower($itemName ?: (string)($recordInput['recipient'] ?? '')) . "||" . ($date ?? '') . "||{$qty}";
        $isAutoRef = (bool) preg_match('/^(?:RSMI|RPCI|MR|MOR|SC|STOCK_CARD|MIGRATED)-HIST-\d+$/i', $reference);

        // Duplicate checks
        $isDuplicate = false;
        if (!$isAutoRef && isset($existingRefSet[$refLower])) {
            $isDuplicate = true;
        } elseif ($comboKey && isset($existingComboSet[$comboKey])) {
            $isDuplicate = true;
        }

        if ($isDuplicate) {
            $skipped++;
            continue;
        }

        if (!$isAutoRef) {
            $existingRefSet[$refLower] = true;
        }
        if ($comboKey) {
            $existingComboSet[$comboKey] = true;
        }

        if ($normalizedFormType === 'RSMI') {
            $rcc = isset($recordInput['responsibility_center_code']) && trim((string)$recordInput['responsibility_center_code']) !== ''
                ? (string) $recordInput['responsibility_center_code']
                : (isset($recordInput['center_code']) && trim((string)$recordInput['center_code']) !== '' ? (string) $recordInput['center_code'] : null);

            $entityName = isset($recordInput['entity_name']) && trim((string)$recordInput['entity_name']) !== ''
                ? (string) $recordInput['entity_name']
                : (isset($recordInput['entity']) ? (string) $recordInput['entity'] : 'University of Camarines Norte');

            $insertData[] = [
                'migration_id' => $migrationLog->id,
                'migration_batch_id' => $batchId,
                'source_file' => $source,
                'source_sheet' => isset($recordInput['source_sheet']) ? (string) $recordInput['source_sheet'] : null,
                'source_row' => $index + 1,
                'form_identifier' => 'RSMI',
                'serial_no' => $reference,
                'ris_no' => isset($recordInput['ris_no']) ? (string) $recordInput['ris_no'] : $reference,
                'date' => $date,
                'entity_name' => $entityName,
                'fund_cluster' => isset($recordInput['fund_cluster']) ? (string) $recordInput['fund_cluster'] : null,
                'center_code' => $rcc,
                'stock_no' => isset($recordInput['stock_no']) ? (string) $recordInput['stock_no'] : null,
                'item' => $itemName ?: null,
                'unit' => isset($recordInput['unit']) ? (string) $recordInput['unit'] : null,
                'quantity_issued' => $qty,
                'unit_cost' => isset($recordInput['unit_cost']) ? (float) $recordInput['unit_cost'] : null,
                'amount' => isset($recordInput['amount']) ? (float) $recordInput['amount'] : null,
                'raw_data' => json_encode($recordInput),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        } elseif ($normalizedFormType === 'RPCI') {
            $insertData[] = [
                'migration_id' => $migrationLog->id,
                'migration_batch_id' => $batchId,
                'source_file' => $source,
                'source_sheet' => isset($recordInput['source_sheet']) ? (string) $recordInput['source_sheet'] : null,
                'source_row' => $index + 1,
                'form_identifier' => 'RPCI',
                'serial_no' => $reference,
                'stock_no' => isset($recordInput['stock_no']) ? (string) $recordInput['stock_no'] : null,
                'date' => $date,
                'entity_name' => isset($recordInput['entity_name']) ? (string) $recordInput['entity_name'] : null,
                'fund_cluster' => isset($recordInput['fund_cluster']) ? (string) $recordInput['fund_cluster'] : null,
                'item' => $itemName ?: null,
                'unit' => isset($recordInput['unit']) ? (string) $recordInput['unit'] : null,
                'quantity_per_books' => $qty,
                'physical_count' => isset($recordInput['on_hand_count']) ? (int) $recordInput['on_hand_count'] : $qty,
                'variance' => isset($recordInput['shortage_qty']) ? (int) $recordInput['shortage_qty'] : null,
                'unit_cost' => isset($recordInput['unit_cost']) ? (float) $recordInput['unit_cost'] : null,
                'total_value' => isset($recordInput['amount']) ? (float) $recordInput['amount'] : (isset($recordInput['shortage_value']) ? (float) $recordInput['shortage_value'] : null),
                'location' => isset($recordInput['department']) ? (string) $recordInput['department'] : null,
                'condition' => isset($recordInput['condition']) ? (string) $recordInput['condition'] : null,
                'remarks' => isset($recordInput['remarks']) ? (string) $recordInput['remarks'] : null,
                'raw_data' => json_encode($recordInput),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        } elseif ($normalizedFormType === 'STOCK_CARD') {
            $insertData[] = [
                'migration_id' => $migrationLog->id,
                'migration_batch_id' => $batchId,
                'source_file' => $source,
                'source_sheet' => isset($recordInput['source_sheet']) ? (string) $recordInput['source_sheet'] : null,
                'source_row' => $index + 1,
                'form_identifier' => 'STOCK_CARD',
                'stock_no' => isset($recordInput['stock_no']) ? (string) $recordInput['stock_no'] : null,
                'item' => $itemName ?: null,
                'unit' => isset($recordInput['unit']) ? (string) $recordInput['unit'] : null,
                'date' => $date,
                'reference_no' => $reference,
                'receipt_quantity' => isset($recordInput['receipt_qty']) ? (int) $recordInput['receipt_qty'] : 0,
                'issue_quantity' => $qty,
                'balance' => isset($recordInput['balance_qty']) ? (int) $recordInput['balance_qty'] : 0,
                'unit_cost' => isset($recordInput['unit_cost']) ? (float) $recordInput['unit_cost'] : null,
                'total_cost' => isset($recordInput['amount']) ? (float) $recordInput['amount'] : null,
                'supplier_source' => isset($recordInput['department']) ? (string) $recordInput['department'] : null,
                'office_end_user' => isset($recordInput['recipient']) ? (string) $recordInput['recipient'] : null,
                'remarks' => isset($recordInput['remarks']) ? (string) $recordInput['remarks'] : null,
                'raw_data' => json_encode($recordInput),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        } elseif ($normalizedFormType === 'MR') {
            $insertData[] = [
                'migration_id' => $migrationLog->id,
                'migration_batch_id' => $batchId,
                'source_file' => $source,
                'source_sheet' => isset($recordInput['source_sheet']) ? (string) $recordInput['source_sheet'] : null,
                'source_row' => $index + 1,
                'form_identifier' => 'MR',
                'memorial_no' => $reference,
                'date_received' => $date,
                'received_from' => isset($recordInput['department']) ? (string) $recordInput['department'] : null,
                'received_by' => isset($recordInput['recipient']) ? (string) $recordInput['recipient'] : null,
                'received_for' => isset($recordInput['designation']) ? (string) $recordInput['designation'] : null,
                'remarks' => isset($recordInput['remarks']) ? (string) $recordInput['remarks'] : ($itemName ?: null),
                'raw_data' => json_encode($recordInput),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $saved++;
    }

    // High-speed chunked insertion into dedicated tables
    if (!empty($insertData)) {
        foreach (array_chunk($insertData, 500) as $chunk) {
            if ($normalizedFormType === 'RSMI') {
                \App\Models\Compliance\RsmiMigratedRecord::insert($chunk);
            } elseif ($normalizedFormType === 'RPCI') {
                \App\Models\Compliance\RpcIMigratedRecord::insert($chunk);
            } elseif ($normalizedFormType === 'STOCK_CARD') {
                \App\Models\Compliance\StockCardMigratedRecord::insert($chunk);
            } elseif ($normalizedFormType === 'MR') {
                \App\Models\Compliance\MemorandumReceiptMigratedRecord::insert($chunk);
            }
        }
    }

    // Update centralized migration log
    $migrationLog->update([
        'records_count' => $saved,
        'status' => 'completed',
        'message' => "Migrated {$saved} historical {$normalizedFormType} records to dedicated table; skipped {$skipped} duplicates or invalid rows.",
    ]);

    return redirect()->route('compliance.reports');
};

Route::post('/compliance/migrations', function (\Illuminate\Http\Request $request) use ($processComplianceMigration) {
    return $processComplianceMigration($request);
})->middleware(['auth', 'verified'])->name('compliance.migrations.store');

Route::post('/compliance/migrate/stock-card', function (\Illuminate\Http\Request $request) use ($processComplianceMigration) {
    return $processComplianceMigration($request, 'STOCK_CARD');
})->middleware(['auth', 'verified'])->name('compliance.migrate.stock_card');

Route::post('/compliance/migrate/memorandum-receipt', function (\Illuminate\Http\Request $request) use ($processComplianceMigration) {
    return $processComplianceMigration($request, 'MR');
})->middleware(['auth', 'verified'])->name('compliance.migrate.memorandum_receipt');

Route::post('/compliance/reports', function (\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'title' => ['required', 'string', 'max:255'],
        'type' => ['required', 'string', 'max:50'],
        'reference' => ['required', 'string', 'max:100'],
        'itemName' => ['nullable', 'string', 'max:255'],
        'supplierId' => ['nullable', 'integer', 'exists:suppliers,id'],
        'supplierName' => ['nullable', 'string', 'max:255'],
        'periodType' => ['required', 'in:specific,range,monthly,yearly'],
        'date' => ['nullable', 'date'],
        'startDate' => ['nullable', 'date'],
        'endDate' => ['nullable', 'date'],
        'selectedMonth' => ['nullable', 'integer', 'between:1,12'],
        'selectedYear' => ['nullable', 'integer', 'between:2000,2100'],
        'coverageLabel' => ['nullable', 'string', 'max:255'],
        'payload' => ['nullable', 'array'],
    ]);

    $coverageLabel = $validated['coverageLabel'] ?? null;

    if (!$coverageLabel) {
        if (($validated['periodType'] ?? null) === 'monthly' && !empty($validated['selectedMonth']) && !empty($validated['selectedYear'])) {
            $coverageLabel = Carbon::createFromDate((int) $validated['selectedYear'], (int) $validated['selectedMonth'], 1)->format('F Y');
        } elseif (($validated['periodType'] ?? null) === 'yearly' && !empty($validated['selectedYear'])) {
            $coverageLabel = 'Year ' . $validated['selectedYear'];
        } elseif (($validated['periodType'] ?? null) === 'range' && !empty($validated['startDate']) && !empty($validated['endDate'])) {
            $coverageLabel = $validated['startDate'] . ' to ' . $validated['endDate'];
        } else {
            $coverageLabel = $validated['date'] ?? null;
        }
    }

    \App\Models\ComplianceReport::create([
        'title' => $validated['title'],
        'type' => $validated['type'],
        'reference' => $validated['reference'],
        'item_name' => $validated['itemName'] ?? null,
        'period_type' => $validated['periodType'],
        'date' => $validated['date'] ?? null,
        'start_date' => $validated['startDate'] ?? null,
        'end_date' => $validated['endDate'] ?? null,
        'selected_month' => $validated['selectedMonth'] ?? null,
        'selected_year' => $validated['selectedYear'] ?? null,
        'coverage_label' => $coverageLabel,
        'payload' => $validated['payload'] ?? null,
        'created_by' => optional($request->user())->id,
    ]);

    return redirect()->route('compliance.reports');
})->middleware(['auth', 'verified'])->name('compliance.reports.store');

Route::put('/compliance/reports/{report}', function (\Illuminate\Http\Request $request, \App\Models\ComplianceReport $report) {
    ResourceOwnershipPolicy::authorize($request->user(), $report, 'created_by');

    $validated = $request->validate([
        'title' => ['required', 'string', 'max:255'],
        'type' => ['required', 'string', 'max:50'],
        'reference' => ['required', 'string', 'max:100'],
        'itemName' => ['nullable', 'string', 'max:255'],
        'supplierId' => ['nullable', 'integer', 'exists:suppliers,id'],
        'supplierName' => ['nullable', 'string', 'max:255'],
        'periodType' => ['required', 'in:specific,range,monthly,yearly'],
        'date' => ['nullable', 'date'],
        'startDate' => ['nullable', 'date'],
        'endDate' => ['nullable', 'date'],
        'selectedMonth' => ['nullable', 'integer', 'between:1,12'],
        'selectedYear' => ['nullable', 'integer', 'between:2000,2100'],
        'coverageLabel' => ['nullable', 'string', 'max:255'],
        'payload' => ['nullable', 'array'],
    ]);

    $coverageLabel = $validated['coverageLabel'] ?? null;

    if (!$coverageLabel) {
        if (($validated['periodType'] ?? null) === 'monthly' && !empty($validated['selectedMonth']) && !empty($validated['selectedYear'])) {
            $coverageLabel = Carbon::createFromDate((int) $validated['selectedYear'], (int) $validated['selectedMonth'], 1)->format('F Y');
        } elseif (($validated['periodType'] ?? null) === 'yearly' && !empty($validated['selectedYear'])) {
            $coverageLabel = 'Year ' . $validated['selectedYear'];
        } elseif (($validated['periodType'] ?? null) === 'range' && !empty($validated['startDate']) && !empty($validated['endDate'])) {
            $coverageLabel = $validated['startDate'] . ' to ' . $validated['endDate'];
        } else {
            $coverageLabel = $validated['date'] ?? null;
        }
    }

    $report->update([
        'title' => $validated['title'],
        'type' => $validated['type'],
        'reference' => $validated['reference'],
        'item_name' => $validated['itemName'] ?? null,
        'period_type' => $validated['periodType'],
        'date' => $validated['date'] ?? null,
        'start_date' => $validated['startDate'] ?? null,
        'end_date' => $validated['endDate'] ?? null,
        'selected_month' => $validated['selectedMonth'] ?? null,
        'selected_year' => $validated['selectedYear'] ?? null,
        'coverage_label' => $coverageLabel,
        'payload' => $validated['payload'] ?? null,
    ]);

    return redirect()->route('compliance.reports');
})->middleware(['auth', 'verified'])->name('compliance.reports.update');

Route::delete('/compliance/reports/{report}', function (\Illuminate\Http\Request $request, \App\Models\ComplianceReport $report) {
    ResourceOwnershipPolicy::authorize($request->user(), $report, 'created_by');

    $report->update([
        'archived_at' => now(),
    ]);

    return redirect()->route('compliance.reports');
})->middleware(['auth', 'verified'])->name('compliance.reports.archive');

Route::get('/compliance/analytics', function () {
    $items = class_exists(\Modules\Inventory\Models\Item::class)
        ? \Modules\Inventory\Models\Item::query()->latest()->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku ?? 'No SKU',
                'stock' => (int) $item->stock,
                'unitCost' => (float) ($item->unit_cost ?? 0),
                'amount' => (float) ($item->amount ?? 0),
                'status' => $item->status,
                'unitOfIssue' => $item->unit_of_issue ?? 'Pcs',
                'description' => $item->description,
            ];
        })
        : collect();

    $supplierItemValues = [];
    if (class_exists(\Modules\Inventory\Models\Item::class)) {
        \Modules\Inventory\Models\Item::all(['supplier_id', 'stock', 'unit_cost', 'amount'])->each(function ($item) use (&$supplierItemValues) {
            if ($item->supplier_id === null) return;
            $supplierId = (string) $item->supplier_id;
            $itemAmount = $item->amount !== null ? (float) $item->amount : (float) $item->stock * (float) $item->unit_cost;
            $supplierItemValues[$supplierId] = ($supplierItemValues[$supplierId] ?? 0) + $itemAmount;
        });
    }

    $supplierIssuedTotals = [];
    if (class_exists(\Modules\Inventory\Models\Issuance::class)) {
        \Modules\Inventory\Models\Issuance::with('item')->get()->each(function ($issuance) use (&$supplierIssuedTotals) {
            if (! $issuance->item || $issuance->item->supplier_id === null) return;
            $supplierId = (string) $issuance->item->supplier_id;
            $supplierIssuedTotals[$supplierId] = ($supplierIssuedTotals[$supplierId] ?? 0) + (float) $issuance->quantity * (float) $issuance->item->unit_cost;
        });
    }

    $totalSupplierValue = 0;
    if (class_exists(\Modules\Suppliers\Models\Supplier::class)) {
        \Modules\Suppliers\Models\Supplier::all()->each(function ($supplier) use (&$totalSupplierValue, $supplierItemValues) {
            $supplierId = (string) $supplier->id;
            $totalSupplierValue += $supplierItemValues[$supplierId] ?? 0;
        });
    }

    $stats = [
        'totalItems' => $items->count(),
        'totalStock' => (int) $items->sum('stock'),
        'lowStockAlerts' => (int) $items->where('status', 'Low Stock')->count(),
        'outOfStock' => (int) $items->where('status', 'Out of Stock')->count(),
        'totalValue' => '₱' . number_format($totalSupplierValue > 0 ? $totalSupplierValue : (float) $items->sum('amount'), 2),
        'highestConsumable' => data_get($items->sortByDesc('stock')->first(), 'name', 'N/A'),
        'lowestConsumable' => data_get($items->sortBy('stock')->first(), 'name', 'N/A'),
    ];

    $lowStockItems = $items
        ->where('status', 'Low Stock')
        ->take(6)
        ->values()
        ->map(function ($item) {
            return [
                'id' => $item['id'],
                'name' => $item['name'],
                'sku' => $item['sku'],
                'stock' => $item['stock'],
                'unitOfIssue' => $item['unitOfIssue'],
                'amount' => $item['amount'],
            ];
        });

    $statusCounts = [
        'Available' => (int) $items->where('status', 'Available')->count(),
        'Low Stock' => (int) $items->where('status', 'Low Stock')->count(),
        'Out of Stock' => (int) $items->where('status', 'Out of Stock')->count(),
    ];

    $highestConsumables = $items
        ->sortByDesc('stock')
        ->take(5)
        ->values()
        ->map(function ($item) {
            return [
                'id' => $item['id'],
                'name' => $item['name'],
                'sku' => $item['sku'],
                'stock' => $item['stock'],
                'unitOfIssue' => $item['unitOfIssue'],
                'status' => $item['status'],
            ];
        });

    $lowestConsumables = $items
        ->sortBy('stock')
        ->take(5)
        ->values()
        ->map(function ($item) {
            return [
                'id' => $item['id'],
                'name' => $item['name'],
                'sku' => $item['sku'],
                'stock' => $item['stock'],
                'unitOfIssue' => $item['unitOfIssue'],
                'status' => $item['status'],
            ];
        });

    $stockChartItems = $items
        ->sortByDesc('stock')
        ->take(8)
        ->values()
        ->map(function ($item) {
            return [
                'label' => $item['name'],
                'value' => $item['stock'],
                'meta' => $item['unitOfIssue'] . ' • ' . $item['sku'],
                'color' => $item['status'] === 'Out of Stock' ? '#dc2626' : ($item['status'] === 'Low Stock' ? '#f59e0b' : '#b91c1c'),
            ];
        });

    $valueChartItems = $items
        ->sortByDesc('amount')
        ->take(8)
        ->values()
        ->map(function ($item) {
            return [
                'label' => $item['name'],
                'value' => (float) $item['amount'],
                'meta' => $item['sku'],
                'color' => '#0f766e',
            ];
        });

    $lowStockChartItems = $items
        ->where('status', 'Low Stock')
        ->take(6)
        ->values()
        ->map(function ($item) {
            return [
                'label' => $item['name'],
                'value' => $item['stock'],
                'meta' => 'Min threshold 10',
                'color' => '#f59e0b',
            ];
        });

    return Inertia::render('Compliance/ManageAnalytics', [
        'analytics' => [
            'stats' => $stats,
            'items' => $items->values(),
            'lowStockItems' => $lowStockItems,
            'consumables' => [
                'highest' => $highestConsumables,
                'lowest' => $lowestConsumables,
            ],
            'statusCounts' => $statusCounts,
            'chartData' => [
                'stockItems' => $stockChartItems,
                'valueItems' => $valueChartItems,
                'lowStockItems' => $lowStockChartItems,
                'statusSeries' => [
                    ['label' => 'Available', 'value' => $statusCounts['Available'], 'color' => '#059669'],
                    ['label' => 'Low Stock', 'value' => $statusCounts['Low Stock'], 'color' => '#f59e0b'],
                    ['label' => 'Out of Stock', 'value' => $statusCounts['Out of Stock'], 'color' => '#dc2626'],
                ],
            ],
        ],
    ]);
})->middleware(['auth', 'verified'])->name('compliance.analytics');

// Note: /audit-logs/login-trails is now handled by the AuditLogs module routes.

Route::get('/audit-logs/transaction-trails', [\Modules\AuditLogs\Http\Controllers\TransactionTrailController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('audit-logs.transaction-trails');


Route::get('/access-control/role-permission', [ManageRolePermissionController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.role-permission');

Route::post('/access-control/role-permission', [ManageRolePermissionController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.role-permission.store');

Route::put('/access-control/role-permission/{role}', [ManageRolePermissionController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.role-permission.update');

Route::delete('/access-control/role-permission/{role}', [ManageRolePermissionController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.role-permission.destroy');

Route::get('/access-control/manage-staffs', [ManageStaffController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.staffs');

Route::post('/access-control/manage-staffs', [ManageStaffController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.staffs.store');

Route::put('/access-control/manage-staffs/{user}', [ManageStaffController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.staffs.update');

Route::patch('/access-control/manage-staffs/{user}/toggle-status', [ManageStaffController::class, 'toggleStatus'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.staffs.toggle-status');

Route::post('/access-control/manage-staffs/{user}/resend-invitation', [ManageStaffController::class, 'resendInvitation'])
    ->middleware(['auth', 'verified'])
    ->name('access-control.staffs.resend-invitation');

Route::get('/rfid-scanner', function (\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'item_id' => ['nullable', 'integer', 'exists:items,id'],
    ]);

    $items = class_exists(\Modules\Inventory\Models\Item::class)
        ? \Modules\Inventory\Models\Item::with('supplier')->latest()->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'description' => $item->description,
                'unit_of_issue' => $item->unit_of_issue,
                'stock' => $item->stock,
                'status' => $item->status,
                'rfid_tag' => $item->rfid_tag,
                'supplier_id' => $item->supplier_id,
                'supplier_name' => $item->supplier ? $item->supplier->name : 'N/A',
                'updated_at' => optional($item->updated_at)->toDateTimeString(),
            ];
        })
        : collect();

    return Inertia::render('RFID-Scanner/Index', [
        'items' => $items,
        'selectedItemId' => $validated['item_id'] ?? null,
    ]);
})->middleware(['auth', 'verified'])->name('rfid-scanner.index');

Route::post('/rfid-scanner/assign', function (\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'item_id' => ['required', 'integer', 'exists:items,id'],
        'rfid_tag' => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9\-_]+$/'],
    ]);

    $itemId = $validated['item_id'];
    $rfidTag = trim($validated['rfid_tag']);

    $item = \Modules\Inventory\Models\Item::findOrFail($itemId);
    ResourceOwnershipPolicy::authorize($request->user(), $item, 'created_by');

    // Check if the RFID ID is already assigned to a DIFFERENT item
    $existing = \Modules\Inventory\Models\Item::where('rfid_tag', $rfidTag)
        ->where('id', '!=', $itemId)
        ->first();

    if ($existing) {
        return back()->withErrors([
            'rfid_tag' => "Conflict: RFID ID '{$rfidTag}' is already assigned to '{$existing->name}' (Property No: " . ($existing->sku ?? 'N/A') . ").",
            'conflict_item' => [
                'id' => $existing->id,
                'name' => $existing->name,
                'sku' => $existing->sku ?? 'N/A',
                'description' => $existing->description,
            ],
        ]);
    }

    $item = \Modules\Inventory\Models\Item::findOrFail($itemId);
    $item->update(['rfid_tag' => $rfidTag]);

    return redirect()->route('rfid-scanner.index', ['item_id' => $itemId])->with('success', "RFID Tag {$rfidTag} successfully assigned to {$item->name}.");
})->middleware(['auth', 'verified'])->name('rfid-scanner.assign');

Route::post('/rfid-scanner/unassign', function (\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'item_id' => ['required', 'integer', 'exists:items,id'],
    ]);

    $item = \Modules\Inventory\Models\Item::findOrFail($validated['item_id']);
    ResourceOwnershipPolicy::authorize($request->user(), $item, 'created_by');

    $item->update(['rfid_tag' => null]);

    return redirect()->route('rfid-scanner.index', ['item_id' => $item->id])->with('success', "RFID Tag unassigned from {$item->name}.");
})->middleware(['auth', 'verified'])->name('rfid-scanner.unassign');

Route::get('/rfid-scanner/lookup/{tag}', function (\Illuminate\Http\Request $request, $tag) {
    $validator = \Illuminate\Support\Facades\Validator::make(['tag' => $tag], [
        'tag' => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9\-_]+$/'],
    ]);

    if ($validator->fails()) {
        return response()->json([
            'found' => false,
            'message' => 'Invalid RFID tag format.',
        ], 422);
    }

    $sanitizedTag = $validator->validated()['tag'];

    $item = \Modules\Inventory\Models\Item::where('rfid_tag', $sanitizedTag)
        ->with('supplier')
        ->first();

    if (!$item) {
        return response()->json([
            'found' => false,
            'message' => "No item associated with RFID tag '{$sanitizedTag}'.",
        ], 404);
    }

    return response()->json([
        'found' => true,
        'item' => [
            'id' => $item->id,
            'name' => $item->name,
            'sku' => $item->sku,
            'description' => $item->description,
            'supplier_id' => $item->supplier_id,
            'supplier_name' => $item->supplier ? $item->supplier->name : '',
            'rfid_tag' => $item->rfid_tag,
            'stock' => $item->stock,
            'unit_of_issue' => $item->unit_of_issue,
        ],
    ]);
})->middleware(['auth', 'verified'])->name('rfid-scanner.lookup');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
