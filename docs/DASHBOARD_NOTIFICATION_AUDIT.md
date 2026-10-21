# Dashboard notification and action feedback audit

Audit date: 18 October 2026

## Result and scope

NEMIX does not currently have a dashboard notification inbox for every action. It has separate mechanisms: a supply-request alert bell, page-local success/error feedback, dashboard status cards, a recent activity feed, and email alerts. The bell creates new records only for supply request submission. Approval, release, receiving, RFID assignment, supplier changes, report generation, and administrative changes do not each create new bell notifications.

This audit traces the dashboard's clickable controls and the main business action handlers on its destination pages and other authenticated management pages. Findings are based on source inspection and small isolated JavaScript logic checks. Browser interaction, real users, physical RFID, and email delivery were not exercised. No application behavior was changed.

The existing targeted PHP tests could not start: PHPUnit reported `Cannot open bootstrap script ... vendor/autoload.php`. This prevents claiming backend regression tests passed. Test configuration was explicitly set to SQLite `:memory:` for the attempted run.

## 1. Notification mechanisms and pages

| Mechanism | Where displayed | Trigger / audience | Persistence |
| --- | --- | --- | --- |
| Request alerts bell | Shared sidebar on authenticated pages listed below | Submission of a supply request; active users with review permissions receive individual alert rows | Stored in `supply_request_alerts`; unread state is per recipient |
| New-request callout | Under sidebar bell when expanded | New Pending alert detected after initial poll | Visible for 6 seconds; initial load does not announce existing requests |
| Dashboard FlashToast | Dashboard; also available in AppLayout for pages that actually use it | Shared flash success/error/warning/status | Transient; generally 5 seconds, or 8 for warning/error; not an inbox |
| Operational alerts | Dashboard only | Untagged items, subject to role gate; pending suppliers | Derived from server props on a dashboard visit, not action notifications |
| Critical Stock and other status cards | Dashboard only | Current inventory, issuance, supplier, RFID, and report summary data | Snapshot loaded with the dashboard |
| Recent System Activity | Dashboard only | Latest 8 eligible business audit events | Audit-backed feed, without notification read/unread state |
| Local banners/toasts/dialogs | Individual management pages | Results of actions performed on that page | Usually transient, with inconsistent implementation |
| Low/critical-stock email | Configured recipient email, or active administrator fallback | Downward stock threshold crossing while enabled | Email channel; no request-bell notification |
| Staff/security email | Invitation, verification, password workflows | Account/security action | Separate from the dashboard request bell |

### Pages containing the shared request-alert component

The sidebar mounts `SupplyRequestAlerts` only when `canAny(approve, reject, release)` is true **and** `capabilities.inventory.issuance` is enabled. A page containing the sidebar does not mean every user sees the bell.

| Page | Route / URL | Page action feedback |
| --- | --- | --- |
| Dashboard | `/dashboard` | FlashToast, status cards, operational alerts, activity feed |
| All Items | `/inventories` | InventoryNotification success/error/warning/info |
| Receiving | `/inventory/receiving` | Local success/error banner; RFID modal validation/notices |
| Issuance | `/inventory/issuance` | Direct issuance success banner; request queue errors; missing request-action success feedback |
| My Requests | `/inventory/my-requests` | Submit/update/cancel success and error feedback |
| RFID Scanner | `/rfid-scanner` | Flash success/error banners and tagging workflow result state |
| Suppliers | `/suppliers` | Form validation; missing save-success notification |
| Manage Reports | `/compliance/reports` | ActionDialog for recording/migration outcomes; gaps for preview/download failures |
| Analytics | `/compliance/analytics` | Read/filter/export UI; no business mutation notification inbox |
| Staff Accounts | `/access-control/manage-staffs` | StaffNotification success/error/warning/info |
| Role & Permissions | `/access-control/role-permission` | RoleNotification success/error/warning/info |
| System Settings | `/admin/system-settings` | Local toast and field errors; hardware actions have some gaps |
| Login Trails | `/audit-logs/login-trails` | Read/filter/print view; shares request bell for eligible users |
| Transaction Trails | `/audit-logs/transaction-trails` | Read/filter/print view; shares request bell for eligible users |
| Account Settings / Profile | `/account-settings`, `/profile` | Profile success/validation and password/OTP workflow feedback |

Sources: `resources/js/Components/Navigation/Sidebar.tsx:193`, `resources/js/Components/Navigation/SupplyRequestAlerts.tsx:23`, the corresponding page components, and `resources/js/app.tsx:19`. App bootstrap does not wrap every page in AppLayout, so the toast in AppLayout is not automatically global.

## 2. Findings

### F01 - P2: Approve, Reject, and Release success messages are not displayed

**Page/buttons:** Issuance > request queue > Approve, revise approval, Reject confirmation, Release.

The backend returns success flashes after these operations. The queue handles errors, but approval/release have no success notification callback; rejection's success callback only closes the modal. Issuance Index has a local notification state for direct issuance creation, but neither consumes shared flash nor renders FlashToast. The request's changed status can be visible, but the returned success message is lost on this page.

**Evidence:** `Modules/Inventory/app/Http/Controllers/SupplyRequestController.php:251`; `resources/js/Pages/Inventory/Issuance/components/SupplyRequestQueue.tsx:161`, `:216`, `:228`; `resources/js/Pages/Inventory/Issuance/Index.tsx:110`, `:261`, `:350`.

**Correction:** Consume shared flash in the page or pass one success callback through the queue. Show the backend message once after each successful mutation, including repeated identical operations on different requests.

**Verification:** Approve, revise, reject, and release separate valid requests. Each must show exactly one appropriate confirmation; validation failures must show only errors.

### F02 - P2: Supplier create/update loses success confirmation

**Page/buttons:** Suppliers > new supplier save; edit supplier save, including status changes.

The controller flashes `Supplier created successfully.` or `Supplier updated successfully.`. The page only closes the form on success and has no FlashToast, flash reader, or local success notification. It uses the shared sidebar directly, not AppLayout.

**Evidence:** `Modules/Suppliers/app/Http/Controllers/SuppliersController.php:70`, `:113`; `resources/js/Pages/Suppliers/ManageSupplier.tsx:142`, `:175`.

**Correction:** Add one shared/local result renderer and preserve existing field validation. Do not treat merely opening or cancelling a form as a successful save.

**Verification:** Create and edit a supplier. Confirm one visible saved-result message and the updated row; invalid submissions must keep the form open with errors.

### F03 - P2: Report preview and PDF download failures are silent to the user

**Page/buttons:** Manage Reports > Preview Official Report; saved report > Download PDF.

Preview errors are logged to the browser console and return false without setting a user-visible error. PDF export catches failures, logs them, and removes the loading state without notifying the user. Report recording itself has success/error callbacks; this finding concerns the separate preview and download actions.

**Evidence:** `resources/js/Pages/Compliance/Reports/hooks/useReportGenerator.ts:75`, `:105`; `resources/js/Pages/Compliance/Reports/Components/ReportPreviewDialog.tsx:96`, `:120`.

**Correction:** Surface server validation/network errors in the configuration dialog, and export errors in the preview dialog. Keep the report and inputs intact for retry.

**Verification:** Force a preview request failure and an export failure. The user must receive a readable error and be able to retry. Browser print preview is not proof of a completed physical print.

### F04 - P2: Issuance queue misses remote changes when the pending count is unchanged

**Pages:** Issuance in one session; actions performed by another custodian or coordinator.

The sidebar dispatches `supply-requests-changed` only when `pending_count` changes. Releasing an Approved request, cancelling an Approved request, revising approved quantities, or editing a Pending request can leave that count unchanged. The queue does not reload for those changes. A new request plus an approval between polls can also produce the same total and miss refresh.

**Evidence:** `resources/js/Components/Navigation/SupplyRequestAlerts.tsx:45`; `resources/js/Pages/Inventory/Issuance/Index.tsx:129`.

**Correction:** Refresh against a queue revision or updated-at signal covering relevant requests, or poll the queue itself. Pending count is a summary, not a change token.

**Verification:** Open Issuance in two sessions. Release/revise an Approved request in one; the other must update without requiring a manual reload. Also test offsetting submission/approval events.

### F05 - P2: Older loaded request alerts retain stale status and read state

**Pages/buttons:** Request alerts on every eligible sidebar page > Load older alerts.

Refresh fetches only the newest 10 alerts, then appends all previously loaded alerts absent from that response without refreshing their fields. Older entries can remain Pending after approval/rejection/cancellation or remain unread after being read elsewhere, even when the overall unread count has updated.

**Evidence:** `resources/js/Components/Navigation/SupplyRequestAlerts.tsx:51`, `:55`, `:76`; `Modules/Inventory/app/Http/Controllers/SupplyRequestAlertController.php:28`.

**Correction:** Refresh all loaded IDs/pages, or explicitly invalidate/refetch the older list. Prevent overlapping poll/open/load-older responses from overwriting newer read state.

**Verification:** Load more than 10 alerts, change an older request in another session, then poll. Its displayed status and read state must match the server.

### F06 - P2: Repeated identical flash messages may not retrigger notifications

**Components/pages:** FlashToast; the flash-only portions of My Requests, Receiving, and System Settings.

Effects depend on message strings rather than an event identity. If a mounted component receives the same flash values for two consecutive operations with no intermediate clearing, its effect does not rerun. After auto-dismiss, the second identical message can be invisible. Explicit per-action callbacks cover some operations, so this is not a claim that every repeated action fails.

**Evidence:** `resources/js/Components/FlashToast.tsx:42`, `:56`; `resources/js/Pages/Inventory/Requests/Index.tsx:103`; `resources/js/Pages/Inventory/Receiving/Index.tsx:40`; `resources/js/Pages/Admin/SystemSettings/Index.tsx:98`.

**Correction:** Include a per-event flash identifier or consume notifications on each completed visit, with deduplication preventing double rendering from callbacks and flash effects.

**Verification:** Trigger two identical success results without leaving the page, allowing the first to dismiss. Both must be announced once. Repeat for an identical error.

### F07 - P3: Hardware enable/disable and revoke reload without success confirmation

**Page/buttons:** System Settings > RFID > enable/disable; revoke.

Successful JSON responses immediately trigger a full reload. The backend returns JSON, not a session success flash, and the handlers do not show a success notification before or after reload. Error handlers do show a toast. Updated device status provides some visual feedback, but there is no explicit completed-action message.

**Evidence:** `resources/js/Pages/Admin/SystemSettings/Components/RfidSettings.tsx:93`, `:102`; `app/Http/Controllers/Admin/RfidDeviceSettingController.php:77`, `:88`.

**Correction:** Reload device props while retaining a success toast. Distinguish a queued configuration from a device-applied configuration.

**Verification:** Toggle and revoke a disposable device. Confirm status and one visible result message; a rejected request must not claim success.

### F08 - P2: Dashboard status/activity does not refresh when sidebar alerts poll

**Page:** Dashboard left open while another user changes stock, RFID assignments, suppliers, or reports.

Dashboard data comes from initial Inertia props. Dashboard Index has no polling or subscription to refresh summary, critical stock, operational alerts, receiving/issuance lists, or activity. Sidebar polling updates only its own state; its queue event is limited to the Issuance route. Therefore the dashboard can display outdated operational information until another dashboard request/navigation occurs.

**Evidence:** `resources/js/Pages/Dashboard/Index.tsx:21`; `app/Http/Controllers/DashboardController.php:29`; `resources/js/Components/Navigation/SupplyRequestAlerts.tsx:45`, `:66`.

**Correction:** Add a bounded partial refresh, focus refresh, or event subscription for operational data, and communicate freshness if useful. Do not imply that bell polling refreshes all dashboard cards.

**Verification:** Leave Dashboard open, then receive/release stock or assign a tag in another session. Within the chosen refresh interval, summary and affected cards must reconcile with source records.

## 3. Coverage gaps and behavior to confirm

- **Requester outcome notifications:** Submission notifies active approvers. Approval, rejection, cancellation, release, and revisions do not create new alert rows for the coordinator or other recipients. Existing approver rows expose the request's current status when fetched. If all major business actions should notify affected users, event creation and recipient rules must be expanded.
- **Role gate differs from permissions:** The dashboard RFID banner is allowed for System Admin, System Administrator, and Property Staff roles. A Property Custodian or custom role with RFID permission alone does not satisfy that gate. Review the intended audience. Source: `app/Http/Controllers/DashboardController.php:52`.
- **Critical-stock banner prop is unused:** OperationalAlertStrip receives `criticalStockCount` but only renders RFID and supplier banners. Critical stock is shown in its separate summary card/table. Do not describe the strip as a third critical-stock notification. Source: `resources/js/Pages/Dashboard/Components/OperationalAlertStrip.tsx:20`.
- **Request alert failures are hidden:** Poll, load-older, and mark-read errors are swallowed. Mark-read failure still allows navigation, so users can see the unread badge persist after opening a request. This preserves navigation but lacks an error/staleness indicator. Source: `SupplyRequestAlerts.tsx:59`, `:95`, `:109`.
- **First-load/collapsed behavior:** Initial poll intentionally does not create a new-request callout; collapsed navigation hides the callout but retains the unread badge. Only one newest matching Pending alert is announced per poll; multiple new requests are still available in the list.
- **Activity feed is not an every-click record:** It shows the latest 8 eligible business audit events, deduplicates related actions, excludes child technical operations, and excludes ordinary authentication. Read/open/cancel-modal/filter/print buttons do not automatically create feed events. Sources: `app/Services/DashboardService.php:420`; `app/Services/ActivityPresentationService.php:51`.
- **Low-stock email is conditional:** Notification enablement, threshold crossing, recipient selection, and successful delivery matter. Delivery failure is logged; it does not generate a request-bell alert. Source: `Modules/Inventory/app/Services/LowStockAlertService.php:15`.

## 4. Dashboard buttons and destinations

Dashboard links below navigate to pages. Clicking them does not itself create a saved-action notification, which is appropriate for navigation.

| Dashboard control | Destination / behavior | Notification implication |
| --- | --- | --- |
| Manage RFID Hardware in RFID banner | RFID Scanner | Tagging workspace, not the hardware settings page despite its label |
| Review Suppliers | Suppliers registry | Opens supplier management; no review-specific query/filter |
| Critical Stock summary card | All Items | No stock-status query/filter is supplied |
| Inventory Value summary card | All Items | Navigation only |
| Available Items summary card | All Items | No availability filter is supplied |
| Issued This Month summary card | Issuance | No month filter is supplied |
| Unserviceable summary card | All Items | No unserviceable filter is supplied |
| Monthly / Yearly movement buttons | GET dashboard with chart_filter | Refreshes movement data, not a business mutation |
| Analytics | Compliance Analytics | Navigation only |
| Receiving View Ledger | Receiving | Navigate to incoming stock ledger |
| Issuance View Ledger | Issuance | Navigate to approvals/issuance workspace according to permissions |
| View All Inventory | All Items | Navigation only |
| Manage RFID | RFID Scanner | Navigation only |
| View Registry | Suppliers | Navigation only |
| Manage Official Reports | Manage Reports | Navigation only |
| View All Activity | Transaction Trails | Audit feed destination |
| Request alerts bell | Expand/collapse sidebar alerts; refresh | Does not mark all alerts read |
| Individual alert / View request callout | Mark this recipient's alert read, then Issuance `?request=ID` | Opens/focuses related request; navigation continues if mark-read fails |
| Load older alerts | Fetch preceding alert IDs | Does not mark them read |
| Mobile menu / theme control | Toggle navigation / theme | Local UI change; no business success notification required |
| System mode change confirmation | Shared SystemModeBadge action | Own transient success/error message; mode banner also changes |

Sources: `resources/js/Pages/Dashboard/Components/*.tsx`, `resources/js/Components/Navigation/SupplyRequestAlerts.tsx`, and `resources/js/Components/SystemModeBadge.tsx`.

## 5. Main action buttons: page feedback versus dashboard bell

“No new bell event” means the action does not insert a new `SupplyRequestAlert`. The action may still produce an audit event or alter a dashboard metric. Audit feed visibility depends on audit logging and the feed's filters, not button clicks alone.

| Page | Action buttons / action group | Current local feedback | New request-bell event? |
| --- | --- | --- | --- |
| All Items | Save Item Master, update identity, delete confirmation | Success banner/callback; validation/error feedback | No |
| All Items | View details, Tag RFID, open/edit/cancel form, filters | Details/navigation/form state; no save message expected until mutation | No |
| Receiving | Save Receiving, Update Receiving | Success banner; inline form validation | No |
| Receiving | Scan RFID / Add Tag / remove scanned line | Identified row, duplicate/unassigned notices, field validation | No |
| Receiving | Receive Items | Success flash/banner; submit errors in modal; special carried-scan confirmation | No |
| My Requests | Submit request | Success banner and inline validation | **Yes: active approvers/reviewers at submission time** |
| My Requests | Update request | Success callback/banner and validation | No |
| My Requests | Cancel request confirmation | Local success/error plus backend result | No; existing row status changes when refetched |
| My Requests | RIS preview, download, print | Preview/download/print UI, not a new business notification | No |
| Issuance | Approve, revise approval | Error handling and changed request state; success flash not displayed (F01) | No |
| Issuance | Reject confirmation | Modal closes; error handling; success flash not displayed (F01) | No |
| Issuance | Release | Error handling and changed request/stock state; success flash not displayed (F01) | No |
| Issuance | Record Issuance / save direct issuance | Success callback/banner and inline validation | No |
| Issuance | Preview RIS, print/download | Document UI; not an action-success inbox event | No |
| RFID Scanner | Assign/replace tag | Tagging result state; success/error banner; validation errors | No |
| RFID Scanner | Unassign | Workflow success/error state and flash banner | No |
| RFID Scanner | Select next item / lookup / scan | Identification/workflow state | No |
| Suppliers | Create/save, update/save, status changes | Field validation; form closes without success confirmation (F02) | No |
| Manage Reports | Preview Official Report | Preview/loading; console-only failure (F03) | No |
| Manage Reports | Save & Record Document | ActionDialog success/error | No |
| Manage Reports | Historical migration submission | Completion/error callbacks and migration UI | No |
| Manage Reports | Download PDF | Loading state; console-only failure (F03) | No |
| Manage Reports | Print Form / Print Preview | Browser print UI; physical completion not observed | No |
| Staff Accounts | Create/update staff, enable/disable confirmation, resend invitation | Shared flash rendered by StaffNotification; authority warnings; form validation | No |
| Role & Permissions | Create/update/delete confirmation | RoleNotification; protected-role/authority warnings; validation | No |
| System Settings | Save settings | Toast plus field validation and threshold cross-validation | No |
| System Settings > Email & Notifications | Send diagnostic test email | Success/error toast and validation; dispatch is not proof of inbox delivery | No |
| System Settings > Signatories | Add directory entry / remove entry | Creation dialog validation, result toasts, assigned-entry protection | No |
| System Settings > Operations | Policy backup download | Direct download link; no local completion/error toast handler | No |
| System Settings > RFID | Save configuration | Success means queued version; errors shown | No |
| System Settings > RFID | Test scanner | Informational/error toast; explicitly does not prove tag reading | No |
| System Settings > RFID | Register device, rotate secret | Informational/error toast and one-time secret display | No |
| System Settings > RFID | Enable/disable, revoke | Changed device state after reload; no success toast (F07) | No |
| System Settings > RFID | Scan Wi-Fi | Wi-Fi scan progress/results or error in Wi-Fi component | No |
| Account Settings | Save profile | recentlySuccessful message and field validation | No |
| Account Settings | Password/OTP steps | Step-specific success/error state | No |
| Analytics / Audit Logs | Search, filters, pagination, export/print controls | Results/loading/document UI; no generic action notification | No |

Server routes for report update/archive, receiving/issuance update/delete, and supplier delete exist, but route existence alone does not establish that a current page exposes a matching button. This matrix describes the inspected rendered workflows; those additional endpoints need direct route tests separately.

## 6. Verification performed and remaining checks

### Completed

- Traced alert creation, recipient selection, unread ownership, polling, alert opening, and pagination through frontend and controller source.
- Traced success flashes through middleware, app bootstrap, layouts, and the management pages.
- Inspected existing `SupplyRequestAlertTest` coverage: active approver recipients, private read state, unauthorized access, approval status/count, and older-page loading. These are existing tests, not fresh passing evidence.
- Inspected dashboard status/alert props, action links, activity presentation rules, RFID feedback handlers, report preview/save/export handlers, and low-stock email trigger rules.
- Ran isolated JavaScript assertions confirming: latest-page merge retains an older alert's fields; unchanged pending count does not activate the change condition; identical flash strings do not change effect dependencies. These checks validate the local logic behind F04-F06, not an end-to-end UI run.
- Attempted `php artisan test --filter='SupplyRequestAlertTest|LowStockAlertTest|SystemOverviewDashboardTest|DashboardRecentActivityNormalizationTest|DashboardAnalyticsTest'` with explicit isolated test database settings. Blocked before test execution by missing `vendor/autoload.php`.

### Live acceptance checklist

| Check | Expected observation |
| --- | --- |
| Submit as coordinator, observe active custodian on Dashboard | Bell unread count increases within the next successful 15-second poll; expanded sidebar shows new-request callout after baseline poll |
| Open alert | Correct request focused in Issuance; only this user's alert becomes read |
| Approve / revise / reject / release | Exactly one result message each; no new coordinator notification exists until recipient/event coverage is implemented |
| Two-session release while queue remains open | Awaiting-release list updates even with unchanged pending count after F04 correction |
| Load >10 alerts; change old request elsewhere | Old row status and unread marker refresh after F05 correction |
| Repeat identical successful action after auto-dismiss | Second completion announces once after F06 correction |
| Save supplier | Explicit success confirmation after F02 correction |
| Fail report preview/export | Visible error, preserved inputs, retry available after F03 correction |
| Change stock/RFID/supplier/report in another session | Open dashboard refreshes affected data after F08 correction |
| Enable/disable/revoke test device | Explicit result confirmation and authoritative device state after F07 correction |
| Coordinator without reviewer permission | No request bell; own request feedback remains available |
| Wrong-recipient mark-read request | Denied; other recipient's unread state unchanged |
| Email threshold crossing | Mail attempt to configured recipient; failures observable in logs, independently of bell state |

Recommended correction order: F01-F03 for immediate action feedback, F04-F05 for cross-session consistency, F06 for repeat-event reliability, F08 for dashboard freshness, then F07 for explicit device-action confirmation. Define event recipients before expanding the bell to other business actions.
