<?php

namespace App\Http\Controllers;

use App\Models\CoordinatorMovement;
use App\Models\CoordinatorStock;
use App\Services\CoordinatorInventoryService;
use App\Support\TableSort;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Modules\Inventory\Services\InventoryPolicy;
use Modules\Inventory\Services\SupplyRequestService;
use Modules\Inventory\Services\WeeklyRequestQuota;

class CoordinatorInventoryController extends Controller
{
    public function catalog(Request $request)
    {
        abort_unless($request->user()->usesCoordinatorInventory(), 403);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:150'],
            'availability' => ['nullable', 'in:all,available,unavailable'],
        ]);
        $search = trim($filters['search'] ?? '');
        $availability = $filters['availability'] ?? 'all';
        $sort = TableSort::fromRequest($request, [
            'name' => 'items.name',
            'sku' => function ($query, $direction) {
                $driver = DB::connection()->getDriverName();
                if ($driver === 'pgsql') {
                    $query->orderByRaw("CASE WHEN items.sku ~ '^[0-9]+$' THEN CAST(items.sku AS INTEGER) ELSE NULL END {$direction}")
                          ->orderBy('items.sku', $direction);
                } elseif ($driver === 'sqlite') {
                    $query->orderByRaw("CAST(items.sku AS INTEGER) {$direction}")
                          ->orderBy('items.sku', $direction);
                } else {
                    $query->orderByRaw("CAST(items.sku AS UNSIGNED) {$direction}")
                          ->orderBy('items.sku', $direction);
                }
            },
            'unit' => 'items.unit_of_issue',
            'on_hand' => 'items.stock',
            'available' => 'available_quantity',
        ], 'name');
        $minimumStockThreshold = InventoryPolicy::lowThreshold();
        $usage = WeeklyRequestQuota::usage($request->user()->id);
        $weekEnd = Carbon::parse(WeeklyRequestQuota::week(), config('app.timezone'))->addWeek()->toIso8601String();
        $reservations = SupplyRequestService::reservationQuery()->groupBy('lines.item_id')
            ->selectRaw('lines.item_id, SUM(lines.approved_quantity) as quantity');
        $userPreOrders = DB::table('item_pre_orders')
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->select('id as pre_order_id', 'item_id', 'quantity_requested as pre_order_quantity', 'urgency as pre_order_urgency', 'purpose as pre_order_purpose', 'created_at as pre_order_created_at');
        $available = "(items.stock - COALESCE(reservations.quantity, 0) - {$minimumStockThreshold})";
        $query = DB::table('items')->whereNull('items.deleted_at')
            ->leftJoinSub($reservations, 'reservations', 'reservations.item_id', '=', 'items.id')
            ->leftJoinSub($userPreOrders, 'user_pre_orders', 'user_pre_orders.item_id', '=', 'items.id')
            ->select(
                'items.id', 'items.name', 'items.sku', 'items.description', 'items.unit_of_issue', 'items.stock', 'items.weekly_request_limit',
                'user_pre_orders.pre_order_id', 'user_pre_orders.pre_order_quantity', 'user_pre_orders.pre_order_urgency', 'user_pre_orders.pre_order_purpose', 'user_pre_orders.pre_order_created_at'
            )
            ->selectRaw("CASE WHEN {$available} > 0 THEN {$available} ELSE 0 END as available_quantity")
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $pattern = '%'.mb_strtolower($search).'%';
                $query->whereRaw('LOWER(items.name) LIKE ?', [$pattern])->orWhereRaw('LOWER(items.sku) LIKE ?', [$pattern]);
            }))
            ->when($availability === 'available', fn ($query) => $query->whereRaw("{$available} > 0"))
            ->when($availability === 'unavailable', fn ($query) => $query->whereRaw("{$available} <= 0"));
        $sort->apply($query, 'items.id', 'asc');
        $items = $query->paginate(TableSort::pageSize($request, 15))->withQueryString()
            ->through(fn ($item) => [
                'id' => $item->id, 'name' => $item->name, 'sku' => $item->sku,
                'description' => $item->description, 'unit' => $item->unit_of_issue,
                'on_hand' => (int) $item->stock, 'available_quantity' => (int) $item->available_quantity,
                'weekly_request_limit' => $item->weekly_request_limit,
                'quota_remaining' => $item->weekly_request_limit === null ? 0 : max(0, $item->weekly_request_limit - ($usage[$item->id] ?? 0)),
                'quota_week_end' => $weekEnd,
                'user_pre_order' => $item->pre_order_id ? [
                    'id' => (int) $item->pre_order_id,
                    'quantity' => (int) $item->pre_order_quantity,
                    'urgency' => $item->pre_order_urgency,
                    'purpose' => $item->pre_order_purpose,
                    'created_at' => $item->pre_order_created_at,
                ] : null,
            ]);

        return Inertia::render('Inventory/Coordinator/Catalog', [
            'inventoryScope' => 'coordinator', 'items' => $items,
            'filters' => ['search' => $search, 'availability' => $availability, ...$sort->filters()],
            'lowStockThreshold' => $minimumStockThreshold,
        ]);
    }

    public function index(Request $request)
    {
        abort_unless($request->user()->usesCoordinatorInventory(), 403);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:150'],
            'type' => ['nullable', 'in:all,receipt,issue'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $search = trim($filters['search'] ?? '');
        $type = $filters['type'] ?? 'all';
        $sort = TableSort::fromRequest($request, [
            'date' => 'coordinator_movements.date',
            'item' => fn ($query, $direction) => $query->orderBy(
                CoordinatorStock::select('name')->whereColumn('coordinator_stocks.id', 'coordinator_movements.coordinator_stock_id'), $direction
            ),
            'type' => 'coordinator_movements.type',
            'quantity' => 'coordinator_movements.quantity',
            'source' => fn ($query, $direction) => $query->orderByRaw("CASE WHEN coordinator_movements.type = 'receipt' THEN 'Supply Office' ELSE coordinator_movements.office END ".$direction),
        ], 'date', 'desc');
        $movements = CoordinatorMovement::forCoordinator($request->user()->id)->with('stock:id,name,sku,unit')
            ->when($type !== 'all', fn ($query) => $query->where('type', $type))
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $pattern = '%'.mb_strtolower($search).'%';
                $query->whereRaw('LOWER(COALESCE(reference, ?)) LIKE ?', ['', $pattern])
                    ->orWhereRaw('LOWER(COALESCE(office, ?)) LIKE ?', ['', $pattern])
                    ->orWhereHas('stock', fn ($stock) => $stock->whereRaw('LOWER(name) LIKE ?', [$pattern])->orWhereRaw('LOWER(sku) LIKE ?', [$pattern]));
            }));
        $sort->apply($movements, 'coordinator_movements.id');

        return Inertia::render('Inventory/Coordinator/Index', [
            'inventoryScope' => 'coordinator',
            'lowStockThreshold' => InventoryPolicy::lowThreshold(),
            'stocks' => CoordinatorStock::where('coordinator_id', $request->user()->id)->orderBy('name')->get(),
            'historyFilters' => ['search' => $search, 'type' => $type, ...$sort->filters()],
            'movements' => $movements->paginate(TableSort::pageSize($request, 20))->withQueryString()->appends(['tab' => 'history'])
                ->through(fn (CoordinatorMovement $movement) => [
                    'id' => $movement->id,
                    'date' => $movement->date->toDateString(),
                    'type' => $movement->type,
                    'quantity' => $movement->quantity,
                    'reference' => $movement->officialReference(),
                    'office' => $movement->type === 'receipt' ? 'Supply Office' : $movement->office,
                    'stock' => $movement->stock,
                ]),
        ]);
    }

    public function issue(Request $request, CoordinatorInventoryService $service)
    {
        abort_unless($request->user()->usesCoordinatorInventory(), 403);
        $data = $request->validate([
            'stock_id' => ['required', 'integer'], 'quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
            'recipient' => ['required', 'string', 'max:255'],
        ]);
        $service->issue($request->user(), $data['stock_id'], $data['quantity'], $data['recipient']);

        return back()->with('success', 'Delivery Unit issue recorded.');
    }

    public function stockCard(Request $request, int $stock, CoordinatorInventoryService $service)
    {
        abort_unless($request->user()->usesCoordinatorInventory(), 403);
        $ownedStock = CoordinatorStock::where('coordinator_id', $request->user()->id)->findOrFail($stock);
        $filters = $request->validate([
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', Rule::when($request->filled('start_date'), 'after_or_equal:start_date')],
        ]);
        $dataset = $service->stockCard($ownedStock, $filters['start_date'] ?? null, $filters['end_date'] ?? null);
        if ($request->expectsJson()) {
            return response()->json($dataset);
        }

        $pdf = Pdf::loadView('compliance.pdf.stock_card', ['stockCard' => $dataset, 'entries' => $dataset['entries']])
            ->setPaper('A4', 'portrait')->setOption(['isRemoteEnabled' => false, 'defaultFont' => 'DejaVu Sans']);

        return $pdf->download('Stock-Card-'.$ownedStock->id.'.pdf');
    }
}
