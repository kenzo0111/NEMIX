# SupplySync interface standardization

## Audit and implementation

The Laravel/Inertia frontend previously used the same permission-filtered Navigation/Sidebar but repeated sidebar state, offsets, page wrappers, and headers in 17 module pages. DashboardHeader also selected a different visual style and system title based on inventory scope. The Coordinator dashboard and delivery-unit inventory/request workspaces supplied the design reference: maroon branding, restrained bordered surfaces, readable compact controls, responsive margins, and local table scrolling.

DashboardLayout now owns the sidebar, persisted collapse state, responsive content offset, skip link, and print behavior. DashboardContent owns the common 1600px canvas, margins, and spacing. Existing module content, filters, actions, and modal state remain in their original pages. AppLayout and the legacy AuthenticatedLayout use the same shell. PageHeader and DashboardHeader delegate to SystemHeader.

SystemHeader derives the designation from the current Inertia authentication props on every render. It respects the server's primary role and system-admin flag, translates existing role aliases for display, and retains custom role names. It does not use local storage or inventory scope to infer identity. Login, refresh, and subsequent Inertia responses use the server's current session data. No role-switching feature was introduced.

The visible system title is Consumable Supply Management; SupplySync remains the brand. Authentication branding, sidebar branding, browser titles, and document metadata use the updated terminology. Inventory module/function names retain their domain meaning.

Authenticated module surfaces use consistent corner radii and restrained modal shadows. Existing semantic status colors, accessible modal focus handling, tables, form validation, loading indicators, empty states, and notification behavior remain in place.

## Permission and workflow boundaries

Sidebar capability/permission filtering, routes, controllers, API endpoints, database schemas, stock transactions, and authorization checks were not changed. Administrator functions, SPMO receiving/issuance/reporting tools, and requester workflows remain intact.

Authorized Personnel continue using the Coordinator requester workspace. Required supporting documents, private document access, designated SPMO verification, correction/resubmission, and blocking approval/release until verification are preserved by the existing backend implementation.

## Verification

- `npm run test:ui`: role designations, primary-role precedence, custom roles, replaced session props, fresh renders, module titles/actions, operating-mode notices, shared-shell accessibility and responsive/print classes.
- `npx tsc --noEmit`: complete frontend type check.
- `npm run build`: production bundle.
- `php vendor/phpunit/phpunit/phpunit --filter='AuthorizedPersonnelWorkflowTest|CoordinatorInventoryTest|CoordinatorDepartmentAssignmentTest|SystemOverviewDashboardTest|ManageStaffAuthorizationTest|AuthenticationTest'`: 55 tests, 812 assertions passed. Elevated execution was needed because the Windows sandbox reported Composer's existing autoload file as unreadable.

Live browser visual inspection at mobile/tablet/desktop widths was not performed. The automated frontend checks render React markup and inspect layout contracts; they do not measure browser geometry. Manual QA should cover sidebar toggling, zoom, wide tables, print previews, and document upload/review under each authenticated role.

## Typography

Screen UI uses Figtree with Segoe UI/system sans-serif fallbacks, a 16px body baseline, 20–24px system headings, 14px role labels, and medium/semibold emphasis. Central screen-only rules align heading families, weights, and table headers across existing modules. Login and sidebar branding use smaller, restrained text with less letter spacing. Existing print and PDF styles remain responsible for official document typography. No additional font download was introduced; the existing Figtree stylesheet already includes the required weights.
