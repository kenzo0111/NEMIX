# Approval stock deduction and weekly item quotas

Implemented locally on 19 November 2026 for Authorized Personnel, Supply Coordinators, and Inventory Staff. Existing action permissions and ownership restrictions still apply. No deployment or application database migration/conversion has been performed.

## Procedure and stock effects

1. The requester submits items within their stock and weekly allowance. Pending requests hold quota but do not deduct central stock. Authorized Personnel must provide their required supporting document.
2. Inventory Staff with document-review permission verify the supporting document where required. The request then proceeds to inventory review.
3. An authorized approver selects quantities, each at most the requested quantity, available stock above the protected minimum, and the original requester's remaining allowance. Approval deducts FIFO batches and cached item stock together in one transaction. Partial approval frees the unused part of the pending quota hold.
4. Approval revisions restore/reallocate the prior allocation. Repeating identical approval quantities does not deduct again. Cancelling before release restores the original batches once and frees the original week's quota.
5. A verified request requiring a document is marked Ready for Pickup. The requester presents the signed RIS. An authorized issuer confirms handover and releases all approved lines together.
6. Release uses saved batch quantities and cost snapshots, creates the issuance, and credits the requester's unit inventory where applicable. It does not deduct central stock a second time. Released usage remains counted against its original week.

The original requester consumes the quota when staff approve on their behalf. These changes do not give Inventory Staff approval or release permissions automatically.

## Item limits and calendar weeks

Use the existing inventory item create/edit form's **Weekly limit per user** field to configure each item's permitted quantity in its unit of issue. Values are integers from 0 to 1,000,000.

- A blank limit is unconfigured and blocks new requests with a configuration message. No arbitrary numeric caps were assigned to existing items.
- A zero limit blocks requests for that item.
- Each user has a separate allowance for each item. Multiple pending requests share it, so splitting a quantity cannot evade the cap.
- The period starts Monday at 00:00 in `config('app.timezone')`, which defaults to `Asia/Manila`. A fresh period is selected automatically; no scheduled reset job is needed.
- The server records the original week on submission. Editing Date Requested, correction, approval, release, or cancellation does not change that week. Cancelling an older request frees only its original week's quota.
- Lowering a configured limit can leave older usage above the cap. Remaining allowance displays zero; historical requests are preserved.

The final implementation uses the existing user row as the quota mutex and aggregates persisted request lines for usage. It does not require a separate weekly-account table or a reset task. Allocation rows retain the history of restored and released FIFO quantities.

## Simultaneous requests and refreshed views

Transactions lock the requester, request, sorted item rows, and affected batches. Submissions for one user serialize quota checks; approvals for different users serialize shared stock checks. Approval, cancellation, revision, and release recheck state after locking. Stock conflicts fail without partial item deductions. Deadlock retries are bounded on the main requisition transaction paths.

Pending requests do not reserve stock. The first successful approval takes the available stock; another approver must reduce quantities if availability changes. Submission UUIDs prevent duplicate requests on retries. This does not promise first-submitted priority.

Visible Requests, Central Supply Catalog, All Items, and Issuance pages refresh stock and quota values approximately every five seconds and on focus/visibility return. Background polling pauses while hidden or another navigation is active. Refreshes preserve entered form fields; stale excessive quantities are blocked with the current limit.

Direct issuance checks known registered requester names, assigned office-head names, and a supplied recipient user ID, and directs covered recipients into the requisition workflow. Other direct recipients retain their existing workflow. Free-text recipient identity is still an existing limitation; alternate unrecognized names cannot establish a registered user's identity. A mandatory recipient-account selector would be a separate identity-model change.

RPCI and Stock Card keep outstanding approval allocations in physical Supply Office custody until actual release. Available stock has already been deducted, while physical custody includes allocated supplies awaiting pickup.

## Rollout

Use the normal deployment maintenance window and database backup procedure. Run these commands against the intended application database, after installing the new source:

```powershell
php artisan down
php artisan migrate --force
php artisan inventory:convert-approval-stock --dry-run
php artisan inventory:convert-approval-stock
npm run build
```

The conversion command allocates and deducts existing Approved/Ready for Pickup requests once. Released/Issued records remain untouched. Conversion is atomic and rerunnable. Its dry run rolls back all changes. Existing approvals are grandfathered against the current minimum-stock threshold because their quantities are already committed as reservations; conversion must still cover every approved quantity from real stock and batches. New approvals retain minimum-stock enforcement. If an item is missing or batches cannot cover approvals, reconcile the reported request/item and rerun; do not resume requests with unresolved conversion errors.

Before reopening requests, configure each requestable item's actual weekly cap through item editing during controlled administrative access. Blank item limits will block submissions immediately after migration. Confirm item caps and reconciled approvals, then run:

```powershell
php artisan up
```

Legacy approvals remain reservations until converted, so mixed records are understood by the new code. The explicit conversion is still required to bring all outstanding approvals into approval-time deduction.

Before rolling back to the prior reservation model, restore outstanding allocations while the new code is still installed:

```powershell
php artisan inventory:convert-approval-stock --restore --dry-run
php artisan inventory:convert-approval-stock --restore
```

The schema rollback refuses to remove allocation records while any allocation remains outstanding. Use the normal release rollback procedure to target this migration; avoid rolling back unrelated migrations blindly.

## Verification

- Focused PHP suite: **87 tests, 1,770 assertions passed**. Covers role workflows, minimum-stock protection, weekly caps, original-week accounting, increasing pending edits, revisions, cancellation, release, configuration, reports, and legacy conversion, including existing commitments below the current minimum stock.
- Real PostgreSQL concurrency harness: **7 checks passed** for overselling, split quota, approval versus cancellation, reversed multi-item approvals, revision versus release, duplicate submissions, and receiving adjustment versus approval.
- Frontend request-stock tests passed, including exhausted/unconfigured caps and editing without counting a request twice. Request-details and RIS-preview regression tests passed.
- TypeScript check and production frontend build passed. Vite reports the existing unresolved campus-image reference and large-chunk warnings.
- The broader inventory suite has existing failures: 30 failures and 5 errors were reproduced with the original source during the audit, mainly permissions and minimum-stock fixtures. It is not a fully green suite.

Focused verification:

```powershell
php vendor/bin/phpunit --filter 'ApprovalStockWeeklyQuotaTest|SupplyRequestMinimumStockTest|CentralSupplyCatalogTest|AuthorizedPersonnelWorkflowTest|SupplyRequestWorkflowTest|InventoryPolicySettingsTest|CoordinatorInventoryTest' --no-progress
node tests/Frontend/request-stock.test.mjs
node tests/Frontend/request-details-custodian.test.mjs
node tests/Frontend/ris-preview.test.mjs
node node_modules/typescript/bin/tsc --noEmit --pretty false
npm run build
```

The PostgreSQL harness (`tests/run-stock-concurrency.ps1`) is restricted to the isolated local test database `supplysync_stock_tests` at `127.0.0.1:55439`. It uses independent processes and a database start barrier. It must never be redirected at an application database. The local cluster data is in `tmp/stock-quota-pg`; it can be started with the installed PostgreSQL 18 `pg_ctl` before rerunning the harness, and stopped afterward. This harness performs `migrate:fresh` only inside that guarded test environment.
