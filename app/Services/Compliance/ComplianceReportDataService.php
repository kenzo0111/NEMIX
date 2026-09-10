<?php

namespace App\Services\Compliance;

use App\Models\Compliance\MemorandumReceiptMigratedRecord;
use App\Models\Compliance\RpcIMigratedRecord;
use App\Models\Compliance\RsmiMigratedRecord;
use App\Models\Compliance\StockCardMigratedRecord;
use App\Models\ComplianceMigratedRecord;
use App\Models\ComplianceReport;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ComplianceReportDataService
{
    protected string $timezone;

    public function __construct()
    {
        $this->timezone = config('app.timezone', 'Asia/Manila');
    }

    /**
     * Generate an authoritative unique reference safely with sequence incrementing.
     */
    public function generateUniqueReference(?string $dateStr = null): string
    {
        $datePrefix = $dateStr
            ? Carbon::parse($dateStr)->timezone($this->timezone)->format('Y-m-d')
            : now($this->timezone)->format('Y-m-d');

        return DB::transaction(function () use ($datePrefix) {
            $existing = ComplianceReport::query()
                ->where('reference', 'LIKE', $datePrefix . '-%')
                ->lockForUpdate()
                ->pluck('reference');

            $maxSeq = 0;
            foreach ($existing as $ref) {
                if (preg_match('/^' . preg_quote($datePrefix, '/') . '-(\d+)$/', (string) $ref, $matches)) {
                    $seq = (int) $matches[1];
                    if ($seq > $maxSeq) {
                        $maxSeq = $seq;
                    }
                }
            }

            return sprintf('%s-%04d', $datePrefix, $maxSeq + 1);
        });
    }

    /**
     * Formats a date string safely into Y-m-d.
     */
    public function normalizeDate($val): ?string
    {
        if (empty($val)) {
            return null;
        }
        try {
            if ($val instanceof \DateTimeInterface) {
                return $val->format('Y-m-d');
            }
            return Carbon::parse($val)->timezone($this->timezone)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Evaluates if a given date falls within the specified reporting period.
     */
    public function isDateInPeriod(?string $dateStr, array $filters): bool
    {
        $periodType = $filters['periodType'] ?? $filters['period_type'] ?? 'all';
        if ($periodType === 'all' || empty($dateStr)) {
            return true;
        }

        $cleanDate = $this->normalizeDate($dateStr);
        if (!$cleanDate) {
            return true;
        }

        if ($periodType === 'specific') {
            $target = $this->normalizeDate($filters['date'] ?? null);
            return empty($target) || $cleanDate === $target;
        }

        if ($periodType === 'range') {
            $start = $this->normalizeDate($filters['startDate'] ?? $filters['start_date'] ?? null);
            $end = $this->normalizeDate($filters['endDate'] ?? $filters['end_date'] ?? null);

            if ($start && $end) {
                return $cleanDate >= $start && $cleanDate <= $end;
            }
            if ($start) {
                return $cleanDate >= $start;
            }
            if ($end) {
                return $cleanDate <= $end;
            }
            return true;
        }

        if ($periodType === 'monthly') {
            $m = (int) ($filters['selectedMonth'] ?? $filters['selected_month'] ?? 0);
            $y = (int) ($filters['selectedYear'] ?? $filters['selected_year'] ?? 0);
            if ($m && $y) {
                $c = Carbon::parse($cleanDate);
                return $c->month === $m && $c->year === $y;
            }
            return true;
        }

        if ($periodType === 'yearly') {
            $y = (int) ($filters['selectedYear'] ?? $filters['selected_year'] ?? 0);
            if ($y) {
                $c = Carbon::parse($cleanDate);
                return $c->year === $y;
            }
            return true;
        }

        return true;
    }

    /**
     * Compute coverage label from filter parameters.
     */
    public function buildCoverageLabel(array $filters): string
    {
        $periodType = $filters['periodType'] ?? $filters['period_type'] ?? 'all';
        $cleanDate = $this->normalizeDate($filters['date'] ?? null);
        $cleanStartDate = $this->normalizeDate($filters['startDate'] ?? $filters['start_date'] ?? null);
        $cleanEndDate = $this->normalizeDate($filters['endDate'] ?? $filters['end_date'] ?? null);
        $month = (int) ($filters['selectedMonth'] ?? $filters['selected_month'] ?? 0);
        $year = (int) ($filters['selectedYear'] ?? $filters['selected_year'] ?? 0);

        if ($periodType === 'all') {
            return 'All Records / Full Ledger';
        }
        if ($periodType === 'monthly' && $month && $year) {
            return Carbon::createFromDate($year, $month, 1)->format('F Y');
        }
        if ($periodType === 'yearly' && $year) {
            return 'Year ' . $year;
        }
        if ($periodType === 'range' && $cleanStartDate && $cleanEndDate) {
            return $cleanStartDate . ' to ' . $cleanEndDate;
        }
        return $cleanDate ?? 'All Records';
    }

    /**
     * Authoritatively retrieves and formats RSMI records.
     */
    public function getRsmiRecords(array $filters): array
    {
        $records = collect();

        // 1. Live Issuances
        if (class_exists(\Modules\Inventory\Models\Issuance::class)) {
            $liveIssuances = \Modules\Inventory\Models\Issuance::with(['item', 'issuer'])
                ->latest()
                ->get()
                ->filter(function ($issuance) use ($filters) {
                    $dt = $issuance->date_issued ?? $issuance->created_at;
                    return $this->isDateInPeriod($this->normalizeDate($dt), $filters);
                })
                ->map(function ($issuance) {
                    $item = $issuance->item;
                    $qty = (int) ($issuance->quantity ?? 0);
                    $unitCost = (float) ($item?->unit_cost ?? 0);
                    $amount = $qty * $unitCost;
                    $rawDate = $issuance->date_issued ?? $issuance->created_at;

                    return [
                        'source' => 'live',
                        'risNo' => $issuance->id ? sprintf('%04d', $issuance->id) : '-',
                        'responsibilityCenterCode' => $issuance->department ?? '-',
                        'stockNo' => $item?->sku ?? '-',
                        'itemDescription' => $item?->name ?? '-',
                        'unit' => $item?->unit_of_issue ?? $item?->unit_measure ?? 'pc',
                        'quantityIssued' => $qty,
                        'unitCost' => $unitCost,
                        'amount' => $amount,
                        'date' => $this->normalizeDate($rawDate),
                        'entity_name' => 'University of Camarines Norte',
                        'fund_cluster' => $issuance->fund_cluster ?? '01 - Regular Agency Fund',
                    ];
                });

            $records = $records->concat($liveIssuances);
        }

        // 2. Migrated RSMI Records
        if (Schema::hasTable('rsmi_migrated_records')) {
            $migrated = RsmiMigratedRecord::query()
                ->latest()
                ->get()
                ->filter(function ($rec) use ($filters) {
                    $dt = $rec->date ?? data_get($rec->raw_data, 'date');
                    return $this->isDateInPeriod($this->normalizeDate($dt), $filters);
                })
                ->map(function ($rec) {
                    $raw = $rec->raw_data ?? [];
                    $qty = (int) ($rec->quantity_issued ?? data_get($raw, 'quantity') ?? 0);
                    $cost = (float) ($rec->unit_cost ?? data_get($raw, 'unit_cost') ?? 0);
                    $amt = (float) ($rec->amount ?? data_get($raw, 'amount') ?? ($qty * $cost));

                    $centerCode = $rec->center_code ?? data_get($raw, 'center_code') ?? data_get($raw, 'responsibility_center_code') ?? '-';
                    $risNo = $rec->ris_no ?? $rec->serial_no ?? data_get($raw, 'ris_no') ?? ('RSMI-HIST-' . $rec->id);

                    return [
                        'source' => 'migration',
                        'risNo' => $risNo,
                        'responsibilityCenterCode' => $centerCode,
                        'stockNo' => $rec->stock_no ?? data_get($raw, 'stock_no') ?? '-',
                        'itemDescription' => $rec->item ?? data_get($raw, 'item_name') ?? '-',
                        'unit' => $rec->unit ?? data_get($raw, 'unit') ?? 'pc',
                        'quantityIssued' => $qty,
                        'unitCost' => $cost,
                        'amount' => $amt,
                        'date' => $this->normalizeDate($rec->date ?? data_get($raw, 'date')),
                        'entity_name' => $rec->entity_name ?? data_get($raw, 'entity_name') ?? 'University of Camarines Norte',
                        'fund_cluster' => $rec->fund_cluster ?? data_get($raw, 'fund_cluster') ?? '01 - Regular Agency Fund',
                    ];
                });

            $records = $records->concat($migrated);
        }

        // 3. Legacy compliance migrated records
        if (Schema::hasTable('compliance_migrated_records')) {
            $legacy = ComplianceMigratedRecord::query()
                ->where('form_type', 'RSMI')
                ->latest()
                ->get()
                ->filter(function ($rec) use ($filters) {
                    return $this->isDateInPeriod($this->normalizeDate($rec->date), $filters);
                })
                ->map(function ($rec) {
                    $raw = $rec->payload ?? [];
                    $qty = (int) ($rec->quantity ?? 0);
                    $cost = (float) data_get($raw, 'unit_cost', 0);
                    $amt = (float) data_get($raw, 'amount', $qty * $cost);

                    return [
                        'source' => 'migration_legacy',
                        'risNo' => $rec->reference ?? ('RSMI-LEGACY-' . $rec->id),
                        'responsibilityCenterCode' => $rec->department ?? '-',
                        'stockNo' => data_get($raw, 'stock_no', '-'),
                        'itemDescription' => $rec->item_name ?? '-',
                        'unit' => data_get($raw, 'unit', 'pc'),
                        'quantityIssued' => $qty,
                        'unitCost' => $cost,
                        'amount' => $amt,
                        'date' => $this->normalizeDate($rec->date),
                        'entity_name' => 'University of Camarines Norte',
                        'fund_cluster' => '01 - Regular Agency Fund',
                    ];
                });

            $records = $records->concat($legacy);
        }

        // Map into official issuedItems format
        $issuedItems = $records->values()->map(function ($r) {
            return [
                'risNo' => $r['risNo'],
                'responsibilityCenterCode' => $r['responsibilityCenterCode'],
                'stockNo' => $r['stockNo'],
                'itemDescription' => $r['itemDescription'],
                'unit' => $r['unit'],
                'quantityIssued' => $r['quantityIssued'],
                'unitCost' => $r['unitCost'] ? ('₱' . number_format($r['unitCost'], 2)) : '0.00',
                'amount' => $r['amount'] ? ('₱' . number_format($r['amount'], 2)) : '0.00',
            ];
        })->toArray();

        // Recapitulation grouping
        $recapMap = [];
        foreach ($records as $r) {
            $key = $r['stockNo'] . '|' . $r['unitCost'];
            if (!isset($recapMap[$key])) {
                $recapMap[$key] = [
                    'stockNo' => $r['stockNo'],
                    'quantity' => 0,
                    'unitCost' => $r['unitCost'] ? ('₱' . number_format($r['unitCost'], 2)) : '0.00',
                    'rawTotalCost' => 0,
                    'totalCost' => '0.00',
                    'uacsObjectCode' => '',
                ];
            }
            $recapMap[$key]['quantity'] += (int) $r['quantityIssued'];
            $recapMap[$key]['rawTotalCost'] += (float) $r['amount'];
            $recapMap[$key]['totalCost'] = '₱' . number_format($recapMap[$key]['rawTotalCost'], 2);
        }

        $recapitulationItems = array_values($recapMap);

        $totalUnits = $records->sum('quantityIssued');
        $totalAmount = $records->sum('amount');

        return [
            'issuedItems' => $issuedItems,
            'recapitulationItems' => $recapitulationItems,
            'summary' => [
                'recordCount' => count($issuedItems),
                'totalUnits' => $totalUnits,
                'totalAmount' => $totalAmount,
            ],
            'entityName' => $records->first()['entity_name'] ?? 'University of Camarines Norte',
            'fundCluster' => $records->first()['fund_cluster'] ?? '01 - Regular Agency Fund',
        ];
    }

    /**
     * Authoritatively retrieves and formats RPCI records.
     */
    public function getRpciRecords(array $filters): array
    {
        $supplierId = $filters['supplierId'] ?? $filters['supplier_id'] ?? null;
        $items = collect();

        // 1. Live inventory items
        if (class_exists(\Modules\Inventory\Models\Item::class)) {
            $query = \Modules\Inventory\Models\Item::query();
            if ($supplierId) {
                $query->where('supplier_id', $supplierId);
            }
            $liveItems = $query->get()->map(function ($item) {
                $stock = (int) ($item->stock ?? 0);
                $unitCost = (float) ($item->unit_cost ?? 0);
                return [
                    'source' => 'live',
                    'article' => $item->name ?? '-',
                    'description' => $item->description ?? $item->name ?? '-',
                    'stock_no' => $item->sku ?? '-',
                    'unit' => $item->unit_of_issue ?? $item->unit_measure ?? 'pc',
                    'unit_value' => $unitCost,
                    'balance_per_card' => $stock,
                    'on_hand_count' => $stock,
                    'shortage_qty' => '',
                    'shortage_value' => '',
                    'remarks' => $item->remarks ?? '',
                ];
            });

            $items = $items->concat($liveItems);
        }

        // 2. Migrated RPCI records
        if (Schema::hasTable('rpci_migrated_records')) {
            $migrated = RpcIMigratedRecord::query()
                ->latest()
                ->get()
                ->filter(function ($rec) use ($filters, $supplierId) {
                    if ($supplierId && data_get($rec->raw_data, 'supplier_id') && (string)data_get($rec->raw_data, 'supplier_id') !== (string)$supplierId) {
                        return false;
                    }
                    $dt = $rec->date ?? data_get($rec->raw_data, 'date');
                    return $this->isDateInPeriod($this->normalizeDate($dt), $filters);
                })
                ->map(function ($rec) {
                    $raw = $rec->raw_data ?? [];
                    $itemName = $rec->item ?? data_get($raw, 'item_name') ?? data_get($raw, 'description') ?? data_get($raw, 'article') ?? 'Inventory Item';
                    $stockNo = $rec->stock_no ?? $rec->serial_no ?? data_get($raw, 'stock_no') ?? '-';
                    $cost = (float) ($rec->unit_cost ?? data_get($raw, 'unit_cost') ?? data_get($raw, 'unit_value') ?? 0);
                    $bal = (int) ($rec->quantity_per_books ?? data_get($raw, 'balance_per_card') ?? 0);
                    $phys = (int) ($rec->physical_count ?? data_get($raw, 'on_hand_count') ?? $bal);
                    $shortageQty = $rec->variance ?? data_get($raw, 'shortage_qty') ?? ($bal !== $phys ? ($bal - $phys) : '');
                    $shortageVal = data_get($raw, 'shortage_value') ?? ($shortageQty ? ($shortageQty * $cost) : '');

                    return [
                        'source' => 'migration',
                        'article' => $itemName,
                        'description' => data_get($raw, 'description') ?? $itemName,
                        'stock_no' => $stockNo,
                        'unit' => $rec->unit ?? data_get($raw, 'unit') ?? 'pc',
                        'unit_value' => $cost,
                        'balance_per_card' => $bal,
                        'on_hand_count' => $phys,
                        'shortage_qty' => $shortageQty !== null && $shortageQty !== '' ? (string)$shortageQty : '',
                        'shortage_value' => $shortageVal !== null && $shortageVal !== '' ? (string)$shortageVal : '',
                        'remarks' => $rec->remarks ?? data_get($raw, 'remarks') ?? '',
                    ];
                });

            $items = $items->concat($migrated);
        }

        $totalValue = $items->sum(function ($it) {
            return ((float)($it['balance_per_card'] ?? 0)) * ((float)($it['unit_value'] ?? 0));
        });

        return [
            'items' => $items->values()->toArray(),
            'summary' => [
                'recordCount' => $items->count(),
                'totalQuantity' => $items->sum('balance_per_card'),
                'totalValue' => $totalValue,
            ],
            'entity_name' => 'University of Camarines Norte',
            'fund_cluster' => '01 - Regular Agency Fund',
        ];
    }

    /**
     * Authoritatively retrieves and calculates Stock Card ledger entries.
     */
    public function getStockCardRecords(array $filters): array
    {
        $targetItemName = trim((string) ($filters['itemName'] ?? $filters['item_name'] ?? ''));
        if (empty($targetItemName)) {
            return [
                'item' => '',
                'stock_no' => '-',
                'description' => '',
                'unit_of_measurement' => 'Pieces',
                're_order_point' => '-',
                'entries' => [],
                'summary' => ['recordCount' => 0, 'currentBalance' => 0],
            ];
        }

        $targetLower = strtolower($targetItemName);
        $activeItem = null;
        if (class_exists(\Modules\Inventory\Models\Item::class)) {
            $activeItem = \Modules\Inventory\Models\Item::where(DB::raw('LOWER(name)'), $targetLower)
                ->orWhere(DB::raw('LOWER(sku)'), $targetLower)
                ->first();
        }

        $transactions = collect();

        // 1. Receivings
        if (class_exists(\Modules\Inventory\Models\Receiving::class)) {
            $receivingsQuery = \Modules\Inventory\Models\Receiving::with(['item', 'supplier']);
            if ($activeItem) {
                $receivingsQuery->where('item_id', $activeItem->id);
            }
            $receivings = $receivingsQuery->get()
                ->filter(function ($rec) use ($targetLower, $activeItem, $filters) {
                    if (!$activeItem) {
                        $name = strtolower((string)($rec->item?->name ?? ''));
                        if ($name !== $targetLower) return false;
                    }
                    $dt = $rec->date_received ?? $rec->created_at;
                    return $this->isDateInPeriod($this->normalizeDate($dt), $filters);
                })
                ->map(function ($rec) {
                    $qty = (int) ($rec->quantity ?? 0);
                    $dt = $rec->date_received ?? $rec->created_at;
                    $supplierName = $rec->supplier?->name ?? $rec->supplier?->company_name ?? 'Delivery / Supplier';

                    return [
                        'date' => $this->normalizeDate($dt),
                        'reference' => 'RR-' . $rec->id,
                        'receipt_qty' => $qty > 0 ? $qty : '',
                        'issue_qty' => '',
                        'issue_office' => $supplierName,
                        'days_to_consume' => '',
                        '_type' => 'receipt',
                    ];
                });

            $transactions = $transactions->concat($receivings);
        }

        // 2. Issuances
        if (class_exists(\Modules\Inventory\Models\Issuance::class)) {
            $issuancesQuery = \Modules\Inventory\Models\Issuance::with(['item']);
            if ($activeItem) {
                $issuancesQuery->where('item_id', $activeItem->id);
            }
            $issuances = $issuancesQuery->get()
                ->filter(function ($iss) use ($targetLower, $activeItem, $filters) {
                    if (!$activeItem) {
                        $name = strtolower((string)($iss->item?->name ?? ''));
                        if ($name !== $targetLower) return false;
                    }
                    $dt = $iss->date_issued ?? $iss->created_at;
                    return $this->isDateInPeriod($this->normalizeDate($dt), $filters);
                })
                ->map(function ($iss) {
                    $qty = (int) ($iss->quantity ?? 0);
                    $dt = $iss->date_issued ?? $iss->created_at;
                    $office = $iss->department ?? $iss->recipient ?? 'Office';

                    return [
                        'date' => $this->normalizeDate($dt),
                        'reference' => 'RIS-' . $iss->id,
                        'receipt_qty' => '',
                        'issue_qty' => $qty > 0 ? $qty : '',
                        'issue_office' => $office,
                        'days_to_consume' => $iss->purpose ?? '',
                        '_type' => 'issue',
                    ];
                });

            $transactions = $transactions->concat($issuances);
        }

        // 3. Migrated Stock Card Records
        if (Schema::hasTable('stock_card_migrated_records')) {
            $migrated = StockCardMigratedRecord::query()
                ->latest()
                ->get()
                ->filter(function ($rec) use ($targetLower, $activeItem, $filters) {
                    $raw = $rec->raw_data ?? [];
                    $name = strtolower((string)($rec->item ?? data_get($raw, 'item_name') ?? ''));
                    $sku = strtolower((string)($rec->stock_no ?? data_get($raw, 'stock_no') ?? ''));

                    $matchesName = ($name === $targetLower);
                    $matchesSku = ($activeItem && $sku === strtolower((string)$activeItem->sku));
                    if (!$matchesName && !$matchesSku) return false;

                    $dt = $rec->date ?? data_get($raw, 'date');
                    return $this->isDateInPeriod($this->normalizeDate($dt), $filters);
                })
                ->map(function ($rec) {
                    $raw = $rec->raw_data ?? [];
                    $receiptQty = (int) ($rec->receipt_quantity ?? data_get($raw, 'receipt_qty') ?? 0);
                    $issueQty = (int) ($rec->issue_quantity ?? data_get($raw, 'issue_qty') ?? 0);
                    $balQty = (int) ($rec->balance ?? data_get($raw, 'balance_qty') ?? 0);
                    $ref = $rec->reference_no ?? ('SC-HIST-' . $rec->id);
                    $office = $rec->office_end_user ?? $rec->supplier_source ?? data_get($raw, 'office_end_user') ?? '';

                    return [
                        'date' => $this->normalizeDate($rec->date ?? data_get($raw, 'date')),
                        'reference' => $ref,
                        'receipt_qty' => $receiptQty > 0 ? $receiptQty : '',
                        'issue_qty' => $issueQty > 0 ? $issueQty : '',
                        'balance_qty' => $balQty,
                        'issue_office' => $office,
                        'days_to_consume' => $rec->remarks ?? 'Historical Migration',
                        '_type' => $receiptQty > 0 ? 'receipt' : 'issue',
                    ];
                });

            $transactions = $transactions->concat($migrated);
        }

        // Chronological sort
        $sorted = $transactions->sortBy(function ($t) {
            return ($t['date'] ?? '') . '|' . ($t['reference'] ?? '');
        })->values();

        $currentStock = (int) ($activeItem?->stock ?? 0);
        $totalIssued = $sorted->sum(fn($e) => (int)($e['issue_qty'] ?: 0));
        $totalReceived = $sorted->sum(fn($e) => (int)($e['receipt_qty'] ?: 0));
        $openingBalance = max(0, $currentStock + $totalIssued - $totalReceived);

        $entries = [];
        $runningBalance = $openingBalance;

        if ($openingBalance > 0 || $sorted->isEmpty()) {
            $entries[] = [
                'date' => '',
                'reference' => 'Opening Balance',
                'receipt_qty' => '',
                'issue_qty' => '',
                'issue_office' => '',
                'balance_qty' => $openingBalance > 0 ? $openingBalance : ($currentStock > 0 ? $currentStock : ''),
                'days_to_consume' => '',
            ];
        }

        foreach ($sorted as $tx) {
            $rQty = (int) ($tx['receipt_qty'] ?: 0);
            $iQty = (int) ($tx['issue_qty'] ?: 0);
            $runningBalance = $runningBalance + $rQty - $iQty;

            $entries[] = [
                'date' => $tx['date'] ?? '',
                'reference' => $tx['reference'] ?? '',
                'receipt_qty' => $tx['receipt_qty'] ?? '',
                'issue_qty' => $tx['issue_qty'] ?? '',
                'balance_qty' => isset($tx['balance_qty']) ? $tx['balance_qty'] : max(0, $runningBalance),
                'issue_office' => $tx['issue_office'] ?? '',
                'days_to_consume' => $tx['days_to_consume'] ?? '',
            ];
        }

        return [
            'item' => $activeItem?->name ?? $targetItemName,
            'stock_no' => $activeItem?->sku ?? '-',
            'description' => $activeItem?->description ?? $activeItem?->name ?? $targetItemName,
            'unit_of_measurement' => $activeItem?->unit_of_issue ?? $activeItem?->unit_measure ?? 'Pieces',
            're_order_point' => (string) ($activeItem?->reorder_point ?? '-'),
            'entries' => $entries,
            'summary' => [
                'recordCount' => count($entries),
                'currentBalance' => max(0, $runningBalance),
            ],
            'entity_name' => 'University of Camarines Norte',
            'fund_cluster' => '01 - Regular Agency Fund',
        ];
    }

    /**
     * Authoritatively retrieves and formats Memorandum Receipt (MR) records.
     */
    public function getMemorandumReceiptRecords(array $filters): array
    {
        $endUser = trim((string) ($filters['endUser'] ?? $filters['end_user'] ?? ''));
        $endUserLower = strtolower($endUser);
        $records = collect();

        // 1. Live issuances
        if (class_exists(\Modules\Inventory\Models\Issuance::class)) {
            $query = \Modules\Inventory\Models\Issuance::with(['item']);
            $issuances = $query->latest()->get()
                ->filter(function ($iss) use ($endUserLower, $filters) {
                    if ($endUserLower && strtolower((string)$iss->recipient) !== $endUserLower) {
                        return false;
                    }
                    $dt = $iss->date_issued ?? $iss->created_at;
                    return $this->isDateInPeriod($this->normalizeDate($dt), $filters);
                })
                ->map(function ($iss) {
                    $item = $iss->item;
                    $qty = (int) ($iss->quantity ?? 1);
                    $cost = (float) ($item?->unit_cost ?? 0);
                    $total = $qty * $cost;
                    $dt = $iss->date_issued ?? $iss->created_at;

                    return [
                        'source' => 'live',
                        'quantity' => $qty,
                        'unit' => $item?->unit_of_issue ?? $item?->unit_measure ?? 'pc',
                        'description' => $item?->name ?? 'Property Item',
                        'propertyNo' => $item?->sku ?? ('PROP-' . $iss->id),
                        'dateAcquired' => $this->normalizeDate($dt),
                        'unitValue' => $cost,
                        'totalValue' => $total,
                        'recipient' => $iss->recipient ?? 'Accountable Officer',
                        'designation' => $iss->recipient_designation ?? 'Property Custodian',
                        'department' => $iss->department ?? 'Official Business',
                    ];
                });

            $records = $records->concat($issuances);
        }

        // 2. Migrated MR records
        if (Schema::hasTable('memorandum_receipt_migrated_records')) {
            $migrated = MemorandumReceiptMigratedRecord::query()
                ->latest()
                ->get()
                ->filter(function ($rec) use ($endUserLower, $filters) {
                    $raw = $rec->raw_data ?? [];
                    $recip = strtolower((string)($rec->received_by ?? data_get($raw, 'recipient') ?? ''));
                    if ($endUserLower && $recip !== $endUserLower) {
                        return false;
                    }
                    $dt = $rec->date_received ?? data_get($raw, 'date');
                    return $this->isDateInPeriod($this->normalizeDate($dt), $filters);
                })
                ->map(function ($rec) {
                    $raw = $rec->raw_data ?? [];
                    $qty = (int) (data_get($raw, 'quantity') ?? 1);
                    $cost = (float) (data_get($raw, 'unit_cost') ?? 0);
                    $desc = data_get($raw, 'item_name') ?? $rec->remarks ?? 'Property Item';
                    $propNo = data_get($raw, 'property_no') ?? $rec->memorial_no ?? ('MR-HIST-' . $rec->id);

                    return [
                        'source' => 'migration',
                        'quantity' => $qty,
                        'unit' => data_get($raw, 'unit', 'pc'),
                        'description' => $desc,
                        'propertyNo' => $propNo,
                        'dateAcquired' => $this->normalizeDate($rec->date_received ?? data_get($raw, 'date')),
                        'unitValue' => $cost,
                        'totalValue' => $qty * $cost,
                        'recipient' => $rec->received_by ?? data_get($raw, 'recipient') ?? 'Accountable Officer',
                        'designation' => $rec->received_for ?? data_get($raw, 'designation') ?? 'Property Custodian',
                        'department' => $rec->received_from ?? data_get($raw, 'department') ?? 'Official Business',
                    ];
                });

            $records = $records->concat($migrated);
        }

        $firstRec = $records->first();
        $totalVal = $records->sum('totalValue');

        return [
            'items' => $records->values()->toArray(),
            'receivedByName' => $endUser ?: ($firstRec['recipient'] ?? 'Accountable Officer'),
            'receivedByPosition' => $firstRec['designation'] ?? 'Property Custodian',
            'receivedByOffice' => $firstRec['department'] ?? 'Official Business',
            'grandTotal' => $totalVal,
            'summary' => [
                'recordCount' => $records->count(),
                'totalQuantity' => $records->sum('quantity'),
                'totalValue' => $totalVal,
            ],
            'entityName' => 'University of Camarines Norte',
            'fundCluster' => '01 - Regular Agency Fund',
        ];
    }

    /**
     * Canonical entry point returning normalized report dataset based on criteria.
     */
    public function getReportDataset(array $filters): array
    {
        $type = strtoupper((string) ($filters['type'] ?? $filters['report_type'] ?? 'RSMI'));
        $genDate = $this->normalizeDate($filters['generatedDate'] ?? $filters['generated_date'] ?? now($this->timezone)->toDateString());
        $reference = !empty($filters['reference'])
            ? trim((string)$filters['reference'])
            : $this->generateUniqueReference($genDate);

        $coverageLabel = $this->buildCoverageLabel($filters);

        $dataset = [
            'type' => $type,
            'reference' => $reference,
            'generatedDate' => $genDate,
            'coverageLabel' => $coverageLabel,
            'filters' => $filters,
        ];

        switch ($type) {
            case 'RSMI':
                $data = $this->getRsmiRecords($filters);
                $dataset['rsmi'] = $data;
                $dataset['summary'] = $data['summary'];
                $dataset['title'] = $filters['title'] ?? 'RSMI - Supplies and Materials Issued';
                break;

            case 'RPCI':
                $data = $this->getRpciRecords($filters);
                $dataset['rpci'] = $data;
                $dataset['summary'] = $data['summary'];
                $dataset['title'] = $filters['title'] ?? 'RPCI - Physical Count of Inventories';
                break;

            case 'STOCK_CARD':
            case 'STOCKCARD':
                $data = $this->getStockCardRecords($filters);
                $dataset['stockCard'] = $data;
                $dataset['summary'] = $data['summary'];
                $dataset['title'] = $filters['title'] ?? ($data['item'] ? "Stock Card - {$data['item']}" : 'Stock Card');
                break;

            case 'MR':
            case 'MOR':
                $data = $this->getMemorandumReceiptRecords($filters);
                $dataset['mr'] = $data;
                $dataset['summary'] = $data['summary'];
                $dataset['title'] = $filters['title'] ?? ($data['receivedByName'] ? "Memorandum Receipt - {$data['receivedByName']}" : 'Memorandum Receipt for Property');
                break;

            default:
                $dataset['summary'] = ['recordCount' => 0];
                $dataset['title'] = $filters['title'] ?? 'Compliance Report';
                break;
        }

        return $dataset;
    }
}
