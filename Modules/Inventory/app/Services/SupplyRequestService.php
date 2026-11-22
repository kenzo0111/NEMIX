<?php

namespace Modules\Inventory\Services;

use App\Services\CoordinatorInventoryService;
use App\Services\DocumentNumberService;
use App\Services\SystemSettingsService;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Models\SupplyRequestAlert;

class SupplyRequestService
{
    public function __construct(private InventoryIssuanceService $issuanceService) {}

    public static function reservationQuery(?int $exceptRequestId = null): Builder
    {
        return DB::table('supply_request_items as lines')
            ->join('supply_requests as requests', 'requests.id', '=', 'lines.supply_request_id')
            ->whereIn('requests.status', ['Approved', 'Ready for Pickup'])
            ->whereNull('requests.stock_allocated_at')
            ->when($exceptRequestId, fn ($query) => $query->where('requests.id', '<>', $exceptRequestId));
    }

    public static function reservedQuantity(int $itemId, ?int $exceptRequestId = null): int
    {
        return (int) self::reservationQuery($exceptRequestId)
            ->where('lines.item_id', $itemId)
            ->sum('lines.approved_quantity');
    }

    public static function requestableQuantity(int $stock, int $reserved): int
    {
        return max(0, $stock - $reserved);
    }

    public static function stockLimitMessage(Item $item, int $maximum): string
    {
        $unit = $item->unit_of_issue ?: 'units';

        return "You can request at most {$maximum} {$unit} of {$item->name} based on available warehouse stock and approved reservations.";
    }

    public static function audit(SupplyRequest $request, int $actorId, string $action): void
    {
        if (! class_exists(TransactionTrail::class)) {
            return;
        }
        TransactionTrail::create([
            'user_id' => $actorId,
            'module' => 'Inventory',
            'action' => $action,
            'resource_ref' => $request->ris_number ?: 'REQUEST-'.$request->id,
            'details' => "Supply request #{$request->id}: {$action}",
            'status' => 'Success',
            'is_parent' => true,
            'event_key' => 'inventory.supply_request.'.strtolower(str_replace(' ', '_', $action)),
            'subject_type' => SupplyRequest::class,
            'subject_id' => (string) $request->id,
            'metadata' => ['request_id' => $request->id, 'status' => $request->status, 'issuance_id' => $request->issuance_id,
                'document_type' => $request->supporting_document_type, 'document_name' => $request->supporting_document_name,
                'document_verified_by' => $request->document_verified_by, 'document_verified_at' => $request->document_verified_at?->toIso8601String(),
                'document_remarks' => $request->document_verification_remarks],
        ]);
    }

    public static function generateOfficialRisNumber(?string $date = null): string
    {
        return app(DocumentNumberService::class)->reserve('RIS', $date);
    }

    public function approve(SupplyRequest $request, array $quantities, int $reviewerId, ?string $remarks): void
    {
        DB::transaction(function () use ($request, $quantities, $reviewerId, $remarks) {
            WeeklyRequestQuota::lockUser($request->requested_by);
            $request = SupplyRequest::whereKey($request->id)->lockForUpdate()->firstOrFail();
            if (! in_array($request->status, ['Pending', 'Under Review'], true)) {
                throw ValidationException::withMessages(['request' => 'Quantities can only be adjusted before approval. Only pending requests can be approved.']);
            }
            if ($request->requires_supporting_document && (! $request->document_verified_at || ! $request->document_verified_by || ! $request->supporting_document_path)) {
                throw ValidationException::withMessages(['request' => 'The supporting document must be verified before inventory approval.']);
            }

            $lines = $request->items()->orderBy('item_id')->get();
            $items = Item::whereIn('id', $lines->pluck('item_id'))->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $usage = WeeklyRequestQuota::usage($request->requested_by, $request->quota_week_start, $request->id);
            $anyApproved = false;
            foreach ($lines as $line) {
                $quantity = (int) ($quantities[$line->id] ?? 0);
                if ($quantity < 0 || $quantity > $line->quantity) {
                    throw ValidationException::withMessages(['approved_quantities' => 'Approved quantities must be between zero and the requested quantity.']);
                }
                $item = $items->get($line->item_id);
                if (! $item) {
                    throw ValidationException::withMessages(['approved_quantities' => 'This item is unavailable. Please adjust the approved quantity.']);
                }
                $oldQuantity = $request->stock_allocated_at ? (int) $line->approved_quantity : 0;
                $maximum = self::requestableQuantity($item->stock + $oldQuantity, self::reservedQuantity($line->item_id, $request->id));
                if ($quantity > $maximum) {
                    throw ValidationException::withMessages(['approved_quantities' => self::stockLimitMessage($item, $maximum)]);
                }
                if ($quantity > 0) {
                    WeeklyRequestQuota::validate($item, $quantity, $usage, 'approved_quantities');
                }
                if (! $request->stock_allocated_at || $quantity !== $oldQuantity) {
                    RequestStockAllocation::restore($line);
                    $item->stock += $oldQuantity;
                    RequestStockAllocation::allocate($line, $item, $quantity);
                    if ($quantity === 0) {
                        app(InventoryBalanceService::class)->synchronizeItem($item);
                    }
                }
                $line->update(['approved_quantity' => $quantity]);
                $anyApproved = $anyApproved || $quantity > 0;
            }
            if (! $anyApproved) {
                throw ValidationException::withMessages(['approved_quantities' => 'Approve at least one unit, or reject the request.']);
            }

            $request->update([
                'status' => 'Approved',
                'stock_allocated_at' => $request->stock_allocated_at ?? now(),
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
                'review_remarks' => $remarks,
                'ris_number' => $request->ris_number ?: self::generateOfficialRisNumber($request->date_requested ? $request->date_requested->toDateString() : null),
            ]);
            self::audit($request, $reviewerId, 'Approved Supply Request');
            SupplyRequestAlert::updateOrCreate(['user_id' => $request->requested_by, 'supply_request_id' => $request->id], ['read_at' => null]);
        }, 5);
    }

    public function cancel(SupplyRequest $request, int $actorId): void
    {
        DB::transaction(function () use ($request, $actorId) {
            WeeklyRequestQuota::lockUser($request->requested_by);
            $locked = SupplyRequest::whereKey($request->id)->lockForUpdate()->firstOrFail();
            if ($locked->status === 'Cancelled') {
                return;
            }
            if (! in_array($locked->status, ['Pending', 'Approved', 'Pending Verification', 'For Correction', 'Under Review', 'Ready for Pickup'], true)) {
                throw ValidationException::withMessages(['request' => 'Only requests awaiting release can be cancelled.']);
            }
            $lines = $locked->items()->orderBy('item_id')->get();
            $items = Item::whereIn('id', $lines->pluck('item_id'))->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            foreach ($lines as $line) {
                RequestStockAllocation::restore($line);
                if ($item = $items->get($line->item_id)) {
                    app(InventoryBalanceService::class)->synchronizeItem($item);
                }
            }
            $locked->update(['status' => 'Cancelled']);
            self::audit($locked, $actorId, 'Cancelled Supply Request');
        }, 5);
    }

    public function release(SupplyRequest $request, int $issuerId): void
    {
        DB::transaction(function () use ($request, $issuerId) {
            WeeklyRequestQuota::lockUser($request->requested_by);
            $request = SupplyRequest::whereKey($request->id)->lockForUpdate()->firstOrFail();
            if (($request->requires_supporting_document
                ? ($request->status !== 'Ready for Pickup' || ! $request->document_verified_at)
                : $request->status !== 'Approved') || $request->issuance_id) {
                throw ValidationException::withMessages(['request' => 'This request is not awaiting release.']);
            }

            $request->load(['items.item', 'requester', 'reviewer']);
            $lines = $request->items->filter(fn ($line) => $line->approved_quantity > 0)
                ->map(fn ($line) => ['item_id' => $line->item_id, 'quantity' => $line->approved_quantity])->values()->all();

            $signatories = app(SystemSettingsService::class)->getIssuanceSignatories();

            $issuance = $this->issuanceService->issue([
                'date_issued' => now()->toDateString(),
                'ris_number' => $request->ris_number,
                'supply_request_id' => $request->id,
                'recipient' => $request->recipient ?: $request->requester->name,
                'department' => $request->department,
                'fund_cluster' => $request->fund_cluster ?: '01',
                'recipient_designation' => $request->recipient_designation,
                'purpose' => $request->purpose,
                'approved_by' => $signatories['approved_by_name'],
                'approved_by_designation' => $signatories['approved_by_designation'],
                'issued_by_name' => $signatories['issued_by_name'],
                'issued_by_position' => $signatories['issued_by_position'],
            ], $lines, $issuerId);

            $request->update(['status' => $request->requires_supporting_document ? 'Released' : 'Issued', 'issuance_id' => $issuance->id, 'released_at' => now()]);
            if ($request->requester->usesCoordinatorInventory()) {
                app(CoordinatorInventoryService::class)->receiveRelease($request, $issuerId);
            }
            self::audit($request, $issuerId, 'Released Supply Request');
            SupplyRequestAlert::updateOrCreate(['user_id' => $request->requested_by, 'supply_request_id' => $request->id], ['read_at' => null]);
        }, 5);
    }
}
