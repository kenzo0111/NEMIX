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
use Modules\Suppliers\Http\Requests\StoreSupplierRequest;
use Modules\Suppliers\Http\Requests\UpdateSupplierRequest;
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

        $supplierIds = $suppliers->pluck('id')->filter()->all();

        $supplierItemValues = [];
        if (!empty($supplierIds) && class_exists(Item::class)) {
            $supplierItemValues = Item::query()
                ->whereIn('supplier_id', $supplierIds)
                ->where('stock', '>', 0)
                ->whereNotNull('unit_cost')
                ->where('unit_cost', '>', 0)
                ->groupBy('supplier_id')
                ->select('supplier_id', DB::raw('SUM(stock * unit_cost) as total_val'))
                ->pluck('total_val', 'supplier_id')
                ->toArray();
        }

        $suppliers = $suppliers->map(function ($supplier) use ($supplierItemValues) {
            $supplierId = (string) $supplier->id;
            $calculatedValue = round((float) ($supplierItemValues[$supplierId] ?? 0), 2);
            $supplier->contract_supplies_value = $calculatedValue;
            $supplier->amount = $calculatedValue;
            return $supplier;
        });

        return Inertia::render('Suppliers/ManageSupplier', [
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        $validated = $request->validated();
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
    public function update(UpdateSupplierRequest $request, $id): RedirectResponse
    {
        $supplier = Supplier::findOrFail($id);
        ResourceOwnershipPolicy::authorize(auth()->user(), $supplier, 'created_by');

        $supplier->update($request->validated());

        return redirect()->route('suppliers.index')->with('success', 'Supplier updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id): RedirectResponse
    {
        $supplier = Supplier::findOrFail($id);
        ResourceOwnershipPolicy::authorize(auth()->user(), $supplier, 'created_by');

        if ($supplier->hasHistoricalTransactions()) {
            return back()->with('error', 'This record cannot be permanently deleted because it is referenced by existing inventory transactions. Archive or deactivate the record instead.');
        }

        try {
            $supplier->delete();
        } catch (\Throwable $e) {
            return back()->with('error', 'This record cannot be permanently deleted because it is referenced by existing inventory transactions. Archive or deactivate the record instead.');
        }

        return redirect()->route('suppliers.index')->with('success', 'Supplier deleted successfully.');
    }
}
