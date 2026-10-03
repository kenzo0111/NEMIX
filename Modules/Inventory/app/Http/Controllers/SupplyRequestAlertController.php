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
        abort_unless(collect(['approve', 'reject', 'release'])->contains(
            fn ($action) => PermissionResolver::hasPermission($request->user(), 'route:inventory.requests.'.$action)
        ), 403);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeApprover($request);
        $userId = $request->user()->id;

        $alerts = SupplyRequestAlert::query()
            ->where('user_id', $userId)
            ->with(['supplyRequest.requester'])
            ->latest()->limit(10)->get()
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
            'pending_count' => SupplyRequest::query()->where('status', 'Pending')->count(),
            'alerts' => $alerts,
        ]);
    }

    public function read(Request $request, SupplyRequestAlert $alert): JsonResponse
    {
        $this->authorizeApprover($request);
        abort_unless($alert->user_id === $request->user()->id, 403);

        if ($alert->read_at === null) {
            $alert->update(['read_at' => now()]);
        }

        return response()->json(['ok' => true]);
    }
}
