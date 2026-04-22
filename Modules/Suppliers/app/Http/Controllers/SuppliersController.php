<?php

namespace Modules\Suppliers\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Issuance;
use Modules\Suppliers\Models\Supplier;

class SuppliersController extends \App\Http\Controllers\Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $suppliers = Supplier::all();

        $items = class_exists(Item::class)
            ? Item::all(['id', 'supplier_id', 'stock', 'unit_cost'])
            : collect();

        $issuances = class_exists(Issuance::class)
            ? Issuance::with('item')->get()
            : collect();

        return Inertia::render('Suppliers/ManageSupplier', [
            'suppliers' => $suppliers,
            'items' => $items,
            'issuances' => $issuances,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'tin' => 'required|string|unique:suppliers,tin',
            'address' => 'required|string|max:255',
            'reg_number' => 'required|string|unique:suppliers,reg_number',
            'category' => 'required|string',
            'status' => 'required|in:active,pending,blacklisted',
            'amount' => 'nullable|numeric',
        ]);

        Supplier::create($request->all());

        return redirect()->route('suppliers.index')->with('success', 'Supplier created successfully.');
    }

    /**
     * Show the specified resource.
     */
    public function show($id)
    {
        $supplier = Supplier::findOrFail($id);
        return Inertia::render('Suppliers/ShowSupplier', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $supplier = Supplier::findOrFail($id);
        return Inertia::render('Suppliers/EditSupplier', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255',
            'tin' => 'required|string|unique:suppliers,tin,' . $supplier->id,
            'address' => 'required|string|max:255',
            'reg_number' => 'required|string|unique:suppliers,reg_number,' . $supplier->id,
            'category' => 'required|string',
            'status' => 'required|in:active,pending,blacklisted',
            'amount' => 'nullable|numeric',
        ]);

        $supplier->update($request->all());

        return redirect()->route('suppliers.index')->with('success', 'Supplier updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->delete();

        return redirect()->route('suppliers.index')->with('success', 'Supplier deleted successfully.');
    }
}
