<?php

namespace Modules\Inventory\Services;

use App\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\Inventory\Models\Issuance;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;

class SupplyRequestService
{
    public function __construct(private InventoryIssuanceService $issuanceService) {}

    public static function reservedQuantity(int $itemId, ?int $exceptRequestId = null): int
    {
        return (int) DB::table('supply_request_items as lines')
            ->join('supply_requests as requests', 'requests.id', '=', 'lines.supply_request_id')
            ->where('requests.status', 'Approved')
            ->where('lines.item_id', $itemId)
            ->when($exceptRequestId, fn ($query) => $query->where('requests.id', '<>', $exceptRequestId))
            ->sum('lines.approved_quantity');
    }

    public static function audit(SupplyRequest $request, int $actorId, string $action): void
    {
        if (!class_exists(TransactionTrail::class)) return;
        TransactionTrail::create([
            'user_id' => $actorId,
            'module' => 'Inventory',
            'action' => $action,
            'resource_ref' => $request->ris_number ?: 'REQUEST-' . $request->id,
            'details' => "Supply request #{$request->id}: {$action}",
            'status' => 'Success',
            'is_parent' => true,
            'event_key' => 'inventory.supply_request.' . strtolower(str_replace(' ', '_', $action)),
            'subject_type' => SupplyRequest::class,
            'subject_id' => (string) $request->id,
            'metadata' => ['request_id' => $request->id, 'status' => $request->status, 'issuance_id' => $request->issuance_id],
        ]);
    }

    public static function generateOfficialRisNumber(?string $date = null): string
    {
        $risPrefix = class_exists(SystemSetting::class)
            ? (SystemSetting::get('numbering.ris_prefix') ?: 'RIS-')
            : 'RIS-';

        $dateCarbon = $date ? Carbon::parse($date) : now();
        $yearMonth = $dateCarbon->format('Y-m');
        $pattern = $risPrefix . $yearMonth . '-%';

        $issuanceCount = DB::table('issuances')
            ->where('ris_number', 'like', $pattern)
            ->count();

        $requestCount = DB::table('supply_requests')
            ->where('ris_number', 'like', $pattern)
            ->count();

        $seq = max($issuanceCount, $requestCount) + 1;

        do {
            $candidate = sprintf('%s%s-%04d', $risPrefix, $yearMonth, $seq);
            $inIssuances = DB::table('issuances')->where('ris_number', $candidate)->exists();
            $inRequests = DB::table('supply_requests')->where('ris_number', $candidate)->exists();

            if (!$inIssuances && !$inRequests) {
                return $candidate;
            }
            $seq++;
        } while (true);
    }

    public function approve(SupplyRequest $request, array $quantities, int $reviewerId, ?string $remarks): void
    {
        DB::transaction(function () use ($request, $quantities, $reviewerId, $remarks) {
            $request = SupplyRequest::whereKey($request->id)->lockForUpdate()->firstOrFail();
            if (!in_array($request->status, ['Pending', 'Approved'], true)) {
                throw ValidationException::withMessages(['request' => 'Only pending or approved requests can be reviewed.']);
            }
            $revising = $request->status === 'Approved';

            $lines = $request->items()->orderBy('item_id')->get();
            $items = Item::whereIn('id', $lines->pluck('item_id'))->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $anyApproved = false;
            foreach ($lines as $line) {
                $quantity = (int) ($quantities[$line->id] ?? 0);
                if ($quantity < 0 || $quantity > $line->quantity) {
                    throw ValidationException::withMessages(['approved_quantities' => 'Approved quantities must be between zero and the requested quantity.']);
                }
                $item = $items->get($line->item_id);
                if (!$item || $quantity > $item->stock - self::reservedQuantity($line->item_id, $revising ? $request->id : null)) {
                    throw ValidationException::withMessages(['approved_quantities' => "Not enough unreserved stock for {$item?->name}. Please adjust the approved quantity."]);
                }
                $line->update(['approved_quantity' => $quantity]);
                $anyApproved = $anyApproved || $quantity > 0;
            }
            if (!$anyApproved) {
                throw ValidationException::withMessages(['approved_quantities' => 'Approve at least one unit, or reject the request.']);
            }

            $request->update([
                'status' => 'Approved',
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
                'review_remarks' => $remarks,
                'ris_number' => $request->ris_number ?: self::generateOfficialRisNumber($request->date_requested ? $request->date_requested->toDateString() : null),
            ]);
            self::audit($request, $reviewerId, $revising ? 'Revised Supply Approval' : 'Approved Supply Request');
        });
    }

    public function release(SupplyRequest $request, int $issuerId): void
    {
        DB::transaction(function () use ($request, $issuerId) {
            $request = SupplyRequest::whereKey($request->id)->lockForUpdate()->firstOrFail();
            if ($request->status !== 'Approved' || $request->issuance_id) {
                throw ValidationException::withMessages(['request' => 'This request is not awaiting release.']);
            }

            $request->load(['items.item', 'requester', 'reviewer']);
            $lines = $request->items->filter(fn ($line) => $line->approved_quantity > 0)
                ->map(fn ($line) => ['item_id' => $line->item_id, 'quantity' => $line->approved_quantity])->values()->all();

            $issuance = $this->issuanceService->issue([
                'date_issued' => now()->toDateString(),
                'ris_number' => $request->ris_number,
                'supply_request_id' => $request->id,
                'recipient' => $request->recipient ?: $request->requester->name,
                'department' => $request->department,
                'fund_cluster' => $request->fund_cluster ?: '01',
                'recipient_designation' => $request->recipient_designation,
                'purpose' => $request->purpose,
                'approved_by' => $request->reviewer?->name,
                'issued_by_name' => auth()->user()?->name,
            ], $lines, $issuerId);

            $request->update(['status' => 'Issued', 'issuance_id' => $issuance->id, 'released_at' => now()]);
            self::audit($request, $issuerId, 'Released Supply Request');
        });
    }
}
