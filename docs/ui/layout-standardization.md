# SupplySync interface standardization

## Audit and implementation

The Laravel/Inertia frontend previously used the same permission-filtered Navigation/Sidebar but repeated sidebar state, offsets, page wrappers, and headers in 17 module pages. DashboardHeader also selected a different visual style and system title based on inventory scope. The Coordinator dashboard and delivery-unit inventory/request workspaces supplied the design reference: maroon branding, restrained bordered surfaces, readable compact controls, responsive margins, and local table scrolling.

DashboardLayout owns the sidebar, persisted collapse state, responsive content offset, skip link, persistent SystemHeader, and print behavior. DashboardContent owns the common 1600px canvas, margins, and spacing, including Settings and RFID. Existing module content, filters, actions, and modal state remain in their original pages. AppLayout and the legacy AuthenticatedLayout use the same shell without adding another header. PageHeader renders the module overview and its h1; its embedded variant aligns overviews inside DashboardContent. SystemHeader renders the system identity, current role, operating-mode controls/notice, theme selector and one mobile navigation toggle.

SystemHeader derives the designation from the current Inertia authentication props on every render. It respects the server's primary role and system-admin flag, translates existing role aliases for display, and retains custom role names. The role label does not append “Dashboard” on module pages. It does not use local storage or inventory scope to infer identity. Login, refresh, and subsequent Inertia responses use the server's current session data. No role-switching feature was introduced.

The visible system title is Consumable Supply Management; SupplySync remains the brand. Authentication branding, sidebar branding, browser titles, and document metadata use the updated terminology. Inventory module/function names retain their domain meaning.

Authenticated module surfaces use consistent corner radii and restrained modal shadows. Existing semantic status colors, accessible modal focus handling, tables, form validation, loading indicators, empty states, and notification behavior remain in place.

## Permission and workflow boundaries

Sidebar capability/permission filtering, routes, controllers, API endpoints, database schemas, stock transactions, and authorization checks were not changed. Administrator functions, SPMO receiving/issuance/reporting tools, and requester workflows remain intact.

Authorized Personnel continue using the Coordinator requester workspace. Required supporting documents, private document access, designated SPMO verification, correction/resubmission, and blocking approval/release until verification are preserved by the existing backend implementation.

## Verification updated 25 November 2026

- `npm run test:ui`: 49 checks covering composed shell identity/navigation, role precedence, actions, field associations, status semantics, display helpers, compiled CSS, sorting and existing workflow rendering.
- `npx tsc --noEmit`: complete frontend type check.
- `npm run build`: production bundle.
- `node --test tests/Frontend/*.test.mjs`: 11 regression suites passed, including quantity limits, document workflows, signatories, Stock Cards and notifications.
- `php vendor/phpunit/phpunit/phpunit --filter='LegacyUserManagementUiTest|ManageStaffAuthorizationTest|AuthorizedPersonnelWorkflowTest|AuthenticationTest'`: 43 tests, 305 assertions passed. Legacy HTML redirects retain authentication and route authorization; the existing JSON index response is preserved.

Browser verification used real frontend components, the compiled production CSS, synthetic data, and a local Inertia adapter. It does not certify a deployed authenticated session or real device/network workflows. See [the implementation report](./ui-consistency-implementation-2026-11-25.md) for the final evidence and limits.

## Typography

Screen UI uses Figtree with system sans-serif fallbacks, a 16px body/input baseline, 14px supporting/action labels, and medium/semibold emphasis. Screen headings use 24px mobile / 30px larger screens; system identity uses a smaller supporting hierarchy. Shared button, field, badge, table and dialog styles live in `resources/css/ui.css`. Global weight overrides were removed. Official forms carry a `data-paper-preview` boundary and document CSS is scoped to each form root, preserving paper fonts and weights. No additional font download was introduced.

## Shared controls

Use `Button` from `Components/ui/button` for native actions and its `actionLinkProps` for navigation actions. The default button type is `button`; form submit actions explicitly use `type="submit"`. Variants are primary, secondary, danger, ghost, tab and unstyled (for specialized card controls). The loading state disables repeat submission. Tab controls expose `aria-selected`, `aria-pressed` or `aria-current` so selected treatment comes from state.

Use `Field` for label/hint/error relationships and `ui-field` for native field styling. React Select uses `styles/selectStyles.ts`; Compliance uses the same styles. `useValidationFocus` handles locally returned errors; global Inertia error handling focuses the first visible invalid field. `Modal` requires an accessible name. DialogHeader/Body/Footer provide shared spacing and RecordDetailsModal is adopted by Receiving.

Use `StatusBadge` with domain status maps. Cancellation is neutral; rejection/failure is destructive. Use displayFormat helpers for screen calendar dates, operational timestamps, quantities and PHP amounts. Paper formats remain document-specific. Timestamps default to Asia/Manila and display their timezone; calendar dates retain their original day.
