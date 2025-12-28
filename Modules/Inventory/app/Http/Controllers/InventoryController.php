<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Modules\Inventory\Models\Category;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Inventory\Models\Issuance;
use Modules\Suppliers\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventory/AllItems', [
            'items' => Item::with('category')->get()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'stock' => $item->stock,
                    'status' => $item->status,
                    'description' => $item->description,
                    'category' => $item->category?->name,
                    'category_id' => $item->category_id,
                ];
            }),
            'categories' => Category::all()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255|unique:items,sku',
            'stock' => 'required|integer|min:0',
            'status' => 'required|in:Available,Low Stock,Out of Stock',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        Item::create($request->only(['name', 'sku', 'stock', 'status', 'description', 'category_id']));

        return redirect()->route('inventory.index')->with('success', 'Item created successfully.');
    }

    public function update(Request $request, Item $inventory)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255|unique:items,sku,' . $inventory->id,
            'stock' => 'required|integer|min:0',
            'status' => 'required|in:Available,Low Stock,Out of Stock',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        $inventory->update($request->only(['name', 'sku', 'stock', 'status', 'description', 'category_id']));

        return redirect()->route('inventory.index')->with('success', 'Item updated successfully.');
    }

    public function destroy(Item $inventory)
    {
        $inventory->delete();

        return redirect()->route('inventory.index')->with('success', 'Item deleted successfully.');
    }

    public function categories()
    {
        return Inertia::render('Inventory/Categories', [
            'categories' => Category::all()
        ]);
    }

    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        Category::create($request->only(['name', 'description']));

        return redirect()->route('inventory.categories')->with('success', 'Category created successfully.');
    }

    public function updateCategory(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category->update($request->only(['name', 'description']));

        return redirect()->route('inventory.categories')->with('success', 'Category updated successfully.');
    }

    public function deleteCategory(Category $category)
    {
        $category->delete();

        return redirect()->route('inventory.categories')->with('success', 'Category deleted successfully.');
    }

    public function receiving()
    {
        return Inertia::render('Inventory/Receiving', [
            'receivings' => Receiving::with(['item', 'supplier'])->get()->map(function ($receiving) {
                return [
                    'id' => $receiving->id,
                    'item' => $receiving->item->name,
                    'sku' => $receiving->item->sku,
                    'quantity' => $receiving->quantity,
                    'supplier' => $receiving->supplier->name,
                    'date' => $receiving->date_received->format('Y-m-d'),
                ];
            }),
            'items' => Item::all(['id', 'name', 'sku']),
            'suppliers' => Supplier::all(['id', 'name']),
        ]);
    }

    public function storeReceiving(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:items,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'quantity' => 'required|integer|min:1',
            'date_received' => 'required|date',
        ]);

        Receiving::create($request->only(['item_id', 'supplier_id', 'quantity', 'date_received']));

        return redirect()->route('inventory.receiving')->with('success', 'Receiving record created successfully.');
    }

    public function updateReceiving(Request $request, Receiving $receiving)
    {
        $request->validate([
            'item_id' => 'required|exists:items,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'quantity' => 'required|integer|min:1',
            'date_received' => 'required|date',
        ]);

        $receiving->update($request->only(['item_id', 'supplier_id', 'quantity', 'date_received']));

        return redirect()->route('inventory.receiving')->with('success', 'Receiving record updated successfully.');
    }

    public function destroyReceiving(Receiving $receiving)
    {
        $receiving->delete();

        return redirect()->route('inventory.receiving')->with('success', 'Receiving record voided successfully.');
    }

    public function issuance()
    {
        return Inertia::render('Inventory/Issuance', [
            'issuances' => Issuance::with(['item', 'issuer'])->get()->map(function ($issuance) {
                return [
                    'id' => $issuance->id,
                    'item' => $issuance->item->name,
                    'sku' => $issuance->item->sku,
                    'quantity' => $issuance->quantity,
                    'recipient' => $issuance->recipient,
                    'date' => $issuance->date_issued->format('Y-m-d'),
                    'status' => $issuance->status,
                    'issued_by' => $issuance->issuer ? $issuance->issuer->name : 'Unknown',
                ];
            }),
            'items' => Item::all(['id', 'name', 'sku']),
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
            }
        });

        return redirect()->route('inventory.issuance')->with('success', 'Issuance records created successfully.');
    }

    public function updateIssuance(Request $request, Issuance $issuance)
    {
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

        $issuance->update($request->only([
            'item_id', 'quantity', 'recipient', 'department', 'fund_cluster',
            'recipient_designation', 'purpose', 'approved_by', 'approved_by_designation',
            'date_issued', 'status'
        ]));

        return redirect()->route('inventory.issuance')->with('success', 'Issuance record updated successfully.');
    }

    public function destroyIssuance(Issuance $issuance)
    {
        $issuance->delete();

        return redirect()->route('inventory.issuance')->with('success', 'Issuance record archived successfully.');
    }
}
