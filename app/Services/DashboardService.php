<?php

namespace App\Services;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Get authoritative inventory summary statistics.
     */
    public function getSummaryStats(): array
    {
        $totalInventoryValue = class_exists(\Modules\Inventory\Models\Item::class)
            ? (float) \Modules\Inventory\Models\Item::query()->sum(DB::raw('stock * COALESCE(unit_cost, 0)'))
            : 0.0;

        $activeInventoryItems = class_exists(\Modules\Inventory\Models\Item::class)
            ? (int) \Modules\Inventory\Models\Item::where('stock', '>', 0)->count()
            : 0;

        $totalItemsCount = class_exists(\Modules\Inventory\Models\Item::class)
            ? (int) \Modules\Inventory\Models\Item::count()
            : 0;

        $itemsIssuedMtd = class_exists(\Modules\Inventory\Models\Issuance::class)
            ? (int) \Modules\Inventory\Models\Issuance::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('quantity')
            : 0;

        $totalRisIssuedCount = class_exists(\Modules\Inventory\Models\Issuance::class)
            ? (int) DB::table(DB::raw('(select distinct recipient, date_issued, status, issued_by, created_at from issuances) as distinct_issuances'))->count()
            : 0;

        $lowStockThreshold = class_exists(\App\Models\SystemSetting::class)
            ? (int) \App\Models\SystemSetting::get('inventory.low_stock_threshold', 10)
            : 10;

        $criticalAlertsCount = class_exists(\Modules\Inventory\Models\Item::class)
            ? (int) \Modules\Inventory\Models\Item::where(function ($q) use ($lowStockThreshold) {
                $q->where('status', 'Low Stock')
                    ->orWhere(function ($sub) use ($lowStockThreshold) {
                        $sub->where('stock', '<=', $lowStockThreshold)->where('stock', '>', 0);
                    });
            })->count()
            : 0;

        $unserviceableCount = class_exists(\Modules\Inventory\Models\Item::class)
            ? (int) \Modules\Inventory\Models\Item::where('status', 'Out of Stock')
                ->orWhere('stock', '<=', 0)
                ->count()
            : 0;

        return [
            'summary' => [
                'total_inventory_value' => $totalInventoryValue,
                'available_items' => $activeInventoryItems > 0 ? $activeInventoryItems : $totalItemsCount,
                'issued_this_month' => $itemsIssuedMtd,
                'critical_stock' => $criticalAlertsCount,
                'unserviceable' => $unserviceableCount,
            ],
            // Preserved for backward compatibility with existing tests and modules
            'stats' => [
                'totalInventoryValue' => '₱' . number_format($totalInventoryValue, 2),
                'totalRisIssued' => $totalRisIssuedCount,
                'itemsIssuedMtd' => $itemsIssuedMtd,
                'unserviceable' => $unserviceableCount,
                'criticalAlerts' => $criticalAlertsCount,
                'activeInventoryItems' => $totalItemsCount,
            ],
        ];
    }

    /**
     * Get inventory movement trends (Monthly, Yearly, and Custom).
     */
    public function getInventoryMovement(?string $chartFilter = 'monthly', ?string $startDate = null, ?string $endDate = null): array
    {
        $chartData = [
            'monthly' => [],
            'yearly' => [],
            'custom' => [],
        ];

        $currentTotalStock = class_exists(\Modules\Inventory\Models\Item::class)
            ? (int) \Modules\Inventory\Models\Item::sum('stock')
            : 0;

        if (class_exists(\Modules\Inventory\Models\Receiving::class) && class_exists(\Modules\Inventory\Models\Issuance::class)) {
            // Monthly view: last 6 months
            for ($i = 5; $i >= 0; $i--) {
                $monthDate = now()->subMonths($i);
                $startOfMonth = $monthDate->copy()->startOfMonth();
                $endOfMonth = $monthDate->copy()->endOfMonth();

                $stockIn = (int) \Modules\Inventory\Models\Receiving::whereBetween('date_received', [
                    $startOfMonth->toDateString(),
                    $endOfMonth->toDateString(),
                ])->sum('quantity');

                $risIssued = (int) \Modules\Inventory\Models\Issuance::whereBetween('date_issued', [
                    $startOfMonth->toDateString(),
                    $endOfMonth->toDateString(),
                ])->sum('quantity');

                $receivingsSince = (int) \Modules\Inventory\Models\Receiving::where('date_received', '>=', $startOfMonth->toDateString())->sum('quantity');
                $issuancesSince = (int) \Modules\Inventory\Models\Issuance::where('date_issued', '>=', $startOfMonth->toDateString())->sum('quantity');

                $starting = max(0, $currentTotalStock - $receivingsSince + $issuancesSince);

                $chartData['monthly'][] = [
                    'label' => $monthDate->format('M Y'),
                    'starting' => $starting,
                    'stockIn' => $stockIn,
                    'risIssued' => $risIssued,
                ];
            }

            // Yearly view: last 5 years
            for ($i = 4; $i >= 0; $i--) {
                $yearDate = now()->subYears($i);
                $year = $yearDate->year;
                $startOfYear = $yearDate->copy()->startOfYear();
                $endOfYear = $yearDate->copy()->endOfYear();

                $stockIn = (int) \Modules\Inventory\Models\Receiving::whereBetween('date_received', [
                    $startOfYear->toDateString(),
                    $endOfYear->toDateString(),
                ])->sum('quantity');

                $risIssued = (int) \Modules\Inventory\Models\Issuance::whereBetween('date_issued', [
                    $startOfYear->toDateString(),
                    $endOfYear->toDateString(),
                ])->sum('quantity');

                $receivingsSince = (int) \Modules\Inventory\Models\Receiving::where('date_received', '>=', $startOfYear->toDateString())->sum('quantity');
                $issuancesSince = (int) \Modules\Inventory\Models\Issuance::where('date_issued', '>=', $startOfYear->toDateString())->sum('quantity');

                $starting = max(0, $currentTotalStock - $receivingsSince + $issuancesSince);

                $chartData['yearly'][] = [
                    'label' => (string) $year,
                    'starting' => $starting,
                    'stockIn' => $stockIn,
                    'risIssued' => $risIssued,
                ];
            }

            // Custom date range view
            if ($startDate && $endDate) {
                $start = Carbon::parse($startDate);
                $end = Carbon::parse($endDate);
                $daysDiff = $start->diffInDays($end);

                if ($daysDiff <= 31) {
                    $period = CarbonPeriod::create($start, '1 day', $end);
                    foreach ($period as $dt) {
                        $stockIn = (int) \Modules\Inventory\Models\Receiving::whereDate('date_received', $dt->toDateString())->sum('quantity');
                        $risIssued = (int) \Modules\Inventory\Models\Issuance::whereDate('date_issued', $dt->toDateString())->sum('quantity');

                        $receivingsSince = (int) \Modules\Inventory\Models\Receiving::where('date_received', '>=', $dt->toDateString())->sum('quantity');
                        $issuancesSince = (int) \Modules\Inventory\Models\Issuance::where('date_issued', '>=', $dt->toDateString())->sum('quantity');

                        $starting = max(0, $currentTotalStock - $receivingsSince + $issuancesSince);

                        $chartData['custom'][] = [
                            'label' => $dt->format('M d'),
                            'starting' => $starting,
                            'stockIn' => $stockIn,
                            'risIssued' => $risIssued,
                        ];
                    }
                } else {
                    $period = CarbonPeriod::create($start->copy()->startOfMonth(), '1 month', $end->copy()->endOfMonth());
                    foreach ($period as $dt) {
                        $startOfMonth = $dt->copy()->startOfMonth();
                        $endOfMonth = $dt->copy()->endOfMonth();

                        $stockIn = (int) \Modules\Inventory\Models\Receiving::whereBetween('date_received', [
                            $startOfMonth->toDateString(),
                            $endOfMonth->toDateString(),
                        ])->sum('quantity');

                        $risIssued = (int) \Modules\Inventory\Models\Issuance::whereBetween('date_issued', [
                            $startOfMonth->toDateString(),
                            $endOfMonth->toDateString(),
                        ])->sum('quantity');

                        $receivingsSince = (int) \Modules\Inventory\Models\Receiving::where('date_received', '>=', $startOfMonth->toDateString())->sum('quantity');
                        $issuancesSince = (int) \Modules\Inventory\Models\Issuance::where('date_issued', '>=', $startOfMonth->toDateString())->sum('quantity');

                        $starting = max(0, $currentTotalStock - $receivingsSince + $issuancesSince);

                        $chartData['custom'][] = [
                            'label' => $dt->format('M Y'),
                            'starting' => $starting,
                            'stockIn' => $stockIn,
                            'risIssued' => $risIssued,
                        ];
                    }
                }
            } else {
                $chartData['custom'] = $chartData['monthly'];
            }
        }

        $activeSet = $chartData[$chartFilter] ?? $chartData['monthly'];
        $totalReceived = collect($activeSet)->sum('stockIn');
        $totalIssued = collect($activeSet)->sum('risIssued');
        $startingBalance = !empty($activeSet) ? ($activeSet[0]['starting'] ?? 0) : 0;
        $endingBalance = max(0, $startingBalance + $totalReceived - $totalIssued);

        return [
            'chartData' => $chartData,
            'movement' => $activeSet,
            'movementSummary' => [
                'received' => $totalReceived,
                'issued' => $totalIssued,
                'starting_balance' => $startingBalance,
                'ending_balance' => $currentTotalStock > 0 ? $currentTotalStock : $endingBalance,
            ],
            'chartLabels' => collect($activeSet)->pluck('label')->all(),
            'stockInData' => collect($activeSet)->pluck('stockIn')->all(),
            'risIssuedData' => collect($activeSet)->pluck('risIssued')->all(),
        ];
    }

    /**
     * Get recent stock receiving records (latest 5).
     */
    public function getRecentReceivings(int $limit = 5): array
    {
        if (!class_exists(\Modules\Inventory\Models\Receiving::class)) {
            return [];
        }

        return \Modules\Inventory\Models\Receiving::with(['item', 'supplier', 'creator'])
            ->latest('date_received')
            ->latest('id')
            ->take($limit)
            ->get()
            ->map(function ($r) {
                $receivedDate = $r->date_received ?? $r->created_at;
                return [
                    'id' => $r->id,
                    'item_name' => $r->item?->name ?? 'Inventory Stock',
                    'quantity' => (int) $r->quantity,
                    'unit' => $r->item?->unit_of_issue ?? 'Units',
                    'supplier' => $r->supplier?->name ?? 'Unassigned Supplier',
                    'received_at' => $receivedDate ? $receivedDate->timezone('Asia/Manila')->diffForHumans() : 'Recently',
                    'received_at_formatted' => $receivedDate ? $receivedDate->timezone('Asia/Manila')->format('M d, Y • h:i A') : '',
                    'received_by' => $r->creator?->name ?? 'Property Staff',
                ];
            })
            ->all();
    }

    /**
     * Get recent stock issuance records (latest 5).
     */
    public function getRecentIssuances(int $limit = 5): array
    {
        if (!class_exists(\Modules\Inventory\Models\Issuance::class)) {
            return [];
        }

        return \Modules\Inventory\Models\Issuance::with(['item', 'issuer'])
            ->latest('date_issued')
            ->latest('id')
            ->take($limit)
            ->get()
            ->map(function ($i) {
                $issuedDate = $i->date_issued ?? $i->created_at;
                return [
                    'id' => $i->id,
                    'ris_number' => $i->ris_number ?: ('RIS-' . str_pad((string)$i->id, 5, '0', STR_PAD_LEFT)),
                    'item_name' => $i->item?->name ?? 'Assorted Supplies',
                    'recipient' => $i->recipient ?: 'Department Staff',
                    'department' => $i->department ?: 'Academic / Admin Unit',
                    'total_items' => (int) ($i->quantity ?: 1),
                    'unit' => $i->item?->unit_of_issue ?? 'Units',
                    'issued_at' => $issuedDate ? $issuedDate->timezone('Asia/Manila')->diffForHumans() : 'Recently',
                    'issued_at_formatted' => $issuedDate ? $issuedDate->timezone('Asia/Manila')->format('M d, Y • h:i A') : '',
                    'issued_by' => $i->issuer?->name ?? 'Supply Officer',
                    'status' => $i->status ?: 'Issued',
                ];
            })
            ->all();
    }

    /**
     * Get top stock items requiring attention (Low or Critical stock, latest 5).
     */
    public function getCriticalStock(int $limit = 5): array
    {
        if (!class_exists(\Modules\Inventory\Models\Item::class)) {
            return [];
        }

        $lowStockThreshold = class_exists(\App\Models\SystemSetting::class)
            ? (int) \App\Models\SystemSetting::get('inventory.low_stock_threshold', 10)
            : 10;

        return \Modules\Inventory\Models\Item::where(function ($q) use ($lowStockThreshold) {
                $q->where('status', 'Low Stock')
                    ->orWhere('status', 'Out of Stock')
                    ->orWhere('stock', '<=', $lowStockThreshold);
            })
            ->orderBy('stock', 'asc')
            ->take($limit)
            ->get()
            ->map(function ($item) use ($lowStockThreshold) {
                $criticalCutoff = max(1, (int) round($lowStockThreshold / 2));
                $priority = $item->stock <= 0 ? 'Critical' : ($item->stock <= $criticalCutoff ? 'Critical' : 'Low');
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku ?? 'No SKU',
                    'current' => (int) $item->stock,
                    'min' => $lowStockThreshold,
                    'unit' => $item->unit_of_issue ?? 'Pcs',
                    'priority' => $priority,
                    'status' => $item->stock <= 0 ? 'Out of Stock' : ($priority === 'Critical' ? 'Critical' : 'Low Stock'),
                ];
            })
            ->all();
    }

    /**
     * Get authoritative RFID tagging coverage statistics.
     */
    public function getRfidSummary(): array
    {
        if (!class_exists(\Modules\Inventory\Models\Item::class)) {
            return [
                'tagged' => 0,
                'untagged' => 0,
                'total' => 0,
                'percentage' => 0,
            ];
        }

        $total = (int) \Modules\Inventory\Models\Item::count();
        $tagged = (int) \Modules\Inventory\Models\Item::whereNotNull('rfid_tag')
            ->where('rfid_tag', '!=', '')
            ->count();
        $untagged = max(0, $total - $tagged);
        $percentage = $total > 0 ? (int) round(($tagged / $total) * 100) : 0;

        return [
            'tagged' => $tagged,
            'untagged' => $untagged,
            'total' => $total,
            'percentage' => $percentage,
        ];
    }

    /**
     * Get high-level supplier compliance status summary.
     */
    public function getSupplierSummary(): array
    {
        if (!class_exists(\Modules\Suppliers\Models\Supplier::class)) {
            return [
                'active' => 0,
                'pending' => 0,
                'blacklisted' => 0,
                'total' => 0,
            ];
        }

        $active = (int) \Modules\Suppliers\Models\Supplier::where('status', 'active')->count();
        $pending = (int) \Modules\Suppliers\Models\Supplier::where('status', 'pending')->count();
        $blacklisted = (int) \Modules\Suppliers\Models\Supplier::where('status', 'blacklisted')->count();
        $total = (int) \Modules\Suppliers\Models\Supplier::count();

        return [
            'active' => $active,
            'pending' => $pending,
            'blacklisted' => $blacklisted,
            'total' => $total,
        ];
    }

    /**
     * Get high-level compliance & reporting summary.
     */
    public function getComplianceSummary(): array
    {
        if (!class_exists(\App\Models\ComplianceReport::class)) {
            return [
                'reports_this_month' => 0,
                'latest_report' => null,
            ];
        }

        $reportsThisMonth = (int) \App\Models\ComplianceReport::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $latest = \App\Models\ComplianceReport::with('creator')->latest()->first();

        return [
            'reports_this_month' => $reportsThisMonth,
            'latest_report' => $latest ? [
                'id' => $latest->id,
                'title' => $latest->title ?: ($latest->type . ' Report'),
                'type' => $latest->type ?: 'Compliance',
                'reference' => $latest->reference ?: ('REP-' . $latest->id),
                'date' => $latest->date ? $latest->date->format('M d, Y') : ($latest->created_at ? $latest->created_at->format('M d, Y') : ''),
                'created_by' => $latest->creator?->name ?? 'System',
            ] : null,
        ];
    }

    /**
     * Get recent business-meaningful audit activity (latest 8).
     */
    public function getRecentActivity($user = null, int $limit = 8): array
    {
        if (!class_exists(\Modules\AuditLogs\Models\TransactionTrail::class)) {
            return [];
        }

        return \Modules\AuditLogs\Models\TransactionTrail::with('user.roles')
            ->latest()
            ->take($limit)
            ->get()
            ->map(function ($trail) {
                $resolved = class_exists(\Modules\AuditLogs\Support\AuditLogFormatter::class)
                    ? \Modules\AuditLogs\Support\AuditLogFormatter::resolveLogEntry($trail)
                    : [
                        'action' => $trail->action,
                        'details' => $trail->details,
                        'module' => $trail->module,
                        'resource_ref' => $trail->resource_ref,
                        'status' => $trail->status,
                    ];

                $badge = match ($resolved['status']) {
                    'Verified', 'Success' => 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
                    'Logged' => 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
                    'Flagged', 'Failed' => 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
                    'In Progress' => 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20',
                    default => 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20',
                };

                return [
                    'id' => $resolved['resource_ref'] ?: ('TRX-' . $trail->id),
                    'user' => $trail->user ? $trail->user->name : 'System Administrator',
                    'role' => $trail->user && $trail->user->roles->isNotEmpty() ? $trail->user->roles->first()->name : 'Authorized Staff',
                    'module' => $resolved['module'],
                    'action' => $resolved['action'],
                    'details' => $resolved['details'],
                    'status' => $resolved['status'],
                    'badge' => $badge,
                    'time' => $trail->created_at ? $trail->created_at->timezone('Asia/Manila')->diffForHumans() : now('Asia/Manila')->diffForHumans(),
                    'timestamp' => $trail->created_at ? $trail->created_at->timezone('Asia/Manila')->format('M d, Y • h:i A') : now('Asia/Manila')->format('M d, Y • h:i A'),
                ];
            })
            ->all();
    }
}
