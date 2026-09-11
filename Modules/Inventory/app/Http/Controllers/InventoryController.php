<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\IssuanceItem;
use Modules\Inventory\Http\Requests\StoreIssuanceRequest;
use Modules\Suppliers\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Inventory\Services\InventoryService;
use Modules\Inventory\DTOs\InventoryItemDTO;
use Carbon\Carbon;

use App\Policies\ResourceOwnershipPolicy;

class InventoryController extends Controller
{
    protected $inventoryService;

    public function generateUniqueSku(int $supplierId): string
    {
        $supplier = Supplier::find($supplierId);
        $supplierName = $supplier ? $supplier->name : 'GEN';
        $words = preg_split('/\s+/', trim($supplierName));
        $letters = [];
        foreach (array_slice($words, 0, 3) as $word) {
            if ($word !== '') {
                $letters[] = strtoupper(substr($word, 0, 1));
            }
        }
        while (count($letters) < 3) {
            $letters[] = 'X';
        }
        $acronym = implode('', array_slice($letters, 0, 3));
        $year = date('y');
        $month = date('m');

        $count = Item::where('supplier_id', $supplierId)->count();
        $index = $count + 1;
        do {
            $sku = sprintf('%s-%s-%s-%03d-0001', $acronym, $year, $month, $index);
            $exists = Item::where('sku', $sku)->exists();
            if (!$exists) {
                return $sku;
            }
            $index++;
        } while (true);
    }

    public function index(Request $request)
    {
        $lowStockThreshold = class_exists(\App\Models\SystemSetting::class)
            ? (int) \App\Models\SystemSetting::get('inventory.low_stock_threshold', 10)
            : 10;

        $itemsQuery = ResourceOwnershipPolicy::scopeQuery(Item::with('supplier'), auth()->user());
        $suppliersQuery = ResourceOwnershipPolicy::scopeQuery(Supplier::query(), auth()->user());

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $itemsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('rfid_tag', 'like', "%{$search}%");
            });
        }

        if ($request->filled('supplier')) {
            $itemsQuery->where('supplier_id', $request->input('supplier'));
        }

        if ($request->filled('status')) {
            $itemsQuery->where('status', $request->input('status'));
        }

        $itemsQuery->orderBy('id', 'desc');

        $perPage = (int) $request->input('per_page', 10);
        $paginator = $itemsQuery->paginate($perPage)->withQueryString();

        $itemsList = collect($paginator->items())->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'stock' => $item->stock,
                'unit_cost' => $item->unit_cost,
                'amount' => $item->amount,
                'status' => $item->status,
                'description' => $item->description,
                'unit_of_issue' => $item->unit_of_issue,
                'supplier_id' => $item->supplier_id,
                'supplier' => $item->supplier ? [
                    'id' => $item->supplier->id,
                    'name' => $item->supplier->name,
                ] : null,
                'rfid_tag' => $item->rfid_tag,
            ];
        })->values()->all();

        return Inertia::render('Inventory/AllItems', [
            'items' => $itemsList,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'filters' => [
                'search' => $request->input('search', ''),
                'supplier' => $request->input('supplier', ''),
                'status' => $request->input('status', ''),
            ],
            'suppliers' => $suppliersQuery->get(['id', 'name']),
            'lowStockThreshold' => $lowStockThreshold,
        ]);
    }

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'sku' => ['nullable', 'string', 'max:255'],
            'stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'unit_cost' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'status' => ['nullable', 'string', 'in:Available,Low Stock,Out of Stock'],
            'description' => ['nullable', 'string', 'max:2000'],
            'unit_of_issue' => ['nullable', 'string', 'max:255'],
        ]);

        $lowStockThreshold = class_exists(\App\Models\SystemSetting::class)
            ? (int) \App\Models\SystemSetting::get('inventory.low_stock_threshold', 10)
            : 10;

        $stock = (int) $validated['stock'];
        $unitCost = isset($validated['unit_cost']) && $validated['unit_cost'] !== '' ? (float) $validated['unit_cost'] : 0.0;
        $amount = round($stock * $unitCost, 2);
        $status = $stock <= 0 ? 'Out of Stock' : ($stock <= $lowStockThreshold ? 'Low Stock' : 'Available');

        return DB::transaction(function () use ($validated, $stock, $unitCost, $amount, $status) {
            $sku = !empty($validated['sku']) ? trim($validated['sku']) : '';
            if ($sku === '' || Item::where('sku', $sku)->exists()) {
                $sku = $this->generateUniqueSku((int) $validated['supplier_id']);
            }

            $item = Item::create([
                'name' => $validated['name'],
                'supplier_id' => $validated['supplier_id'],
                'sku' => $sku,
                'stock' => $stock,
                'unit_cost' => $unitCost,
                'amount' => $amount,
                'status' => $status,
                'description' => $validated['description'] ?? null,
                'unit_of_issue' => $validated['unit_of_issue'] ?? null,
                'created_by' => auth()->id(),
            ]);

            return redirect()->route('inventory.index')->with('success', 'Inventory item created successfully.');
        });
    }

    public function update(Request $request, Item $inventory)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $inventory, 'created_by');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'sku' => ['nullable', 'string', 'max:255', 'unique:items,sku,' . $inventory->id],
            'stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'unit_cost' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'status' => ['nullable', 'string', 'in:Available,Low Stock,Out of Stock'],
            'description' => ['nullable', 'string', 'max:2000'],
            'unit_of_issue' => ['nullable', 'string', 'max:255'],
        ]);

        $lowStockThreshold = class_exists(\App\Models\SystemSetting::class)
            ? (int) \App\Models\SystemSetting::get('inventory.low_stock_threshold', 10)
            : 10;

        $stock = (int) $validated['stock'];
        $unitCost = isset($validated['unit_cost']) && $validated['unit_cost'] !== '' ? (float) $validated['unit_cost'] : 0.0;
        $amount = round($stock * $unitCost, 2);
        $status = $stock <= 0 ? 'Out of Stock' : ($stock <= $lowStockThreshold ? 'Low Stock' : 'Available');

        return DB::transaction(function () use ($validated, $inventory, $stock, $unitCost, $amount, $status) {
            $sku = !empty($validated['sku']) ? trim($validated['sku']) : $inventory->sku;
            if (empty($sku)) {
                $sku = $this->generateUniqueSku((int) $validated['supplier_id']);
            }

            $inventory->update([
                'name' => $validated['name'],
                'supplier_id' => $validated['supplier_id'],
                'sku' => $sku,
                'stock' => $stock,
                'unit_cost' => $unitCost,
                'amount' => $amount,
                'status' => $status,
                'description' => $validated['description'] ?? null,
                'unit_of_issue' => $validated['unit_of_issue'] ?? null,
            ]);

            return redirect()->route('inventory.index')->with('success', 'Inventory item updated successfully.');
        });
    }

    public function destroy(Item $inventory)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $inventory, 'created_by');

        $inventory->delete();

        return redirect()->route('inventory.index')->with('success', 'Inventory item deleted successfully.');
    }

    public function receiving(Request $request)
    {
        $search = trim($request->input('search', ''));
        $supplierId = $request->input('supplier', '');

        $receivingsQuery = ResourceOwnershipPolicy::scopeQuery(
            Receiving::with(['item', 'supplier']),
            auth()->user()
        );

        if ($search !== '') {
            $receivingsQuery->where(function ($query) use ($search) {
                $query->whereHas('item', function ($iq) use ($search) {
                    $iq->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                })
                ->orWhereHas('supplier', function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%");
                });
            });
        }

        if ($supplierId !== '' && $supplierId !== null) {
            $receivingsQuery->where('supplier_id', $supplierId);
        }

        $paginated = $receivingsQuery
            ->latest('date_received')
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $transformed = $paginated->through(function ($receiving) {
            return [
                'id' => $receiving->id,
                'item_id' => $receiving->item_id,
                'supplier_id' => $receiving->supplier_id,
                'item' => $receiving->item ? $receiving->item->name : 'N/A',
                'sku' => $receiving->item ? $receiving->item->sku : '',
                'quantity' => (int) $receiving->quantity,
                'supplier' => $receiving->supplier ? $receiving->supplier->name : '',
                'date' => $receiving->date_received ? $receiving->date_received->format('Y-m-d') : '',
                'date_received' => $receiving->date_received ? $receiving->date_received->format('Y-m-d') : '',
            ];
        });

        $itemsQuery = ResourceOwnershipPolicy::scopeQuery(Item::with('supplier'), auth()->user());
        $suppliersQuery = ResourceOwnershipPolicy::scopeQuery(Supplier::query(), auth()->user());

        return Inertia::render('Inventory/Receiving', [
            'receivings' => $transformed,
            'items' => $itemsQuery->get()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'rfid_tag' => $item->rfid_tag,
                    'supplier_id' => $item->supplier_id,
                    'supplier_name' => $item->supplier ? $item->supplier->name : '',
                    'description' => $item->description,
                    'unit_of_issue' => $item->unit_of_issue,
                    'stock' => (int) $item->stock,
                ];
            }),
            'suppliers' => $suppliersQuery->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'supplier' => $supplierId ? (int) $supplierId : '',
            ],
        ]);
    }

    private function refreshItemTotals(Item $item): void
    {
        $lowStockThreshold = class_exists(\App\Models\SystemSetting::class)
            ? (int) \App\Models\SystemSetting::get('inventory.low_stock_threshold', 10)
            : 10;
        $item->amount = (float) $item->stock * (float) ($item->unit_cost ?? 0);
        $item->status = $item->stock <= 0 ? 'Out of Stock' : ($item->stock <= $lowStockThreshold ? 'Low Stock' : 'Available');
        $item->save();
    }

    private function normalizeDate(?string $date): ?string
    {
        if (empty($date)) {
            return null;
        }

        try {
            $tz = config('app.timezone', 'Asia/Manila');
            if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', trim($date), $matches)) {
                return sprintf('%04d-%02d-%02d', $matches[3], $matches[1], $matches[2]);
            }
            return Carbon::parse($date)->timezone($tz)->format('Y-m-d');
        } catch (\Exception $e) {
            return $date;
        }
    }

    public function storeReceiving(Request $request)
    {
        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:items,id'],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
            'date_received' => ['required', 'date'],
        ]);

        $normalizedDate = $this->normalizeDate($request->date_received);

        DB::transaction(function () use ($request, $normalizedDate) {
            $item = Item::where('id', $request->item_id)->lockForUpdate()->firstOrFail();

            $data = $request->only(['item_id', 'supplier_id', 'quantity']);
            $data['date_received'] = $normalizedDate;
            $data['created_by'] = auth()->id();
            Receiving::create($data);

            if (! $item->supplier_id && $request->supplier_id) {
                $item->supplier_id = $request->supplier_id;
            }
            $item->stock += (int) $request->quantity;
            $this->refreshItemTotals($item);
        });

        return redirect()->route('inventory.receiving')->with('success', 'Receiving record created successfully.');
    }

    public function updateReceiving(Request $request, Receiving $receiving)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $receiving, 'created_by');

        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:items,id'],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
            'date_received' => ['required', 'date'],
        ]);

        $normalizedDate = $this->normalizeDate($request->date_received);

        DB::transaction(function () use ($request, $receiving, $normalizedDate) {
            $oldItemId = $receiving->item_id;
            $oldQuantity = (int) $receiving->quantity;
            $newQuantity = (int) $request->quantity;
            $newItemId = (int) $request->item_id;

            if ($oldItemId == $newItemId) {
                $item = Item::where('id', $oldItemId)->lockForUpdate()->firstOrFail();
                $diff = $newQuantity - $oldQuantity;

                if ($item->stock + $diff < 0) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'quantity' => "Cannot reduce received quantity by " . abs($diff) . ". The resulting stock balance for {$item->name} would be negative (" . ($item->stock + $diff) . ").",
                    ]);
                }

                $item->stock += $diff;
                if (! $item->supplier_id && $request->supplier_id) {
                    $item->supplier_id = $request->supplier_id;
                }
                $this->refreshItemTotals($item);
            } else {
                // Item changed
                $oldItem = Item::where('id', $oldItemId)->lockForUpdate()->firstOrFail();
                $newItem = Item::where('id', $newItemId)->lockForUpdate()->firstOrFail();

                if ($oldItem->stock - $oldQuantity < 0) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'item_id' => "Cannot reassign item: reducing stock for {$oldItem->name} by {$oldQuantity} would result in a negative stock balance (" . ($oldItem->stock - $oldQuantity) . ").",
                    ]);
                }

                $oldItem->stock -= $oldQuantity;
                $this->refreshItemTotals($oldItem);

                $newItem->stock += $newQuantity;
                if (! $newItem->supplier_id && $request->supplier_id) {
                    $newItem->supplier_id = $request->supplier_id;
                }
                $this->refreshItemTotals($newItem);
            }

            $updateData = $request->only(['item_id', 'supplier_id', 'quantity']);
            $updateData['date_received'] = $normalizedDate;
            $receiving->update($updateData);
        });

        return redirect()->route('inventory.receiving')->with('success', 'Receiving record updated successfully.');
    }

    public function destroyReceiving(Receiving $receiving)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $receiving, 'created_by');

        DB::transaction(function () use ($receiving) {
            $item = Item::where('id', $receiving->item_id)->lockForUpdate()->firstOrFail();

            if ($item->stock - (int) $receiving->quantity < 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'error' => "Cannot void receiving record: current stock for {$item->name} ({$item->stock}) is less than the received quantity ({$receiving->quantity}).",
                ]);
            }

            $item->stock -= (int) $receiving->quantity;
            $this->refreshItemTotals($item);

            $receiving->delete();
        });

        return redirect()->route('inventory.receiving')->with('success', 'Receiving record voided successfully.');
    }

    public function issuance(Request $request)
    {
        $search = trim($request->input('search', ''));
        $recipient = trim($request->input('recipient', ''));

        $issuancesQuery = ResourceOwnershipPolicy::scopeQuery(
            Issuance::with(['items.item', 'item', 'issuer']),
            auth()->user(),
            'issued_by'
        );

        if ($search !== '') {
            $issuancesQuery->where(function ($query) use ($search) {
                $query->where('ris_number', 'like', "%{$search}%")
                    ->orWhere('recipient', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->orWhere('purpose', 'like', "%{$search}%")
                    ->orWhereHas('items.item', function ($iq) use ($search) {
                        $iq->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    })
                    ->orWhereHas('item', function ($iq) use ($search) {
                        $iq->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
            });
        }

        if ($recipient !== '') {
            $issuancesQuery->where('recipient', $recipient);
        }

        $paginated = $issuancesQuery
            ->latest('date_issued')
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $defaultApprovedBy = class_exists(\App\Models\SystemSetting::class)
            ? \App\Models\SystemSetting::get('signatories.ris_approved_by_name', 'ARSENIO GEM A. GARCILLANOSA')
            : 'ARSENIO GEM A. GARCILLANOSA';
        $defaultApprovedByDesignation = class_exists(\App\Models\SystemSetting::class)
            ? \App\Models\SystemSetting::get('signatories.ris_approved_by_designation', 'SUPPLY OFFICER III/ADMIN OFFICER V')
            : 'SUPPLY OFFICER III/ADMIN OFFICER V';

        $transformed = $paginated->through(function ($issuance) use ($defaultApprovedBy, $defaultApprovedByDesignation) {
            $dateFormatted = $issuance->date_issued ? $issuance->date_issued->format('Y-m-d') : '';
            $risNo = $issuance->ris_number ?: ('RIS-' . ($issuance->date_issued ? $issuance->date_issued->format('Y-m') : date('Y-m')) . '-' . str_pad($issuance->id, 4, '0', STR_PAD_LEFT));

            if ($issuance->items->isNotEmpty()) {
                $itemsList = $issuance->items->map(function ($line) {
                    $itemName = $line->item ? $line->item->name : 'N/A';
                    $sku = $line->item ? $line->item->sku : '';
                    return [
                        'id' => $line->id,
                        'item_id' => $line->item_id,
                        'item' => $itemName,
                        'item_name' => $itemName,
                        'sku' => $sku,
                        'stock_no' => $sku,
                        'quantity' => (int) $line->quantity,
                        'unit_cost' => (float) $line->unit_cost,
                        'amount' => (float) $line->amount,
                        'unit' => $line->item->unit_of_issue ?? 'pcs',
                    ];
                })->values()->all();

                $totalQty = (int) $issuance->items->sum('quantity');
                $totalAmt = (float) $issuance->items->sum('amount');
                $firstItemName = $itemsList[0]['item'];
                $itemSummary = count($itemsList) > 1
                    ? count($itemsList) . ' items (' . $firstItemName . ', ...)'
                    : $firstItemName;
            } else {
                $itemName = $issuance->item ? $issuance->item->name : 'N/A';
                $sku = $issuance->item ? $issuance->item->sku : '';
                $unitCost = (float) ($issuance->item->unit_cost ?? 0);
                $qty = (int) $issuance->quantity;
                $amt = (float) $qty * $unitCost;

                $itemsList = [
                    [
                        'id' => $issuance->id,
                        'item_id' => $issuance->item_id,
                        'item' => $itemName,
                        'item_name' => $itemName,
                        'sku' => $sku,
                        'stock_no' => $sku,
                        'quantity' => $qty,
                        'unit_cost' => $unitCost,
                        'amount' => $amt,
                        'unit' => $issuance->item->unit_of_issue ?? 'pcs',
                    ]
                ];
                $totalQty = $qty;
                $totalAmt = $amt;
                $itemSummary = $itemName;
            }

            return [
                'id' => $issuance->id,
                'ris_number' => $risNo,
                'item' => $itemSummary,
                'sku' => $itemsList[0]['sku'] ?? '',
                'quantity' => $totalQty,
                'total_quantity' => $totalQty,
                'unit_cost' => $itemsList[0]['unit_cost'] ?? 0,
                'amount' => $totalAmt,
                'total_amount' => $totalAmt,
                'recipient' => $issuance->recipient,
                'department' => $issuance->department,
                'fund_cluster' => $issuance->fund_cluster,
                'recipient_designation' => $issuance->recipient_designation,
                'purpose' => $issuance->purpose,
                'approved_by' => $issuance->approved_by ?: $defaultApprovedBy,
                'approved_by_designation' => $issuance->approved_by_designation ?: $defaultApprovedByDesignation,
                'date' => $dateFormatted,
                'date_issued' => $dateFormatted,
                'status' => $issuance->status,
                'issued_by' => $issuance->issuer ? $issuance->issuer->name : 'Supply Staff',
                'created_at' => $issuance->created_at ? $issuance->created_at->format('Y-m-d H:i:s') : '',
                'items' => $itemsList,
                'items_list' => $itemsList,
            ];
        });

        $itemsQuery = ResourceOwnershipPolicy::scopeQuery(Item::query(), auth()->user());
        $recipientsQuery = ResourceOwnershipPolicy::scopeQuery(Issuance::query(), auth()->user(), 'issued_by');

        return Inertia::render('Inventory/Issuance', [
            'issuances' => $transformed,
            'items' => $itemsQuery->get(['id', 'name', 'sku', 'stock', 'unit_of_issue', 'unit_cost']),
            'recipients' => $recipientsQuery->distinct()->pluck('recipient')->filter()->values()->all(),
            'divisions' => config('university.divisions', []),
            'filters' => [
                'search' => $search,
                'recipient' => $recipient,
            ],
        ]);
    }

    public function storeIssuance(StoreIssuanceRequest $request)
    {
        $normalizedDate = $this->normalizeDate($request->date_issued);

        \DB::transaction(function () use ($request, $normalizedDate) {
            $risPrefix = class_exists(\App\Models\SystemSetting::class)
                ? \App\Models\SystemSetting::get('numbering.ris_prefix', 'RIS-')
                : 'RIS-';

            $dateCarbon = Carbon::parse($normalizedDate);
            $yearMonth = $dateCarbon->format('Y-m');

            $monthCount = Issuance::whereYear('date_issued', $dateCarbon->year)
                ->whereMonth('date_issued', $dateCarbon->month)
                ->count();
            $seq = $monthCount + 1;
            $risNumber = sprintf('%s%s-%04d', $risPrefix, $yearMonth, $seq);
            while (Issuance::where('ris_number', $risNumber)->exists()) {
                $seq++;
                $risNumber = sprintf('%s%s-%04d', $risPrefix, $yearMonth, $seq);
            }

            $approvedBy = $request->approved_by ?: (class_exists(\App\Models\SystemSetting::class)
                ? \App\Models\SystemSetting::get('signatories.ris_approved_by_name', 'ARSENIO GEM A. GARCILLANOSA')
                : 'ARSENIO GEM A. GARCILLANOSA');
            $approvedByDesignation = $request->approved_by_designation ?: (class_exists(\App\Models\SystemSetting::class)
                ? \App\Models\SystemSetting::get('signatories.ris_approved_by_designation', 'SUPPLY OFFICER III/ADMIN OFFICER V')
                : 'SUPPLY OFFICER III/ADMIN OFFICER V');

            $lockedItems = [];
            $totalQuantity = 0;

            foreach ($request->issuances as $issuanceData) {
                $item = Item::where('id', $issuanceData['item_id'])->lockForUpdate()->firstOrFail();
                $qty = (int) $issuanceData['quantity'];

                if ($item->stock < $qty) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'issuances' => 'Insufficient stock for item: ' . $item->name . ' (Available: ' . $item->stock . ', Requested: ' . $qty . ')'
                    ]);
                }

                $totalQuantity += $qty;
                $lockedItems[] = [
                    'item' => $item,
                    'quantity' => $qty,
                ];
            }

            $primaryItem = $lockedItems[0]['item'];

            $issuance = Issuance::create([
                'ris_number' => $risNumber,
                'item_id' => $primaryItem->id,
                'quantity' => $totalQuantity,
                'recipient' => $request->recipient,
                'department' => $request->department,
                'fund_cluster' => $request->fund_cluster,
                'recipient_designation' => $request->recipient_designation,
                'purpose' => $request->purpose,
                'approved_by' => $approvedBy,
                'approved_by_designation' => $approvedByDesignation,
                'date_issued' => $normalizedDate,
                'status' => 'Issued',
                'issued_by' => auth()->id(),
            ]);

            foreach ($lockedItems as $locked) {
                $item = $locked['item'];
                $qty = $locked['quantity'];
                $unitCost = (float) ($item->unit_cost ?? 0);
                $amount = $qty * $unitCost;

                IssuanceItem::create([
                    'issuance_id' => $issuance->id,
                    'item_id' => $item->id,
                    'quantity' => $qty,
                    'unit_cost' => $unitCost,
                    'amount' => $amount,
                ]);

                $item->stock -= $qty;
                $this->refreshItemTotals($item);
            }
        });

        return redirect()->route('inventory.issuance')->with('success', 'Issuance record created successfully.');
    }

    public function updateIssuance(Request $request, Issuance $issuance)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $issuance, 'issued_by');

        $validated = $request->validate([
            'issuances' => ['nullable', 'array', 'min:1', 'max:100'],
            'issuances.*.item_id' => ['required_with:issuances', 'integer', 'exists:items,id'],
            'issuances.*.quantity' => ['required_with:issuances', 'integer', 'min:1', 'max:1000000'],
            'item_id' => ['nullable', 'integer', 'exists:items,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'recipient' => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'fund_cluster' => ['nullable', 'string', 'max:255'],
            'recipient_designation' => ['nullable', 'string', 'max:255'],
            'purpose' => ['nullable', 'string', 'max:2000'],
            'approved_by' => ['nullable', 'string', 'max:255'],
            'approved_by_designation' => ['nullable', 'string', 'max:255'],
            'date_issued' => ['required', 'date'],
            'status' => ['required', 'string', 'in:Pending,Issued,Cancelled'],
        ]);

        $normalizedDate = $this->normalizeDate($request->date_issued);

        $requestedLines = [];
        if ($request->filled('issuances') && is_array($request->issuances)) {
            $requestedLines = $request->issuances;
        } elseif ($request->filled('item_id') && $request->filled('quantity')) {
            $requestedLines = [[
                'item_id' => (int) $request->item_id,
                'quantity' => (int) $request->quantity,
            ]];
        } else {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'quantity' => 'At least one item line must be specified for this issuance voucher.'
            ]);
        }

        $condensedRequested = [];
        foreach ($requestedLines as $line) {
            $iid = (int) $line['item_id'];
            $qty = (int) $line['quantity'];
            $condensedRequested[$iid] = ($condensedRequested[$iid] ?? 0) + $qty;
        }

        \DB::transaction(function () use ($request, $issuance, $normalizedDate, $condensedRequested) {
            // 1. Lock the issuance record
            $lockedIssuance = Issuance::where('id', $issuance->id)->lockForUpdate()->firstOrFail();

            // 2. Retrieve old issuance items
            $oldChildItems = $lockedIssuance->items()->get();
            $oldLines = [];
            if ($oldChildItems->isNotEmpty()) {
                foreach ($oldChildItems as $ci) {
                    $oldLines[] = ['item_id' => (int) $ci->item_id, 'quantity' => (int) $ci->quantity];
                }
            } elseif ($lockedIssuance->item_id) {
                $oldLines[] = ['item_id' => (int) $lockedIssuance->item_id, 'quantity' => (int) $lockedIssuance->quantity];
            }

            // 3. Lock all affected inventory items in deterministic order
            $allItemIds = array_values(array_unique(array_merge(
                array_column($oldLines, 'item_id'),
                array_keys($condensedRequested)
            )));
            sort($allItemIds);

            $lockedItems = Item::whereIn('id', $allItemIds)->lockForUpdate()->get()->keyBy('id');

            // 4. Reverse old stock impact if previously Issued
            if ($lockedIssuance->status === 'Issued') {
                foreach ($oldLines as $oldLine) {
                    $item = $lockedItems->get($oldLine['item_id']);
                    if ($item) {
                        $item->stock += (int) $oldLine['quantity'];
                    }
                }
            }

            // 5. Validate and apply new stock deductions if new status is Issued
            if ($request->status === 'Issued') {
                foreach ($condensedRequested as $itemId => $reqQty) {
                    $item = $lockedItems->get($itemId);
                    if (! $item || $item->stock < $reqQty) {
                        $available = $item ? $item->stock : 0;
                        $itemName = $item ? $item->name : "Item #{$itemId}";
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'quantity' => "Insufficient stock for item: {$itemName} (Available: {$available}, Requested: {$reqQty})"
                        ]);
                    }
                }

                foreach ($condensedRequested as $itemId => $reqQty) {
                    $item = $lockedItems->get($itemId);
                    $item->stock -= $reqQty;
                }
            }

            // 6. Recalculate totals and statuses for all touched inventory items
            foreach ($lockedItems as $item) {
                $this->refreshItemTotals($item);
            }

            // 7. Synchronize child issuance_items
            $lockedIssuance->items()->delete();

            $primaryItemId = null;
            $totalQuantity = 0;
            $totalAmount = 0.00;

            foreach ($condensedRequested as $itemId => $qty) {
                $item = $lockedItems->get($itemId);
                $unitCost = (float) ($item->unit_cost ?? 0);
                $amount = $qty * $unitCost;

                if ($primaryItemId === null) {
                    $primaryItemId = $itemId;
                }
                $totalQuantity += $qty;
                $totalAmount += $amount;

                IssuanceItem::create([
                    'issuance_id' => $lockedIssuance->id,
                    'item_id' => $itemId,
                    'quantity' => $qty,
                    'unit_cost' => $unitCost,
                    'amount' => $amount,
                ]);
            }

            // 8. Update issuance parent fields consistently
            $updateData = $request->only([
                'recipient', 'department', 'fund_cluster',
                'recipient_designation', 'purpose', 'approved_by', 'approved_by_designation',
                'status'
            ]);
            $updateData['date_issued'] = $normalizedDate;
            $updateData['item_id'] = $primaryItemId;
            $updateData['quantity'] = $totalQuantity;
            $lockedIssuance->update($updateData);

            // 9. Write audit log
            if (class_exists(\Modules\AuditLogs\Models\TransactionTrail::class)) {
                \Modules\AuditLogs\Models\TransactionTrail::create([
                    'user_id' => auth()->id(),
                    'module' => 'Inventory',
                    'action' => 'Updated Stock Issuance',
                    'resource_ref' => $lockedIssuance->ris_number ?: ('RIS-' . $lockedIssuance->id),
                    'details' => json_encode([
                        'issuance_id' => $lockedIssuance->id,
                        'ris_number' => $lockedIssuance->ris_number,
                        'recipient' => $lockedIssuance->recipient,
                        'status' => $lockedIssuance->status,
                        'total_quantity' => $totalQuantity,
                        'total_amount' => $totalAmount,
                        'items_count' => count($condensedRequested),
                    ]),
                    'status' => 'completed',
                ]);
            }
        });

        return redirect()->route('inventory.issuance')->with('success', 'Issuance record updated successfully.');
    }

    public function destroyIssuance(Issuance $issuance)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $issuance, 'issued_by');

        \DB::transaction(function () use ($issuance) {
            if ($issuance->status === 'Issued') {
                // Revert stock for child issuance items if present
                if ($issuance->items()->count() > 0) {
                    foreach ($issuance->items as $issuanceItem) {
                        $item = Item::where('id', $issuanceItem->item_id)->lockForUpdate()->first();
                        if ($item) {
                            $item->stock += $issuanceItem->quantity;
                            $this->refreshItemTotals($item);
                        }
                    }
                } elseif ($issuance->item_id) {
                    $item = Item::where('id', $issuance->item_id)->lockForUpdate()->first();
                    if ($item) {
                        $item->stock += $issuance->quantity;
                        $this->refreshItemTotals($item);
                    }
                }
            }

            $issuance->delete();
        });

        return redirect()->route('inventory.issuance')->with('success', 'Issuance record archived successfully.');
    }
}
