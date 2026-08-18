<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Inventory\Models\Issuance;
use Modules\Suppliers\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Inventory\Services\InventoryService;
use Modules\Inventory\DTOs\InventoryItemDTO;

use App\Policies\ResourceOwnershipPolicy;

class InventoryController extends Controller
{
    protected $inventoryService;

    public function index()
    {
        $itemsQuery = ResourceOwnershipPolicy::scopeQuery(Item::with('supplier'), auth()->user());
        $suppliersQuery = ResourceOwnershipPolicy::scopeQuery(Supplier::query(), auth()->user());

        return Inertia::render('Inventory/AllItems', [
            'items' => $itemsQuery->get()->map(function ($item) {
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
                    'supplier' => $item->supplier,
                    'rfid_tag' => $item->rfid_tag,
                ];
            }),
            'suppliers' => $suppliersQuery->get()
        ]);
    }

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'supplier_id' => 'required|exists:suppliers,id',
            'sku' => 'nullable|string|max:255|unique:items,sku',
            'stock' => 'required|integer|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'amount' => 'nullable|numeric|min:0',
            'status' => 'required|in:Available,Low Stock,Out of Stock',
            'description' => 'nullable|string',
            'unit_of_issue' => 'nullable|string|max:255',
        ]);

        $data = $request->only([
            'name', 'supplier_id', 'sku', 'stock', 'unit_cost', 'amount', 'status', 'description', 'unit_of_issue'
        ]);
        $data['created_by'] = auth()->id();

        Item::create($data);

        return redirect()->route('inventory.index')->with('success', 'Item created successfully.');
    }

    public function update(Request $request, Item $inventory)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $inventory, 'created_by');

        $request->validate([
            'name' => 'required|string|max:255',
            'supplier_id' => 'required|exists:suppliers,id',
            'sku' => 'nullable|string|max:255|unique:items,sku,' . $inventory->id,
            'stock' => 'required|integer|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'amount' => 'nullable|numeric|min:0',
            'status' => 'required|in:Available,Low Stock,Out of Stock',
            'description' => 'nullable|string',
            'unit_of_issue' => 'nullable|string|max:255',
        ]);

        $inventory->update($request->only(['name', 'supplier_id', 'sku', 'stock', 'unit_cost', 'amount', 'status', 'description', 'unit_of_issue']));

        return redirect()->route('inventory.index')->with('success', 'Item updated successfully.');
    }

    public function destroy(Item $inventory)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $inventory, 'created_by');

        $inventory->delete();

        return redirect()->route('inventory.index')->with('success', 'Item deleted successfully.');
    }

    public function receiving()
    {
        $receivingsQuery = ResourceOwnershipPolicy::scopeQuery(Receiving::with(['item', 'supplier']), auth()->user());
        $itemsQuery = ResourceOwnershipPolicy::scopeQuery(Item::with('supplier'), auth()->user());
        $suppliersQuery = ResourceOwnershipPolicy::scopeQuery(Supplier::query(), auth()->user());

        return Inertia::render('Inventory/Receiving', [
            'receivings' => $receivingsQuery->get()->map(function ($receiving) {
                return [
                    'id' => $receiving->id,
                    'item' => $receiving->item ? $receiving->item->name : 'N/A',
                    'sku' => $receiving->item ? $receiving->item->sku : '',
                    'quantity' => $receiving->quantity,
                    'supplier' => $receiving->supplier ? $receiving->supplier->name : '',
                    'date' => $receiving->date_received ? $receiving->date_received->format('Y-m-d') : '',
                ];
            }),
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
                ];
            }),
            'suppliers' => $suppliersQuery->get(['id', 'name']),
        ]);
    }

    private function refreshItemTotals(Item $item): void
    {
        $item->amount = (float) $item->stock * (float) ($item->unit_cost ?? 0);
        $item->status = $item->stock <= 0 ? 'Out of Stock' : ($item->stock <= 10 ? 'Low Stock' : 'Available');
        $item->save();
    }

    public function storeReceiving(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:items,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'quantity' => 'required|integer|min:1',
            'date_received' => 'required|date',
        ]);

        \DB::transaction(function () use ($request) {
            $data = $request->only(['item_id', 'supplier_id', 'quantity', 'date_received']);
            $data['created_by'] = auth()->id();
            Receiving::create($data);

            $item = Item::findOrFail($request->item_id);
            $item->stock += $request->quantity;
            $this->refreshItemTotals($item);
        });

        return redirect()->route('inventory.receiving')->with('success', 'Receiving record created successfully.');
    }

    public function updateReceiving(Request $request, Receiving $receiving)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $receiving, 'created_by');

        $request->validate([
            'item_id' => 'required|exists:items,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'quantity' => 'required|integer|min:1',
            'date_received' => 'required|date',
        ]);

        \DB::transaction(function () use ($request, $receiving) {
            $oldItem = Item::findOrFail($receiving->item_id);
            $oldQuantity = $receiving->quantity;

            $receiving->update($request->only(['item_id', 'supplier_id', 'quantity', 'date_received']));
            
            if ($oldItem->id == $request->item_id) {
                // Revert old quantity, apply new quantity
                $oldItem->stock = $oldItem->stock - $oldQuantity + $request->quantity;
                $this->refreshItemTotals($oldItem);
            } else {
                // Item changed. Revert old item stock, update new item stock
                $oldItem->stock -= $oldQuantity;
                $this->refreshItemTotals($oldItem);

                $newItem = Item::findOrFail($request->item_id);
                $newItem->stock += $request->quantity;
                $this->refreshItemTotals($newItem);
            }
        });

        return redirect()->route('inventory.receiving')->with('success', 'Receiving record updated successfully.');
    }

    public function destroyReceiving(Receiving $receiving)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $receiving, 'created_by');

        \DB::transaction(function () use ($receiving) {
            $item = Item::findOrFail($receiving->item_id);
            $item->stock -= $receiving->quantity;
            $this->refreshItemTotals($item);

            $receiving->delete();
        });

        return redirect()->route('inventory.receiving')->with('success', 'Receiving record voided successfully.');
    }

    public function issuance()
    {
        $issuancesQuery = ResourceOwnershipPolicy::scopeQuery(Issuance::with(['item', 'issuer']), auth()->user(), 'issued_by');
        $itemsQuery = ResourceOwnershipPolicy::scopeQuery(Item::query(), auth()->user());

        return Inertia::render('Inventory/Issuance', [
            'issuances' => $issuancesQuery->get()->map(function ($issuance) {
                return [
                    'id' => $issuance->id,
                    'item' => $issuance->item ? $issuance->item->name : 'N/A',
                    'sku' => $issuance->item ? $issuance->item->sku : '',
                    'quantity' => $issuance->quantity,
                    'unit_cost' => $issuance->item->unit_cost ?? 0,
                    'amount' => (float) $issuance->quantity * (float) ($issuance->item->unit_cost ?? 0),
                    'recipient' => $issuance->recipient,
                    'department' => $issuance->department,
                    'fund_cluster' => $issuance->fund_cluster,
                    'recipient_designation' => $issuance->recipient_designation,
                    'purpose' => $issuance->purpose,
                    'approved_by' => $issuance->approved_by,
                    'approved_by_designation' => $issuance->approved_by_designation,
                    'date' => $issuance->date_issued ? $issuance->date_issued->format('Y-m-d') : '',
                    'status' => $issuance->status,
                    'issued_by' => $issuance->issuer ? $issuance->issuer->name : 'Unknown',
                    'created_at' => $issuance->created_at ? $issuance->created_at->format('Y-m-d H:i:s') : '',
                ];
            }),
            'items' => $itemsQuery->get(['id', 'name', 'sku']),
        ]);
    }

    public function storeIssuance(Request $request)
    {
        $request->validate([
            'issuances' => 'required|array|min:1',
            'issuances.*.item_id' => 'required|exists:items,id',
            'issuances.*.quantity' => 'required|integer|min:1',
            'recipient' => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'fund_cluster' => 'nullable|string|max:255',
            'recipient_designation' => 'nullable|string|max:255',
            'purpose' => 'nullable|string',
            'approved_by' => 'nullable|string|max:255',
            'approved_by_designation' => 'nullable|string|max:255',
            'date_issued' => 'required|date',
        ]);

        // Use database transaction for bulk insert
        \DB::transaction(function () use ($request) {
            foreach ($request->issuances as $issuanceData) {
                $item = Item::findOrFail($issuanceData['item_id']);
                
                if ($item->stock < $issuanceData['quantity']) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'issuances' => 'Insufficient stock for item: ' . $item->name
                    ]);
                }

                Issuance::create([
                    'item_id' => $issuanceData['item_id'],
                    'quantity' => $issuanceData['quantity'],
                    'recipient' => $request->recipient,
                    'department' => $request->department,
                    'fund_cluster' => $request->fund_cluster,
                    'recipient_designation' => $request->recipient_designation,
                    'purpose' => $request->purpose,
                    'approved_by' => $request->approved_by,
                    'approved_by_designation' => $request->approved_by_designation,
                    'date_issued' => $request->date_issued,
                    'status' => 'Issued',
                    'issued_by' => auth()->id(),
                ]);
                
                $item->stock -= $issuanceData['quantity'];
                $this->refreshItemTotals($item);
            }
        });

        return redirect()->route('inventory.issuance')->with('success', 'Issuance records created successfully.');
    }

    public function updateIssuance(Request $request, Issuance $issuance)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $issuance, 'issued_by');

        $request->validate([
            'item_id' => 'required|exists:items,id',
            'quantity' => 'required|integer|min:1',
            'recipient' => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'fund_cluster' => 'nullable|string|max:255',
            'recipient_designation' => 'nullable|string|max:255',
            'purpose' => 'nullable|string',
            'approved_by' => 'nullable|string|max:255',
            'approved_by_designation' => 'nullable|string|max:255',
            'date_issued' => 'required|date',
            'status' => 'required|in:Pending,Issued,Cancelled',
        ]);

        \DB::transaction(function () use ($request, $issuance) {
            $oldItem = Item::findOrFail($issuance->item_id);
            $oldQuantity = $issuance->quantity;
            $oldStatus = $issuance->status;
            
            $issuance->update($request->only([
                'item_id', 'quantity', 'recipient', 'department', 'fund_cluster',
                'recipient_designation', 'purpose', 'approved_by', 'approved_by_designation',
                'date_issued', 'status'
            ]));
            
            // Revert previous stock if the issuance was 'Issued'
            if ($oldStatus === 'Issued') {
                $oldItem->stock += $oldQuantity;
            }
            $this->refreshItemTotals($oldItem);

            // Deduct new stock if new status is 'Issued'
            if ($request->status === 'Issued') {
                $newItem = Item::findOrFail($request->item_id);
                if ($newItem->stock < $request->quantity) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'quantity' => 'Insufficient stock for item: ' . $newItem->name
                    ]);
                }
                $newItem->stock -= $request->quantity;
                $this->refreshItemTotals($newItem);
            }
        });

        return redirect()->route('inventory.issuance')->with('success', 'Issuance record updated successfully.');
    }

    public function destroyIssuance(Issuance $issuance)
    {
        ResourceOwnershipPolicy::authorize(auth()->user(), $issuance, 'issued_by');

        \DB::transaction(function () use ($issuance) {
            if ($issuance->status === 'Issued') {
                $item = Item::findOrFail($issuance->item_id);
                $item->stock += $issuance->quantity;
                $this->refreshItemTotals($item);
            }

            $issuance->delete();
        });

        return redirect()->route('inventory.issuance')->with('success', 'Issuance record archived successfully.');
    }
}
