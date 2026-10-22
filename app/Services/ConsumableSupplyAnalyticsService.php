<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConsumableSupplyAnalyticsService
{
    public function build(Request $request): array
    {
        $filters = $request->validate([
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'year' => ['nullable', 'integer', 'between:2000,2100'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'department' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'item_id' => ['nullable', 'integer', 'exists:items,id'],
            'status' => ['nullable', 'in:Pending,Approved,Rejected,Ready for Pickup,Released,Issued'],
        ]);
        $year = (int) ($filters['year'] ?? now()->year);
        $base = CarbonImmutable::create($year, (int) ($filters['month'] ?? 1), 1);
        $start = CarbonImmutable::parse($filters['start_date'] ?? $base->toDateString());
        $end = CarbonImmutable::parse($filters['end_date'] ?? (empty($filters['month']) ? $base->endOfYear() : $base->endOfMonth())->toDateString());
        if ($end->lt($start) || $start->diffInDays($end) > 3660) {
            throw ValidationException::withMessages(['end_date' => 'Choose a reporting range of up to ten years, ending on or after the start date.']);
        }
        $filters = array_merge($filters, ['start_date' => $start->toDateString(), 'end_date' => $end->toDateString()]);

        $departments = collect(config('university.divisions', []))->flatMap(fn ($group) => $group['options'])->pluck('value')
            ->merge(DB::table('users')->whereNotNull('department')->pluck('department'))
            ->merge(DB::table('supply_requests')->distinct()->pluck('department'))
            ->merge(DB::table('issuances')->whereNull('deleted_at')->distinct()->pluck('department'))
            ->filter()->unique()->sort()->values();
        $current = $this->period($filters, $start, $end, $departments->all());
        $previousEnd = $start->subDay();
        $previousStart = $previousEnd->subDays((int) $start->diffInDays($end));
        $previous = $this->period($filters, $previousStart, $previousEnd, $departments->all());
        $previousDepartments = collect($previous['departments'])->keyBy('name');
        $current['departments'] = array_map(function ($department) use ($previousDepartments) {
            $before = $previousDepartments->get($department['name'])['requested'] ?? 0;

            return $department + ['previousRequested' => $before, 'demandChange' => $department['requested'] - $before];
        }, $current['departments']);

        return $current + [
            'filters' => $filters,
            'comparison' => ['start' => $previousStart->toDateString(), 'end' => $previousEnd->toDateString(), 'stats' => $previous['stats'], 'trends' => $previous['trends']],
            'options' => [
                'departments' => $departments,
                // Items have no category field. Use the existing supplier classification, explicitly identified in the UI.
                'categories' => DB::table('suppliers')->whereNotNull('category')->distinct()->orderBy('category')->pluck('category'),
                'items' => DB::table('items')->orderBy('name')->get(['id', 'name']),
            ],
        ];
    }

    private function period(array $filters, CarbonImmutable $start, CarbonImmutable $end, array $directory): array
    {
        $requestMonth = $this->monthExpression('COALESCE(r.date_requested, r.created_at)');
        $issueMonth = $this->monthExpression('release.date_issued');
        $from = $start->toDateString();
        $to = $end->addDay()->toDateString();
        $requests = DB::table('supply_requests as r')
            ->whereRaw('COALESCE(r.date_requested, r.created_at) >= ?', [$from])
            ->whereRaw('COALESCE(r.date_requested, r.created_at) < ?', [$to])
            ->when(! empty($filters['department']), fn ($q) => $q->where('r.department', $filters['department']))
            ->when(! empty($filters['status']), fn ($q) => $q->where('r.status', $filters['status']));
        $lines = (clone $requests)->join('supply_request_items as l', 'l.supply_request_id', '=', 'r.id')
            ->join('items as i', 'i.id', '=', 'l.item_id')->leftJoin('suppliers as s', 's.id', '=', 'i.supplier_id');
        $this->itemFilters($lines, $filters);
        // Aggregate each source before combining: never join request lines to release lines.
        $requestRows = $lines->selectRaw("r.department, l.item_id, i.name, s.category, {$requestMonth} as month, COUNT(DISTINCT r.id) as frequency, SUM(l.quantity) as requested, MAX(COALESCE(r.date_requested, r.created_at)) as latest")
            ->groupBy('r.department', 'l.item_id', 'i.name', 's.category')->groupByRaw($requestMonth)->get();
        // Distinct requisitions at department/month grain, including requests with no matching lines only when no item filters are set.
        $counts = (clone $requests)->when(! empty($filters['item_id']) || ! empty($filters['category']), function ($q) use ($filters) {
            $q->whereExists(function ($sub) use ($filters) {
                $sub->selectRaw('1')->from('supply_request_items as l')->join('items as i', 'i.id', '=', 'l.item_id')->leftJoin('suppliers as s', 's.id', '=', 'i.supplier_id')->whereColumn('l.supply_request_id', 'r.id');
                $this->itemFilters($sub, $filters);
            });
        })->selectRaw("r.department, {$requestMonth} as month, COUNT(DISTINCT r.id) as requisitions")
            ->groupBy('r.department')->groupByRaw($requestMonth)->get();

        // Modern child rows are authoritative. Legacy parent quantities are used only if no children exist.
        $modern = DB::table('issuance_items')->select('issuance_id', 'item_id', 'quantity');
        $legacy = DB::table('issuances as legacy')->selectRaw('legacy.id as issuance_id, legacy.item_id, legacy.quantity')
            ->whereNotNull('legacy.item_id')->whereNotExists(fn ($q) => $q->selectRaw('1')->from('issuance_items')->whereColumn('issuance_id', 'legacy.id'));
        $issued = DB::query()->fromSub($modern->unionAll($legacy), 'l')->join('issuances as release', 'release.id', '=', 'l.issuance_id')
            ->join('items as i', 'i.id', '=', 'l.item_id')->leftJoin('suppliers as s', 's.id', '=', 'i.supplier_id')
            ->whereNull('release.deleted_at')->where('release.status', 'Issued')
            ->where('release.date_issued', '>=', $from)->where('release.date_issued', '<', $to)
            ->when(! empty($filters['department']), fn ($q) => $q->where('release.department', $filters['department']))
            ->when(! empty($filters['status']), fn ($q) => $q->whereExists(fn ($sub) => $sub->selectRaw('1')->from('supply_requests as linked')->whereColumn('linked.issuance_id', 'release.id')->where('linked.status', $filters['status'])));
        $this->itemFilters($issued, $filters);
        $issueRows = $issued->selectRaw("release.department, l.item_id, i.name, s.category, {$issueMonth} as month, SUM(l.quantity) as issued")
            ->groupBy('release.department', 'l.item_id', 'i.name', 's.category')->groupByRaw($issueMonth)->get();

        $departments = [];
        $items = [];
        $demand = [];
        $demandHistory = [];
        $trends = [];
        $departmentTrends = [];
        for ($month = $start->startOfMonth(); $month->lte($end); $month = $month->addMonth()) {
            $trends[$month->format('Y-m')] = ['month' => $month->format('Y-m'), 'requisitions' => 0, 'requested' => 0, 'issued' => 0, 'topItem' => '—'];
        }
        $empty = ['requisitions' => 0, 'requested' => 0, 'issued' => 0, 'distinctItems' => 0, 'topItem' => '—'];
        foreach ($directory as $name) {
            if (empty($filters['department']) || $filters['department'] === $name) {
                $departments[$name] = ['name' => $name] + $empty;
            }
        }
        foreach ($counts as $row) {
            $name = $row->department ?: 'Unassigned office';
            $departments[$name] ??= ['name' => $name] + $empty;
            $departments[$name]['requisitions'] += (int) $row->requisitions;
            $trends[$row->month]['requisitions'] += (int) $row->requisitions;
            $departmentTrends[$name][$row->month] ??= ['department' => $name, 'month' => $row->month, 'requisitions' => 0, 'requested' => 0, 'issued' => 0, 'topItem' => '—'];
            $departmentTrends[$name][$row->month]['requisitions'] += (int) $row->requisitions;
        }
        $monthlyItems = [];
        foreach ([[$requestRows, false], [$issueRows, true]] as [$rows, $isIssue]) {
            foreach ($rows as $row) {
                $name = $row->department ?: 'Unassigned office';
                $departments[$name] ??= ['name' => $name] + $empty;
                $items[$row->item_id] ??= ['id' => $row->item_id, 'name' => $row->name, 'category' => $row->category ?: 'Unclassified', 'frequency' => 0, 'requested' => 0, 'issued' => 0, 'offices' => [], 'latest' => null];
                $key = $name.'|'.$row->item_id;
                $demand[$key] ??= ['department' => $name, 'id' => $row->item_id, 'name' => $row->name, 'frequency' => 0, 'requested' => 0, 'issued' => 0, 'latest' => null];
                $historyKey = $key.'|'.$row->month;
                $demandHistory[$historyKey] ??= ['department' => $name, 'id' => $historyKey, 'name' => $row->name, 'month' => $row->month, 'frequency' => 0, 'requested' => 0, 'issued' => 0];
                $metric = $isIssue ? 'issued' : 'requested';
                $quantity = (int) $row->$metric;
                $departments[$name][$metric] += $quantity;
                $items[$row->item_id][$metric] += $quantity;
                $demand[$key][$metric] += $quantity;
                $demandHistory[$historyKey][$metric] += $quantity;
                $trends[$row->month][$metric] += $quantity;
                $departmentTrends[$name][$row->month] ??= ['department' => $name, 'month' => $row->month, 'requisitions' => 0, 'requested' => 0, 'issued' => 0, 'topItem' => '—'];
                $departmentTrends[$name][$row->month][$metric] += $quantity;
                if (! $isIssue) {
                    $items[$row->item_id]['frequency'] += (int) $row->frequency;
                    $items[$row->item_id]['offices'][$name] = true;
                    $items[$row->item_id]['latest'] = max($items[$row->item_id]['latest'] ?? '', $row->latest);
                    $demand[$key]['frequency'] += (int) $row->frequency;
                    $demandHistory[$historyKey]['frequency'] += (int) $row->frequency;
                    $demand[$key]['latest'] = max($demand[$key]['latest'] ?? '', $row->latest);
                    $monthlyItems[$row->month][$row->item_id] = ($monthlyItems[$row->month][$row->item_id] ?? 0) + (int) $row->frequency;
                }
            }
        }
        foreach ($departments as $name => &$department) {
            $requestedItems = collect($demand)->where('department', $name)->where('frequency', '>', 0)->sortBy([['frequency', 'desc'], ['name', 'asc']]);
            $department['topItem'] = $requestedItems->first()['name'] ?? '—';
            $department['distinctItems'] = $requestedItems->count();
        }
        unset($department);
        $departmentHistory = [];
        foreach ($departments as $name => $department) {
            foreach ($trends as $month => $trend) {
                $departmentHistory[] = $departmentTrends[$name][$month] ?? ['department' => $name, 'month' => $month, 'requisitions' => 0, 'requested' => 0, 'issued' => 0, 'topItem' => '—'];
            }
        }
        foreach ($monthlyItems as $month => $ranking) {
            arsort($ranking);
            $trends[$month]['topItem'] = $items[array_key_first($ranking)]['name'];
        }
        $items = collect($items)->map(fn ($item) => array_merge($item, ['offices' => count($item['offices'])]))->sortBy([['frequency', 'desc'], ['name', 'asc']])->values();
        $ranked = collect($departments)->sortBy([['requested', 'desc'], ['name', 'asc']])->values();
        $active = $ranked->where('requisitions', '>', 0);

        return [
            'stats' => ['totalRequisitions' => $counts->sum('requisitions'), 'mostRequestedItem' => $items->firstWhere('frequency', '>', 0)['name'] ?? '—', 'highestDepartment' => $active->first()['name'] ?? '—', 'lowestDepartment' => $active->sortBy([['requested', 'asc'], ['name', 'asc']])->first()['name'] ?? '—', 'totalIssued' => $issueRows->sum('issued'), 'activeOffices' => $active->count()],
            'departments' => $ranked->all(), 'items' => $items->all(), 'demand' => array_values($demand), 'trends' => array_values($trends), 'departmentTrends' => $departmentHistory, 'demandHistory' => array_values($demandHistory),
        ];
    }

    private function monthExpression(string $column): string
    {
        // PostgreSQL dates/timestamps require an explicit formatter; SQLite and MySQL accept SUBSTR.
        return DB::connection()->getDriverName() === 'pgsql'
            ? "TO_CHAR({$column}, 'YYYY-MM')"
            : "SUBSTR({$column}, 1, 7)";
    }

    private function itemFilters($query, array $filters): void
    {
        $query->when(! empty($filters['item_id']), fn ($q) => $q->where('i.id', $filters['item_id']))
            ->when(! empty($filters['category']), fn ($q) => $q->where('s.category', $filters['category']));
    }
}

