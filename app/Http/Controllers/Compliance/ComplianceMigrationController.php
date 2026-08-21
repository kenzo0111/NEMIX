<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\ComplianceMigrationLog;
use App\Models\Compliance\MemorandumReceiptMigratedRecord;
use App\Models\Compliance\RpcIMigratedRecord;
use App\Models\Compliance\RsmiMigratedRecord;
use App\Models\Compliance\StockCardMigratedRecord;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class ComplianceMigrationController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        return $this->processMigration($request);
    }

    public function migrateStockCard(Request $request): RedirectResponse
    {
        return $this->processMigration($request, 'STOCK_CARD');
    }

    public function migrateMemorandumReceipt(Request $request): RedirectResponse
    {
        return $this->processMigration($request, 'MR');
    }

    protected function processMigration(Request $request, ?string $forcedFormType = null): RedirectResponse
    {
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

        $migrationLog = ComplianceMigrationLog::create([
            'form_type' => $normalizedFormType,
            'source' => $source,
            'records_count' => 0,
            'status' => 'processing',
            'message' => "Processing {$normalizedFormType} migration batch...",
            'created_by' => $userId,
        ]);

        $existingRefSet = [];
        $existingComboSet = [];

        if ($normalizedFormType === 'RSMI' && Schema::hasTable('rsmi_migrated_records')) {
            $existingRefSet = RsmiMigratedRecord::query()
                ->pluck('ris_no')
                ->concat(RsmiMigratedRecord::query()->pluck('serial_no'))
                ->filter()
                ->map(fn ($r) => strtolower(trim((string) $r)))
                ->flip()
                ->toArray();

            $existingComboSet = RsmiMigratedRecord::query()
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
        } elseif ($normalizedFormType === 'RPCI' && Schema::hasTable('rpci_migrated_records')) {
            $existingRefSet = RpcIMigratedRecord::query()
                ->pluck('serial_no')
                ->concat(RpcIMigratedRecord::query()->pluck('stock_no'))
                ->filter()
                ->map(fn ($r) => strtolower(trim((string) $r)))
                ->flip()
                ->toArray();

            $existingComboSet = RpcIMigratedRecord::query()
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
        } elseif ($normalizedFormType === 'STOCK_CARD' && Schema::hasTable('stock_card_migrated_records')) {
            $existingRefSet = StockCardMigratedRecord::query()
                ->pluck('reference_no')
                ->concat(StockCardMigratedRecord::query()->pluck('stock_no'))
                ->filter()
                ->map(fn ($r) => strtolower(trim((string) $r)))
                ->flip()
                ->toArray();

            $existingComboSet = StockCardMigratedRecord::query()
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
        } elseif ($normalizedFormType === 'MR' && Schema::hasTable('memorandum_receipt_migrated_records')) {
            $existingRefSet = MemorandumReceiptMigratedRecord::query()
                ->pluck('memorial_no')
                ->filter()
                ->map(fn ($r) => strtolower(trim((string) $r)))
                ->flip()
                ->toArray();

            $existingComboSet = MemorandumReceiptMigratedRecord::query()
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
                $carbon = Carbon::parse($str);
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

        if (!empty($insertData)) {
            foreach (array_chunk($insertData, 500) as $chunk) {
                if ($normalizedFormType === 'RSMI') {
                    RsmiMigratedRecord::insert($chunk);
                } elseif ($normalizedFormType === 'RPCI') {
                    RpcIMigratedRecord::insert($chunk);
                } elseif ($normalizedFormType === 'STOCK_CARD') {
                    StockCardMigratedRecord::insert($chunk);
                } elseif ($normalizedFormType === 'MR') {
                    MemorandumReceiptMigratedRecord::insert($chunk);
                }
            }
        }

        $migrationLog->update([
            'records_count' => $saved,
            'status' => 'completed',
            'message' => "Migrated {$saved} historical {$normalizedFormType} records to dedicated table; skipped {$skipped} duplicates or invalid rows.",
        ]);

        return redirect()->route('compliance.reports')->with('success', "Batch migration completed: {$saved} records imported.");
    }
}
