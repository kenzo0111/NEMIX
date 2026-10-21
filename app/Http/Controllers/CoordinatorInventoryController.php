<?php

namespace App\Http\Controllers;

use App\Models\CoordinatorMovement;
use App\Models\CoordinatorStock;
use App\Services\CoordinatorInventoryService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CoordinatorInventoryController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->usesCoordinatorInventory(), 403);

        return Inertia::render('Inventory/Coordinator/Index', [
            'inventoryScope' => 'coordinator',
            'lowStockThreshold' => \Modules\Inventory\Services\InventoryPolicy::lowThreshold(),
            'stocks' => CoordinatorStock::where('coordinator_id', $request->user()->id)->orderBy('name')->get(),
            'movements' => CoordinatorMovement::forCoordinator($request->user()->id)
                ->with('stock:id,name,sku,unit')
                ->latest('date')->latest('id')->paginate(20)->appends(['tab' => 'history'])
                ->through(fn (CoordinatorMovement $movement) => [
                    'id' => $movement->id,
                    'date' => $movement->date->toDateString(),
                    'type' => $movement->type,
                    'quantity' => $movement->quantity,
                    'reference' => $movement->reference,
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
            'end_date' => ['nullable', 'date_format:Y-m-d', \Illuminate\Validation\Rule::when($request->filled('start_date'), 'after_or_equal:start_date')],
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
