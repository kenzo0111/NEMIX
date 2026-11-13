<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\AccessControl\PermissionResolver;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Modules\Inventory\Services\SupportingDocumentService;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Models\SupplyRequestAlert;
use Modules\Inventory\Services\SupplyRequestService;

class SupplyRequestController extends Controller
{
    public function __construct(private SupplyRequestService $service) {}

    private function authorizeRequestAction(Request $request): void
    {
        $user = $request->user();
        abort_unless(
            $user && ($user->isSystemAdmin() || PermissionResolver::hasPermission($user, 'route:'.$request->route()->getName())),
            403
        );
    }

    private function canReviewRequests(User $user): bool
    {
        return collect(['approve', 'reject', 'release', 'verify-document'])
            ->contains(fn ($action) => PermissionResolver::hasPermission($user, 'route:inventory.requests.'.$action));
    }

    private function validateRequestStock(array $lines): void
    {
        $items = Item::whereIn('id', array_column($lines, 'item_id'))
            ->orderBy('id')->lockForUpdate()->get()->keyBy('id');
        $errors = [];
        foreach ($lines as $index => $line) {
            $item = $items->get($line['item_id']);
            if (!$item || $item->stock <= 0) {
                $errors["items.{$index}.item_id"] = 'This item is out of stock and unavailable for requisition. Select another item or remove this row.';
            }
        }
        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }

    public function index(Request $request)
    {
        $this->authorizeRequestAction($request);
        $prefill = $request->validate([
            'item_id' => ['nullable', 'integer', 'min:1'],
            'request_id' => ['nullable', 'integer', 'min:1'],
            'search' => ['nullable', 'string', 'max:150'],
            'status' => ['nullable', Rule::in([
                'Pending', 'Pending Verification', 'For Correction', 'Under Review',
                'Approved', 'Ready for Pickup', 'Issued', 'Released', 'Rejected', 'Cancelled',
            ])],
        ]);
        $initialItemId = isset($prefill['item_id'])
            ? Item::whereKey($prefill['item_id'])->where('stock', '>', 0)->value('id') : null;

        $signatories = app(\App\Services\SystemSettingsService::class)->getIssuanceSignatories();
        $defaultApprovedBy = $signatories['approved_by_name'];
        $defaultApprovedByDesignation = $signatories['approved_by_designation'];
        $defaultIssuedBy = $signatories['issued_by_name'];
        $defaultIssuedByDesignation = $signatories['issued_by_position'];

        $isCoordinator = $request->user()->usesCoordinatorInventory();
        $requestProps = $isCoordinator
            ? $this->coordinatorRequestProps($request, $prefill)
            : [
                'requests' => SupplyRequest::with(['items.item.activeBatches', 'requester', 'reviewer', 'documentVerifier', 'issuance.items.allocations.inventoryBatch'])
                    ->when(! $request->user()->isSystemAdmin(), fn ($query) => $query->where('requested_by', $request->user()->id))
                    ->latest()->get(),
            ];

        return Inertia::render('Inventory/Requests/Index', [
            'readOnly' => $request->user()->isSystemAdmin(),
            'requiresSupportingDocument' => $request->user()->requiresSupportingDocument(),
            'inventoryScope' => $isCoordinator ? 'coordinator' : null,
            'initialItemId' => $initialItemId,
            'departmentAssignment' => $isCoordinator ? [
                'department' => $request->user()->department,
                'recipient' => $request->user()->officeHead?->name,
                'recipient_designation' => $request->user()->officeHead?->designation,
                'ready' => $this->hasDepartmentAssignment($request->user()),
            ] : null,
            ...$requestProps,
            'items' => Item::where('stock', '>', 0)->orderBy('name')->get(['id', 'name', 'sku', 'stock', 'unit_of_issue']),
            'divisions' => config('university.divisions', []),
            'defaultApprovedBy' => $defaultApprovedBy,
            'defaultApprovedByDesignation' => $defaultApprovedByDesignation,
            'defaultIssuedBy' => $defaultIssuedBy,
            'defaultIssuedByDesignation' => $defaultIssuedByDesignation,
        ]);
    }

    private function coordinatorRequestProps(Request $request, array $filters): array
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $status = (string) ($filters['status'] ?? '');
        $baseQuery = SupplyRequest::query()->where('requested_by', $request->user()->id);
        $requestSummary = (clone $baseQuery)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $query = (clone $baseQuery)->with($this->coordinatorRequestRelations());

        if ($status !== '') {
            $groupedStatuses = [
                'Pending' => ['Pending', 'Pending Verification', 'Under Review'],
                'Approved' => ['Approved', 'Ready for Pickup'],
                'Issued' => ['Issued', 'Released'],
            ];
            $query->whereIn('status', $groupedStatuses[$status] ?? [$status]);
        }

        if ($search !== '') {
            $pattern = '%'.mb_strtolower($search).'%';
            $query->where(function ($query) use ($search, $pattern) {
                if (ctype_digit($search)) {
                    $query->orWhereKey((int) $search);
                }
                $query->orWhereRaw('LOWER(COALESCE(ris_number, ?)) LIKE ?', ['', $pattern])
                    ->orWhereRaw('LOWER(COALESCE(recipient, ?)) LIKE ?', ['', $pattern])
                    ->orWhereRaw('LOWER(COALESCE(recipient_designation, ?)) LIKE ?', ['', $pattern])
                    ->orWhereRaw('LOWER(department) LIKE ?', [$pattern])
                    ->orWhereRaw('LOWER(purpose) LIKE ?', [$pattern])
                    ->orWhereHas('items.item', fn ($itemQuery) => $itemQuery
                        ->whereRaw('LOWER(items.name) LIKE ?', [$pattern])
                        ->orWhereRaw('LOWER(items.sku) LIKE ?', [$pattern]));
            });
        }

        $requests = $query->latest()->paginate(10)->withQueryString()
            ->through(fn (SupplyRequest $supplyRequest) => $this->serializeCoordinatorRequest($supplyRequest));

        $focusedRequest = null;
        if (! empty($filters['request_id'])) {
            $focused = (clone $baseQuery)->with($this->coordinatorRequestRelations())
                ->find($filters['request_id']);
            $focusedRequest = $focused ? $this->serializeCoordinatorRequest($focused) : null;
        }

        return [
            'requests' => $requests,
            'requestSummary' => $requestSummary,
            'requestFilters' => ['search' => $search, 'status' => $status],
            'focusedRequest' => $focusedRequest,
        ];
    }

    private function coordinatorRequestRelations(): array
    {
        return [
            'items:id,supply_request_id,item_id,quantity,approved_quantity',
            'items.item:id,name,sku,stock,unit_of_issue',
            'items.item.activeBatches:id,item_id,supplier_stock_no,quantity_remaining',
            'requester:id,name',
            'reviewer:id,name',
            'documentVerifier:id,name',
            'issuance:id,ris_number,recipient,recipient_designation,issued_by_name,issued_by_position,date_issued,fund_cluster',
            'issuance.items:id,issuance_id,item_id,quantity',
            'issuance.items.allocations:id,issuance_item_id,inventory_batch_id,quantity',
            'issuance.items.allocations.inventoryBatch:id,supplier_stock_no',
        ];
    }

    private function serializeCoordinatorRequest(SupplyRequest $request): array
    {
        return [
            'id' => $request->id,
            'requires_supporting_document' => (bool) $request->requires_supporting_document,
            'supporting_document_type' => $request->supporting_document_type,
            'supporting_document_name' => $request->supporting_document_name,
            'document_verified_at' => $request->document_verified_at?->toIso8601String(),
            'document_verification_remarks' => $request->document_verification_remarks,
            'requested_by' => $request->requested_by,
            'recipient' => $request->recipient,
            'recipient_designation' => $request->recipient_designation,
            'fund_cluster' => $request->fund_cluster,
            'date_requested' => $request->date_requested?->toDateString(),
            'status' => $request->status,
            'department' => $request->department,
            'purpose' => $request->purpose,
            'ris_number' => $request->ris_number,
            'review_remarks' => $request->review_remarks,
            'created_at' => $request->created_at?->toIso8601String(),
            'reviewed_at' => $request->reviewed_at?->toIso8601String(),
            'issuance_id' => $request->issuance_id,
            'requester' => $request->requester ? ['id' => $request->requester->id, 'name' => $request->requester->name] : null,
            'reviewer' => $request->reviewer ? ['id' => $request->reviewer->id, 'name' => $request->reviewer->name] : null,
            'document_verifier' => $request->documentVerifier ? ['name' => $request->documentVerifier->name] : null,
            'items' => $request->items->map(function ($line) {
                $item = $line->item;
                $stockNo = $item?->activeBatches?->first(fn ($batch) => filled($batch->supplier_stock_no))?->supplier_stock_no;

                return [
                    'id' => $line->id,
                    'item_id' => $line->item_id,
                    'quantity' => (int) $line->quantity,
                    'approved_quantity' => $line->approved_quantity === null ? null : (int) $line->approved_quantity,
                    'item' => $item ? [
                        'id' => $item->id,
                        'name' => $item->name,
                        'sku' => $item->sku,
                        'stock' => (int) $item->stock,
                        'unit_of_issue' => $item->unit_of_issue,
                        'stock_no' => $stockNo,
                        'supplier_stock_no' => $stockNo,
                    ] : null,
                ];
            })->values(),
            'issuance' => $request->issuance ? [
                'id' => $request->issuance->id,
                'ris_number' => $request->issuance->ris_number,
                'recipient' => $request->issuance->recipient,
                'recipient_designation' => $request->issuance->recipient_designation,
                'issued_by_name' => $request->issuance->issued_by_name,
                'issued_by_position' => $request->issuance->issued_by_position,
                'date_issued' => $request->issuance->date_issued?->toDateString(),
                'fund_cluster' => $request->issuance->fund_cluster,
                'items' => $request->issuance->items->map(fn ($issuanceItem) => [
                    'id' => $issuanceItem->id,
                    'item_id' => $issuanceItem->item_id,
                    'quantity' => (int) $issuanceItem->quantity,
                    'allocations' => $issuanceItem->allocations->map(fn ($allocation) => [
                        'batch_id' => $allocation->inventory_batch_id,
                        'supplier_stock_no' => $allocation->inventoryBatch?->supplier_stock_no,
                        'quantity' => (int) $allocation->quantity,
                    ])->values(),
                ])->values(),
            ] : null,
        ];
    }

    public function risPdf(Request $request, SupplyRequest $supplyRequest)
    {
        abort_unless(
            $request->user()->id === $supplyRequest->requested_by
                || $this->canReviewRequests($request->user()),
            403
        );
        abort_unless(in_array($supplyRequest->status, ['Approved', 'Issued', 'Ready for Pickup', 'Released'], true), 404);

        $supplyRequest->load(['items.item.activeBatches', 'requester', 'reviewer', 'documentVerifier', 'issuance.items.allocations.inventoryBatch']);
        $issued = in_array($supplyRequest->status, ['Issued', 'Released'], true);
        $issuance = $supplyRequest->issuance;
        $printDate = now('Asia/Manila')->toDateString();
        $signatories = app(\App\Services\SystemSettingsService::class)->getIssuanceSignatories();

        $ris = [
            'entity_name' => SystemSetting::get('institution.name', 'University of Camarines Norte'),
            'fund_cluster' => $supplyRequest->fund_cluster ?: ($issuance?->fund_cluster ?: '01 - Regular Agency Fund'),
            'division' => $supplyRequest->department,
            'office' => $supplyRequest->department,
            'responsibility_center_code' => SystemSetting::get('institution_responsibility_center_code', ''),
            'ris_no' => $supplyRequest->ris_number ?? '',
            'purpose' => $supplyRequest->purpose,
            'requested_by_name' => $supplyRequest->recipient ?: ($supplyRequest->requester?->name),
            'requested_by_designation' => trim($supplyRequest->recipient_designation ?? '') ?: (trim($issuance?->recipient_designation ?? '') ?: 'Requesting Personnel'),
            'requested_by_date' => $supplyRequest->date_requested ? $supplyRequest->date_requested->format('Y-m-d') : ($supplyRequest->created_at ? $supplyRequest->created_at->format('Y-m-d') : date('Y-m-d')),
            'approved_by_name' => $signatories['approved_by_name'],
            'approved_by_designation' => $signatories['approved_by_designation'],
            'approved_by_date' => $supplyRequest->reviewed_at?->copy()->timezone('Asia/Manila')->format('Y-m-d'),
            'issued_by_name' => $issuance?->issued_by_name ?: $signatories['issued_by_name'],
            'issued_by_designation' => $issuance?->issued_by_position ?: $signatories['issued_by_position'],
            // Printable pre-release dates do not create a stock release.
            'issued_by_date' => $issued ? $issuance?->date_issued?->format('Y-m-d') : $printDate,
            'received_by_name' => $supplyRequest->recipient ?: ($supplyRequest->requester?->name),
            'received_by_designation' => trim($supplyRequest->recipient_designation ?? '') ?: (trim($issuance?->recipient_designation ?? '') ?: 'Requesting Personnel'),
            'received_by_date' => $issued ? $issuance?->date_issued?->format('Y-m-d') : $printDate,
        ];
        $items = $supplyRequest->items->filter(fn ($line) => $line->approved_quantity > 0)
            ->map(function ($line) use ($issued, $issuance) {
                $stockNo = null;
                if ($issuance && $issuance->relationLoaded('items')) {
                    $issuanceItem = $issuance->items->firstWhere('item_id', $line->item_id);
                    if ($issuanceItem && $issuanceItem->relationLoaded('allocations')) {
                        $stockNumbers = $issuanceItem->allocations
                            ->map(fn ($al) => $al->inventoryBatch?->supplier_stock_no)
                            ->filter()
                            ->unique()
                            ->values();
                        if ($stockNumbers->isNotEmpty()) {
                            $stockNo = $stockNumbers->implode(', ');
                        }
                    }
                }
                if (!$stockNo) {
                    $stockNo = $line->item?->stock_no ?: ($line->item?->supplier_stock_no ?: null);
                }

                return [
                    'stock_no' => $stockNo ?: '-',
                    'unit' => $line->item?->unit_of_issue ?: 'pcs',
                    'description' => $line->item?->name ?: 'Unavailable item',
                    'quantity' => $line->approved_quantity,
                    'stock_available' => true,
                    'issue_quantity' => $issued ? $line->approved_quantity : '',
                    'remarks' => '',
                ];
            })->values()->all();
        $fileName = preg_replace('/[^A-Za-z0-9_-]/', '_', $supplyRequest->ris_number ?: "RIS-{$supplyRequest->id}") . '.pdf';
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
        $this->authorizeRequestAction($request);
        if ($request->user()->usesCoordinatorInventory() && ! $request->user()->requiresSupportingDocument()) {
            if (!$this->hasDepartmentAssignment($request->user())) {
                throw ValidationException::withMessages(['department' => 'Ask an administrator to assign your Delivery Unit and an active office head with a designation in Staff Accounts before submitting a request.']);
            }
            $request->merge([
                'department' => $request->user()->department,
                'recipient' => $request->user()->officeHead->name,
                'recipient_designation' => $request->user()->officeHead->designation,
            ]);
        } elseif ($request->user()->requiresSupportingDocument()) {
            if (trim($request->user()->department ?? '') !== '') {
                $request->merge(['department' => $request->user()->department]);
            }
            $request->merge(['recipient' => $request->user()->name]);
        }
        $requiresDocument = $request->user()->requiresSupportingDocument();
        $data = $request->validate([
            ...SupportingDocumentService::rules($requiresDocument),
            'recipient' => ['nullable', 'string', 'max:255'],
            'recipient_designation' => ['nullable', 'string', 'max:255'],
            'fund_cluster' => ['nullable', 'string', 'max:255'],
            'date_requested' => ['nullable', 'date'],
            'department' => ['required', 'string', 'max:255'],
            'purpose' => ['required', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.item_id' => ['required', 'integer', 'distinct', 'exists:items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
        ]);

        SupportingDocumentService::save($request, $requiresDocument, null, function (array $documentFields) use ($data, $request) {
            $this->validateRequestStock($data['items']);
            $risNumber = SupplyRequestService::generateOfficialRisNumber($data['date_requested'] ?? null);
            $supplyRequest = SupplyRequest::create([
                'ris_number' => $risNumber,
                'requested_by' => $request->user()->id,
                'recipient' => $data['recipient'] ?? $request->user()->name,
                'recipient_designation' => $data['recipient_designation'] ?? null,
                'fund_cluster' => $data['fund_cluster'] ?? '01',
                'date_requested' => $data['date_requested'] ?? now()->toDateString(),
                'department' => $data['department'],
                'purpose' => $data['purpose'],
                'status' => 'Pending',
                ...$documentFields,
            ]);
            $supplyRequest->items()->createMany($data['items']);
            if ($documentFields) SupplyRequestService::audit($supplyRequest, $request->user()->id, 'Uploaded Supporting Document');
            SupplyRequestService::audit($supplyRequest, $request->user()->id, 'Submitted Supply Request');
            $approverIds = User::query()->where('is_active', true)->get()
                ->filter(fn (User $user) => $this->canReviewRequests($user))->pluck('id');
            foreach ($approverIds as $approverId) {
                SupplyRequestAlert::create([
                    'user_id' => $approverId,
                    'supply_request_id' => $supplyRequest->id,
                ]);
            }
        });
        return redirect()->route('inventory.requests.index')->with('success', 'Request submitted to the Property Custodian.');
    }

    public function cancel(Request $request, SupplyRequest $supplyRequest)
    {
        $this->authorizeRequestAction($request);
        abort_unless($request->user()->id === $supplyRequest->requested_by || $request->user()->hasAnyRole(['System Admin', 'System Administrator']), 403);
        DB::transaction(function () use ($supplyRequest, $request) {
            $locked = SupplyRequest::whereKey($supplyRequest->id)->lockForUpdate()->firstOrFail();
            if (!in_array($locked->status, ['Pending', 'Approved', 'Pending Verification', 'For Correction', 'Under Review', 'Ready for Pickup'], true)) {
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
        $this->authorizeRequestAction($request);
        // Keep the original unit and signatory even after a transfer or change of head.
        if ($request->user()->usesCoordinatorInventory() && ! $request->user()->requiresSupportingDocument()) {
            $request->merge($supplyRequest->only(['department', 'recipient', 'recipient_designation']));
        } elseif ($request->user()->requiresSupportingDocument()) {
            $request->merge(['recipient' => $request->user()->name]);
        }
        $requiresDocument = $supplyRequest->requires_supporting_document || $request->user()->requiresSupportingDocument();
        $data = $request->validate([
            ...SupportingDocumentService::rules($requiresDocument, $supplyRequest),
            'recipient' => ['nullable', 'string', 'max:255'],
            'recipient_designation' => ['nullable', 'string', 'max:255'],
            'fund_cluster' => ['nullable', 'string', 'max:255'],
            'date_requested' => ['nullable', 'date'],
            'department' => ['required', 'string', 'max:255'],
            'purpose' => ['required', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.item_id' => ['required', 'integer', 'distinct', 'exists:items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
        ]);
        SupportingDocumentService::save($request, $requiresDocument, $supplyRequest, function (array $documentFields) use ($supplyRequest, $data, $request) {
            $locked = SupplyRequest::whereKey($supplyRequest->id)->lockForUpdate()->firstOrFail();
            if (!in_array($locked->status, ['Pending', 'Pending Verification', 'For Correction'], true)) {
                throw ValidationException::withMessages(['request' => 'Only pending requests can be edited.']);
            }
            $this->validateRequestStock($data['items']);
            $locked->update([
                'recipient' => $data['recipient'] ?? $locked->recipient ?? $request->user()->name,
                'recipient_designation' => $data['recipient_designation'] ?? $locked->recipient_designation,
                'fund_cluster' => $data['fund_cluster'] ?? $locked->fund_cluster ?? '01',
                'date_requested' => $data['date_requested'] ?? $locked->date_requested ?? now()->toDateString(),
                'department' => $data['department'],
                'purpose' => $data['purpose'],
                ...$documentFields,
            ]);
            $locked->items()->delete();
            $locked->items()->createMany($data['items']);
            SupplyRequestService::audit($locked, $request->user()->id, $documentFields ? 'Resubmitted Supporting Document' : 'Updated Supply Request');
            if ($documentFields) {
                foreach (User::where('is_active', true)->get()->filter(fn ($user) => PermissionResolver::hasPermission($user, 'route:inventory.requests.verify-document')) as $verifier) {
                    SupplyRequestAlert::updateOrCreate(['user_id' => $verifier->id, 'supply_request_id' => $locked->id], ['read_at' => null]);
                }
            }
        });
        return redirect()->route('inventory.requests.index')->with('success', 'Request updated.');
    }

    private function hasDepartmentAssignment(User $user): bool
    {
        return trim($user->department ?? '') !== ''
            && $user->officeHead?->is_active
            && trim($user->officeHead->name ?? '') !== ''
            && trim($user->officeHead->designation ?? '') !== '';
    }

    public function approve(Request $request, SupplyRequest $supplyRequest)
    {
        $this->authorizeRequestAction($request);
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
        $this->authorizeRequestAction($request);
        $data = $request->validate(['remarks' => ['required', 'string', 'max:2000']]);
        DB::transaction(function () use ($supplyRequest, $request, $data) {
            $locked = SupplyRequest::whereKey($supplyRequest->id)->lockForUpdate()->firstOrFail();
            if (!in_array($locked->status, ['Pending', 'Under Review'], true)) {
                throw ValidationException::withMessages(['request' => 'Only pending requests can be rejected.']);
            }
            $locked->update(['status' => 'Rejected', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now(), 'review_remarks' => $data['remarks']]);
            SupplyRequestService::audit($locked, $request->user()->id, 'Rejected Supply Request');
        });
        return back()->with('success', 'Request rejected.');
    }

    public function document(Request $request, SupplyRequest $supplyRequest)
    {
        abort_unless(($request->user()->id === $supplyRequest->requested_by
            && PermissionResolver::hasPermission($request->user(), 'route:inventory.requests.index'))
            || (!$request->user()->usesCoordinatorInventory() && $this->canReviewRequests($request->user())), 403);
        abort_unless($supplyRequest->supporting_document_path && Storage::disk('local')->exists($supplyRequest->supporting_document_path), 404);
        SupplyRequestService::audit($supplyRequest, $request->user()->id, 'Viewed Supporting Document');
        $headers = ['Content-Type' => $supplyRequest->supporting_document_mime, 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store'];
        return $request->boolean('inline')
            ? Storage::disk('local')->response($supplyRequest->supporting_document_path, $supplyRequest->supporting_document_name, $headers, 'inline')
            : Storage::disk('local')->download($supplyRequest->supporting_document_path, $supplyRequest->supporting_document_name, $headers);
    }

    public function verifyDocument(Request $request, SupplyRequest $supplyRequest)
    {
        $this->authorizeRequestAction($request);
        abort_if($request->user()->id === $supplyRequest->requested_by, 403);
        $data = $request->validate([
            'decision' => ['required', 'in:verified,correction'],
            'remarks' => ['required_if:decision,correction', 'nullable', 'string', 'max:2000'],
        ]);
        DB::transaction(function () use ($request, $supplyRequest, $data) {
            $locked = SupplyRequest::whereKey($supplyRequest->id)->lockForUpdate()->firstOrFail();
            if (!$locked->requires_supporting_document || $locked->status !== 'Pending Verification'
                || !$locked->supporting_document_path || !Storage::disk('local')->exists($locked->supporting_document_path)) {
                throw ValidationException::withMessages(['request' => 'This request is not awaiting document verification.']);
            }
            $locked->update([
                'status' => $data['decision'] === 'verified' ? 'Under Review' : 'For Correction',
                'document_verified_by' => $request->user()->id,
                'document_verified_at' => now(),
                'document_verification_remarks' => $data['remarks'] ?? null,
            ]);
            SupplyRequestService::audit($locked, $request->user()->id, $data['decision'] === 'verified' ? 'Verified Supporting Document' : 'Returned Supporting Document for Correction');
            SupplyRequestAlert::updateOrCreate(['user_id' => $locked->requested_by, 'supply_request_id' => $locked->id], ['read_at' => null]);
        });
        return back()->with('success', 'Document review recorded.');
    }

    public function ready(Request $request, SupplyRequest $supplyRequest)
    {
        $this->authorizeRequestAction($request);
        DB::transaction(function () use ($request, $supplyRequest) {
            $locked = SupplyRequest::whereKey($supplyRequest->id)->lockForUpdate()->firstOrFail();
            if (!$locked->requires_supporting_document || $locked->status !== 'Approved' || !$locked->document_verified_at) {
                throw ValidationException::withMessages(['request' => 'Only verified, approved requests can be prepared for pickup.']);
            }
            $locked->update(['status' => 'Ready for Pickup']);
            SupplyRequestService::audit($locked, $request->user()->id, 'Prepared Supply Request for Pickup');
            SupplyRequestAlert::updateOrCreate(['user_id' => $locked->requested_by, 'supply_request_id' => $locked->id], ['read_at' => null]);
        });
        return back()->with('success', 'Requester notified that supplies are ready for pickup.');
    }

    public function release(Request $request, SupplyRequest $supplyRequest)
    {
        $this->authorizeRequestAction($request);
        $request->validate(['signed_ris_presented' => ['required', 'accepted']]);
        $this->service->release($supplyRequest, $request->user()->id);
        return back()->with('success', 'Items released and inventory updated.');
    }
}
