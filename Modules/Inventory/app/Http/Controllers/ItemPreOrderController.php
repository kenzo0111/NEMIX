<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\AccessControl\PermissionResolver;
use App\Support\TableSort;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\ItemPreOrder;

class ItemPreOrderController extends Controller
{
    /**
     * Dedicated Pre-Orders & Unit Demand Portal for the Supply Office.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless(
            $user && ($user->isSystemAdmin()
                || PermissionResolver::hasPermission($user, 'route:inventory.pre-orders.index')
                || PermissionResolver::hasPermission($user, 'route:inventory.index')),
            403
        );

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:150'],
            'status' => ['nullable', 'string', 'in:all,pending,notified,fulfilled,cancelled'],
            'urgency' => ['nullable', 'string', 'in:all,normal,urgent'],
            'tab' => ['nullable', 'string', 'in:by_item,all_requests'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $search = trim($filters['search'] ?? '');
        $status = $filters['status'] ?? 'pending';
        $urgency = $filters['urgency'] ?? 'all';
        $tab = $filters['tab'] ?? 'by_item';

        // Overall summary statistics
        $stats = [
            'total_pending_orders' => ItemPreOrder::where('status', 'pending')->count(),
            'total_units_demanded' => (int) ItemPreOrder::where('status', 'pending')->sum('quantity_requested'),
            'items_with_demand' => ItemPreOrder::where('status', 'pending')->distinct('item_id')->count('item_id'),
            'urgent_demands' => ItemPreOrder::where('status', 'pending')->where('urgency', 'urgent')->count(),
        ];

        // Detailed pre-order requests query
        $detailedQuery = ItemPreOrder::with([
            'item:id,name,sku,unit_of_issue,stock,status',
            'user:id,name,email,department,designation',
        ])
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($urgency !== 'all', fn ($q) => $q->where('urgency', $urgency))
            ->when($search !== '', function ($q) use ($search) {
                $pattern = '%'.mb_strtolower($search).'%';
                $q->where(function ($query) use ($pattern) {
                    $query->whereRaw('LOWER(delivery_unit) LIKE ?', [$pattern])
                        ->orWhereRaw('LOWER(purpose) LIKE ?', [$pattern])
                        ->orWhereHas('item', fn ($itemQ) => $itemQ->whereRaw('LOWER(name) LIKE ?', [$pattern])->orWhereRaw('LOWER(sku) LIKE ?', [$pattern]))
                        ->orWhereHas('user', fn ($userQ) => $userQ->whereRaw('LOWER(name) LIKE ?', [$pattern]));
                });
            })
            ->orderByDesc('id');

        $detailedOrders = $detailedQuery->paginate(15)->withQueryString()->through(fn (ItemPreOrder $order) => [
            'id' => $order->id,
            'item_id' => $order->item_id,
            'item_name' => $order->item?->name ?? 'Unknown Item',
            'sku' => $order->item?->sku ?? 'N/A',
            'unit' => $order->item?->unit_of_issue ?? 'unit',
            'stock_on_hand' => (int) ($order->item?->stock ?? 0),
            'item_status' => $order->item?->status ?? 'Out of Stock',
            'user_name' => $order->user?->name ?? 'Unknown',
            'user_designation' => $order->user?->designation ?? '',
            'delivery_unit' => $order->delivery_unit,
            'quantity_requested' => $order->quantity_requested,
            'urgency' => $order->urgency,
            'purpose' => $order->purpose,
            'status' => $order->status,
            'created_at' => $order->created_at?->toIso8601String(),
            'notified_at' => $order->notified_at?->toIso8601String(),
            'fulfilled_at' => $order->fulfilled_at?->toIso8601String(),
        ]);

        // Consolidated Demand by Item query
        $consolidatedItems = DB::table('item_pre_orders')
            ->join('items', 'item_pre_orders.item_id', '=', 'items.id')
            ->whereNull('items.deleted_at')
            ->when($status !== 'all', fn ($q) => $q->where('item_pre_orders.status', $status))
            ->when($urgency !== 'all', fn ($q) => $q->where('item_pre_orders.urgency', $urgency))
            ->when($search !== '', function ($q) use ($search) {
                $pattern = '%'.mb_strtolower($search).'%';
                $q->where(function ($sub) use ($pattern) {
                    $sub->whereRaw('LOWER(items.name) LIKE ?', [$pattern])
                        ->orWhereRaw('LOWER(items.sku) LIKE ?', [$pattern])
                        ->orWhereRaw('LOWER(item_pre_orders.delivery_unit) LIKE ?', [$pattern]);
                });
            })
            ->groupBy('items.id', 'items.name', 'items.sku', 'items.stock', 'items.unit_of_issue', 'items.status')
            ->select(
                'items.id as item_id',
                'items.name as item_name',
                'items.sku',
                'items.stock as on_hand',
                'items.unit_of_issue as unit',
                'items.status as item_status',
                DB::raw('COUNT(item_pre_orders.id) as total_pre_orders'),
                DB::raw('SUM(item_pre_orders.quantity_requested) as total_quantity_demanded'),
                DB::raw("SUM(CASE WHEN item_pre_orders.urgency = 'urgent' THEN 1 ELSE 0 END) as urgent_pre_orders_count"),
                DB::raw('MIN(item_pre_orders.created_at) as earliest_demand_at'),
                DB::raw('MAX(item_pre_orders.created_at) as latest_demand_at')
            )
            ->orderByDesc('total_quantity_demanded')
            ->get()
            ->map(function ($row) {
                // Fetch waiting units breakdown
                $units = ItemPreOrder::where('item_id', $row->item_id)
                    ->where('status', 'pending')
                    ->select('delivery_unit', 'quantity_requested', 'urgency')
                    ->get();

                return [
                    'item_id' => $row->item_id,
                    'item_name' => $row->item_name,
                    'sku' => $row->sku,
                    'on_hand' => (int) $row->on_hand,
                    'unit' => $row->unit,
                    'item_status' => $row->item_status,
                    'total_pre_orders' => (int) $row->total_pre_orders,
                    'total_quantity_demanded' => (int) $row->total_quantity_demanded,
                    'urgent_pre_orders_count' => (int) $row->urgent_pre_orders_count,
                    'earliest_demand_at' => $row->earliest_demand_at,
                    'latest_demand_at' => $row->latest_demand_at,
                    'waiting_units' => $units->map(fn ($u) => [
                        'delivery_unit' => $u->delivery_unit,
                        'quantity' => $u->quantity_requested,
                        'urgency' => $u->urgency,
                    ]),
                ];
            });

        return Inertia::render('Inventory/PreOrders/Index', [
            'stats' => $stats,
            'consolidatedItems' => $consolidatedItems,
            'detailedOrders' => $detailedOrders,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'urgency' => $urgency,
                'tab' => $tab,
            ],
        ]);
    }

    /**
     * Store or update a Pre-Order from a Supply Coordinator or Authorized Personnel.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->usesCoordinatorInventory(), 403);

        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:items,id'],
            'quantity_requested' => ['required', 'integer', 'min:1', 'max:10000'],
            'urgency' => ['required', 'string', 'in:normal,urgent'],
            'purpose' => ['nullable', 'string', 'max:500'],
        ]);

        $item = Item::findOrFail($validated['item_id']);

        // Only out-of-stock items can be pre-ordered
        if ($item->stock > 0) {
            return back()->withErrors([
                'item_id' => 'This item is currently in stock in the Supply Office. You can submit a regular supply request directly.',
            ]);
        }

        $deliveryUnit = $user->department
            ?: ($user->requiresSupportingDocument() ? 'Authorized Office' : 'Delivery Unit');

        ItemPreOrder::updateOrCreate(
            [
                'item_id' => $item->id,
                'user_id' => $user->id,
                'status' => 'pending',
            ],
            [
                'delivery_unit' => $deliveryUnit,
                'quantity_requested' => $validated['quantity_requested'],
                'urgency' => $validated['urgency'],
                'purpose' => $validated['purpose'] ?? null,
            ]
        );

        return back()->with('success', "Pre-order for \"{$item->name}\" submitted. The Supply Office has been notified to prioritize replenishment.");
    }

    /**
     * Cancel an active Pre-Order.
     */
    public function destroy(Request $request, ItemPreOrder $preOrder): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && ($preOrder->user_id === $user->id || $user->isSystemAdmin()), 403);

        $preOrder->update(['status' => 'cancelled']);

        return back()->with('success', 'Pre-order cancelled successfully.');
    }
}
