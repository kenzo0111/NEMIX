<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\AccessControl\PermissionResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Models\SupplyRequestAlert;

class SupplyRequestAlertController extends Controller
{
    private function authorizeApprover(Request $request): void
    {
        abort_unless($request->user()->requiresSupportingDocument() || collect(['approve', 'reject', 'release', 'verify-document'])->contains(
            fn ($action) => PermissionResolver::hasPermission($request->user(), 'route:inventory.requests.'.$action)
        ), 403);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeApprover($request);
        $userId = $request->user()->id;

        $validated = $request->validate(['before' => ['sometimes', 'integer', 'min:1']]);

        $before = isset($validated['before']) ? SupplyRequestAlert::where('user_id', $userId)->findOrFail($validated['before']) : null;
        $rows = SupplyRequestAlert::query()
            ->where('user_id', $userId)
            ->when($before, fn ($query) => $query->where(fn ($older) => $older
                ->where('updated_at', '<', $before->updated_at)
                ->orWhere(fn ($same) => $same->where('updated_at', $before->updated_at)->where('id', '<', $before->id))))
            ->with(['supplyRequest.requester'])
            ->orderByDesc('updated_at')->orderByDesc('id')->limit(11)->get();
        $hasMore = $rows->count() > 10;
        $alerts = $rows->take(10)
            ->filter(fn ($alert) => $alert->supplyRequest !== null)
            ->map(fn ($alert) => [
                'id' => $alert->id,
                'request_id' => $alert->supply_request_id,
                'ris_number' => $alert->supplyRequest->ris_number,
                'requester' => $alert->supplyRequest->requester?->name,
                'status' => $alert->supplyRequest->status,
                'created_at' => $alert->created_at?->toIso8601String(),
                'read_at' => $alert->read_at?->toIso8601String(),
            ])->values();

        return response()->json([
            'unread_count' => SupplyRequestAlert::query()->where('user_id', $userId)->whereNull('read_at')->count(),
            'pending_count' => SupplyRequest::query()->when($request->user()->usesCoordinatorInventory(), fn ($query) => $query->where('requested_by', $userId))->whereIn('status', ['Pending', 'Pending Verification', 'Under Review'])->count(),
            'alerts' => $alerts,
            'has_more' => $hasMore,
        ]);
    }

    public function read(Request $request, SupplyRequestAlert $alert): JsonResponse
    {
        $this->authorizeApprover($request);
        abort_unless($alert->user_id === $request->user()->id, 403);

        if ($alert->read_at === null) {
            $alert->timestamps = false;
            $alert->update(['read_at' => now()]);
        }

        return response()->json(['ok' => true]);
    }
}
