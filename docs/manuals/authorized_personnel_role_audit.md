# Authorized Personnel role audit

Reviewed 12 November 2026 against the local repository. This is a source and workflow audit for the role manual, not a certification of a deployed database or a comprehensive security assessment.

## Role and permission evidence

- `app/Models/User.php`: Authorized Personnel requires supporting documents and uses coordinator inventory unless also assigned System Admin.
- `database/migrations/2026_10_02_000002_add_supply_workflow_roles.php`: defines the default Supply Coordinator request permissions.
- `database/migrations/2026_10_21_000001_create_coordinator_inventory.php` and `2026_10_21_000002_add_coordinator_catalog_permission.php`: add owned inventory, unit issues, Stock Cards and the read only central catalog.
- `database/migrations/2026_10_22_000001_add_authorized_personnel_workflow.php`: copies the coordinator permissions to Authorized Personnel and adds document access and request alert permissions. It does not independently guarantee that an existing customized role has the default permission set.
- `app/Http/Middleware/AuthorizeAction.php`: blocks requester access to central inventory, suppliers, RFID, compliance, approval, rejection, verification, readiness and release; shared transaction history redirects to private unit movements.
- `Modules/AuditLogs/app/Http/Controllers/AuditLogsController.php`: optional Login Audit stays restricted to the user's own events. Account Settings supplies personal login history independently.

## Request workflow evidence

`Modules/Inventory/app/Http/Controllers/SupplyRequestController.php` and the `SupportingDocumentService.php` and `SupplyRequestService.php` services establish these rules:

1. The requester identity is the logged in account. An assigned department is enforced for a new request; an unassigned Authorized Personnel user selects a department. Unlike Supply Coordinator, this role does not require an assigned office head to submit.
2. A request requires an approved document type and a genuine PDF, JPG, JPEG or PNG up to 10 MB. Files are private; preview and download are protected and audited.
3. New requests start at Pending Verification. Review can return For Correction or advance to Under Review. Only designated staff can verify, and owners cannot verify their own files.
4. Request edits are restricted to Pending, Pending Verification and For Correction. Existing documents can be retained, but document type is still required and any eligible save resets the document review metadata and status.
5. Owners can cancel Pending, Pending Verification, For Correction, Under Review, Approved and Ready for Pickup requests. Released, Rejected and Cancelled requests are final for the requester interface.
6. Approved and Ready for Pickup quantities remain reserved. Authorized Personnel release requires Ready for Pickup and signed RIS confirmation. Release credits account owned stock once.
7. RIS PDFs are available after approval, including legacy Issued records. Before release, the official PDF leaves Issue Qty blank. Printed dates are not proof of release. The application's View RIS preview can use different date labels, so the manual directs signing from the official PDF.
8. Request alerts are account specific. Their pending number includes Pending, Pending Verification and Under Review, excluding For Correction and Ready for Pickup. My Requests offers grouped summary filters and explicit status filters.

`app/Http/Controllers/CoordinatorInventoryController.php` and `app/Services/CoordinatorInventoryService.php` confirm owned inventory, owner enforced issues, quantity checks, private movement history, Stock Card opening balances and date filters. The normal requester interface has no unit issue reversal or account stock transfer action. Account handover must therefore be arranged through the institution rather than by sharing credentials.

## Confirmed implementation limitation

The catalog reservation query in `CoordinatorInventoryController::catalog` uses `where('requests.status', 'Approved')`. `SupplyRequestService::reservedQuantity` uses both Approved and Ready for Pickup. Consequently, catalog availability can overstate unreserved quantities once an approved request is marked Ready for Pickup. The manual labels catalog availability provisional and directs users to the staff confirmed quantities. Application code was not modified as part of this documentation request.

The role checks do not guarantee adequate stock when a request is submitted; request validation checks positive central stock, while approval and release apply the inventory workflow and configured policy. The manual avoids promising requested quantities will be fulfilled.

## Validation

Command: `php vendor/bin/phpunit --filter 'AuthorizedPersonnelWorkflowTest|CoordinatorInventoryTest|SupplyRequestAlertTest'`.

Result: **26 tests passed, 516 assertions** using the configured in memory SQLite test database. Covered document format/size enforcement, ownership, private document access, verification gates, correction and upload cleanup, role change persistence, pickup/release, unit receipt, inherited inventory workflows and request alerts. No production database was used for this validation.

The retained draft was patched in place. Only `word/document.xml` changed; 20 other package parts were preserved. The existing cover logos, A4 geometry, Aptos styles, tables, running page furniture, 18 chapter structure and screenshot register were retained in the Word source. Button names and workflow descriptions were corrected, and audit evidence and alert instructions were added.

The delivered PDF has 29 pages, 18 chapters and 23 screenshot capture directions, consistent with the retained role manuals. It does not contain live application screenshots. Word launch approval was declined, and the bundled renderer lacks LibreOffice, so the final PDF was generated directly with ReportLab and rasterized using Poppler at 140 dpi. Calibri substitutes for the reference's Aptos font, which is not installed locally. The PDF contents, links, page numbers and all page layouts were checked. Native Word pagination and field refresh remain unverified in the retained DOCX, which is not the verified deliverable.
