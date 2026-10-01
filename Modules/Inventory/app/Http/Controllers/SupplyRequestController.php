<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Services\SupplyRequestService;

class SupplyRequestController extends Controller
{
    public function __construct(private SupplyRequestService $service) {}

    private function coordinator(Request $request): void
    {
        abort_unless($request->user()->hasAnyRole(['Supply Coordinator', 'System Admin', 'System Administrator']), 403);
    }

    private function custodian(Request $request): void
    {
        abort_unless($request->user()->hasAnyRole(['Property Custodian', 'System Admin', 'System Administrator']), 403);
    }

    public function index(Request $request)
    {
        $this->coordinator($request);
        return Inertia::render('Inventory/Requests/Index', [
            'requests' => SupplyRequest::with(['items.item', 'reviewer', 'issuance'])
                ->where('requested_by', $request->user()->id)->latest()->get(),
            'items' => Item::orderBy('name')->get(['id', 'name', 'sku', 'stock', 'unit_of_issue']),
        ]);
    }

    public function risPdf(Request $request, SupplyRequest $supplyRequest)
    {
        abort_unless(
            $request->user()->id === $supplyRequest->requested_by
                || $request->user()->hasAnyRole(['Property Custodian', 'System Admin', 'System Administrator']),
            403
        );
        abort_unless(in_array($supplyRequest->status, ['Approved', 'Issued'], true), 404);

        $supplyRequest->load(['items.item', 'requester', 'reviewer', 'issuance']);
        $issued = $supplyRequest->status === 'Issued';
        $issuance = $supplyRequest->issuance;
        $ris = [
            'entity_name' => SystemSetting::get('institution.name', 'University of Camarines Norte'),
            'fund_cluster' => $issuance?->fund_cluster ?: '01 - Regular Agency Fund',
            'division' => $supplyRequest->department,
            'office' => $supplyRequest->department,
            'responsibility_center_code' => SystemSetting::get('institution_responsibility_center_code', ''),
            'ris_no' => preg_replace('/^RIS-/i', '', $supplyRequest->ris_number ?? ''),
            'purpose' => $supplyRequest->purpose,
            'requested_by_name' => $supplyRequest->requester?->name,
            'requested_by_date' => $supplyRequest->created_at,
            'approved_by_name' => $supplyRequest->reviewer?->name,
            'approved_by_designation' => 'Property Custodian',
            'approved_by_date' => $supplyRequest->reviewed_at,
            'issued_by_name' => $issued ? $issuance?->issued_by_name : null,
            'issued_by_designation' => $issued ? $issuance?->issued_by_position : null,
            'issued_by_date' => $issued ? $issuance?->date_issued : null,
            'received_by_name' => $issued ? $supplyRequest->requester?->name : null,
            'received_by_date' => $issued ? $issuance?->date_issued : null,
        ];
        $items = $supplyRequest->items->filter(fn ($line) => $line->approved_quantity > 0)
            ->map(fn ($line) => [
                'stock_no' => '-',
                'unit' => $line->item?->unit_of_issue ?: 'pcs',
                'description' => $line->item?->name ?: 'Unavailable item',
                'quantity' => $line->approved_quantity,
                'stock_available' => true,
                'issue_quantity' => $issued ? $line->approved_quantity : '',
                'remarks' => '',
            ])->values()->all();
        $fileName = preg_replace('/[^A-Za-z0-9_-]/', '_', $supplyRequest->ris_number ?: "RIS-REQ-{$supplyRequest->id}") . '.pdf';
        $pdf = Pdf::loadView('compliance.pdf.requisition_issue_slip', [
            'ris' => $ris, 'items' => $items, 'dataset' => [],
        ])->setPaper('A4', 'portrait')->setOption([
            'isRemoteEnabled' => false,
            'isHtml5ParserEnabled' => true,
            'defaultFont' => 'DejaVu Sans',
        ]);

        return $request->boolean('inline') ? $pdf->stream($fileName) : $pdf->download($fileName);
    }

    public function store(Request $request)
    {
        $this->coordinator($request);
        $data = $request->validate([
            'department' => ['required', 'string', 'max:255'],
            'purpose' => ['required', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.item_id' => ['required', 'integer', 'distinct', 'exists:items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
        ]);

        DB::transaction(function () use ($data, $request) {
            $supplyRequest = SupplyRequest::create([
                'requested_by' => $request->user()->id,
                'department' => $data['department'],
                'purpose' => $data['purpose'],
                'status' => 'Pending',
            ]);
            $supplyRequest->items()->createMany($data['items']);
            SupplyRequestService::audit($supplyRequest, $request->user()->id, 'Submitted Supply Request');
        });
        return redirect()->route('inventory.requests.index')->with('success', 'Request submitted to the Property Custodian.');
    }

    public function cancel(Request $request, SupplyRequest $supplyRequest)
    {
        abort_unless($request->user()->id === $supplyRequest->requested_by || $request->user()->hasAnyRole(['System Admin', 'System Administrator']), 403);
        DB::transaction(function () use ($supplyRequest, $request) {
            $locked = SupplyRequest::whereKey($supplyRequest->id)->lockForUpdate()->firstOrFail();
            if (!in_array($locked->status, ['Pending', 'Approved'], true)) {
                throw ValidationException::withMessages(['request' => 'Only pending or approved requests can be cancelled.']);
            }
            $locked->update(['status' => 'Cancelled']);
            SupplyRequestService::audit($locked, $request->user()->id, 'Cancelled Supply Request');
        });
        return back()->with('success', 'Request cancelled.');
    }

    public function update(Request $request, SupplyRequest $supplyRequest)
    {
        abort_unless($request->user()->id === $supplyRequest->requested_by, 403);
        $data = $request->validate([
            'department' => ['required', 'string', 'max:255'],
            'purpose' => ['required', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.item_id' => ['required', 'integer', 'distinct', 'exists:items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
        ]);
        DB::transaction(function () use ($supplyRequest, $data, $request) {
            $locked = SupplyRequest::whereKey($supplyRequest->id)->lockForUpdate()->firstOrFail();
            if ($locked->status !== 'Pending') {
                throw ValidationException::withMessages(['request' => 'Only pending requests can be edited.']);
            }
            $locked->update(['department' => $data['department'], 'purpose' => $data['purpose']]);
            $locked->items()->delete();
            $locked->items()->createMany($data['items']);
            SupplyRequestService::audit($locked, $request->user()->id, 'Updated Supply Request');
        });
        return redirect()->route('inventory.requests.index')->with('success', 'Request updated.');
    }

    public function approve(Request $request, SupplyRequest $supplyRequest)
    {
        $this->custodian($request);
        $data = $request->validate([
            'approved_quantities' => ['required', 'array'],
            'approved_quantities.*' => ['required', 'integer', 'min:0'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);
        $this->service->approve($supplyRequest, $data['approved_quantities'], $request->user()->id, $data['remarks'] ?? null);
        return back()->with('success', 'Request approved and added to the release queue.');
    }

    public function reject(Request $request, SupplyRequest $supplyRequest)
    {
        $this->custodian($request);
        $data = $request->validate(['remarks' => ['required', 'string', 'max:2000']]);
        DB::transaction(function () use ($supplyRequest, $request, $data) {
            $locked = SupplyRequest::whereKey($supplyRequest->id)->lockForUpdate()->firstOrFail();
            if ($locked->status !== 'Pending') {
                throw ValidationException::withMessages(['request' => 'Only pending requests can be rejected.']);
            }
            $locked->update(['status' => 'Rejected', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now(), 'review_remarks' => $data['remarks']]);
            SupplyRequestService::audit($locked, $request->user()->id, 'Rejected Supply Request');
        });
        return back()->with('success', 'Request rejected.');
    }

    public function release(Request $request, SupplyRequest $supplyRequest)
    {
        $this->custodian($request);
        $request->validate(['signed_ris_presented' => ['required', 'accepted']]);
        $this->service->release($supplyRequest, $request->user()->id);
        return back()->with('success', 'Items released and inventory updated.');
    }
}
