<?php

namespace App\Services\Compliance;

use App\Models\Compliance\MemorandumReceiptMigratedRecord;
use App\Models\Compliance\RpcIMigratedRecord;
use App\Models\Compliance\RsmiMigratedRecord;
use App\Models\Compliance\StockCardMigratedRecord;
use App\Models\ComplianceMigratedRecord;
use App\Models\ComplianceReport;
use App\Models\SystemSetting;
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
     * Centralized system entity name from System Settings.
     */
    public function getSystemEntityName(): string
    {
        return \App\Models\SystemSetting::get('institution.name', 'University of Camarines Norte');
    }

    /**
     * Default fund cluster configured in System Settings.
     */
    public function getDefaultFundCluster(): string
    {
        return \App\Models\SystemSetting::get('institution.default_fund_cluster', '01 - Regular Agency Fund');
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
     * Canonical mapping of institutional offices to short acronyms.
     */
    protected static array $canonicalOfficeCodes = [
        'office of the vice president for administration and finance' => 'OVPAF',
        'office of the vice president for academic affairs' => 'OVPAA',
        'office of the vice president for research and extension' => 'OVPRE',
        'office of the president' => 'OP',
        'college of engineering' => 'CE',
        'college of arts and sciences' => 'CAS',
        'college of business and public administration' => 'CBPA',
        'college of computing and multimedia studies' => 'CCMS',
        'college of education' => 'CoEd',
        'college of fisheries, aquatic sciences, & technology' => 'CFAST',
        'college of fisheries, aquatic sciences and technology' => 'CFAST',
        'college of agriculture and natural resources' => 'CANR',
        'college of trades and technology' => 'CoTT',
        'graduate school' => 'GS',
        'academic services division' => 'ASD',
        'auxiliary services division' => 'ASD',
        'information technology services office' => 'ITSO',
        'supply and property management office' => 'SPMO',
        'general services office' => 'GSO',
        'library' => 'LIB',
        'admission office' => 'AO',
        'alumni affairs office' => 'AAO',
        'center for equity, inclusivity and diversity' => 'CEID',
        'culture and performing arts unit' => 'CPAU',
        'electronic counseling services' => 'E-Counseling',
        'extension services division' => 'ESD',
        'fabrication and manufacturing research center' => 'FMRC',
        'guidance and counseling office' => 'GCO',
        'integrated sustainability and resilience office' => 'ISRO',
        'intellectual property management office' => 'IPMO',
        'legal affairs office' => 'LAO',
        'medical and dental services' => 'MDS',
        'national service training program office' => 'NSTP',
        'national service training program' => 'NSTP',
        'office of student services and development' => 'OSSD',
        'planning and development office' => 'PDO',
        'public information and community relations office' => 'PICRO',
        'quality assurance office' => 'QAO',
        'queen pineapple research and development institute' => 'QPRDI',
        "registrar's office" => 'RO',
        'registrars office' => 'RO',
        'research services division' => 'RSD',
        'sentro ng wika at kultura' => 'SWK',
        'social policy research center' => 'SPRC',
        'sports and development office' => 'SDO',
        'student financial assistance unit' => 'SFAU',
        'testing and evaluation' => 'TE',
    ];

    /**
     * Extracts acronym from an office or department name.
     * Priority:
     * 1. Parenthetical acronym (e.g. '... (CCMS) ...' -> 'CCMS')
     * 2. Already a code/acronym (single short token)
     * 3. Canonical dictionary match
     * 4. Algorithmic generation from significant words
     * 5. '-' fallback
     */
    public function extractAcronym(?string $name): string
    {
        if (!$name) {
            return '-';
        }
        $trimmed = trim($name);
        if ($trimmed === '' || $trimmed === '-') {
            return '-';
        }

        // 1. Parentheses: e.g. "College of Computing and Multimedia Studies (CCMS) - Main Campus"
        if (preg_match('/\(([A-Za-z0-9&\/ -]+)\)/', $trimmed, $matches)) {
            $extracted = trim($matches[1]);
            if ($extracted !== '' && $extracted !== '-') {
                return $extracted;
            }
        }

        // Strip campus/location suffix
        $stripped = preg_replace('/\s*-\s*(?:[A-Za-z\s]+)?Campus.*$/i', '', $trimmed);
        $stripped = preg_replace('/\s*-\s*(Main|Jose Panganiban|Abaño|Mercedes|Labo).*$/i', '', $stripped);
        $baseKey = strtolower(trim($stripped));

        // 2. Canonical dictionary match (e.g. 'library' -> 'LIB', 'office of the vice president...' -> 'OVPAF')
        if (isset(self::$canonicalOfficeCodes[$baseKey])) {
            return self::$canonicalOfficeCodes[$baseKey];
        }
        if (isset(self::$canonicalOfficeCodes[strtolower($trimmed)])) {
            return self::$canonicalOfficeCodes[strtolower($trimmed)];
        }

        // 3. Already a compact code (single token under 8 chars or standard format)
        if (!str_contains($trimmed, ' ') && strlen($trimmed) <= 8) {
            return $trimmed;
        }
        if (preg_match('/^\d{2}-\d{3}-\d{2}$/', $trimmed)) {
            return $trimmed;
        }

        // 4. Algorithmic acronym generation from significant words
        $stopWords = ['of', 'the', 'and', 'for', 'in', 'to', 'at', 'ng', 'mga', '&'];
        $cleanWords = preg_replace('/[^\w\s-]/', ' ', $stripped);
        $tokens = array_values(array_filter(preg_split('/\s+/', $cleanWords), function ($t) use ($stopWords) {
            return $t !== '' && !in_array(strtolower($t), $stopWords, true);
        }));

        if (empty($tokens)) {
            return '-';
        }

        if (count($tokens) === 1) {
            $single = $tokens[0];
            if (strlen($single) <= 4) {
                return strtoupper($single);
            }
            if (strtolower($single) === 'library') {
                return 'LIB';
            }
            return strlen($single) <= 6 ? strtoupper($single) : strtoupper(substr($single, 0, 3));
        }

        $acronym = '';
        foreach ($tokens as $token) {
            $acronym .= strtoupper($token[0]);
        }

        return $acronym !== '' ? $acronym : '-';
    }

    /**
     * Authoritatively retrieves and formats RSMI records.
     */
    public function getRsmiRecords(array $filters): array
    {
        $records = collect();

        // 1. Live Issuances
        if (class_exists(\Modules\Inventory\Models\Issuance::class)) {
            $liveIssuances = \Modules\Inventory\Models\Issuance::with(['items.item', 'item', 'issuer'])
                ->latest()
                ->get()
                ->filter(function ($issuance) use ($filters) {
                    $dt = $issuance->date_issued ?? $issuance->created_at;
                    return $this->isDateInPeriod($this->normalizeDate($dt), $filters);
                })
                ->flatMap(function ($issuance) {
                    $rawDate = $issuance->date_issued ?? $issuance->created_at;
                    $normDate = $this->normalizeDate($rawDate);
                    $risNo = $issuance->ris_number ?: ($issuance->id ? sprintf('%04d', $issuance->id) : '-');
                    $deptName = $issuance->department ?? '-';
                    $deptCode = $this->extractAcronym($deptName);
                    $fundCluster = $issuance->fund_cluster ?? '01 - Regular Agency Fund';

                    if ($issuance->items->isNotEmpty()) {
                        return $issuance->items->map(function ($line) use ($normDate, $risNo, $deptName, $deptCode, $fundCluster) {
                            $item = $line->item;
                            $qty = (int) $line->quantity;
                            $unitCost = (float) ($line->unit_cost ?? $item?->unit_cost ?? 0);
                            $amount = (float) ($line->amount ?? ($qty * $unitCost));

                            return [
                                'source' => 'live',
                                'risNo' => $risNo,
                                'responsibilityCenterCode' => $deptCode,
                                'responsibility_center' => [
                                    'name' => $deptName,
                                    'code' => $deptCode,
                                    'acronym' => $deptCode,
                                ],
                                'stockNo' => $item?->sku ?? '-',
                                'itemDescription' => $item?->name ?? '-',
                                'unit' => $item?->unit_of_issue ?? $item?->unit_measure ?? 'pc',
                                'quantityIssued' => $qty,
                                'unitCost' => $unitCost,
                                'amount' => $amount,
                                'date' => $normDate,
                                'entity_name' => $this->getSystemEntityName(),
                                'fund_cluster' => $fundCluster,
                            ];
                        });
                    }

                    $item = $issuance->item;
                    $qty = (int) ($issuance->quantity ?? 0);
                    $unitCost = (float) ($item?->unit_cost ?? 0);
                    $amount = $qty * $unitCost;

                    return [[
                        'source' => 'live',
                        'risNo' => $risNo,
                        'responsibilityCenterCode' => $deptCode,
                        'responsibility_center' => [
                            'name' => $deptName,
                            'code' => $deptCode,
                            'acronym' => $deptCode,
                        ],
                        'stockNo' => $item?->sku ?? '-',
                        'itemDescription' => $item?->name ?? '-',
                        'unit' => $item?->unit_of_issue ?? $item?->unit_measure ?? 'pc',
                        'quantityIssued' => $qty,
                        'unitCost' => $unitCost,
                        'amount' => $amount,
                        'date' => $normDate,
                        'entity_name' => $this->getSystemEntityName(),
                        'fund_cluster' => $fundCluster,
                    ]];
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

                    $rawCenter = $rec->center_code ?? data_get($raw, 'center_code') ?? data_get($raw, 'responsibility_center_code') ?? '-';
                    $centerCode = $this->extractAcronym($rawCenter);
                    $risNo = $rec->ris_no ?? $rec->serial_no ?? data_get($raw, 'ris_no') ?? ('RSMI-HIST-' . $rec->id);

                    return [
                        'source' => 'migration',
                        'risNo' => $risNo,
                        'responsibilityCenterCode' => $centerCode,
                        'responsibility_center' => [
                            'name' => $rawCenter,
                            'code' => $centerCode,
                            'acronym' => $centerCode,
                        ],
                        'stockNo' => $rec->stock_no ?? data_get($raw, 'stock_no') ?? '-',
                        'itemDescription' => $rec->item ?? data_get($raw, 'item_name') ?? '-',
                        'unit' => $rec->unit ?? data_get($raw, 'unit') ?? 'pc',
                        'quantityIssued' => $qty,
                        'unitCost' => $cost,
                        'amount' => $amt,
                        'date' => $this->normalizeDate($rec->date ?? data_get($raw, 'date')),
                        'entity_name' => $rec->entity_name ?? data_get($raw, 'entity_name') ?? $this->getSystemEntityName(),
                        'fund_cluster' => $rec->fund_cluster ?? data_get($raw, 'fund_cluster') ?? $this->getDefaultFundCluster(),
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

                    $rawDept = $rec->department ?? '-';
                    $deptCode = $this->extractAcronym($rawDept);

                    return [
                        'source' => 'migration_legacy',
                        'risNo' => $rec->reference ?? ('RSMI-LEGACY-' . $rec->id),
                        'responsibilityCenterCode' => $deptCode,
                        'responsibility_center' => [
                            'name' => $rawDept,
                            'code' => $deptCode,
                            'acronym' => $deptCode,
                        ],
                        'stockNo' => data_get($raw, 'stock_no', '-'),
                        'itemDescription' => $rec->item_name ?? '-',
                        'unit' => data_get($raw, 'unit', 'pc'),
                        'quantityIssued' => $qty,
                        'unitCost' => $cost,
                        'amount' => $amt,
                        'date' => $this->normalizeDate($rec->date),
                        'entity_name' => $this->getSystemEntityName(),
                        'fund_cluster' => $this->getDefaultFundCluster(),
                    ];
                });

            $records = $records->concat($legacy);
        }

        // Map into official issuedItems format
        $issuedItems = $records->values()->map(function ($r) {
            return [
                'risNo' => $r['risNo'],
                'responsibilityCenterCode' => $r['responsibilityCenterCode'],
                'responsibility_center' => $r['responsibility_center'] ?? [
                    'name' => $r['responsibilityCenterCode'],
                    'code' => $r['responsibilityCenterCode'],
                    'acronym' => $r['responsibilityCenterCode'],
                ],
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
            'recapitulation' => $recapitulationItems,
            'summary' => [
                'recordCount' => count($issuedItems),
                'totalUnits' => $totalUnits,
                'totalAmount' => $totalAmount,
            ],
            'entityName' => $this->getSystemEntityName(),
            'entity_name' => $this->getSystemEntityName(),
            'fundCluster' => $records->first()['fund_cluster'] ?? $this->getDefaultFundCluster(),
            'fund_cluster' => $records->first()['fund_cluster'] ?? $this->getDefaultFundCluster(),
        ];
    }

    /**
     * Authoritatively retrieves and formats RPCI records.
     */
    public function getRpciRecords(array $filters): array
    {
        $supplierId = $filters['supplierId'] ?? $filters['supplier_id'] ?? null;
        $items = collect();

        $asOfDate = $this->normalizeDate(
            $filters['as_at_date'] ?? $filters['asAtDate'] ?? $filters['date'] ?? $filters['endDate'] ?? $filters['end_date'] ?? null
        );

        // 1. Live inventory batches (authoritative supplier batch identity, stock number, and cost)
        if (class_exists(\Modules\Inventory\Models\InventoryBatch::class)) {
            $batchQuery = \Modules\Inventory\Models\InventoryBatch::query()
                ->with(['item', 'supplier', 'allocations.issuanceItem.issuance'])
                ->whereNull('deleted_at');

            if ($supplierId) {
                $batchQuery->where('supplier_id', $supplierId);
            }

            if ($asOfDate) {
                $batchQuery->where('date_received', '<=', $asOfDate);
            }

            $batchQuery->orderBy('item_id', 'asc')
                ->orderBy('date_received', 'asc')
                ->orderBy('id', 'asc');

            $batches = $batchQuery->get();

            $batchItems = $batches->map(function ($batch) use ($asOfDate) {
                if ($asOfDate) {
                    $issuedUpToDate = (int) $batch->allocations->filter(function ($alloc) use ($asOfDate) {
                        $issDate = $alloc->issuanceItem?->issuance?->date_issued;
                        if (!$issDate) {
                            return false;
                        }
                        $norm = $this->normalizeDate($issDate);
                        return $norm && $norm <= $asOfDate;
                    })->sum('quantity');

                    $bookBalance = max(0, (int) $batch->quantity_received - $issuedUpToDate);
                } else {
                    $bookBalance = (int) $batch->quantity_remaining;
                }

                $item = $batch->item;
                $unitCost = (float) $batch->unit_cost;
                $stockNo = $batch->supplier_stock_no ?: ($item?->sku ?: '-');

                return [
                    'source' => 'live_batch',
                    'item_id' => $batch->item_id,
                    'batch_id' => $batch->id,
                    'article' => $item?->name ?? '-',
                    'description' => $item?->description ?? $item?->name ?? '-',
                    'stock_no' => $stockNo,
                    'supplier_stock_no' => $batch->supplier_stock_no,
                    'supplier_id' => $batch->supplier_id,
                    'supplier_name' => $batch->supplier?->name ?? 'Supplier',
                    'unit' => $item?->unit_of_issue ?? $item?->unit_measure ?? 'pc',
                    'unit_value' => $unitCost,
                    'balance_per_card' => $bookBalance,
                    'on_hand_count' => $bookBalance,
                    'shortage_qty' => '',
                    'shortage_value' => '',
                    'remarks' => $item?->remarks ?? '',
                    'quantity_received' => (int) $batch->quantity_received,
                    'quantity_remaining' => (int) $batch->quantity_remaining,
                ];
            })->filter(function ($row) use ($supplierId) {
                if ($supplierId) {
                    return true;
                }
                return (int) ($row['balance_per_card'] ?? 0) > 0;
            });

            $items = $items->concat($batchItems);

            // Fallback for items with no batches yet
            if (class_exists(\Modules\Inventory\Models\Item::class)) {
                $batchedItemIds = $batches->pluck('item_id')->unique()->toArray();
                $unbatchedQuery = \Modules\Inventory\Models\Item::query();
                if ($supplierId) {
                    $unbatchedQuery->where('supplier_id', $supplierId);
                }
                if (!empty($batchedItemIds)) {
                    $unbatchedQuery->whereNotIn('id', $batchedItemIds);
                }
                $unbatched = $unbatchedQuery->get()->filter(function ($item) use ($supplierId) {
                    return (int) ($item->stock ?? 0) > 0 || $supplierId;
                })->map(function ($item) {
                    $stock = (int) ($item->stock ?? 0);
                    $unitCost = (float) ($item->unit_cost ?? 0);
                    return [
                        'source' => 'live_item',
                        'item_id' => $item->id,
                        'batch_id' => null,
                        'article' => $item->name ?? '-',
                        'description' => $item->description ?? $item->name ?? '-',
                        'stock_no' => $item->sku ?? '-',
                        'supplier_stock_no' => null,
                        'supplier_id' => $item->supplier_id,
                        'supplier_name' => $item->supplier?->name ?? 'Supplier',
                        'unit' => $item->unit_of_issue ?? $item->unit_measure ?? 'pc',
                        'unit_value' => $unitCost,
                        'balance_per_card' => $stock,
                        'on_hand_count' => $stock,
                        'shortage_qty' => '',
                        'shortage_value' => '',
                        'remarks' => $item->remarks ?? '',
                        'quantity_received' => $stock,
                        'quantity_remaining' => $stock,
                    ];
                });

                $items = $items->concat($unbatched);
            }
        } elseif (class_exists(\Modules\Inventory\Models\Item::class)) {
            $query = \Modules\Inventory\Models\Item::query();
            if ($supplierId) {
                $query->where('supplier_id', $supplierId);
            }
            $liveItems = $query->get()->map(function ($item) {
                $stock = (int) ($item->stock ?? 0);
                $unitCost = (float) ($item->unit_cost ?? 0);
                return [
                    'source' => 'live',
                    'item_id' => $item->id,
                    'batch_id' => null,
                    'article' => $item->name ?? '-',
                    'description' => $item->description ?? $item->name ?? '-',
                    'stock_no' => $item->sku ?? '-',
                    'supplier_stock_no' => null,
                    'supplier_id' => $item->supplier_id,
                    'supplier_name' => $item->supplier?->name ?? 'Supplier',
                    'unit' => $item->unit_of_issue ?? $item->unit_measure ?? 'pc',
                    'unit_value' => $unitCost,
                    'balance_per_card' => $stock,
                    'on_hand_count' => $stock,
                    'shortage_qty' => '',
                    'shortage_value' => '',
                    'remarks' => $item->remarks ?? '',
                    'quantity_received' => $stock,
                    'quantity_remaining' => $stock,
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
            'entity_name' => $this->getSystemEntityName(),
            'entityName' => $this->getSystemEntityName(),
            'fund_cluster' => $this->getDefaultFundCluster(),
            'fundCluster' => $this->getDefaultFundCluster(),
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
                'entity_name' => $this->getSystemEntityName(),
                'entityName' => $this->getSystemEntityName(),
                'fund_cluster' => $this->getDefaultFundCluster(),
                'fundCluster' => $this->getDefaultFundCluster(),
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
            $issuancesQuery = \Modules\Inventory\Models\Issuance::with(['items.item', 'item']);
            if ($activeItem) {
                $issuancesQuery->where(function ($q) use ($activeItem) {
                    $q->whereHas('items', function ($sub) use ($activeItem) {
                        $sub->where('item_id', $activeItem->id);
                    })->orWhere(function ($sub) use ($activeItem) {
                        $sub->where('item_id', $activeItem->id)
                            ->whereDoesntHave('items');
                    });
                });
            }
            $issuances = $issuancesQuery->get()
                ->filter(function ($iss) use ($targetLower, $activeItem, $filters) {
                    $dt = $iss->date_issued ?? $iss->created_at;
                    return $this->isDateInPeriod($this->normalizeDate($dt), $filters);
                })
                ->flatMap(function ($iss) use ($targetLower, $activeItem) {
                    $dt = $iss->date_issued ?? $iss->created_at;
                    $office = $iss->department ?? $iss->recipient ?? 'Office';
                    $ref = $iss->ris_number ?: ('RIS-' . $iss->id);

                    if ($iss->items->isNotEmpty()) {
                        $matchingLines = $iss->items->filter(function ($line) use ($targetLower, $activeItem) {
                            if ($activeItem) {
                                return (int) $line->item_id === (int) $activeItem->id;
                            }
                            $name = strtolower((string)($line->item?->name ?? ''));
                            return $name === $targetLower;
                        });

                        return $matchingLines->map(function ($line) use ($dt, $ref, $office, $iss) {
                            $qty = (int) ($line->quantity ?? 0);
                            return [
                                'date' => $this->normalizeDate($dt),
                                'reference' => $ref,
                                'receipt_qty' => '',
                                'issue_qty' => $qty > 0 ? $qty : '',
                                'issue_office' => $office,
                                'days_to_consume' => $iss->purpose ?? '',
                                '_type' => 'issue',
                            ];
                        });
                    }

                    // Fallback to legacy single item
                    if (!$activeItem) {
                        $name = strtolower((string)($iss->item?->name ?? ''));
                        if ($name !== $targetLower) {
                            return [];
                        }
                    } elseif ((int) $iss->item_id !== (int) $activeItem->id) {
                        return [];
                    }

                    $qty = (int) ($iss->quantity ?? 0);
                    return [[
                        'date' => $this->normalizeDate($dt),
                        'reference' => $ref,
                        'receipt_qty' => '',
                        'issue_qty' => $qty > 0 ? $qty : '',
                        'issue_office' => $office,
                        'days_to_consume' => $iss->purpose ?? '',
                        '_type' => 'issue',
                    ]];
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
                'balance_qty' => $openingBalance,
                'days_to_consume' => '',
            ];
        }

        foreach ($sorted as $tx) {
            if ($tx['receipt_qty']) {
                $runningBalance += (int)$tx['receipt_qty'];
            }
            if ($tx['issue_qty']) {
                $runningBalance -= (int)$tx['issue_qty'];
            }

            $entries[] = [
                'date' => $tx['date'] ?? '',
                'reference' => $tx['reference'] ?? '',
                'receipt_qty' => $tx['receipt_qty'] ?? '',
                'issue_qty' => $tx['issue_qty'] ?? '',
                'issue_office' => $tx['issue_office'] ?? '',
                'balance_qty' => $tx['balance_qty'] ?? max(0, $runningBalance),
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
            'entity_name' => $this->getSystemEntityName(),
            'entityName' => $this->getSystemEntityName(),
            'fund_cluster' => $this->getDefaultFundCluster(),
            'fundCluster' => $this->getDefaultFundCluster(),
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
            $query = \Modules\Inventory\Models\Issuance::with(['items.item', 'item']);
            $issuances = $query->latest()->get()
                ->filter(function ($iss) use ($endUserLower, $filters) {
                    if ($endUserLower && strtolower((string)$iss->recipient) !== $endUserLower) {
                        return false;
                    }
                    $dt = $iss->date_issued ?? $iss->created_at;
                    return $this->isDateInPeriod($this->normalizeDate($dt), $filters);
                })
                ->flatMap(function ($iss) {
                    $dt = $iss->date_issued ?? $iss->created_at;
                    $recipient = $iss->recipient ?? 'Accountable Officer';
                    $designation = $iss->recipient_designation ?? 'Property Custodian';
                    $department = $iss->department ?? 'Official Business';

                    if ($iss->items->isNotEmpty()) {
                        return $iss->items->map(function ($line) use ($iss, $dt, $recipient, $designation, $department) {
                            $item = $line->item;
                            $qty = (int) $line->quantity;
                            $cost = (float) ($line->unit_cost ?? $item?->unit_cost ?? 0);
                            $propNo = $line->property_number ?? $item?->sku ?? $line->id;

                            return [
                                'source' => 'live',
                                'quantity' => $qty,
                                'unit' => $item?->unit_of_issue ?? $item?->unit_measure ?? 'pc',
                                'description' => $item?->name ?? 'Inventory Item',
                                'propertyNo' => (string) $propNo,
                                'dateAcquired' => $this->normalizeDate($dt),
                                'unitValue' => $cost,
                                'totalValue' => $qty * $cost,
                                'recipient' => $recipient,
                                'designation' => $designation,
                                'department' => $department,
                            ];
                        });
                    }

                    $item = $iss->item;
                    $qty = (int) ($iss->quantity ?? 1);
                    $cost = (float) ($item?->unit_cost ?? 0);

                    return [[
                        'source' => 'live',
                        'quantity' => $qty,
                        'unit' => $item?->unit_of_issue ?? $item?->unit_measure ?? 'pc',
                        'description' => $item?->name ?? 'Inventory Item',
                        'propertyNo' => (string) ($item?->sku ?? $iss->id),
                        'dateAcquired' => $this->normalizeDate($dt),
                        'unitValue' => $cost,
                        'totalValue' => $qty * $cost,
                        'recipient' => $recipient,
                        'designation' => $designation,
                        'department' => $department,
                    ]];
                });

            $records = $records->concat($issuances);
        }

        // 2. Migrated Memorandum Receipt records
        if (Schema::hasTable('memorandum_receipt_migrated_records')) {
            $migrated = MemorandumReceiptMigratedRecord::query()
                ->latest()
                ->get()
                ->filter(function ($rec) use ($endUserLower, $filters) {
                    if ($endUserLower) {
                        $matchUser = strtolower((string)$rec->received_by) === $endUserLower ||
                                     strtolower((string)data_get($rec->raw_data, 'recipient')) === $endUserLower;
                        if (! $matchUser) {
                            return false;
                        }
                    }
                    $dt = $rec->date_received ?? data_get($rec->raw_data, 'date');
                    return $this->isDateInPeriod($this->normalizeDate($dt), $filters);
                })
                ->map(function ($rec) {
                    $raw = $rec->raw_data ?? [];
                    $qty = (int) (data_get($raw, 'quantity') ?? data_get($raw, 'qty') ?? 1);
                    $cost = (float) (data_get($raw, 'unit_cost') ?? data_get($raw, 'unit_value') ?? data_get($raw, 'cost') ?? 0);
                    $propNo = data_get($raw, 'stock_no') ?? data_get($raw, 'property_no') ?? $rec->memorial_no ?? ('MR-HIST-' . $rec->id);
                    $desc = data_get($raw, 'item_name') ?? data_get($raw, 'item') ?? data_get($raw, 'description') ?? $rec->remarks ?? 'Property Item';

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
            'entityName' => $this->getSystemEntityName(),
            'entity_name' => $this->getSystemEntityName(),
            'fundCluster' => $this->getDefaultFundCluster(),
            'fund_cluster' => $this->getDefaultFundCluster(),
            'issuedByName' => SystemSetting::get('signatories.mor_issued_by_name', 'ARSENIO GEM A. GARCILLANOSA'),
            'issuedByPosition' => SystemSetting::get('signatories.mor_issued_by_designation', 'SUPPLY OFFICER III / PROPERTY CUSTODIAN'),
            'issuedByOffice' => SystemSetting::get('signatories.mor_issued_by_office', 'Supply & Property Management Office (SPMO)'),
            'appendixNumber' => SystemSetting::get('compliance.mor_appendix_number', 'Appendix 59-A'),
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
        $systemEntity = $this->getSystemEntityName();
        $defaultFund = $this->getDefaultFundCluster();

        $dataset = [
            'type' => $type,
            'reference' => $reference,
            'generatedDate' => $genDate,
            'coverageLabel' => $coverageLabel,
            'entity_name' => $systemEntity,
            'entityName' => $systemEntity,
            'fund_cluster' => $defaultFund,
            'fundCluster' => $defaultFund,
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
            case 'MEMORANDUM_RECEIPT':
            case 'MEMORANDUM RECEIPT':
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
