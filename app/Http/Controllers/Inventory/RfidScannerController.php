<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Policies\ResourceOwnershipPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\Item;

class RfidScannerController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'item_id' => ['nullable', 'integer', 'exists:items,id'],
        ]);

        $items = class_exists(Item::class)
            ? Item::with('supplier')->latest()->get()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'description' => $item->description,
                    'unit_of_issue' => $item->unit_of_issue,
                    'stock' => $item->stock,
                    'status' => $item->status,
                    'rfid_tag' => $item->rfid_tag,
                    'supplier_id' => $item->supplier_id,
                    'supplier_name' => $item->supplier ? $item->supplier->name : 'N/A',
                    'updated_at' => optional($item->updated_at)->toDateTimeString(),
                ];
            })
            : collect();

        return Inertia::render('RFID-Scanner/Index', [
            'items' => $items,
            'selectedItemId' => $validated['item_id'] ?? null,
        ]);
    }

    public function assign(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:items,id'],
            'rfid_tag' => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9\-_]+$/'],
        ]);

        $itemId = $validated['item_id'];
        $rfidTag = trim($validated['rfid_tag']);

        $item = Item::findOrFail($itemId);
        ResourceOwnershipPolicy::authorize($request->user(), $item, 'created_by');

        $existing = Item::where('rfid_tag', $rfidTag)
            ->where('id', '!=', $itemId)
            ->first();

        if ($existing) {
            return back()->withErrors([
                'rfid_tag' => "Conflict: RFID ID '{$rfidTag}' is already assigned to '{$existing->name}' (Property No: " . ($existing->sku ?? 'N/A') . ").",
                'conflict_item' => [
                    'id' => $existing->id,
                    'name' => $existing->name,
                    'sku' => $existing->sku ?? 'N/A',
                    'description' => $existing->description,
                ],
            ]);
        }

        $item->update(['rfid_tag' => $rfidTag]);

        return redirect()->route('rfid-scanner.index', ['item_id' => $itemId])->with('success', "RFID Tag {$rfidTag} successfully assigned to {$item->name}.");
    }

    public function unassign(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:items,id'],
        ]);

        $item = Item::findOrFail($validated['item_id']);
        ResourceOwnershipPolicy::authorize($request->user(), $item, 'created_by');

        $item->update(['rfid_tag' => null]);

        return redirect()->route('rfid-scanner.index', ['item_id' => $item->id])->with('success', "RFID Tag unassigned from {$item->name}.");
    }

    public function lookup(Request $request, string $tag): JsonResponse
    {
        $validator = Validator::make(['tag' => $tag], [
            'tag' => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9\-_]+$/'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'found' => false,
                'message' => 'Invalid RFID tag format.',
            ], 422);
        }

        $sanitizedTag = $validator->validated()['tag'];

        $item = Item::where('rfid_tag', $sanitizedTag)
            ->with('supplier')
            ->first();

        if (!$item) {
            return response()->json([
                'found' => false,
                'message' => "No item associated with RFID tag '{$sanitizedTag}'.",
            ], 404);
        }

        return response()->json([
            'found' => true,
            'item' => [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'description' => $item->description,
                'supplier_id' => $item->supplier_id,
                'supplier_name' => $item->supplier ? $item->supplier->name : '',
                'rfid_tag' => $item->rfid_tag,
                'stock' => $item->stock,
                'unit_of_issue' => $item->unit_of_issue,
            ],
        ]);
    }
}
