# Stock deduction at approval and weekly item quotas

Audit date: 19 November 2026. Scope: local SupplySync source in this workspace.
Status: implemented and deployed after user authorization on 19 November 2026. The findings below describe the pre-implementation audit and the original plan. See [implementation and rollout notes](stock-approval-weekly-quota-implementation.md) for the final design and [the deployment record](stock-approval-weekly-quota-deployment-2026-11-19.md) for verified production migration, conversion, and configuration.

## Requested behavior and confirmed policy

- Deduct central available stock automatically when a request is approved.
- Refresh the stock view for Authorized Personnel, Supply Coordinators, and Inventory Staff.
- Enforce a separate quantity limit for each item, per user, per calendar week.
- Handle simultaneous submissions, approvals, revisions, cancellations, and releases safely.
- The user selected calendar weeks and different limits by item. Actual item quantities have not been supplied; the implementation should provide configuration rather than invent limits.

Proposed week definition: Monday 00:00 through the following Monday 00:00, using the configured institutional timezone. The application defaults to Asia/Manila; the client timezone is Asia/Singapore, which currently has the same UTC offset. Store period boundaries as UTC instants, using an explicit timezone and half-open intervals. This Monday boundary is a proposed default, not a separately confirmed preference.

## Audit findings

| Area | Verified current behavior | Required change |
| --- | --- | --- |
| Approval | `SupplyRequestService::approve()` records quantities and changes status to Approved. It does not decrement `items.stock` or allocate FIFO batches. | Deduct stock and persist reversible batch allocations in the approval transaction. |
| Available stock | The request form and central catalog already calculate stock minus Approved/Ready for Pickup reservations minus the configured minimum stock threshold. Both reservation statuses are included in the current source. | Stop subtracting these quantities again once approval has already deducted stock. Share one calculation across all views and validators. |
| Request limit | Submission, editing, and approval already enforce the current stock-based maximum. Duplicate item rows are rejected. There is no weekly per-user item quota. | Add quota policy, period accounting, remaining allowance, and server validation. |
| Staff approval view | The queue displays raw item stock; its warning compares the entered quantity with raw stock. The numeric maximum is the requested quantity. | Supply and use the authoritative maximum, including remaining quota and stock protection. Account for the existing allocation when revising an approval. |
| Simultaneous approvals | Approval locks the request and affected item rows within a transaction, with items ordered by ID. This is an existing safeguard. | Extend locking to quota accounts and allocations, normalize ordering across affected write paths, and verify with PostgreSQL concurrency tests. |
| Simultaneous submissions | Submission validates stock with row locks inside `SupportingDocumentService::save()`'s transaction, but pending requests do not reserve stock or any quota. | Atomically claim weekly quota at submission. Submission still does not deduct stock; approval rechecks actual availability. |
| Release | `release()` calls `InventoryIssuanceService::issue()`, which allocates FIFO batches and deducts stock. | Use the allocation saved at approval. Release must not deduct available stock again. |
| Cancellation | Cancellation only changes status. That currently works because reservations are calculated from status. | Restore the deducted quantities to their original batches and release the request's quota claim exactly once. |
| Approval revision | An Approved request can be reviewed again; validation excludes that request's existing reservation. | Apply only the quantity difference and retain a revision history. Repeated approval of the same quantities must have zero additional stock effect. |
| Refresh | Catalog stock is manually refreshed. The alert component polls every 15 seconds, but it refreshes the issuance queue only when pending count changes. The listener reloads only `supplyRequests`. | Add stock/quota version polling independent of alert counts, with partial refreshes of the affected data. |
| Batch balances | `InventoryBalanceService` derives cached item stock and value from remaining batch quantities. | Update item and batch balances together. A direct item decrement alone would be overwritten by balance synchronization. |
| Reports | RPCI reads batch remaining quantities. Stock Card reconstructs opening balance from current stock, receipts, and issued quantities. | Account separately for approved supplies awaiting pickup so reports do not treat physical handover as having occurred at approval. |
| Other stock writes | Direct issuance, receiving adjustments, voids, and item edits use stock/reservation protections. | Update those protections to the new allocation model. Prevent edits or voids from invalidating allocated batches. |
| Role coverage | Authorized Personnel and Supply Coordinators share requester services. Inventory Staff are document processors by default; approval/release depend on explicit permissions. | Apply the same backend stock/quota rules to each permitted action. A staff member approving another user's request must use the original requester's quota. |
| Tests | Existing tests intentionally assert unchanged stock after approval, with deduction at release. Request-limit data providers cover the two requester roles. | Rewrite lifecycle expectations and add permission-appropriate Inventory Staff coverage plus concurrent tests. |

### Source anchors

- `Modules/Inventory/app/Services/SupplyRequestService.php:18`: reservations and stock-based limits; `:72`: approval; `:118`: release.
- `Modules/Inventory/app/Http/Controllers/SupplyRequestController.php:42`: stock validation; `:76`: requestable item list; `:342`: submission; `:404`: cancellation; `:419`: editing.
- `app/Http/Controllers/CoordinatorInventoryController.php:27`: central catalog availability.
- `Modules/Inventory/app/Services/InventoryIssuanceService.php:35`: transactional issuance and FIFO stock deduction.
- `Modules/Inventory/app/Services/InventoryBalanceService.php:37`: balance synchronization.
- `Modules/Inventory/app/Services/InventoryCostingService.php:27`: FIFO allocation.
- `Modules/Inventory/app/Services/InventoryReceivingService.php:209`: receiving edits; `:333`: receiving voids.
- `resources/js/Pages/Inventory/Requests/components/RequestFormModal.tsx:43`: request quantity maximum; `:536`: stock display.
- `resources/js/Pages/Inventory/Issuance/components/SupplyRequestQueue.tsx:533`: raw-stock warning; `:582`: approval input maximum.
- `resources/js/Components/Navigation/SupplyRequestAlerts.tsx:46`: count-triggered refresh; `:67`: polling.
- `resources/js/Pages/Inventory/Issuance/Index.tsx:119`: queue partial reload.
- `app/Services/Compliance/ComplianceReportDataService.php:1193`: RPCI; `:1452`: Stock Card; `:1645`: opening-balance reconstruction.
- `app/Models/User.php:145`: requester inventory scope; `:150`: supporting-document capability.

## Recommended lifecycle

Keep physical pickup and the signed RIS separate from the approval stock deduction.

| Action | Central available stock | Weekly quota | Requester's unit inventory |
| --- | --- | --- | --- |
| Submit | No deduction; validate current stock | Hold the requested quantity | No credit |
| Edit / correct | Revalidate current stock | Apply only the change in the held quantity | No credit |
| Verify document | No deduction | Keep the existing hold | No credit |
| Approve | Deduct the approved quantity and allocate its FIFO batches | Replace the requested hold with the approved quantity; free the unapproved remainder | No credit |
| Revise approval | Deduct an increase or restore a decrease | Adjust the same period's claim by the difference | No credit |
| Ready for Pickup | No further deduction | Keep the approved claim | No credit |
| Release | No further available-stock deduction; finalize the saved allocation | Keep the approved usage; do not count release again | Credit once |
| Reject / cancel before approval | No stock restoration needed | Release the held claim | No credit |
| Cancel after approval / readiness | Restore the allocated quantities once | Release the approved claim | No credit |

For pending requests, quota holds prevent a user from splitting a weekly allowance across multiple requests. They do not guarantee central stock. Different users can submit while stock is available; the first successfully committed approval gets that stock. The other approver receives an updated maximum if stock has changed. There is no promised first-submitted priority queue.

Use the server-recorded original submission time to select the quota week. Changing Date Requested, resubmitting a correction, approving, releasing, or switching roles must not move a claim to another week. Pending requests that cross a week boundary retain their original period claim. Released usage remains in its original period. Cancellation restores allowance only in that original period, not in the current week.

## Implementation sequence

### 1. Add quota configuration and durable lifecycle records

- Add an item-specific weekly quantity setting with validation in the item's unit of issue. Authorized item-policy maintainers can configure it; requesters can view but not edit it.
- Display a clear unconfigured state for existing items. Do not silently invent numeric defaults or activate enforcement before required item limits have been configured. Historical usage can exceed a newly configured cap; remaining allowance must then display zero rather than altering historical requests.
- Add a weekly quota account uniquely keyed by user, item, and period start. Record the period end, timezone, pending claims, committed usage, and policy revision needed for auditing.
- Add durable per-request item claims and lifecycle events so edits, approval revisions, cancellation, and release are idempotent and traceable. Link claims to the system submitting account, not the office-head name or approver.
- Add request approval batch allocations linked to each request item, original batch, quantity, FIFO cost snapshot, and lifecycle state. Preserve released/restored allocation history.
- Add a submission idempotency key scoped to the submitting user, protected by a database unique constraint, to avoid duplicate requests after double clicks, network retries, or simultaneous tabs.

### 2. Centralize stock and quota calculations

After conversion to approval deduction:

`stock allowance = max(0, central available stock - minimum stock)`

`weekly allowance = max(0, item weekly limit - other pending claims - committed usage)`

`maximum new request = min(stock allowance, weekly allowance)`

For edits and approval revisions, exclude the same request's existing quota claim. For an increased approval, include the existing allocated quantity when calculating what can be retained/reallocated; only the increase needs additional free stock. Also enforce approved quantity <= requested quantity.

Apply the same service to submission, editing, staff review, catalog data, item stock views, and approval. Revalidate at write time regardless of frontend values or the optional non-strict stock setting. Quotas and requisition safety limits must remain enforced.

### 3. Move stock allocation into approval

- Lock the request, quota accounts, item rows, and eligible batches in a documented consistent order.
- Verify status and supporting-document prerequisites, then recheck all quantities against live stock and quota.
- Allocate approved quantities through FIFO, save approval allocation records, and decrement batch remaining balances and cached item stock together.
- Update quota, request status, review metadata, and audit events in the same transaction. Commit every line together or roll back every line.
- Keep the signed RIS and pickup requirements. Avoid creating an Issued record or crediting unit inventory at approval.
- Restore allocations on cancellation. Apply delta-based revisions before readiness; repeated identical approvals must not deduct again. Ready for Pickup remains closed to ordinary quantity revision unless a dedicated workflow is later authorized.

### 4. Refactor release and other stock operations

- Add an explicit request-release path that transfers saved approval allocations into issuance records without allocating or deducting a second time. Avoid a generic client-supplied flag that bypasses stock deduction.
- Complete release, issuance details, cost snapshots, quota state, and unit inventory receipt atomically and exactly once.
- Update direct issuance and receiving/edit/void safeguards to use the new stock model. Direct issuance must consume only free stock; it must not consume an approval's allocation or bypass an existing request's release process.
- Direct issuance currently identifies the recipient by free text, so it cannot reliably enforce a per-user quota. For issuance to a covered user, require a linked request or a validated recipient user ID and apply the same quota accounting. Do not guess identity from a name or charge the issuing Inventory Staff member for someone else's supplies.
- Preserve outstanding approval allocations when editing or voiding their source receipts. Reject changes that would invalidate already committed or released quantities.
- Trigger stock status updates and existing low-stock notifications at the approval stock change, after successful commit.

### 5. Refresh all three role views

- Add a permission-scoped stock/quota snapshot or version endpoint independent of request alert counts.
- Reuse the existing application's polling approach: refresh visible stock views approximately every 5 seconds, refresh on focus/visibility return, and refresh immediately after the current user's successful mutation. Pause background polling and avoid overlapping refreshes.
- Polling gives bounded freshness, not instantaneous updates across users. State that interval in acceptance criteria. A later push transport can improve it without changing the stock rules.
- Update catalog, request form, staff approval queue, and relevant central inventory cards with the same available-stock value. Display each item's weekly limit, remaining allowance, period end, and effective maximum.
- Refresh open forms without discarding purpose, selected items, entered quantities, or review notes. If stock/quota drops below an entered quantity, show the new limit and block submission rather than silently changing the user's quantity.
- Clamp staff quantity helpers and input limits to the server-provided maximum. Refresh on stale-stock/quota conflicts and explain the actual item and remaining quantity.
- Keep owner scoping for quota responses. Inventory Staff see the original requester's allowance only where review permissions allow it. Do not add approval/release privileges as part of this change.

### 6. Reconcile reports and migrate existing approvals

- Define central available stock as the unallocated balance. Track approved stock awaiting pickup separately; it is physically still in SPMO custody.
- Reconcile physical/reportable central quantity as free batch balance plus outstanding approval allocations. Show availability and pending pickup separately where useful. Final issuance reports and requester unit stock still follow actual release.
- Update RPCI, Stock Card, valuations, dashboards, and history calculations so approval deductions do not fabricate historical physical issues or reduce opening balances without explanation. Include allocation timing in historical reconciliation.
- Add schema first, then run a preflight report of existing Approved/Ready for Pickup requests, their outstanding quantities, and available batches. Convert each outstanding approval to an allocation and deduct once; leave Released/Issued records unchanged.
- Backfill active weekly claims from server submission timestamps and existing quantities, including relevant released usage in the active week. Preserve original periods and identities.
- Make conversion rerunnable using allocation markers and unique constraints. Fail with an actionable reconciliation report if stock/batches cannot cover existing approvals; do not manufacture stock or partially activate the new calculations.
- Switch readers and writers together after conversion. Restore recorded allocations before any rollback to the former reservation model. Migration dry runs and rollback tests are required before rollout.

## Concurrency design

- Use database transactions and row locks for request mutations, quota accounts, affected items, and allocations. Safely insert missing quota accounts with unique-key conflict handling, then lock the persisted account.
- Define a consistent lock order across submission, approval, revision, cancellation, release, receiving changes, and covered direct issuance; current code does not establish a single global order across all these paths.
- Use conditional state/version checks to reject stale staff changes and repeated terminal actions. Treat an identical retry as the same operation where possible.
- Use bounded retries for actual deadlocks or serialization failures, with post-commit notifications. Do not retry an insufficient-stock/quota validation failure as if it were a transient database error.
- Recheck stock and quota after acquiring locks. Never rely on the quantity shown on another user's browser.

## Verification and acceptance criteria

Audit baseline executed successfully:

- `php vendor/bin/phpunit --filter 'SupplyRequestMinimumStockTest|CentralSupplyCatalogTest|AuthorizedPersonnelWorkflowTest|SupplyRequestWorkflowTest|InventoryPolicySettingsTest' --no-progress`
  - Result: 55 tests, 1,145 assertions passed.
- `node tests/Frontend/request-stock.test.mjs`
  - Result: existing request form, role details, minimum stock, reservation, and threshold checks passed. This test required approved execution outside the sandbox to start its esbuild helper.

These results verify current behavior. They do not validate the proposed implementation. The backend suite uses SQLite in memory, which cannot establish PostgreSQL row-lock behavior. No live database balances or deployment state were audited.

Implementation must demonstrate:

1. Stock and FIFO balances deduct once at approval; readiness and release do not deduct again.
2. Lower/higher approval revisions and repeated identical approvals have the correct net effect; cancellations restore once.
3. Each item has its own per-user weekly cap, with correct units, week boundaries, timezone, ownership, and original-period accounting.
4. Multiple pending requests, split quantities, changed request dates, duplicate rows, corrections, roles, concurrent tabs, and direct issuance cannot bypass the quota.
5. Submitted quota holds adjust correctly on editing, partial approval, rejection, and cancellation. Released usage remains counted.
6. Simultaneous approvals cannot oversell; simultaneous submissions by one user cannot exceed the quota; different users have separate quotas but share central stock.
7. Genuine PostgreSQL tests cover overlapping approvals, reversed multi-item ordering, approval-versus-cancellation, revision-versus-release, receiving-versus-approval, and duplicate retries using independent database connections/processes.
8. Stale open forms receive new quantities without losing edits; all three role views refresh within the selected polling interval while preserving permissions.
9. Supporting-document verification, signed RIS, costing, unit receipts, low-stock notifications, RPCI, Stock Card, and migration reconciliation remain correct.

Illustrative example only: with 100 units in central stock, a protected minimum of 10, an item weekly cap of 20, and 5 units already claimed by a user, that user's maximum new request is 15. Approving 15 changes central available stock to 85. Release leaves it at 85 and credits 15 units to the requester. Cancelling before release restores central available stock to 100 and releases that original week's 15-unit claim.

## Outstanding configuration

- The user supplied a limit of 10 in each item's own unit per user, applied to all 23 listed records during deployment. New items require configuration.
- Monday-based weeks and a five-second visible-page polling interval are proposed implementation defaults.
- Implementation and deployment are complete. Migration, existing approval conversion, and the supplied item-limit configuration were verified in production; see the deployment record.
