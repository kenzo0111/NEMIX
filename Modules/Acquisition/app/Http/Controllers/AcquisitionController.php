<?php

namespace Modules\Acquisition\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Acquisition\Models\PurchaseOrder;

class AcquisitionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return view('acquisition::index');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('acquisition::create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'supplier' => 'required',
            'date' => 'required|date',
            'mode' => 'required',
            'fund_cluster' => 'required',
            'end_user' => 'required',
            'department' => 'required',
            'designation' => 'required',
            'total' => 'required|numeric',
        ]);

        $data = $request->except('po_number');
        $data['po_number'] = $this->generateNextPoNumber();

        PurchaseOrder::create($data);

        return redirect()->back()->with('success', 'Purchase Order created successfully.');
    }

    /**
     * Show the specified resource.
     */
    public function show($id)
    {
        return view('acquisition::show');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        return view('acquisition::edit');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'po_number' => 'required|unique:purchase_orders,po_number,' . $id,
            'supplier' => 'required',
            'date' => 'required|date',
            'mode' => 'required',
            'fund_cluster' => 'required',
            'end_user' => 'required',
            'department' => 'required',
            'designation' => 'required',
            'total' => 'required|numeric',
        ]);

        $purchaseOrder = PurchaseOrder::findOrFail($id);
        $purchaseOrder->update($request->all());

        return redirect()->back()->with('success', 'Purchase Order updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id) {}

    /**
     * Get the next available PO number.
     */
    public function getNextPoNumber()
    {
        $nextPoNumber = $this->generateNextPoNumber();

        return response()->json(['nextPoNumber' => $nextPoNumber]);
    }

    private function generateNextPoNumber()
    {
        $now = now();
        $year = $now->year;
        $month = str_pad($now->month, 2, '0', STR_PAD_LEFT);
        $prefix = "{$year}-{$month}-";

        // Find the latest PO number for this month
        $latestPo = PurchaseOrder::where('po_number', 'like', $prefix . '%')
            ->orderBy('po_number', 'desc')
            ->first();

        if ($latestPo) {
            // Extract the number part and increment
            $numberPart = (int) substr($latestPo->po_number, -4);
            $nextNumber = $numberPart + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
}
