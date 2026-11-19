<?php

namespace App\Http\Controllers;

use App\Models\CoordinatorMovement;
use App\Models\CoordinatorStock;
use App\Services\CoordinatorInventoryService;
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
        $minimumStockThreshold = InventoryPolicy::lowThreshold();
        $usage = WeeklyRequestQuota::usage($request->user()->id);
        $weekEnd = Carbon::parse(WeeklyRequestQuota::week(), config('app.timezone'))->addWeek()->toIso8601String();
        $reservations = SupplyRequestService::reservationQuery()->groupBy('lines.item_id')
            ->selectRaw('lines.item_id, SUM(lines.approved_quantity) as quantity');
        $available = "(items.stock - COALESCE(reservations.quantity, 0) - {$minimumStockThreshold})";
        $items = DB::table('items')->whereNull('items.deleted_at')
            ->leftJoinSub($reservations, 'reservations', 'reservations.item_id', '=', 'items.id')
            ->select('items.id', 'items.name', 'items.sku', 'items.description', 'items.unit_of_issue', 'items.stock', 'items.weekly_request_limit')
            ->selectRaw("CASE WHEN {$available} > 0 THEN {$available} ELSE 0 END as available_quantity")
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $pattern = '%'.mb_strtolower($search).'%';
                $query->whereRaw('LOWER(items.name) LIKE ?', [$pattern])->orWhereRaw('LOWER(items.sku) LIKE ?', [$pattern]);
            }))
            ->when($availability === 'available', fn ($query) => $query->whereRaw("{$available} > 0"))
            ->when($availability === 'unavailable', fn ($query) => $query->whereRaw("{$available} <= 0"))
            ->orderBy('items.name')->orderBy('items.id')->paginate(15)
            ->appends(['search' => $search, 'availability' => $availability])
            ->through(fn ($item) => [
                'id' => $item->id, 'name' => $item->name, 'sku' => $item->sku,
                'description' => $item->description, 'unit' => $item->unit_of_issue,
                'on_hand' => (int) $item->stock, 'available_quantity' => (int) $item->available_quantity,
                'weekly_request_limit' => $item->weekly_request_limit,
                'quota_remaining' => $item->weekly_request_limit === null ? 0 : max(0, $item->weekly_request_limit - ($usage[$item->id] ?? 0)),
                'quota_week_end' => $weekEnd,
            ]);

        return Inertia::render('Inventory/Coordinator/Catalog', [
            'inventoryScope' => 'coordinator', 'items' => $items,
            'filters' => ['search' => $search, 'availability' => $availability],
            'lowStockThreshold' => $minimumStockThreshold,
        ]);
    }

    public function index(Request $request)
    {
        abort_unless($request->user()->usesCoordinatorInventory(), 403);

        return Inertia::render('Inventory/Coordinator/Index', [
            'inventoryScope' => 'coordinator',
            'lowStockThreshold' => InventoryPolicy::lowThreshold(),
            'stocks' => CoordinatorStock::where('coordinator_id', $request->user()->id)->orderBy('name')->get(),
            'movements' => CoordinatorMovement::forCoordinator($request->user()->id)
                ->with('stock:id,name,sku,unit')
                ->latest('date')->latest('id')->paginate(20)->appends(['tab' => 'history'])
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
