# SupplySync UI consistency audit and implementation plan

Audit date: **25 November 2026 (Asia/Singapore)**

Verdict: **Partially consistent. The shared foundation is present, but adoption and screen behavior still differ across modules.**

Deliverable: audit and plan. Application source and workflows were not changed.

## Scope and evidence

The audit traced Laravel/Inertia page entry points and their layouts, inspected shared components and representative module implementations, scanned all **245 TSX files under `resources/js`**, reviewed the four contact sheets covering **62 existing Inventory Staff screenshots**, and ran the current frontend checks and production build.

Live inspection covered the public login and password-recovery screens at `https://unc-nemix.com`. Login was checked at a 1440 × 1000 desktop viewport and a 390 × 844 mobile viewport; password recovery was checked at the mobile viewport. Both mobile pages reported no document-level horizontal overflow. Inputs were 52px tall with 16px text. The mobile login submit label measured 16px, while recovery's measured 14px. Branding, card treatment, and the recovery link were coherent. A visible indigo input focus ring warrants checking against the intended maroon focus token.

Authenticated live pages were unavailable without signing in. Their findings below are based on current source and archived visual references, **not a fresh authenticated browser certification**. The screenshot manifest dates the archived captures to **12 November 2026**, at 1440 × 1000. They cover one role and mostly light mode; they cannot establish current mobile, dark-mode, or other-role behavior. Local source and deployed assets were not proven to be the same revision.

### Page coverage

The 18 authenticated entry screens and six authentication screens were included in the source audit. Dashboard and requester screens contain additional role-dependent presentations.

| Area | Entry screens inspected | Main follow-up |
| --- | --- | --- |
| Dashboard | `Dashboard.tsx` → `Dashboard/Index.tsx`; coordinator/authorized-personnel workspace | Shared header, role designation, mode visibility, compact text, dark contrast |
| Central inventory | All Items, Receiving, Issuance and approval queue | Common toolbar, row/action styling, dialogs, status treatment |
| Requests | My Requests, Pre-Orders | Align requester and central-office presentation; preserve verification and quantity phases |
| Delivery unit / office | Coordinator Inventory, Central Supply Catalog | Replace hand-built page headings; align controls and mobile table behavior |
| Suppliers | Manage Supplier | Common controls, validation semantics, table and dialog frame |
| Compliance | Manage Reports, Analytics | Shared filters, typography, tabs, preview controls, paper isolation |
| Access control | Manage Staffs, Roles & Permissions | Shared buttons, dialog frame, validation and table density |
| Audit logs | Login Trails, Transaction Trails | Shared pagination and table styling; retain expandable details and printable ledgers |
| Administration | System Settings and its settings tabs | Align content width and header; normalize controls and state feedback |
| RFID | Scanner and tagging states | Align content width, controls, scanner states and dialog treatment |
| Account | Profile/Edit and profile/security/activity tabs | Shared fields, tabs, validation and action styling |
| Authentication | Login, Forgot Password, Reset Password, invitation Register, Verify Email, Confirm Password | Common control variants, focus treatment and field error relationships |
| Other route surfaces | Enabled UserManagement resource routes, expired-link error, public showcase | Resolve the scaffold route; brand the expired-link experience; keep showcase as an intentional promotional surface |

`Admin/SystemDashboard.tsx`, `AppLayout`, and `DashboardHeader` were also checked as alternate implementations. No active page/controller reference to `Admin/SystemDashboard.tsx` was found; the dashboard controller currently renders `Dashboard`. Alternate implementations are cleanup candidates, not evidence that users currently see those screens.

### Existing strengths

- `DashboardLayout` centralizes sidebar placement, persisted collapse state, the skip link, main content target, responsive offset, and print behavior.
- `DashboardContent` provides a reusable 1600px canvas and responsive gutters.
- Figtree, a shared Tailwind type scale, neutral surface variables, and light/dark palette values already exist.
- Headless UI provides the common modal focus infrastructure. Most modal callers supply an accessible label.
- Shared sorting and selection helpers already cover numeric/date sorting and keyboard navigation. Existing tables keep wide content in local scrolling containers.
- Institutional React Select styles and a 40px toolbar control token are already shared by several modules.
- Global notifications provide a central toast channel and common request/error handling.
- Separate print/PDF styles and white-paper rules already exist. These should be strengthened, rather than replaced by screen styling.

### Adoption indicators

These are source occurrence counts, not counts of individual visual defects. They include unused components and legitimate specialized UI.

| Indicator across `resources/js/**/*.tsx` | Result | Implication |
| --- | --- | --- |
| Raw `<button>` openings | 358 in 131 files | Common actions are largely styled locally |
| `<PrimaryButton>`, `<SecondaryButton>`, `<DangerButton>` usages | 0 each | The existing generic button components do not govern current page actions |
| `<PageHeader>` usages | 15 in 15 files | Common page overview is widely used, with role-specific exceptions |
| `<SystemHeader>` usages | 2, in `AppLayout` and `DashboardHeader` | The persistent header is not composed into the active page shell |
| Direct `<Modal>` usages | 34 in 34 files | Dialog bodies and footers are independently implemented |
| `<RecordDetailsModal>` usages | 0 | A reusable details frame exists but has not been adopted |
| `shadow-xs` / `shadow-2xs` matches | 407 in 135 files | Both utilities are absent from the actual production CSS |
| `text-xs` / 10–13px arbitrary text matches | 189 in 29 files | Review compact screen text; some matches belong to legitimate paper/ledger exceptions |

## Findings

Priority **P1** means resolve before declaring the UI consistent or starting broad rollout. **P2** means standardize in the module migration. Evidence links refer to this checkout.

### F01 — P1: Persistent header and operating context are not adopted

`DashboardLayout` renders the sidebar and children but does not render `SystemHeader`. `PageHeader` is a separate overview section; it does not delegate to `SystemHeader`. Active module pages use that section, requester pages use hand-built headings, and the dashboard uses another custom heading/control arrangement. The shared role designation and non-production notice in `SystemHeader` therefore do not automatically appear throughout the system. `DashboardControls` contains the mode badge on dashboard presentations.

Evidence: [DashboardLayout](C:/Users/Ramil/Downloads/NEMIX/resources/js/Layouts/DashboardLayout.tsx:9), [PageHeader](C:/Users/Ramil/Downloads/NEMIX/resources/js/Components/PageHeader.tsx:8), [SystemHeader](C:/Users/Ramil/Downloads/NEMIX/resources/js/Components/SystemHeader.tsx:7), [dashboard](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Dashboard/Index.tsx:85).

**Plan:** put one persistent system header in the shared authenticated shell. It should show SupplySync, the system title, the authenticated role designation, navigation control, theme control, and applicable operating-mode notice. Keep module titles/actions in a common page overview below it. Use the role label on module pages without appending “Dashboard.” Remove duplicate header/mobile-navigation rendering when adopting the shell. Preserve server-derived identity and permission filtering.

**Acceptance:** every authenticated entry screen has the same shell and one navigation toggle; maintenance/training/staging context remains visible while moving between modules.

### F02 — P2: Page headers and bodies use different maximum widths

`PageHeader` and `DashboardContent` use 1600px. System Settings uses `max-w-7xl` (1280px), while RFID uses 1500px. The header and content can stop aligning on wide screens. Bottom padding also differs between these wrappers.

Evidence: [DashboardContent](C:/Users/Ramil/Downloads/NEMIX/resources/js/Layouts/DashboardContent.tsx:3), [settings wrapper](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Admin/SystemSettings/Index.tsx:209), [RFID wrapper](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/RFID-Scanner/Index.tsx:145).

**Plan:** use `DashboardContent` for the outer canvas everywhere. Constrain an individual form or reading panel inside that canvas when appropriate. Keep page heading, toolbar and card edges aligned.

**Acceptance:** identical outer gutters and header/body alignment at tablet, desktop, and 1920px widths.

### F03 — P2: Several declared visual utilities generate no CSS

The installed Tailwind version is **3.4.19**. Production CSS contains `shadow-sm`, but contains no standalone selectors for `shadow-xs`, `shadow-2xs`, or `backdrop-blur-xs`. The first two appear 407 times in the TSX scan. These classes silently fail to create their intended visual effect. Merely installing a Tailwind v4 package alongside v3 does not activate the v4 utility vocabulary.

Evidence: [Tailwind configuration](C:/Users/Ramil/Downloads/NEMIX/tailwind.config.js:1), [Modal backdrop](C:/Users/Ramil/Downloads/NEMIX/resources/js/Components/Modal.tsx:63), [supplier toolbar](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Suppliers/Components/SupplierToolbar.tsx:65). The generated CSS was inspected after `npm run build`.

**Plan:** select supported utilities or define a small explicit shadow/blur token set in the current configuration. Correct invalid inline CSS values such as `textTransform: 'normal-case'` in shared select styles to valid CSS (`none`). Verify generated CSS, rather than relying on class-name checks.

**Acceptance:** every approved visual token has a generated definition; migrated modules use that token set. A framework major-version upgrade is not required for this work.

### F04 — P2: Buttons and field styling have competing implementations

Supplier actions use `rounded-md` and `bg-red-950`; requester actions commonly use `rounded-lg` and `bg-red-900`; settings actions use `rounded-xl`. Focus rings vary in color and thickness. `TextInput` starts with indigo focus classes, while `AuthTextInput` appends maroon classes. Class concatenation does not resolve these competing utilities by their order in the string. `cn()` currently delegates to `clsx`, which also does not merge Tailwind conflicts.

Evidence: [supplier action](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Suppliers/Components/SupplierToolbar.tsx:65), [settings actions](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Admin/SystemSettings/Index.tsx:183), [TextInput](C:/Users/Ramil/Downloads/NEMIX/resources/js/Components/TextInput.tsx:46), [AuthTextInput](C:/Users/Ramil/Downloads/NEMIX/resources/js/Components/Auth/AuthTextInput.tsx:8), [class helper](C:/Users/Ramil/Downloads/NEMIX/resources/js/lib/utils.ts:3).

**Plan:** introduce or refactor one button API with primary, secondary, destructive, text, and icon variants. Share the same styling with links that act as navigation actions. Provide explicit default/toolbar/auth sizing and loading/disabled states. Build field variants without conflicting base utilities. Retain 52px authentication controls as an intentional variant and the 40px toolbar standard.

**Acceptance:** the same action type has the same radius, spacing, focus, loading, and disabled treatment across modules; destructive actions remain distinguishable from primary actions.

### F05 — P2: Typography rules and role-specific screens disagree

The typography guide specifies 14px supporting text and sentence case. The coordinator dashboard still uses 11px uppercase workspace labels and `text-xs` action labels. The Inventory Staff dashboard uses an uppercase blue role eyebrow. Global rules also flatten `.font-bold`, `.font-extrabold`, and `.font-black` to weight 600, making declared classes and documented weights disagree.

Evidence: [typography guide](C:/Users/Ramil/Downloads/NEMIX/docs/UI_TYPOGRAPHY.md:1), [coordinator dashboard](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Dashboard/Components/CoordinatorDashboardWorkspace.tsx:84), [staff dashboard](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Dashboard/Index.tsx:88), [global emphasis rules](C:/Users/Ramil/Downloads/NEMIX/resources/css/app.css:30).

**Plan:** adopt the existing 14/16/18/20/24/30px scale for screen UI. Set heading/label weights explicitly in shared components; replace broad corrective weight overrides after callers are migrated. Preserve acronyms and official document typography. Review compact text in context instead of treating every small-text occurrence as a defect.

**Acceptance:** shared action labels and supporting screen text use the agreed scale; mobile labels do not shrink to fit; heading hierarchy and sentence case remain consistent across roles.

### F06 — P2: Status colors and badge geometry differ

Request statuses use small rounded rectangular badges, issuance statuses use pill badges, and inventory availability is an unboxed dot/label. More significantly, **Cancelled** is neutral gray in requests but rose in issuance. These choices can suggest different severity for the same term.

Evidence: [request badge](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Inventory/Requests/components/RequestStatusBadge.tsx:42), [issuance status](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Inventory/Issuance/components/IssuanceStatus.tsx:19), [inventory status](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Inventory/AllItems/components/InventoryStatus.tsx:1).

**Plan:** share badge geometry and a semantic tone system. Map each domain status to a display label and tone; agree the meaning of cancellation across workflows. Preserve backend status values and distinct requisition phases, including verification, correction, approval, pickup, release, and replenishment.

**Acceptance:** equivalent states have equivalent tone and shape; status remains understandable through visible text rather than color alone.

### F07 — P1: Dialog frames differ, and the RIS dialog lacks an accessible name

The shared `Modal` provides a restrained outer frame, but Supplier and other dialog bodies add their own `shadow-xl` wrappers, headers, padding, close controls, and footers. `RecordDetailsModal` exists but is unused. `RisPreviewModal` passes neither `ariaLabel` nor a linked `DialogTitle`; an ordinary internal `h3` does not name the Headless UI dialog.

Evidence: [shared Modal](C:/Users/Ramil/Downloads/NEMIX/resources/js/Components/Modal.tsx:1), [supplier form](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Suppliers/Components/SupplierFormModal.tsx:36), [details frame](C:/Users/Ramil/Downloads/NEMIX/resources/js/Components/ui/record-details-modal.tsx:5), [RIS preview](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Inventory/Issuance/components/RisPreviewModal.tsx:99).

**Plan:** share dialog header/body/footer/close-control primitives, require an accessible name, and adopt the details frame where it fits. Keep widths based on content and workflow. Use a predictable scrollable body with reachable actions for long forms. Preserve Headless UI focus handling and processing-close behavior.

**Acceptance:** every dialog is named; keyboard focus enters and returns correctly; Escape/backdrop behavior is intentional; close and submit actions stay reachable at mobile height and 200% zoom.

### F08 — P1: Validation feedback is not consistently associated with fields

The inventory form connects errors using `aria-invalid`, `aria-describedby`, identified messages, and alerts. The supplier Business Name field displays a red border and adjacent error paragraph but omits the equivalent invalid state and error relationship. The shared `InputError` supports alerts but callers do not consistently connect it to an input.

Evidence: [inventory field](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Inventory/AllItems/components/InventoryFormModal.tsx:254), [supplier field](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Suppliers/Components/SupplierFormModal.tsx:90), [InputError](C:/Users/Ramil/Downloads/NEMIX/resources/js/Components/InputError.tsx:3).

**Plan:** share a field wrapper with label, required indicator, hint, stable error ID, invalid state and error relationship. Apply it to native inputs and React Select. Standardize validation messaging and focus on the first invalid field after a failed submission.

**Acceptance:** invalid fields expose the same visual and accessible feedback throughout supplier, inventory, staff, request, authentication and settings forms.

### F09 — P1: At least one active dark-mode text color lacks sufficient contrast

The Inventory Staff dashboard eyebrow uses `text-blue-700` without a dark override. Its configured color `#1d4ed8` against the shell's dark canvas `#111316` has a calculated contrast ratio of **2.78:1**, below 4.5:1 for its 14px text. The shared select `groupHeading` similarly hard-codes dark maroon instead of a theme-aware text token.

Evidence: [active staff heading](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Dashboard/Index.tsx:88), [dark palette](C:/Users/Ramil/Downloads/NEMIX/resources/css/app.css:159), [select group heading](C:/Users/Ramil/Downloads/NEMIX/resources/js/styles/selectStyles.ts:60).

**Plan:** use semantic, theme-aware text tokens for headings, links, metadata, status labels, select options and focus indicators. Audit actual foreground/background pairs in both themes, including nested cards and disabled states. The ratio above is a calculation from source colors, not a live dark-mode screenshot measurement.

**Acceptance:** normal text meets 4.5:1 and large text meets 3:1; UI boundaries/focus indicators meet applicable 3:1 requirements. Confirm with browser checks after migration.

### F10 — P2: Table density, header surfaces and pagination remain local

Sorting is shared, but inventory tables use 16–20px horizontal cell padding, suppliers use 24px, and catalog/request tables commonly use 20px. Header backgrounds differ, particularly in dark mode (`slate-800` versus `slate-900`). Pagination footers are duplicated and some presentation choices depend on the role layout. Wider minimum table widths are legitimate when data requires them; the surrounding interaction should still follow one standard.

Evidence: [inventory table](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Inventory/AllItems/components/InventoryTable.tsx:56), [supplier table](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Suppliers/Components/SupplierTable.tsx:25), [catalog table](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Inventory/Coordinator/components/CatalogTable.tsx:1), [audit pagination](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/AuditLogs/Login/Components/LoginAuditPagination.tsx:46).

**Plan:** share cell/header/row/action styling and pagination presentation through the existing table foundations. Retain direct row actions, server pagination/sorting, and audit accordion rows. Standardize empty/loading/no-match states and filter-reset affordances. Define intentional mobile column/card behavior without reducing text size.

**Acceptance:** comparable tables share density, action alignment, header/hover colors, and pagination wording; wide content scrolls locally; sorting retains its current backend/client semantics.

### F11 — P1: Screen typography rules can override official paper previews

The screen selectors `#app :where(h1, h2, ...)` and `#app :where(thead th)` include embedded paper content. Their ID specificity is higher than the class-only `.official-form-title` rule. In an in-app preview, a form title declared as weight 700 can therefore become 600, and paper table headers can become 500. Print-only rules and white-paper background overrides do not exclude paper descendants from these screen typography selectors.

Evidence: [global screen selectors](C:/Users/Ramil/Downloads/NEMIX/resources/css/app.css:30), [official title style](C:/Users/Ramil/Downloads/NEMIX/resources/Official%20Forms/SharedFormHeaderStyles.tsx:23), [Stock Card title](C:/Users/Ramil/Downloads/NEMIX/resources/Official%20Forms/Stock%20Card%20Report.tsx:136).

**Plan:** explicitly scope screen typography to screen UI, with a paper-preview boundary that excludes descendants. Scope embedded document CSS to each form root, including generic classes such as `.title`, `.font-bold`, and table rules. Keep preview dialog controls on the screen scale and paper content on its official scale.

**Acceptance:** preview, print and exported PDF retain the approved paper fonts, title weights, table headers, page dimensions and signatories in both light and dark mode. Validate representative forms, including RIS, Stock Card, RSMI, RPCI, PO and ICS.

### F12 — P2: Screen date and number presentation lacks one convention

Receiving uses `formatDisplayDate` with `MM/DD/YYYY`; requester records use its `short` format; coordinator utilities use `en-PH` short dates; other dashboard/audit output uses local date/number formatting. Currency also has several local formatters. Existing calendar-date preservation is valuable and must survive display cleanup.

Evidence: [shared date utility](C:/Users/Ramil/Downloads/NEMIX/resources/js/utils/dateUtils.ts:1), [request date](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Inventory/Requests/components/CoordinatorRequestsWorkspace.tsx:253), [coordinator formatters](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Inventory/Coordinator/inventory.ts:3), [receiving row](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Inventory/Receiving/components/ReceivingRow.tsx:93).

**Plan:** define screen calendar-date, timestamp, quantity and PHP currency display helpers. Adopt one human-readable screen date style and a consistent explicit timestamp timezone policy. Keep input dates as `YYYY-MM-DD` and official form formats as required. Keep zero distinct from missing values.

**Acceptance:** the same value displays consistently across dashboard, registry, details and requester screens, without a calendar-date shift.

### F13 — P2: Secondary route surfaces bypass the application design

UserManagement is enabled and registers `/usermanagements` resource routes. Its HTML index returns a standalone Blade scaffold showing **“Hello World”**, with the module's Vite integration commented out. This is separate from the real Staff Management screen. The custom expired-link page extends Laravel's minimal error template rather than the authentication design.

Evidence: [enabled modules](C:/Users/Ramil/Downloads/NEMIX/modules_statuses.json:1), [resource routes](C:/Users/Ramil/Downloads/NEMIX/Modules/UserManagement/routes/web.php:1), [scaffold index](C:/Users/Ramil/Downloads/NEMIX/Modules/UserManagement/resources/views/index.blade.php:1), [expired link](C:/Users/Ramil/Downloads/NEMIX/resources/views/errors/410.blade.php:1).

**Plan:** check for callers before retiring or redirecting the legacy resource UI, retaining appropriate authorization. Use an auth-branded expired-link experience with the existing resend/recovery guidance. Record the public showcase as an intentional promotional design exception.

**Acceptance:** no reachable operational HTML route exposes module scaffold content; expired invitation/reset links offer a consistent, readable recovery path.

### F14 — P1: Baseline validation and documentation do not support a consistency sign-off

- `npm run test:ui`: **41 passed, 1 failed, 42 total**. The failing assertion in `supply-request-quantity-phase.test.cjs` expects “Save Document Review,” which current rendered queue markup does not contain. Reconcile the intended workflow and test rather than guessing whether the UI or assertion should change.
- `npx tsc --noEmit`: **failed with 3 errors**, all in `Inventory/Requests/Index.tsx`: missing `RequestPage.per_page` at line 177; number assigned to `Timeout` at line 199; incompatible comparison at line 202. The latter two stem from browser timeout IDs and the declared ref type.
- `npm run build`: **passed**. A successful bundle does not imply a clean TypeScript check or a consistent rendered interface. Standard warnings included large chunks and a runtime-resolved campus background reference; that reference was not classified as a missing asset.
- The existing layout-standardization document says `PageHeader` delegates to `SystemHeader`, but current source does not. Existing header tests render shared components separately, so they do not prove that active pages compose the common header. Geometry and computed CSS need browser-level checks.

Evidence: [quantity-phase assertion](C:/Users/Ramil/Downloads/NEMIX/tests/ui/supply-request-quantity-phase.test.cjs:67), [request page](C:/Users/Ramil/Downloads/NEMIX/resources/js/Pages/Inventory/Requests/Index.tsx:177), [header tests](C:/Users/Ramil/Downloads/NEMIX/tests/ui/role-layout.test.cjs:1), [prior standardization document](C:/Users/Ramil/Downloads/NEMIX/docs/ui/layout-standardization.md:1).

The Windows sandbox initially blocked subprocess spawning for UI tests and Vite (`EPERM`). Both commands were rerun with elevated execution. The UI assertion failure reported above is the actual rerun result, separate from that environment restriction.

**Plan:** resolve the baseline errors, reconcile the queue assertion against the current authorized workflow, correct documentation, and add meaningful composed-page and browser checks for the shared contract.

**Acceptance:** baseline tests/type-check/build pass; tests exercise the actual page shell; documentation describes the final implementation accurately.

## Target UI contract

Use the current institutional maroon and restrained bordered surfaces as the reference. Keep role-specific capabilities and content, while sharing presentation rules for equivalent elements.

| Element | Proposed standard |
| --- | --- |
| Brand/actions | One semantic maroon primary token based on the existing `#7f1d1d` selection/focus reference; separate destructive, warning, success and informational tones; explicit theme values |
| Page shell | Shared sidebar + one persistent system header + page overview + `DashboardContent` |
| Outer canvas | 1600px maximum; existing 16/28/32px responsive gutters; consistent bottom padding |
| Surfaces | Theme-aware canvas/card/muted/border/text tokens; avoid module-owned neutral palettes |
| Radius | 8px controls; 12px cards/dialog frame; badge shape shared through a component |
| Elevation | Bordered cards with none/subtle supported shadow; one dialog shadow; menus use a declared elevation token |
| Typography | Figtree; screen support/labels 14px, input/body 16px, subsection 18px, section 20px, page 24px mobile / 30px larger screens |
| Control sizes | Toolbar/default minimum 40px; standalone icon target 44 × 44px; auth minimum 52px; text wraps rather than forcing clipping |
| Form feedback | Shared label/hint/error relationships, required indicator, focus ring, disabled/read-only and loading states |
| Table | Shared header/cell padding and colors; right-aligned quantities/currency with tabular numerals; local horizontal scrolling; visible row actions |
| Status | One badge API plus per-domain status maps; semantic text and color; no backend status renaming |
| Dialog | Required accessible name, common header/close/body/footer, content-based widths and predictable scrolling |
| Tabs/filters | Shared selected/focus/disabled treatment; accessible navigation; wrapping or local overflow with visible affordance |
| Paper | Explicit isolated paper boundary, white paper in both themes, approved document-specific typography and dimensions |
| Data presentation | Shared calendar-date/timestamp/currency/quantity helpers; documented missing/zero treatment |

These are proposed implementation decisions. They should be recorded in the shared tokens/components so future modules inherit them automatically.

## Implementation sequence

### Phase 0 — Restore a trustworthy baseline

Owner: frontend maintainer, with workflow review for requisition verification.

1. Resolve `RequestPage.per_page` and browser timeout typing.
2. Reconcile the quantity-phase assertion with current document verification and stock approval behavior. Do not alter stock/approval behavior solely to satisfy a text assertion.
3. Record the current revision and capture representative authenticated screens for System Admin, Inventory Staff, Supply Coordinator and Authorized Personnel in a test environment.
4. Update the standardization/typography documents as implementation decisions are finalized.

Exit: baseline UI tests, frontend regression suite, type-check and production build are green; role fixtures and screenshots are available. Findings: F14.

### Phase 1 — Adopt the shared shell and protect paper content

Owner: frontend maintainer.

1. Compose `SystemHeader` in the authenticated shell and keep page overview separate.
2. Remove duplicate header/navigation control rendering from alternate layouts and callers.
3. Replace Settings/RFID outer wrappers with `DashboardContent`.
4. Establish the screen/paper styling boundary before changing typography.
5. Test the composed shell across routes and modes, not just the isolated header component.

Exit: identical navigation/header/canvas contract on all authenticated screens; official previews retain their paper typography. Findings: F01, F02, F11.

### Phase 2 — Build and adopt control/state primitives

Owner: frontend maintainer; UI reviewer confirms tokens and semantic status maps.

1. Define supported brand, surface, text, radius, shadow and focus tokens; replace non-generated utilities.
2. Refactor shared button/link-action, field, React Select, badge and dialog-frame primitives.
3. Provide explicit loading, disabled, read-only, validation and named-dialog behavior.
4. Correct contrast pairs and invalid inline CSS values.
5. Use one inventory form, one supplier form and one details dialog as reference implementations; inspect them before migrating all callers.

Exit: approved component examples cover their states in both themes, keyboard use and mobile layout. Findings: F03, F04, F06, F07, F08, F09.

### Phase 3 — Migrate the operational screens

Owner: frontend maintainer; role-based QA reviewer.

Migration order:

1. All Items, Receiving and Suppliers, using the reference components.
2. Issuance, request verification/approval/release queue and request dialogs.
3. My Requests, Pre-Orders, delivery-unit/office Inventory and Central Supply Catalog.
4. Dashboard presentations and RFID scanner/tagging states.

Adopt table/pagination styling and data helpers as each screen moves. Preserve direct row actions, local scrolling, server sorting/pagination, quantity limits, document verification and role permissions.

Exit: operational journeys share the same presentation and state conventions; stock/request regression checks still pass. Findings: F04–F10, F12.

### Phase 4 — Migrate governance, account and recovery screens

Owner: frontend maintainer; role-based QA reviewer.

1. Reports, Analytics, report generation/migration/preview controls.
2. Audit tables and pagination, preserving forensic expansion and printable ledgers.
3. Staff, Roles, System Settings and every settings tab.
4. Profile/security/activity tabs and all authentication/recovery states.
5. Resolve legacy UserManagement HTML routes and brand the expired-link screen.
6. Remove unreferenced alternate UI implementations only after checking callers.

Exit: remaining screens use the shared contract; exceptions are documented. Findings: F04–F13.

### Phase 5 — Verify and prevent regression

Owner: QA reviewer with frontend maintainer.

1. Complete the matrix below on a safe environment with seeded records for every meaningful workflow state.
2. Capture current light/dark screenshots for representative pages and dialog states under every role.
3. Add focused browser tests for header composition/mode visibility, table overflow, named dialog focus, field errors, contrast and preview isolation. Avoid tests that only search source class strings.
4. Add a check that approved tokens produce CSS and that retired utility names do not return.
5. Run existing UI/frontend regressions, type-check and build; validate affected backend workflow tests when presentation work touches event wiring.
6. Compare deployed revision/assets with the verified build when releasing the changes.

Exit: all P1 items and migrated P2 items meet their acceptance criteria; the evidence matrix is complete and deployment matches the verified revision.

## Verification matrix and completion criteria

| Dimension | Required coverage |
| --- | --- |
| Roles | System Admin, Inventory Staff/SPMO Personnel, Supply Coordinator, Authorized Personnel; additional configured roles and read-only permission cases |
| Viewports | 320px, 390px, 768px, 1440px, 1920px; include a short landscape viewport for dialogs |
| Zoom | 100% and 200%; no hidden primary action, page-level horizontal overflow, or clipped validation text |
| Themes | Light, dark, system preference; theme persistence across route changes |
| Navigation | Sidebar expanded/collapsed/mobile open; skip link; active destination; browser back/forward; one navigation toggle |
| Modes | Production, maintenance, training and staging; applicable notice stays visible across authenticated modules |
| Tables | Empty dataset, no filter matches, loading, populated, long text, sorting, pagination, row actions, audit expansion, local horizontal scroll |
| Forms | Required/invalid values, server errors, disabled/read-only, processing, successful save, long select values, file selection/review where applicable |
| Request workflow | Verification, correction/resubmission, review, quantity limit feedback, approval, pickup readiness, signed handover/release, cancellation, pre-request/restock |
| Dialogs | Accessible name, initial focus, focus containment/restoration, Escape/backdrop, processing state, long scroll, reachable footer |
| Keyboard/accessibility | Visible focus, labels/error relationships, sort direction, status text, correct heading hierarchy and contrast |
| Paper | Representative RIS/Stock Card/RSMI/RPCI/PO/ICS previews, printing and exported PDFs in both themes; text weights, borders, page breaks, signatures |
| Authentication | Login, recovery, valid/expired invitation and reset, verification/confirmation, inline errors, show-password and loading states |

Completion means all audited entry screens use the agreed shared contract, equivalent controls/states behave consistently, required regression checks pass, and fresh authenticated visual evidence covers the matrix. Until those checks are completed, the system should be described as **partially standardized**, not fully consistent.

## First implementation batch

Start with **Phase 0 and Phase 1**: fix the baseline type/test mismatch, compose the persistent authenticated header, align Settings/RFID canvases, and isolate paper typography. This establishes the contract that subsequent component and module migrations can follow.
