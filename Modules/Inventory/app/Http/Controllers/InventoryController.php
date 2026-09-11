<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Policies\ResourceOwnershipPolicy;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Modules\Inventory\Http\Requests\StoreIssuanceRequest;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\IssuanceItem;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Inventory\Services\InventoryBalanceService;
use Modules\Inventory\Services\InventoryCostingService;
use Modules\Inventory\Services\InventoryDuplicateDetectionService;
use Modules\Inventory\Services\InventoryIssuanceService;
use Modules\Inventory\Services\InventoryReceivingService;
use Modules\Inventory\Services\InventoryService;
use Modules\Suppliers\Models\Supplier;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected InventoryReceivingService $receivingService,
        protected InventoryIssuanceService $issuanceService,
        protected InventoryBalanceService $balanceService,
        protected InventoryDuplicateDetectionService $duplicateDetectionService
    ) {}

    public function generateUniqueSku(?int $supplierId = null, ?string $name = null): string
    {
        $acronym = 'GEN';
        if ($supplierId) {
            $supplier = Supplier::find($supplierId);
            $supplierName = $supplier ? $supplier->name : '';
            if (!empty($supplierName)) {
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
            }
        } elseif (!empty($name)) {
            $words = preg_split('/\s+/', trim($name));
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
        }

        $year = date('y');
        $month = date('m');

        $count = Item::count();
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

        $itemsQuery = ResourceOwnershipPolicy::scopeQuery(
            Item::with(['supplier', 'batches.supplier']),
            auth()->user()
        );
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
            $supplierFilter = $request->input('supplier');
            $itemsQuery->where(function ($q) use ($supplierFilter) {
                $q->where('supplier_id', $supplierFilter)
                  ->orWhereHas('batches', function ($bq) use ($supplierFilter) {
                      $bq->where('supplier_id', $supplierFilter);
                  });
            });
        }

        if ($request->filled('status')) {
            $itemsQuery->where('status', $request->input('status'));
        }

        $itemsQuery->orderBy('id', 'desc');

        $perPage = (int) $request->input('per_page', 10);
        $paginator = $itemsQuery->paginate($perPage)->withQueryString();

        $itemsList = collect($paginator->items())->map(function ($item) {
            $receivingBatches = $item->batches ? $item->batches->map(function ($batch) {
                return [
                    'id' => $batch->id,
                    'supplier_id' => $batch->supplier_id,
                    'supplier_name' => $batch->supplier ? $batch->supplier->name : 'N/A',
                    'quantity_received' => (int) $batch->quantity_received,
                    'quantity_remaining' => (int) $batch->quantity_remaining,
                    'unit_cost' => (float) $batch->unit_cost,
                    'batch_value' => (float) $batch->batch_value,
                    'date_received' => $batch->date_received ? $batch->date_received->format('Y-m-d') : '',
                ];
            })->values()->all() : [];

            return [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'stock' => (int) $item->stock,
                'on_hand' => (int) $item->stock,
                'unit_cost' => (float) ($item->unit_cost ?? 0),
                'amount' => (float) $item->inventory_value,
                'inventory_value' => (float) $item->inventory_value,
                'status' => $item->status,
                'description' => $item->description,
                'unit_of_issue' => $item->unit_of_issue,
                'supplier_id' => $item->supplier_id,
                'supplier' => $item->supplier ? [
                    'id' => $item->supplier->id,
                    'name' => $item->supplier->name,
                ] : null,
                'rfid_tag' => $item->rfid_tag,
                'receiving_batches' => $receivingBatches,
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

    public function show(Item $inventory)
    {
        $inventory->load(['supplier', 'batches.supplier']);

        $receivingBatches = $inventory->batches->map(function ($batch) {
            return [
                'id' => $batch->id,
                'supplier_id' => $batch->supplier_id,
                'supplier_name' => $batch->supplier ? $batch->supplier->name : 'N/A',
                'quantity_received' => (int) $batch->quantity_received,
                'quantity_remaining' => (int) $batch->quantity_remaining,
                'unit_cost' => (float) $batch->unit_cost,
                'batch_value' => (float) $batch->batch_value,
                'date_received' => $batch->date_received ? $batch->date_received->format('Y-m-d') : '',
            ];
        })->values()->all();

        $recentIssuances = IssuanceItem::with('issuance')
            ->where('item_id', $inventory->id)
            ->latest('id')
            ->take(5)
            ->get()
            ->map(function ($line) {
                return [
                    'id' => $line->id,
                    'ris_number' => $line->issuance?->ris_number ?: ('RIS-' . $line->issuance_id),
                    'date_issued' => $line->issuance?->date_issued ? $line->issuance->date_issued->format('Y-m-d') : '',
                    'quantity' => (int) $line->quantity,
                    'amount' => (float) $line->amount,
                    'recipient' => $line->issuance?->recipient ?: 'Office',
                ];
            });

        return response()->json([
            'id' => $inventory->id,
            'name' => $inventory->name,
            'sku' => $inventory->sku,
            'stock' => (int) $inventory->stock,
            'on_hand' => (int) $inventory->stock,
            'unit_cost' => (float) ($inventory->unit_cost ?? 0),
            'amount' => (float) $inventory->inventory_value,
            'inventory_value' => (float) $inventory->inventory_value,
            'status' => $inventory->status,
            'description' => $inventory->description,
            'unit_of_issue' => $inventory->unit_of_issue,
            'rfid_tag' => $inventory->rfid_tag,
            'receiving_batches' => $receivingBatches,
            'recent_issuances' => $recentIssuances,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'sku' => ['nullable', 'string', 'max:255'],
            'stock' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'unit_cost' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'status' => ['nullable', 'string', 'in:Available,Low Stock,Out of Stock'],
            'description' => ['nullable', 'string', 'max:2000'],
            'unit_of_issue' => ['nullable', 'string', 'max:255'],
        ]);

        // 1. Canonical Duplicate Detection
        $duplicate = $this->duplicateDetectionService->findDuplicate($validated);
        if ($duplicate) {
            throw ValidationException::withMessages([
                'name' => $this->duplicateDetectionService->buildDuplicateMessage($duplicate),
            ]);
        }

        $stock = isset($validated['stock']) ? (int) $validated['stock'] : 0;
        $unitCost = isset($validated['unit_cost']) && $validated['unit_cost'] !== '' ? (float) $validated['unit_cost'] : 0.0;
        $supplierId = !empty($validated['supplier_id']) ? (int) $validated['supplier_id'] : null;

        return DB::transaction(function () use ($validated, $stock, $unitCost, $supplierId) {
            $sku = !empty($validated['sku']) ? trim($validated['sku']) : '';
            if ($sku === '' || Item::where('sku', $sku)->exists()) {
                $sku = $this->generateUniqueSku($supplierId, $validated['name']);
            }

            $item = Item::create([
                'name' => $validated['name'],
                'supplier_id' => $supplierId,
                'sku' => $sku,
                'stock' => $stock,
                'unit_cost' => $unitCost,
                'amount' => round($stock * $unitCost, 2),
                'status' => $this->balanceService->determineStatus($stock),
                'description' => $validated['description'] ?? null,
                'unit_of_issue' => $validated['unit_of_issue'] ?? null,
                'created_by' => auth()->id(),
            ]);

            // If initial stock is recorded directly, preserve it in an initial batch
            if ($stock > 0) {
                // If no supplier specified, pick first supplier or leave null
                $batchSupplierId = $supplierId;
                if (!$batchSupplierId) {
                    $firstSupplier = Supplier::first();
                    $batchSupplierId = $firstSupplier ? $firstSupplier->id : 1;
                }

                InventoryBatch::create([
                    'item_id' => $item->id,
                    'receiving_id' => null,
                    'supplier_id' => $batchSupplierId,
                    'quantity_received' => $stock,
                    'quantity_remaining' => $stock,
                    'unit_cost' => $unitCost,
                    'date_received' => date('Y-m-d'),
                    'created_by' => auth()->id(),
                ]);

                $this->balanceService->synchronizeItem($item);
            }

            return redirect()->route('inventory.index')->with('success', 'Inventory item created successfully.');
        });
    }

    public function update(Request $request, Item $inventory)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $inventory, 'created_by');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'sku' => ['nullable', 'string', 'max:255', 'unique:items,sku,' . $inventory->id],
            'stock' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'unit_cost' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'status' => ['nullable', 'string', 'in:Available,Low Stock,Out of Stock'],
            'description' => ['nullable', 'string', 'max:2000'],
            'unit_of_issue' => ['nullable', 'string', 'max:255'],
        ]);

        // Duplicate check (excluding current item)
        $duplicate = $this->duplicateDetectionService->findDuplicate($validated, $inventory->id);
        if ($duplicate) {
            throw ValidationException::withMessages([
                'name' => $this->duplicateDetectionService->buildDuplicateMessage($duplicate),
            ]);
        }

        return DB::transaction(function () use ($validated, $inventory) {
            $sku = !empty($validated['sku']) ? trim($validated['sku']) : $inventory->sku;
            if (empty($sku)) {
                $sku = $this->generateUniqueSku($validated['supplier_id'] ?? $inventory->supplier_id, $validated['name']);
            }

            $updateData = [
                'name' => $validated['name'],
                'sku' => $sku,
                'description' => $validated['description'] ?? null,
                'unit_of_issue' => $validated['unit_of_issue'] ?? null,
            ];

            if (isset($validated['supplier_id'])) {
                $updateData['supplier_id'] = $validated['supplier_id'];
            }

            // If item has no batch history, allow updating stock/unit_cost
            if (!$inventory->batches()->exists()) {
                if (isset($validated['stock'])) {
                    $updateData['stock'] = (int) $validated['stock'];
                }
                if (isset($validated['unit_cost'])) {
                    $updateData['unit_cost'] = (float) $validated['unit_cost'];
                }
            }

            $inventory->update($updateData);
            $this->balanceService->synchronizeItem($inventory);

            return redirect()->route('inventory.index')->with('success', 'Inventory item updated successfully.');
        });
    }

    public function destroy(Item $inventory)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $inventory, 'created_by');

        if ($inventory->hasHistoricalTransactions()) {
            throw ValidationException::withMessages([
                'error' => 'This item cannot be deleted because it is referenced by existing inventory transactions. Archive or deactivate the item instead.',
            ]);
        }

        $inventory->delete();

        return redirect()->route('inventory.index')->with('success', 'Inventory item deleted successfully.');
    }

    public function receiving(Request $request)
    {
        $search = trim($request->input('search', ''));
        $supplierId = $request->input('supplier', '');

        $receivingsQuery = ResourceOwnershipPolicy::scopeQuery(
            Receiving::with(['item', 'supplier', 'batch']),
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
            $dateStr = $receiving->date_received ? $receiving->date_received->format('Y-m-d') : '';
            return [
                'id' => $receiving->id,
                'item_id' => $receiving->item_id,
                'supplier_id' => $receiving->supplier_id,
                'item' => $receiving->item ? $receiving->item->name : 'N/A',
                'sku' => $receiving->item ? $receiving->item->sku : '',
                'quantity' => (int) $receiving->quantity,
                'unit_cost' => (float) $receiving->unit_cost,
                'amount' => (float) $receiving->amount,
                'quantity_remaining' => (int) $receiving->quantity_remaining,
                'remaining' => (int) $receiving->quantity_remaining,
                'supplier' => $receiving->supplier ? $receiving->supplier->name : '',
                'date' => $dateStr,
                'date_received' => $dateStr,
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
                    'unit_cost' => (float) ($item->unit_cost ?? 0),
                ];
            }),
            'suppliers' => $suppliersQuery->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'supplier' => $supplierId ? (int) $supplierId : '',
            ],
        ]);
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
            'unit_cost' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'date_received' => ['required', 'date'],
        ]);

        $validated['date_received'] = $this->normalizeDate($request->date_received);

        $this->receivingService->receive($validated, auth()->id());

        return redirect()->route('inventory.receiving')->with('success', 'Receiving record created successfully.');
    }

    public function updateReceiving(Request $request, Receiving $receiving)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $receiving, 'created_by');

        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:items,id'],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
            'unit_cost' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'date_received' => ['required', 'date'],
        ]);

        $validated['date_received'] = $this->normalizeDate($request->date_received);

        $this->receivingService->update($receiving, $validated, auth()->id());

        return redirect()->route('inventory.receiving')->with('success', 'Receiving record updated successfully.');
    }

    public function destroyReceiving(Receiving $receiving)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $receiving, 'created_by');

        $this->receivingService->void($receiving, auth()->id());

        return redirect()->route('inventory.receiving')->with('success', 'Receiving record voided successfully.');
    }

    public function issuance(Request $request)
    {
        $search = trim($request->input('search', ''));
        $recipient = trim($request->input('recipient', ''));

        $issuancesQuery = ResourceOwnershipPolicy::scopeQuery(
            Issuance::with(['items.item', 'items.allocations.inventoryBatch.supplier', 'item', 'issuer']),
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
                    $batchAllocations = $line->allocations ? $line->allocations->map(function ($al) {
                        return [
                            'batch_id' => $al->inventory_batch_id,
                            'supplier' => $al->inventoryBatch?->supplier?->name ?? 'Supplier',
                            'quantity' => (int) $al->quantity,
                            'unit_cost' => (float) $al->unit_cost,
                            'amount' => (float) $al->amount,
                        ];
                    })->values()->all() : [];

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
                        'allocations' => $batchAllocations,
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
                        'allocations' => [],
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

        $approvedBy = $request->approved_by ?: (class_exists(\App\Models\SystemSetting::class)
            ? \App\Models\SystemSetting::get('signatories.ris_approved_by_name', 'ARSENIO GEM A. GARCILLANOSA')
            : 'ARSENIO GEM A. GARCILLANOSA');
        $approvedByDesignation = $request->approved_by_designation ?: (class_exists(\App\Models\SystemSetting::class)
            ? \App\Models\SystemSetting::get('signatories.ris_approved_by_designation', 'SUPPLY OFFICER III/ADMIN OFFICER V')
            : 'SUPPLY OFFICER III/ADMIN OFFICER V');

        $data = [
            'recipient' => $request->recipient,
            'department' => $request->department,
            'fund_cluster' => $request->fund_cluster,
            'recipient_designation' => $request->recipient_designation,
            'purpose' => $request->purpose,
            'approved_by' => $approvedBy,
            'approved_by_designation' => $approvedByDesignation,
            'date_issued' => $normalizedDate,
        ];

        $this->issuanceService->issue($data, $request->issuances, auth()->id());

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
            throw ValidationException::withMessages([
                'quantity' => 'At least one item line must be specified for this issuance voucher.'
            ]);
        }

        $data = [
            'recipient' => $request->recipient,
            'department' => $request->department,
            'fund_cluster' => $request->fund_cluster,
            'recipient_designation' => $request->recipient_designation,
            'purpose' => $request->purpose,
            'approved_by' => $request->approved_by,
            'approved_by_designation' => $request->approved_by_designation,
            'date_issued' => $normalizedDate,
            'status' => $request->status,
        ];

        $this->issuanceService->update($issuance, $data, $requestedLines, auth()->id());

        return redirect()->route('inventory.issuance')->with('success', 'Issuance record updated successfully.');
    }

    public function destroyIssuance(Issuance $issuance)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $issuance, 'issued_by');

        $this->issuanceService->destroy($issuance, auth()->id());

        return redirect()->route('inventory.issuance')->with('success', 'Issuance record archived successfully.');
    }
}
