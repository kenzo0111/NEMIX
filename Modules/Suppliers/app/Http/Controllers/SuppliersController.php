<?php

namespace Modules\Suppliers\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Policies\ResourceOwnershipPolicy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Issuance;
use Modules\Suppliers\Models\Supplier;

class SuppliersController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $suppliersQuery = ResourceOwnershipPolicy::scopeQuery(Supplier::query(), auth()->user());
        $suppliers = $suppliersQuery->latest()->get();

        $itemsQuery = class_exists(Item::class)
            ? ResourceOwnershipPolicy::scopeQuery(Item::query(), auth()->user())
            : null;

        $supplierItemValues = [];
        if ($itemsQuery) {
            $supplierItemValues = $itemsQuery
                ->whereNotNull('supplier_id')
                ->groupBy('supplier_id')
                ->select('supplier_id', DB::raw('SUM(stock * COALESCE(unit_cost, 0)) as total_val'))
                ->pluck('total_val', 'supplier_id')
                ->toArray();
        }

        $items = $itemsQuery ? $itemsQuery->get(['id', 'name', 'sku', 'supplier_id', 'stock', 'unit_cost', 'amount']) : collect();

        $issuances = class_exists(Issuance::class)
            ? ResourceOwnershipPolicy::scopeQuery(Issuance::with('item'), auth()->user(), 'issued_by')->latest()->get()
            : collect();

        $suppliers = $suppliers->map(function ($supplier) use ($supplierItemValues) {
            $supplierId = (string) $supplier->id;
            $supplier->amount = (float) ($supplierItemValues[$supplierId] ?? $supplier->amount ?? 0);
            return $supplier;
        });

        return Inertia::render('Suppliers/ManageSupplier', [
            'suppliers' => $suppliers,
            'items' => $items,
            'issuances' => $issuances,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'tin' => ['required', 'string', 'max:50', 'unique:suppliers,tin'],
            'address' => ['required', 'string', 'max:255'],
            'reg_number' => ['required', 'string', 'max:100', 'unique:suppliers,reg_number'],
            'category' => ['required', 'string', 'max:100'],
            'status' => ['required', 'in:active,pending,blacklisted'],
            'amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
        ]);

        $validated['created_by'] = auth()->id();

        Supplier::create($validated);

        return redirect()->route('suppliers.index')->with('success', 'Supplier created successfully.');
    }

    /**
     * Show the specified resource.
     */
    public function show($id)
    {
        $supplier = Supplier::findOrFail($id);
        ResourceOwnershipPolicy::authorize(auth()->user(), $supplier, 'created_by');

        if (request()->wantsJson()) {
            return response()->json($supplier);
        }

        return redirect()->route('suppliers.index');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $supplier = Supplier::findOrFail($id);
        ResourceOwnershipPolicy::authorize(auth()->user(), $supplier, 'created_by');

        if (request()->wantsJson()) {
            return response()->json($supplier);
        }

        return redirect()->route('suppliers.index');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id): RedirectResponse
    {
        $supplier = Supplier::findOrFail($id);
        ResourceOwnershipPolicy::authorize(auth()->user(), $supplier, 'created_by');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'tin' => ['required', 'string', 'max:50', 'unique:suppliers,tin,' . $supplier->id],
            'address' => ['required', 'string', 'max:255'],
            'reg_number' => ['required', 'string', 'max:100', 'unique:suppliers,reg_number,' . $supplier->id],
            'category' => ['required', 'string', 'max:100'],
            'status' => ['required', 'in:active,pending,blacklisted'],
            'amount' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
        ]);

        $supplier->update($validated);

        return redirect()->route('suppliers.index')->with('success', 'Supplier updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id): RedirectResponse
    {
        $supplier = Supplier::findOrFail($id);
        ResourceOwnershipPolicy::authorize(auth()->user(), $supplier, 'created_by');

        $supplier->delete();

        return redirect()->route('suppliers.index')->with('success', 'Supplier deleted successfully.');
    }
}
