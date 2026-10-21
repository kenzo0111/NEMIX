<?php

namespace App\Services;

use App\Models\CoordinatorMovement;
use App\Models\CoordinatorStock;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Services\InventoryPolicy;

class CoordinatorInventoryService
{
    public function receiveRelease(SupplyRequest $request, int $actorId): void
    {
        if (!in_array($request->status, ['Issued', 'Released'], true) || ! $request->issuance_id) {
            throw ValidationException::withMessages(['request' => 'Only released requests can enter Delivery Unit inventory.']);
        }
        DB::transaction(function () use ($request, $actorId) {
            // Serializes simultaneous releases to the same coordinator, including first receipts.
            User::whereKey($request->requested_by)->lockForUpdate()->firstOrFail();
            $request->loadMissing(['items.item', 'issuance.items']);
            foreach ($request->items->sortBy('item_id') as $line) {
                if ($line->approved_quantity <= 0 || CoordinatorMovement::where('supply_request_item_id', $line->id)->exists()) {
                    continue;
                }
                $issuedLine = $request->issuance?->items->firstWhere('item_id', $line->item_id);
                $cost = (float) ($issuedLine?->unit_cost ?? $request->issuance?->unit_cost ?? $line->item?->unit_cost ?? 0);
                $stock = CoordinatorStock::firstOrCreate(
                    ['coordinator_id' => $request->requested_by, 'item_id' => $line->item_id],
                    ['name' => $line->item?->name ?? 'Archived item', 'sku' => $line->item?->stock_no ?: ($line->item?->sku ?? (string) $line->item_id),
                        'unit' => $line->item?->unit_of_issue ?? 'pcs']
                );
                $stock->update(['quantity' => $stock->quantity + $line->approved_quantity,
                    'value' => round((float) $stock->value + $line->approved_quantity * $cost, 2)]);
                $stock->movements()->create([
                    'supply_request_item_id' => $line->id, 'actor_id' => $actorId,
                    'type' => 'receipt', 'quantity' => $line->approved_quantity, 'unit_cost' => $cost,
                    'date' => $request->released_at?->toDateString() ?? $request->issuance?->date_issued?->toDateString() ?? now()->toDateString(),
                    'reference' => $request->ris_number ?: 'REQUEST-'.$request->id,
                    'office' => $request->department, 'fund_cluster' => $request->fund_cluster,
                ]);
            }
        });
    }

    public function issue(User $user, int $stockId, int $quantity, string $recipient): void
    {
        DB::transaction(function () use ($user, $stockId, $quantity, $recipient) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $stock = CoordinatorStock::where('coordinator_id', $user->id)->whereKey($stockId)->lockForUpdate()->firstOrFail();
            if ($quantity <= 0 || $quantity > $stock->quantity) {
                throw ValidationException::withMessages(['quantity' => 'The quantity exceeds your available stock.']);
            }
            $cost = (float) $stock->value / $stock->quantity;
            $movement = $stock->movements()->create([
                'actor_id' => $user->id, 'type' => 'issue', 'quantity' => $quantity, 'unit_cost' => $cost,
                'date' => now()->toDateString(), 'reference' => 'UNIT-ISSUE', 'office' => $recipient,
            ]);
            $movement->update(['reference' => 'UNIT-ISSUE-'.$movement->id]);
            $stock->update(['quantity' => $stock->quantity - $quantity,
                'value' => $stock->quantity === $quantity ? 0 : round((float) $stock->value - $quantity * $cost, 2)]);
        });
    }

    public function stockCard(CoordinatorStock $stock, ?string $start, ?string $end): array
    {
        $balance = 0;
        $opening = 0;
        $entries = [];
        $movements = $stock->movements()->when($end, fn ($q) => $q->where('date', '<=', $end))->orderBy('date')->orderBy('id')->get();
        foreach ($movements as $movement) {
            $balance += $movement->type === 'receipt' ? $movement->quantity : -$movement->quantity;
            if ($start && $movement->date->toDateString() < $start) {
                $opening = $balance;

                continue;
            }
            $entries[] = [
                'date' => $movement->date->toDateString(), 'reference' => $movement->reference,
                'receipt_qty' => $movement->type === 'receipt' ? $movement->quantity : '',
                'issue_qty' => $movement->type === 'issue' ? $movement->quantity : '',
                'issue_office' => $movement->type === 'issue' ? $movement->office : '', 'balance_qty' => $balance, 'days_to_consume' => '',
            ];
        }
        if ($start) {
            array_unshift($entries, ['date' => $start, 'reference' => 'Opening balance', 'balance_qty' => $opening]);
        }

        return ['entity_name' => SystemSetting::get('institution.name', 'University of Camarines Norte'),
            'item' => $stock->name, 'description' => $stock->name, 'stock_no' => $stock->sku,
            'unit' => $stock->unit, 're_order_point' => InventoryPolicy::criticalThreshold(),
            'fund_cluster' => $movements->first()?->fund_cluster ?? '01',
            'coordinator_name' => User::find($stock->coordinator_id)?->name,
            'entries' => $entries, 'opening_balance' => $opening, 'ending_balance' => $balance];
    }

    public function dashboard(User $user, string $filter, ?string $start, ?string $end): array
    {
        $stocks = CoordinatorStock::where('coordinator_id', $user->id)->get();
        $movements = CoordinatorMovement::forCoordinator($user->id)->with('stock')->orderBy('date')->orderBy('id')->get();
        $lowThreshold = InventoryPolicy::lowThreshold();
        $criticalThreshold = InventoryPolicy::criticalThreshold();
        $critical = $stocks->where('quantity', '<=', $lowThreshold)->sortBy('quantity');
        $monthlyIssued = $movements->where('type', 'issue')->filter(fn ($m) => $m->date->format('Y-m') === now()->format('Y-m'))->sum('quantity');
        $points = [];
        $customDaily = $filter === 'custom' && $start && $end && Carbon::parse($start)->diffInDays(Carbon::parse($end)) <= 31;
        $periods = $filter === 'custom' && $start && $end
            ? CarbonPeriod::create($customDaily ? $start : Carbon::parse($start)->startOfMonth(), $customDaily ? '1 day' : '1 month', $end)
            : ($filter === 'yearly'
                ? CarbonPeriod::create(now()->subYears(4)->startOfYear(), '1 year', now()->startOfYear())
                : CarbonPeriod::create(now()->subMonthsNoOverflow(5)->startOfMonth(), '1 month', now()->startOfMonth()));
        foreach ($periods as $date) {
            $from = $date->copy();
            if ($filter === 'custom' && $start) {
                $from = $from->max(Carbon::parse($start));
            }
            $to = $filter === 'yearly' ? $date->copy()->endOfYear() : ($customDaily ? $date->copy()->endOfDay() : $date->copy()->endOfMonth());
            if ($filter === 'custom' && $end) {
                $to = $to->min(Carbon::parse($end)->endOfDay());
            }
            $before = $movements->filter(fn ($m) => $m->date->lt($from));
            $within = $movements->filter(fn ($m) => $m->date->betweenIncluded($from, $to));
            $points[] = ['label' => $date->format($filter === 'yearly' ? 'Y' : ($customDaily ? 'M d' : 'M Y')),
                'starting' => $before->where('type', 'receipt')->sum('quantity') - $before->where('type', 'issue')->sum('quantity'),
                'stockIn' => $within->where('type', 'receipt')->sum('quantity'), 'risIssued' => $within->where('type', 'issue')->sum('quantity')];
        }
        $received = array_sum(array_column($points, 'stockIn'));
        $issued = array_sum(array_column($points, 'risIssued'));
        $opening = $points[0]['starting'] ?? 0;

        return [
            'inventoryScope' => 'coordinator', 'coordinatorName' => $user->name,
            'summary' => ['total_inventory_value' => (float) $stocks->sum('value'), 'available_items' => $stocks->where('quantity', '>', 0)->count(),
                'total_inventory' => (int) $stocks->sum('quantity'),
                'total_received' => (int) $movements->where('type', 'receipt')->sum('quantity'),
                'received_this_month' => (int) $movements->where('type', 'receipt')->filter(fn ($m) => $m->date->format('Y-m') === now()->format('Y-m'))->sum('quantity'),
                'movements_this_month' => $movements->filter(fn ($m) => $m->date->format('Y-m') === now()->format('Y-m'))->count(),
                'issued_this_month' => $monthlyIssued, 'critical_stock' => $critical->count(), 'unserviceable' => $stocks->where('quantity', 0)->count()],
            'movement' => $points, 'movementSummary' => ['received' => $received, 'issued' => $issued, 'starting_balance' => $opening, 'ending_balance' => $opening + $received - $issued],
            'recentReceiving' => $movements->where('type', 'receipt')->reverse()->take(5)->map(fn ($m) => [
                'id' => $m->id, 'item_name' => $m->stock->name, 'quantity' => $m->quantity, 'unit' => $m->stock->unit,
                'supplier' => 'Supply Office', 'received_at' => $m->date->toDateString()])->values(),
            'recentIssuance' => $movements->where('type', 'issue')->reverse()->take(5)->map(fn ($m) => [
                'id' => $m->id, 'ris_number' => $m->reference, 'item_name' => $m->stock->name, 'recipient' => $m->office,
                'total_items' => $m->quantity, 'unit' => $m->stock->unit, 'issued_at' => $m->date->toDateString()])->values(),
            'criticalStock' => $critical->take(5)->map(fn ($s) => ['id' => $s->id, 'item_id' => $s->item_id, 'name' => $s->name, 'sku' => $s->sku,
                'current' => $s->quantity, 'min' => $lowThreshold, 'unit' => $s->unit,
                'priority' => $s->quantity <= $criticalThreshold ? 'Critical' : 'Low',
                'status' => $s->quantity <= 0 ? 'Out of Stock' : ($s->quantity <= $criticalThreshold ? 'Critical' : 'Low Stock')])->values(),
            'recentActivity' => $movements->reverse()
                ->groupBy(fn ($m) => json_encode([$m->type, $m->reference ?: $m->id, $m->date->toDateString()]))
                ->take(8)->map(function ($lines) {
                    $latest = $lines->first();

                    return [
                        'id' => $latest->id,
                        'title' => $latest->type === 'receipt' ? 'Received from Supply Office' : 'Delivery Unit issue',
                        'summary' => $lines->map(fn ($m) => $m->quantity.' '.$m->stock->unit.' · '.$m->stock->name)->implode('; '),
                        'reference' => $latest->reference, 'module' => 'Inventory',
                        'occurred_at' => $latest->created_at->toIso8601String(),
                        'context' => ['line_items' => $lines->map(fn ($m) => $m->quantity.' '.$m->stock->unit.' · '.$m->stock->name)->values()],
                    ];
                })->values(), 'showRfidAlert' => false,
            'recentRequests' => SupplyRequest::where('requested_by', $user->id)->with('items.item')
                ->orderByRaw("CASE WHEN status IN ('Pending', 'Approved', 'Pending Verification', 'For Correction', 'Under Review', 'Ready for Pickup') THEN 0 ELSE 1 END")
                ->latest('id')->take(4)->get()->map(fn ($request) => [
                    'id' => $request->id, 'reference' => $request->ris_number ?: 'Request #'.$request->id,
                    'status' => $request->status,
                    'date' => $request->date_requested?->toDateString() ?? $request->created_at->toDateString(),
                    'items' => $request->items->map(fn ($line) => $line->item?->name ?? 'Archived item')->implode(', '),
                ]),
            'requestSummary' => SupplyRequest::where('requested_by', $user->id)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'filters' => ['chartFilter' => $filter, 'customStartDate' => $start, 'customEndDate' => $end],
        ];
    }
}
