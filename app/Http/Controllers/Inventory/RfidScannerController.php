<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Policies\ResourceOwnershipPolicy;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\Inventory\Models\Item;

class RfidScannerController extends Controller
{
    public function index(Request $request): Response
    {
        // Enforce rfid.view permission if permission exists
        $user = $request->user();
        if ($user && method_exists($user, 'hasPermissionTo') && method_exists($user, 'hasRole')) {
            if (!$user->hasRole('System Admin') && $user->can('rfid.view') === false && $user->getAllPermissions()->pluck('name')->contains('rfid.view')) {
                abort(403, 'Unauthorized. Missing rfid.view permission.');
            }
        }

        $validated = $request->validate([
            'item_id' => ['nullable', 'integer', 'exists:items,id'],
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:all,tagged,untagged'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        // Complete items catalog for the interactive tagging workflow & item selector
        $allItems = class_exists(Item::class)
            ? Item::with('supplier:id,name')->latest()->get()->map(function ($item) {
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

        // Paginated records query for the secondary assignment records registry
        $search = $request->input('search');
        $statusFilter = $request->input('status', 'all');
        $perPage = (int) $request->input('per_page', 10);

        $recordsList = [];
        $recordsPagination = null;

        if (class_exists(Item::class)) {
            $recordsQuery = Item::with('supplier:id,name');

            if (!empty($search)) {
                $recordsQuery->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%")
                      ->orWhere('rfid_tag', 'like', "%{$search}%");
                });
            }

            if ($statusFilter === 'tagged') {
                $recordsQuery->whereNotNull('rfid_tag');
            } elseif ($statusFilter === 'untagged') {
                $recordsQuery->whereNull('rfid_tag');
            }

            $recordsQuery->orderBy('id', 'desc');
            $paginator = $recordsQuery->paginate($perPage)->withQueryString();

            $recordsList = collect($paginator->items())->map(function ($item) {
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
            })->values()->all();

            $recordsPagination = [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ];
        }

        return Inertia::render('RFID-Scanner/Index', [
            'items' => $allItems,
            'records' => $recordsList,
            'recordsPagination' => $recordsPagination,
            'recordsFilters' => [
                'search' => $search ?? '',
                'status' => $statusFilter,
            ],
            'selectedItemId' => $validated['item_id'] ?? null,
        ]);
    }

    public function assign(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:items,id'],
            'rfid_tag' => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9\-_]+$/'],
        ]);

        $itemId = (int) $validated['item_id'];
        $rfidTag = trim($validated['rfid_tag']);
        $user = $request->user();

        // Enforce rfid.assign / rfid.replace permission check
        if ($user && method_exists($user, 'hasPermissionTo') && method_exists($user, 'hasRole')) {
            if (!$user->hasRole('System Admin') && $user->can('rfid.assign') === false && $user->getAllPermissions()->pluck('name')->contains('rfid.assign')) {
                abort(403, 'Unauthorized. Missing rfid.assign permission.');
            }
        }

        try {
            return DB::transaction(function () use ($request, $itemId, $rfidTag, $user) {
                // Lock inventory item for concurrent safety
                $item = Item::lockForUpdate()->findOrFail($itemId);
                ResourceOwnershipPolicy::authorize($user, $item, 'created_by');

                // Authoritative uniqueness validation including soft-deleted items
                $existing = Item::withTrashed()
                    ->where('rfid_tag', $rfidTag)
                    ->where('id', '!=', $itemId)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    if (! $existing->trashed()) {
                        // Active item collision -> Reject
                        return back()->withErrors([
                            'rfid_tag' => 'This RFID tag is already assigned to another active inventory item.',
                            'conflict_item' => [
                                'id' => $existing->id,
                                'name' => $existing->name,
                                'sku' => $existing->sku ?? 'N/A',
                                'description' => $existing->description,
                            ],
                        ]);
                    }

                    // Soft-deleted / retired item -> Controlled reassignment
                    $existing->update(['rfid_tag' => null]);
                    $previousTag = $item->rfid_tag;
                    $item->update(['rfid_tag' => $rfidTag]);

                    if (class_exists(TransactionTrail::class)) {
                        TransactionTrail::create([
                            'user_id' => $user?->id,
                            'module' => 'RFID Scanner',
                            'action' => 'reassign',
                            'resource_ref' => $item->sku ?? (string) $item->id,
                            'details' => json_encode([
                                'rfid_tag' => $rfidTag,
                                'previous_item' => [
                                    'id' => $existing->id,
                                    'name' => $existing->name,
                                    'sku' => $existing->sku ?? 'N/A',
                                ],
                                'new_item' => [
                                    'id' => $item->id,
                                    'name' => $item->name,
                                    'sku' => $item->sku ?? 'N/A',
                                ],
                                'changed_by' => $user?->name ?? 'System Administrator',
                                'timestamp' => now()->toIso8601String(),
                                'reason' => 'Controlled reassignment from retired inventory item',
                                'action' => 'reassigned_rfid_tag',
                            ]),
                            'status' => 'completed',
                        ]);
                    }

                    $nextUntagged = Item::whereNull('rfid_tag')
                        ->where('id', '!=', $itemId)
                        ->first();

                    $redirectParams = $nextUntagged ? ['item_id' => $nextUntagged->id] : ['item_id' => $itemId];

                    return redirect()->route('rfid-scanner.index', $redirectParams)
                        ->with('success', "RFID Tag {$rfidTag} successfully reassigned from retired item to {$item->name}.");
                }

                $previousTag = $item->rfid_tag;
                $item->update(['rfid_tag' => $rfidTag]);

                // Write audit trail entry if AuditLogs module is present
                if (class_exists(TransactionTrail::class)) {
                    TransactionTrail::create([
                        'user_id' => $user?->id,
                        'module' => 'RFID Scanner',
                        'action' => $previousTag ? 'replace' : 'assign',
                        'resource_ref' => $item->sku ?? (string) $item->id,
                        'details' => json_encode([
                            'item_id' => $item->id,
                            'item_name' => $item->name,
                            'previous_tag' => $previousTag,
                            'new_tag' => $rfidTag,
                        ]),
                        'status' => 'completed',
                    ]);
                }

                // Locate the next untagged item for seamless continuous workflow
                $nextUntagged = Item::whereNull('rfid_tag')
                    ->where('id', '!=', $itemId)
                    ->first();

                $redirectParams = $nextUntagged ? ['item_id' => $nextUntagged->id] : ['item_id' => $itemId];

                return redirect()->route('rfid-scanner.index', $redirectParams)
                    ->with('success', "RFID Tag {$rfidTag} successfully assigned to {$item->name}.");
            });
        } catch (QueryException $e) {
            return back()->withErrors([
                'rfid_tag' => 'This RFID tag is already associated with an existing inventory item.',
            ]);
        }
    }

    public function unassign(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:items,id'],
        ]);

        $itemId = (int) $validated['item_id'];
        $user = $request->user();

        // Enforce rfid.unassign permission check
        if ($user && method_exists($user, 'hasPermissionTo') && method_exists($user, 'hasRole')) {
            if (!$user->hasRole('System Admin') && $user->can('rfid.unassign') === false && $user->getAllPermissions()->pluck('name')->contains('rfid.unassign')) {
                abort(403, 'Unauthorized. Missing rfid.unassign permission.');
            }
        }

        return DB::transaction(function () use ($itemId, $user) {
            $item = Item::lockForUpdate()->findOrFail($itemId);
            ResourceOwnershipPolicy::authorize($user, $item, 'created_by');

            $previousTag = $item->rfid_tag;
            $item->update(['rfid_tag' => null]);

            if (class_exists(TransactionTrail::class)) {
                TransactionTrail::create([
                    'user_id' => $user?->id,
                    'module' => 'RFID Scanner',
                    'action' => 'unassign',
                    'resource_ref' => $item->sku ?? (string) $item->id,
                    'details' => json_encode([
                        'item_id' => $item->id,
                        'item_name' => $item->name,
                        'unassigned_tag' => $previousTag,
                    ]),
                    'status' => 'completed',
                ]);
            }

            return redirect()->route('rfid-scanner.index', ['item_id' => $item->id])
                ->with('success', "RFID Tag unassigned from {$item->name}.");
        });
    }

    public function status(): JsonResponse
    {
        return response()->json([
            'status' => 'online',
            'timestamp' => microtime(true),
            'message' => 'RFID Scanner API service is operational.',
        ]);
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

        // Broadcast to live feed cache for real-time web portal sync
        Cache::put('latest_rfid_hardware_scan', [
            'tag' => $sanitizedTag,
            'found' => (bool) $item,
            'item' => $item ? [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'stock' => $item->stock,
                'unit_of_issue' => $item->unit_of_issue,
            ] : null,
            'timestamp' => microtime(true),
            'scanned_at' => now()->format('h:i:s A'),
        ], 60);

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
                'rfid_tag' => $item->rfid_tag,
                'stock' => (int) $item->stock,
                'unit_of_issue' => $item->unit_of_issue,
                'status' => $item->status,
            ],
        ]);
    }

    public function liveFeed(): JsonResponse
    {
        $scan = Cache::get('latest_rfid_hardware_scan');

        return response()->json([
            'status' => 'online',
            'scan' => $scan,
        ]);
    }
}
