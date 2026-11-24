# SupplySync UI consistency implementation

Implemented locally on **25 November 2026 (Asia/Singapore)** from the [UI audit](./ui-consistency-audit-plan-2026-11-25.md). The changes are in the working tree and have not been deployed.

## Result

The authenticated application now shares one persistent header, authenticated role designation, mode notice/controls, theme selector and mobile navigation toggle. Module overviews use the shared page hierarchy. Settings and RFID use the same 1600px content canvas as the other modules.

Shared primitives now govern ordinary actions, fields, badges, tables and dialog frames. The migration includes 325 Button usages, 23 Field groups, 51 dialog-part usages and 33 data tables. Specialized controls such as summary cards retain their layout through the unstyled button variant. Native button type, permissions, event handlers, request endpoints, quantity limits and document review gates were preserved.

### Changes by audit finding

| Finding | Implementation |
| --- | --- |
| F01: Header/context | SystemHeader is composed by DashboardLayout; alternate layouts no longer add a duplicate. Role labels do not append “Dashboard” on module pages. Mode notices remain visible across modules. Theme control moved out of the sidebar into the shared header. |
| F02: Canvas alignment | Settings/RFID use DashboardContent; persistent header content also aligns to the shared maximum width. |
| F03: Missing utilities | Replaced unsupported `shadow-xs`, `shadow-2xs` and `backdrop-blur-xs` in frontend TSX. Shared CSS is compiled and tested with the configured Tailwind version. Invalid select `textTransform` was corrected. |
| F04: Buttons/fields | Added primary, secondary, danger, ghost, tab and specialized unstyled variants; loading/disabled support; explicit submit intent. Action links use the same visual attributes. Inputs use semantic theme tokens and maroon focus. Auth controls retain a 52px minimum. |
| F05: Type system | Screen text uses the existing Figtree scale; compact screen labels/actions were raised to 14px; input text is 16px; page h1 is 24px mobile / 30px larger screens. Removed broad global weight overrides. |
| F06: Status semantics | Requests, issuance, inventory, supplier and audit statuses share StatusBadge. Cancellation is neutral; failure/rejection is destructive. Backend status values and distinct workflow labels were retained. |
| F07: Dialogs | Modal requires an accessible name, has one elevation and viewport-bounded scrolling. DialogHeader/Body/Footer provide shared treatment. Receiving adopts RecordDetailsModal. RIS preview is named. Close controls use visible focus and appropriate targets. |
| F08: Validation | Field associates labels, hints and errors, including native controls and React Select. Existing auth errors are linked to inputs, password fields expose invalid state, supplier status is associated with its error, and additional local error states expose `aria-invalid`. First-invalid-field focus is supported for Inertia errors and supplier validation. |
| F09: Dark mode | Replaced dark text colors on active screens, added semantic brand/focus/danger/surface tokens and theme-aware select groups, and normalized badge text/background pairs. This is not a complete third-party accessibility certification. |
| F10: Tables/pagination | Shared table header/cell density, hover treatment, quantity alignment and pagination styling. Preserved direct actions, local horizontal scrolling, server/client sorting contracts and audit expansion. |
| F11: Paper isolation | Official forms have explicit paper boundaries, generic document CSS is scoped to form roots, screen typography excludes paper descendants, and the global table alignment override was removed. Document fonts, heading weights and table headers retain their own rules. |
| F12: Data formatting | Added calendar-date, timestamp, quantity and PHP currency display helpers and adopted them in operational screens. Calendar dates keep their original day; timestamps default to Asia/Manila and display a timezone; missing values remain distinct from zero. Official paper formats remain specific to the document. |
| F13: Other routes | Legacy UserManagement HTML GET pages redirect to the real Staff Management destination; auth/authorization middleware still applies. JSON index behavior is retained. Expired invitation/reset pages now use institutional branding and recovery guidance. |
| F14: Baseline checks | Fixed RequestPage pagination and browser timer types. Updated stale assertions/fixtures to the existing document review, office designation and backend-provided stock/weekly-limit contracts. Added composed-shell, field, badge, display and compiled-CSS checks. |

## Verification

| Check | Result |
| --- | --- |
| `npm run test:ui` | 49 passed |
| `node --test tests/Frontend/*.test.mjs` | 11 suites passed |
| `npx tsc --noEmit` | Passed |
| `npm run build` | Passed |
| PHPUnit: LegacyUserManagementUiTest, ManageStaffAuthorizationTest, AuthorizedPersonnelWorkflowTest, AuthenticationTest | 43 tests, 305 assertions passed |
| `git diff --check` | Passed |

The build retains existing warnings for large chunks, empty vendor chunks, and the runtime-resolved campus-background reference. These do not prevent the bundle from building.

### Browser evidence

Browser checks used **real React components and compiled production CSS with synthetic data and a local Inertia adapter**. They did not sign into the deployed application, mutate stock, send mail or contact scanner hardware. A preview-data error is not evidence of an application backend failure; fixtures were completed before recording the final matrix.

- **66 viewport/page checks**: 27 entry/role combinations at 320px dark mode and 1440px light mode, plus Inventory, Requests, Settings and RFID at 390px, 768px and 1920px. The final matrix had no document-level horizontal overflow, preview render errors or missing page headings.
- The dashboard combinations included Inventory Staff, System Admin, Supply Coordinator and Authorized Personnel. Authentication covered login, recovery, reset, invitation activation, email verification and password confirmation.
- Desktop primary actions measured 40px high, 14px text and 8px radius. Authentication actions measured 52px high with 16px text. Inputs measured 16px text.
- At 390px, the supplier dialog measured 358px wide, remained within the viewport, kept keyboard focus inside, closed on Escape and returned focus to Register Supplier. The mobile sidebar opened and its close target measured 44px.
- The profile category buttons exposed their selected state and used the shared active treatment.
- The Stock Card in dark mode retained a white background, black text, Times New Roman, and weight 700 for its official title and table headers. The surrounding screen heading retained Figtree/600.

Evidence files are in [output/ui-consistency](../../output/ui-consistency/verification.json):

- [Desktop inventory](../../output/ui-consistency/inventory-desktop.jpg)
- [Mobile dark supplier dialog](../../output/ui-consistency/supplier-mobile-dark-dialog.jpg)
- [Dark-mode paper isolation](../../output/ui-consistency/paper-isolation-dark.jpg)

The reproducible local preview adapter and server are under `.tmp/ui-consistency-preview*`. These are synthetic QA helpers and are not loaded by production routes or the application entry point.

## Remaining release verification

Implementation and local checks are complete. A deployment sign-off still requires an authenticated staging run against real server responses, actual 200% browser zoom, long/populated datasets, real upload/review flows, scanner reconnect states, and representative print/PDF exports with page breaks and signatures. The browser preview verifies presentation and local interactions; backend tests verify selected authorization and workflow contracts. Neither substitutes for that deployment matrix.

No deployment, push or production data change was performed.
