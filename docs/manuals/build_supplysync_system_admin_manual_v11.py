from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor

import build_supplysync_system_admin_manual as base


VERSION = "1.1"
EFFECTIVE_DATE = "11 November 2026"


def add_cover(doc):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    if base.UCN_LOGO.exists():
        p.add_run().add_picture(str(base.UCN_LOGO), width=Inches(0.92))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(16)
    if base.SUPPLYSYNC_LOGO.exists():
        p.add_run().add_picture(str(base.SUPPLYSYNC_LOGO), width=Inches(2.65))

    p = doc.add_paragraph(style="Title")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(22)
    p.add_run("SYSTEM ADMINISTRATOR\nUSER MANUAL")

    p = doc.add_paragraph(style="Subtitle")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run(
        "SupplySync: A Web-Based Consumable Supplies Management System\n"
        "with Digital Requisition Processing and Automated Reports"
    )

    line = doc.add_table(rows=1, cols=1)
    line.alignment = WD_TABLE_ALIGNMENT.CENTER
    line.cell(0, 0).width = Inches(5.3)
    base.set_cell_shading(line.cell(0, 0), base.MAROON)
    base.set_cell_margins(line.cell(0, 0), 18, 0, 18, 0)
    base.set_cell_border(
        line.cell(0, 0),
        top={"val": "nil"},
        bottom={"val": "nil"},
        left={"val": "nil"},
        right={"val": "nil"},
    )

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(24)
    r = p.add_run("Role Scope")
    r.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor.from_string(base.MID_GRAY)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("SYSTEM ADMINISTRATOR ONLY")
    r.bold = True
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor.from_string(base.BLACK)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    r = p.add_run("Platform governance, access control, audit, configuration,\nand read-only operational monitoring")
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor.from_string(base.MID_GRAY)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(25)
    r = p.add_run(f"Version {VERSION}  |  {EFFECTIVE_DATE}")
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor.from_string(base.MID_GRAY)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    r = p.add_run("Internal Administrative Use")
    r.bold = True
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor.from_string(base.MAROON)
    doc.add_page_break()


def add_front_matter(doc):
    p = doc.add_paragraph()
    p.style = doc.styles["Heading 1"]
    p.paragraph_format.page_break_before = False
    p.add_run("Document Control")

    base.add_simple_table(
        doc,
        ["Control Item", "Value"],
        [
            ("Document ID", "SS-ADM-MAN-001"),
            ("Document title", "SupplySync System Administrator User Manual"),
            ("Version", VERSION),
            ("Effective date", EFFECTIVE_DATE),
            ("Applicable role", "System Administrator only"),
            (
                "Scope basis",
                "Repository authorization audit of routes, middleware, shared capabilities, navigation, controllers, and role-permission definitions",
            ),
            ("Document owner", "SupplySync System Administration"),
            ("Classification", "Internal Administrative Use"),
            ("Review cycle", "After each major release, authorization change, or at least annually"),
        ],
        widths=[1.75, 5.2],
    )

    doc.add_heading("Revision History", level=2)
    base.add_simple_table(
        doc,
        ["Version", "Date", "Description", "Prepared for"],
        [
            (
                "1.0",
                "11 Nov 2026",
                "Initial draft; later found to include procedures belonging to operational roles.",
                "Internal review",
            ),
            (
                "1.1",
                "11 Nov 2026",
                "Role-scope correction based on repository authorization audit. Operational-role procedures removed.",
                "System Administrators",
            ),
        ],
        widths=[0.75, 1.15, 3.8, 1.5],
    )

    base.add_callout(
        doc,
        "STRICT ROLE BOUNDARY",
        "This manual is only for the System Administrator account. It does not teach routine requisition processing, "
        "stock receiving, stock issuance, inventory record maintenance, supplier operations, supporting-document "
        "verification, pickup processing, release processing, or compliance-report production. Those activities are "
        "handled under separate role manuals. The System Administrator may monitor inventory and requisition records "
        "in read-only form for governance, support, and audit purposes.",
        fill=base.PALE_AMBER,
        title_color=base.MAROON,
    )

    doc.add_heading("How to Use This Manual", level=2)
    base.add_bullets(
        doc,
        [
            "Use only a System Administrator account while following these procedures.",
            "Treat View Inventory, View Requisition, and Open Requests as monitoring pages. Do not infer operational authority from the visibility of a record.",
            "Fields marked with an asterisk are required. Read-only values are supplied by the system.",
            "Blue Screenshot Direction boxes describe exactly what image to capture and what information to hide.",
            "Use demonstration data for screenshots. Never expose passwords, OTPs, invitation links, reset links, device secrets, Wi-Fi credentials, IP addresses, or live personal information.",
            "Read impact and confirmation messages before changing access, operating mode, or system configuration.",
        ],
    )

    doc.add_heading("Manual Conventions", level=2)
    base.add_simple_table(
        doc,
        ["Convention", "Meaning"],
        [
            ("Select", "Choose a menu, tab, record, option, or button."),
            ("Enter", "Type a value into an editable field."),
            ("Read-only", "The administrator may inspect the information but cannot perform the related operational transaction."),
            ("Expected result", "The visible or recorded outcome that confirms the procedure succeeded."),
            ("Important", "A security, validation, audit, or service-impact warning."),
            ("Screenshot direction", "Instructions for creating an image that can later be inserted into the manual."),
        ],
        widths=[1.5, 5.45],
    )
    doc.add_page_break()

    p = doc.add_paragraph()
    p.style = doc.styles["Heading 1"]
    p.paragraph_format.page_break_before = False
    p.add_run("Contents")
    p = doc.add_paragraph()
    base.add_field(
        p,
        'TOC \\o "1-3" \\h \\z \\u',
        "Open this document in Microsoft Word and update the Table of Contents field.",
    )
    base.add_callout(
        doc,
        "TO UPDATE THE CONTENTS",
        "In Microsoft Word, click inside the table of contents, choose Update Table, and select Update entire table.",
        fill=base.PALE_GRAY,
        title_color=base.BLUE_GRAY,
    )


def build_corrected_manual():
    base.SCREENSHOTS.clear()

    doc = Document()
    base.configure_styles(doc)
    base.configure_page(doc)
    base.set_update_fields(doc)
    doc.core_properties.title = "SupplySync System Administrator User Manual"
    doc.core_properties.subject = "System Administrator-only governance, audit, access control, settings, and monitoring procedures"
    doc.core_properties.author = "SupplySync Documentation Team"
    doc.core_properties.keywords = "SupplySync, System Administrator, access control, audit, system settings, read-only monitoring"

    add_cover(doc)
    add_front_matter(doc)

    # 1
    base.add_chapter(
        doc,
        1,
        "Purpose, Scope, and Role Boundary",
        "This manual documents the functions dedicated to the SupplySync System Administrator after auditing the "
        "application's role definitions, authorization middleware, navigation, capabilities, routes, and interface.",
    )
    doc.add_heading("1.1 Audit Outcome", level=2)
    doc.add_paragraph(
        "The audit confirms that the System Administrator is a platform-governance role. Its purpose is to keep "
        "SupplySync secure, available, correctly configured, and auditable. It is not the routine supply-processing role."
    )
    base.add_simple_table(
        doc,
        ["Included in This Manual", "Intentionally Excluded"],
        [
            (
                "System health and administration dashboard",
                "Creating, editing, canceling, approving, rejecting, preparing, or releasing requisitions",
            ),
            (
                "Read-only inventory and requisition monitoring",
                "Adding, editing, archiving, receiving, issuing, or adjusting inventory",
            ),
            (
                "Operating-mode governance",
                "Supporting-document submission or verification",
            ),
            (
                "Login and transaction audit review",
                "Supplier registry operations and compliance-report production",
            ),
            (
                "Roles, permissions, and staff-account administration",
                "Operational RFID tag assignment or tag-conflict resolution",
            ),
            (
                "Institution, signatory, policy, numbering, device, email, session, and telemetry settings",
                "Delivery-unit catalog, unit inventory, unit issues, and Stock Card workflows",
            ),
            (
                "The administrator's own profile, password, sessions, and login history",
                "Any workflow whose purpose is to transact supplies rather than govern the platform",
            ),
        ],
        widths=[3.25, 3.7],
    )
    base.add_callout(
        doc,
        "SERVER-ENFORCED LIMIT",
        "SupplySync explicitly blocks System Administrators from routine supply-operation routes. The permitted "
        "operational exceptions are read-only inventory and requisition views, including associated requisition "
        "documents used for monitoring or audit evidence.",
        fill=base.PALE_GREEN,
        title_color=base.BLUE_GRAY,
    )

    doc.add_heading("1.2 System Administrator Responsibilities", level=2)
    base.add_bullets(
        doc,
        [
            "Monitor database, email, storage, failed jobs, backups, user counts, and recent system activity.",
            "Review system-wide inventory and requisition indicators without performing operational transactions.",
            "Control operating mode and document the reason for every mode change.",
            "Review login and transaction audit evidence and produce filtered printable ledgers.",
            "Design least-privilege roles and maintain staff account access.",
            "Maintain institutional identity, official signatory assignments, stock policies, document-number previews, RFID device governance, notifications, session policy, and runtime telemetry.",
            "Protect the administrator's own credentials and review active sessions and login history.",
        ],
    )

    # 2
    base.add_chapter(
        doc,
        2,
        "Account Activation, Sign-In, and Recovery",
        "Use the institutional email address assigned to the System Administrator account.",
    )
    base.add_procedure(
        doc,
        "2.1 Activate an Invited Administrator Account",
        "Complete first-time registration from the invitation email.",
        [
            "Open the newest SupplySync registration invitation in the administrator's institutional mailbox.",
            "Confirm that the recipient name, email address, and intended System Administrator assignment are correct.",
            "Open the invitation link before it expires.",
            "Create and confirm a strong, unique password.",
            "Submit the form and sign in.",
            "Open the dashboard and confirm that the System Administration workspace is displayed.",
        ],
        "The account is verified and opens the System Administrator dashboard.",
        prerequisites="The staff account has been created and the invitation was delivered to the correct institutional mailbox.",
        notes="Invitation links are credentials. Do not forward, photograph, or place them in tickets or manuals.",
        screenshot=(
            "Administrator Account Activation",
            "a demonstration invitation link and the account activation page",
            "the complete registration form before entering a password",
            "page title, verified email context, password fields, validation guidance, and submit control",
            "Use a demonstration account. Blur the invitation token and email address, and leave password fields empty.",
        ),
    )
    base.add_procedure(
        doc,
        "2.2 Sign In",
        "Open the protected administration workspace.",
        [
            "Open the SupplySync sign-in page.",
            "Enter the administrator's institutional email address.",
            "Enter the password.",
            "Select Sign In.",
            "Verify the signed-in identity and System Administration dashboard title.",
        ],
        "SupplySync opens the System Administrator workspace.",
        notes="Repeated failures are recorded in Login Audit. Stop and use recovery instead of repeatedly guessing.",
        screenshot=(
            "Administrative Sign-In Page",
            "the SupplySync sign-in page in a private demonstration session",
            "the full sign-in card",
            "SupplySync branding, email field, empty password field, Forgot Password link, and Sign In button",
            "Use a synthetic email address and keep the password field empty.",
        ),
    )
    base.add_procedure(
        doc,
        "2.3 Reset a Forgotten Password",
        "Recover access through the registered institutional email address.",
        [
            "Select Forgot Password on the sign-in page.",
            "Enter the administrator account email address.",
            "Submit the reset request.",
            "Open the newest reset email and use the protected link before it expires.",
            "Enter and confirm a new strong password.",
            "Submit the reset, sign in, and review Authentication & Audit for unfamiliar activity.",
        ],
        "The new password is accepted and the administrator can sign in.",
        notes="If the email does not arrive, verify email service health and the account email before sending repeated requests.",
        screenshot=(
            "Forgot Password and Reset Flow",
            "the Forgot Password page, followed by a demonstration reset page",
            "two separate images: the email-request form and the new-password form",
            "instructions, email field, empty password fields, and primary action buttons",
            "Blur the email and completely hide the reset token. Leave all password fields empty.",
        ),
    )

    # 3
    base.add_chapter(
        doc,
        3,
        "System Administrator Navigation and Common Controls",
        "The administrator sidebar is intentionally narrower than operational workspaces.",
    )
    doc.add_heading("3.1 Administrator Navigation", level=2)
    base.add_simple_table(
        doc,
        ["Area", "System Administrator Destination", "Purpose"],
        [
            ("Overview", "Dashboard", "System health, supply summaries, shortcuts, and recent administration activity."),
            ("Logistics & Operations", "View Requisition", "Read-only requisition register and supporting evidence."),
            ("Logistics & Operations", "Open Requests", "Read-only view prefiltered to pending/open requests."),
            ("Logistics & Operations", "View Inventory", "Read-only central inventory register and item details."),
            ("Governance", "Login Audit", "Authentication attempts, access results, source evidence, and print ledger."),
            ("Governance", "Transaction Audit", "Recorded system actions, field changes, technical evidence, and print ledger."),
            ("Governance", "Roles and Permissions", "Role design and permission assignment."),
            ("Governance", "Staff Accounts", "Account creation, assignment, activation status, and invitation handling."),
            ("Governance", "System Settings", "Institutional, policy, device, notification, session, and telemetry settings."),
            ("Account footer", "Profile & Account Settings / Sign Out", "Personal profile, credentials, sessions, history, and secure exit."),
        ],
        widths=[1.25, 2.15, 3.55],
    )
    base.add_screenshot_direction(
        doc,
        "System Administrator Sidebar",
        "the System Administration dashboard with the desktop sidebar expanded",
        "the entire sidebar from the SupplySync logo through the signed-in user footer",
        "Dashboard, View Requisition, Open Requests, View Inventory, Login Audit, Transaction Audit, Roles and Permissions, Staff Accounts, System Settings, and the account footer",
        "Use a demonstration administrator and blur the displayed name and email.",
    )

    doc.add_heading("3.2 Common Interface Controls", level=2)
    base.add_bullets(
        doc,
        [
            "Sidebar collapse: reduces or expands the desktop navigation; the mobile menu opens as a drawer.",
            "Theme selector: switches among Light, Dark, and System display modes without changing records.",
            "Search and filters: narrow the current register; Reset Filters restores the full result set.",
            "Pagination: use Previous and Next or the displayed page controls to move through records.",
            "View and details controls: open a record without authorizing an operational transaction.",
            "Save Settings: commits configuration changes; read validation messages before retrying.",
            "Confirmation dialogs: describe access, mode, or deletion impact before the final action.",
            "Notifications: confirm success, show validation failures, or report service errors.",
        ],
    )

    # 4
    base.add_chapter(
        doc,
        4,
        "System Administration Dashboard",
        "Use the dashboard as the first health and governance check after signing in.",
    )
    base.add_procedure(
        doc,
        "4.1 Review System Status",
        "Confirm that the platform and primary services are available.",
        [
            "Open Dashboard.",
            "Review Total Users and Active Users.",
            "Confirm Database reports Connected.",
            "Review Email Service configuration status.",
            "Confirm the displayed Operating Mode is expected.",
            "Open the system-mode control only when runtime diagnostics or a mode change is required.",
        ],
        "The administrator identifies any service or access issue requiring investigation.",
        screenshot=(
            "Dashboard System Status",
            "Dashboard at the top of the System Administration page",
            "the page header and four system-status cards",
            "Total Users, active count, Database, Email Service, Operating Mode, database status badge, and dashboard controls",
            "Use demonstration totals and blur any administrator identity shown in the header.",
        ),
    )
    base.add_procedure(
        doc,
        "4.2 Review Read-Only Supply Indicators",
        "Identify unusual stock or request conditions without processing them.",
        [
            "Review Supply Items and the requisition-status summary.",
            "Review critical or out-of-stock indicators.",
            "Review Recent Receiving and Recent Issuance for unexpected patterns.",
            "Use Open Requests or View Inventory only to investigate the displayed record.",
            "Refer operational corrections to the appropriate separate workflow owner.",
        ],
        "Potential operational issues are identified for follow-up without an administrator transaction.",
        notes="Dashboard supply information is monitoring evidence. It does not grant authority to receive, issue, approve, reject, or release supplies.",
        screenshot=(
            "Organization-Wide Supply Overview",
            "Dashboard and scroll to Organization-wide Supply Overview",
            "the inventory, requisition-status, critical-stock, recent-receiving, and recent-issuance region",
            "summary counts, Open Requests link, stock warnings, recent movement lists, and read-only context",
            "Use synthetic item, department, supplier, and quantity data.",
        ),
    )
    base.add_procedure(
        doc,
        "4.3 Review Health, Backup, Shortcuts, and Recent Activity",
        "Check background processing, storage, backup information, and recent administration actions.",
        [
            "Review Failed Background Jobs.",
            "Review available Storage.",
            "Read Backup Status and its retention/scheduler note.",
            "Use Administration Shortcuts to open access control, settings, diagnostics, or audit pages.",
            "Review Recent System Activity for unexpected administrative events.",
            "Open Transaction Audit when more evidence is required.",
        ],
        "The administrator has a documented picture of current platform health and recent administration activity.",
        screenshot=(
            "Dashboard Health and Administration",
            "Dashboard and scroll below the supply overview",
            "the health, backup, administration-shortcut, and recent-system-activity panels",
            "failed jobs, storage, backup note, shortcuts, event action, module, actor, and time",
            "Blur actor names and any infrastructure-specific value that should not appear in documentation.",
        ),
    )

    # 5
    base.add_chapter(
        doc,
        5,
        "Read-Only Inventory Monitoring",
        "View Inventory is available for oversight and support. Administrator write controls are suppressed and server-side authorization blocks routine inventory operations.",
    )
    base.add_procedure(
        doc,
        "5.1 Search and Filter Inventory",
        "Locate an item and assess its current status.",
        [
            "Open View Inventory.",
            "Enter an item name or stock/SKU reference in Search.",
            "Optionally filter by Supplier or Status.",
            "Review item name, stock reference, supplier, quantity, unit, cost/amount where visible, and stock status.",
            "Use Reset Filters to return to the complete register.",
        ],
        "The matching inventory records are displayed without edit controls.",
        notes="Do not attempt to add, edit, archive, receive, issue, or reassign tags from the System Administrator account.",
        screenshot=(
            "Read-Only Inventory Register",
            "View Inventory with a demonstration search and status filter applied",
            "the toolbar and complete inventory table",
            "search, supplier/status filters, Reset Filters, item columns, View action, pagination, and absence of add/edit/delete controls",
            "Use synthetic stock references, supplier names, quantities, and costs.",
        ),
    )
    base.add_procedure(
        doc,
        "5.2 View Inventory Item Details",
        "Inspect the information associated with one inventory record.",
        [
            "Select View for the required item.",
            "Review identity, supplier, stock, unit, status, valuation, and descriptive fields shown.",
            "Review any movement or batch context presented as read-only evidence.",
            "Close the details window.",
            "If a correction is needed, record the item reference and refer it through the proper operational process.",
        ],
        "The item is inspected without changing its record or stock balance.",
        screenshot=(
            "Read-Only Inventory Details",
            "View Inventory and open a demonstration item's View action",
            "the full item-details window",
            "item identity, stock reference, supplier, quantity, unit, status, valuation, descriptive information, and Close control",
            "Use synthetic data and blur any RFID value or confidential procurement reference.",
        ),
    )

    # 6
    base.add_chapter(
        doc,
        6,
        "Read-Only Requisition and Open-Request Monitoring",
        "The administrator may inspect organization-wide requisitions and their evidence but does not process the workflow.",
    )
    base.add_procedure(
        doc,
        "6.1 Review the Requisition Register",
        "Locate and monitor a requisition by reference, recipient, department, item, or status.",
        [
            "Open View Requisition.",
            "Search by RIS number, request number, recipient, department, or item.",
            "Select a status filter when required.",
            "Review requested and approved quantities, request date, and current status.",
            "Use pagination to review additional results.",
        ],
        "Matching requisitions are displayed with read-only View and, where available, View RIS controls.",
        notes="The System Administrator must not create, edit, cancel, approve, reject, mark ready, or release a requisition.",
        screenshot=(
            "Read-Only Requisition Register",
            "View Requisition with demonstration records covering more than one status",
            "the summary cards, search/filter toolbar, and requisition table",
            "RIS/reference, recipient, department, purpose, item totals, dates, statuses, View, View RIS, and absence of processing actions",
            "Use synthetic names, departments, purposes, references, and quantities.",
        ),
    )
    base.add_procedure(
        doc,
        "6.2 Review Open Requests",
        "Monitor requests that still require action by an operational role.",
        [
            "Open Open Requests from the sidebar.",
            "Confirm that the page is filtered to Pending/open records.",
            "Review age, requesting office, purpose, item count, and current status.",
            "Open View only when more detail is needed.",
            "Record the reference for follow-up; do not change the request.",
        ],
        "The open-request workload is visible without an administrator workflow action.",
        screenshot=(
            "Open Requests Filter",
            "Open Requests from the System Administrator sidebar",
            "the filtered register and active status filter",
            "pending/open selection, record count, request references, departments, dates, statuses, and View action",
            "Use demonstration records and blur all personal information.",
        ),
    )
    base.add_procedure(
        doc,
        "6.3 View Requisition Details and Supporting Evidence",
        "Review the full record for governance, support, or audit.",
        [
            "Select View for the requisition.",
            "Review recipient, office, purpose, fund cluster, dates, line items, requested quantities, approved quantities, remarks, and status history shown.",
            "Open an attached supporting document only when needed and authorized.",
            "Do not upload, replace, remove, verify, return, or resubmit the document.",
            "Close the details window after recording the required evidence.",
        ],
        "The requisition and its supporting evidence are reviewed without a state change.",
        screenshot=(
            "Read-Only Requisition Details",
            "View Requisition and open a demonstration record",
            "the complete request-details window with its item and status sections",
            "recipient, office, purpose, fund cluster, requested/approved quantities, remarks, timeline/status, document-view control, and Close",
            "Use a synthetic record. Blur signatures, personal information, document references, and attached-document contents.",
        ),
    )
    base.add_procedure(
        doc,
        "6.4 View or Download the RIS",
        "Inspect the official requisition and issue slip associated with a reviewed request.",
        [
            "Select View RIS for an eligible requisition.",
            "Confirm the RIS number, institution, requesting office, purpose, items, quantities, and signatory labels.",
            "Use the available download/print control only for an authorized audit or support purpose.",
            "Close the preview without changing the requisition.",
        ],
        "The RIS is reviewed or retained as authorized evidence.",
        screenshot=(
            "RIS Preview for Monitoring",
            "View Requisition and open View RIS for a demonstration reviewed request",
            "the complete RIS preview and its close/download controls",
            "RIS title and number, institutional header, requesting office, item rows, quantities, purpose, signatory blocks, and preview controls",
            "Use synthetic data and blur signatures, names, reference numbers, and any confidential document data.",
        ),
    )

    # 7
    base.add_chapter(
        doc,
        7,
        "Operating Mode Management",
        "Only the System Administrator may change the active SupplySync environment mode.",
    )
    doc.add_heading("7.1 Available Modes", level=2)
    base.add_simple_table(
        doc,
        ["Mode", "Administrative Meaning"],
        [
            ("LIVE PRODUCTION", "Live records are active. Saved transactions affect production data."),
            ("STAGING SANDBOX", "Isolated environment used for pre-release validation."),
            ("MAINTENANCE MODE", "Routine non-administrator write operations are restricted during maintenance or audit."),
            ("TRAINING SIMULATION", "Synthetic demonstration data is used for onboarding and practice."),
        ],
        widths=[1.9, 5.05],
    )
    base.add_procedure(
        doc,
        "7.2 Review Runtime Diagnostics",
        "Inspect the current mode and environment evidence before making a change.",
        [
            "Select the System Mode badge in the header.",
            "Review Node, Latency, Status, Security, Target Environment, Changed By, and Changed At.",
            "Confirm the currently selected mode.",
            "Close the panel if no change is required.",
        ],
        "The current runtime context is understood before any administrative action.",
        screenshot=(
            "System Mode Diagnostics",
            "the System Administration dashboard and open the System Mode badge",
            "the entire diagnostics and mode-selection panel",
            "active mode, node, latency, status, security, target environment, changed-by evidence, and all four mode options",
            "Blur server node, environment identifiers, IP-related details, and the administrator name.",
        ),
    )
    base.add_procedure(
        doc,
        "7.3 Change the Operating Mode",
        "Move SupplySync to an approved operating environment and create an audit record.",
        [
            "Confirm the maintenance, testing, training, or production change has been authorized.",
            "Open the System Mode panel.",
            "Select the required target mode.",
            "Read the Mode Impact Assessment.",
            "Enter a specific reason for the change.",
            "Select Confirm & Switch Operating Mode.",
            "Confirm the new badge and environment are displayed.",
            "Open Transaction Audit and verify the Operating Mode Switched event.",
        ],
        "The new mode is active and the change, actor, time, source, and reason are recorded.",
        notes="Changing to LIVE PRODUCTION can enable real record modifications. Changing to MAINTENANCE MODE can interrupt staff workflows. Coordinate the change and define the return plan first.",
        screenshot=(
            "Operating Mode Change Confirmation",
            "the System Mode panel and select a non-active demonstration target mode without submitting",
            "the Change Operating Mode confirmation dialog",
            "source mode, target mode, impact assessment, reason field, Cancel, and Confirm & Switch Operating Mode",
            "Use a demonstration environment. Blur administrator identity and infrastructure values; do not execute a production change only for a screenshot.",
        ),
    )

    # 8
    base.add_chapter(
        doc,
        8,
        "Login Audit",
        "Use Login Audit to review authentication attempts, access results, source evidence, and account activity.",
    )
    base.add_procedure(
        doc,
        "8.1 Review Login Audit Summary and Records",
        "Assess successful and failed authentication activity.",
        [
            "Open Login Audit.",
            "Review Total Records, Successful, Failed Logins, and the distinct-user summary.",
            "Review each record's account identity, role, result, time, source information, and available session evidence.",
            "Prioritize repeated failures, unexpected locations or devices, and activity outside normal hours.",
        ],
        "Potential authentication anomalies are identified for investigation.",
        screenshot=(
            "Login Audit Overview",
            "Login Audit with demonstration successful and failed events",
            "the page header, summary cards, toolbar, and first page of records",
            "totals, success/failure indicators, account/role, result, time, masked source IP, and Print Ledger",
            "Use demonstration accounts. Blur names, emails, IP addresses, device data, and session identifiers.",
        ),
    )
    base.add_procedure(
        doc,
        "8.2 Filter Login Evidence",
        "Narrow the audit to a specific account, role, result, or period.",
        [
            "Enter a name, email, or relevant reference in Search.",
            "Select a Role when required.",
            "Select an authentication Status.",
            "Enter Date From and Date To.",
            "Review the filtered summary and records.",
            "Use Reset Filters to restore the complete ledger.",
        ],
        "Only records matching the investigation criteria are displayed.",
        screenshot=(
            "Filtered Login Audit",
            "Login Audit with a demonstration search, failed status, and date range applied",
            "the complete filter toolbar and resulting records",
            "search, role, status, dates, reset control, active-filter indicator, and filtered results",
            "Use synthetic data and blur every email, IP address, device, and session value.",
        ),
    )
    base.add_procedure(
        doc,
        "8.3 Print or Export the Login Ledger",
        "Produce a controlled authentication-audit record.",
        [
            "Apply the required filters.",
            "Select Print Ledger.",
            "Review the print layout, title, filters, generated time, and record columns.",
            "Choose the approved printer or Save as PDF.",
            "Store the output in the authorized audit repository.",
        ],
        "A filtered official authentication ledger is printed or exported.",
        notes="A printed or saved ledger may contain personal and security information. Apply the institution's retention and access rules.",
        screenshot=(
            "Printable Login Audit Ledger",
            "Login Audit with safe demonstration filters, select Print Ledger, and open print preview",
            "the first print-preview page",
            "official title, applied criteria, generation details, column headings, sample rows, and page structure",
            "Use synthetic data and blur account names, emails, IP addresses, and session evidence.",
        ),
    )

    # 9
    base.add_chapter(
        doc,
        9,
        "Transaction Audit",
        "Use Transaction Audit to reconstruct configuration, access-control, and application events.",
    )
    base.add_procedure(
        doc,
        "9.1 Review Transaction Activity",
        "Identify important or unexpected recorded actions.",
        [
            "Open Transaction Audit.",
            "Review the summary cards and recent records.",
            "Review actor, action, module, status, time, and record reference.",
            "Switch between Business and Technical view when deeper evidence is required.",
            "Expand a record to review metadata, changed fields, before/after values, request evidence, and status context.",
        ],
        "The administrator can explain who performed an action, what changed, and when it occurred.",
        screenshot=(
            "Transaction Audit Overview",
            "Transaction Audit with demonstration administrative and system events",
            "the page header, summary, view-mode control, toolbar, and first page of records",
            "actor, action, module, status, time, record context, expand control, and Print Ledger",
            "Use synthetic records and blur names, emails, IP addresses, identifiers, and sensitive metadata.",
        ),
    )
    base.add_procedure(
        doc,
        "9.2 Filter and Inspect Expanded Evidence",
        "Isolate a specific action and review its detailed evidence.",
        [
            "Search for an actor, reference, or event term.",
            "Select Module and Action.",
            "Set Date From and Date To.",
            "Select Technical view when request or change metadata is required.",
            "Expand the target record.",
            "Review changes, updated fields, previous/current values, and available request context.",
            "Reset filters after the investigation.",
        ],
        "The relevant event and its change evidence are visible.",
        screenshot=(
            "Expanded Transaction Evidence",
            "Transaction Audit in Technical view with demonstration module/action/date filters applied and one record expanded",
            "the filter toolbar and complete expanded-details region",
            "active filters, action/module, actor, time, before/after changes, metadata labels, status, and record reference",
            "Use synthetic evidence. Blur IP addresses, user identifiers, tokens, paths, device secrets, and confidential values.",
        ),
    )
    base.add_procedure(
        doc,
        "9.3 Print or Export the Transaction Ledger",
        "Produce a controlled record of selected system activity.",
        [
            "Apply the required search, module, action, dates, and view mode.",
            "Select Print Ledger.",
            "Verify the report title, applied filters, generation details, and record columns.",
            "Print or save as PDF to the approved repository.",
        ],
        "The selected transaction evidence is available as a controlled ledger.",
        screenshot=(
            "Printable Transaction Audit Ledger",
            "Transaction Audit with safe demonstration filters, select Print Ledger, and open print preview",
            "the first print-preview page",
            "official title, applied criteria, generation details, event columns, sample records, and pagination",
            "Use synthetic data and redact personal, network, device, and configuration secrets.",
        ),
    )

    # 10
    base.add_chapter(
        doc,
        10,
        "Roles and Permissions",
        "Design access according to least privilege. Built-in system roles are protected; custom roles may be created and retired.",
    )
    base.add_procedure(
        doc,
        "10.1 Review the Role Register",
        "Assess role coverage, assigned users, and permission counts.",
        [
            "Open Roles and Permissions.",
            "Review the summary and role table.",
            "Search for a role by name.",
            "Distinguish protected system roles from custom roles.",
            "Review assigned-user and permission counts before making a change.",
        ],
        "The administrator understands current access design and role usage.",
        screenshot=(
            "Roles and Permissions Register",
            "Roles and Permissions with the complete role list visible",
            "the page header, access-control summary, search field, and role table",
            "role names, system/custom indicators, user counts, permission counts, and available actions",
            "Use synthetic role assignments or blur user-related counts if considered sensitive.",
        ),
    )
    base.add_procedure(
        doc,
        "10.2 Create a Custom Role",
        "Add a clearly named access role for a defined duty set.",
        [
            "Confirm the duty cannot be met safely by an existing role.",
            "Select Create Role.",
            "Enter a unique descriptive Role Name.",
            "Select Create Role.",
            "Open the new role for editing and assign only the required permissions.",
            "Verify the final permission count before assigning staff.",
        ],
        "A custom role exists with a controlled permission set.",
        notes="A role name does not grant authority by itself. Permissions determine actual access.",
        screenshot=(
            "Create Custom Role",
            "Roles and Permissions and open Create Role",
            "the complete Create Role dialog before submission",
            "Role Name, guidance, Cancel, and Create Role",
            "Use a neutral demonstration role name that is not an actual person's title or identity.",
        ),
    )
    base.add_procedure(
        doc,
        "10.3 Edit Role Permissions",
        "Add or remove capabilities from an existing role.",
        [
            "Select Edit for the role.",
            "For a custom role, correct the Role Name if necessary; protected system-role names remain locked.",
            "Select a permission module.",
            "Search or review the permissions in that module.",
            "Select or clear only the permissions justified by the role's documented duties.",
            "Review the assigned-permission total.",
            "Select Save Changes.",
            "Test the role with a non-production account and review Transaction Audit.",
        ],
        "The role contains only the approved capabilities and the change is auditable.",
        notes="Permission changes can immediately affect access. Preserve at least one valid System Administrator account and avoid granting operational permissions merely for convenience.",
        screenshot=(
            "Edit Role and Permission Assignments",
            "Roles and Permissions and open Edit on a demonstration custom role",
            "the entire Edit Role & Permissions dialog",
            "role type, role name, module list, permission search, checkboxes, assigned count, Cancel, and Save Changes",
            "Use a synthetic role and blur any internal permission identifier not intended for publication.",
        ),
    )
    base.add_procedure(
        doc,
        "10.4 Delete a Custom Role",
        "Retire an unused custom role.",
        [
            "Confirm the role is custom and is no longer required.",
            "Identify and reassign every staff account currently using the role.",
            "Review the role one final time.",
            "Select Delete.",
            "Read the permanent-deletion warning.",
            "Select Delete Role.",
            "Confirm the role no longer appears and review Transaction Audit.",
        ],
        "The unused custom role is removed without stranding staff access.",
        notes="Protected system roles cannot be deleted. Deleting a custom role is irreversible and can remove permissions from assigned staff.",
        screenshot=(
            "Delete Custom Role Confirmation",
            "Roles and Permissions and open Delete for an unused demonstration custom role",
            "the full Delete System Role confirmation dialog without confirming",
            "role name, impact warning, Cancel, and Delete Role",
            "Use an unassigned demonstration role and do not delete a live role only for a screenshot.",
        ),
    )

    # 11
    base.add_chapter(
        doc,
        11,
        "Staff Accounts",
        "Maintain staff identity, role assignment, department context, invitation status, and account availability.",
    )
    base.add_procedure(
        doc,
        "11.1 Review and Filter Staff Accounts",
        "Locate an account and review its current access state.",
        [
            "Open Staff Accounts.",
            "Review totals for staff, active accounts, disabled accounts, and assigned roles.",
            "Search by name or email.",
            "Filter by role or account status when available.",
            "Review role, department, verification, and Active/Disabled status.",
        ],
        "The required account and its access state are identified.",
        screenshot=(
            "Staff Accounts Roster",
            "Staff Accounts with demonstration active, unverified, and disabled accounts",
            "the summary, filters, and staff roster",
            "name/email, role, department, verification, account status, Resend Invite, Edit, Enable/Disable, and filtered-roster indicator",
            "Use synthetic staff. Blur all names, email addresses, departments, and identifiers.",
        ),
    )
    base.add_procedure(
        doc,
        "11.2 Add a Staff Account",
        "Register a staff identity and send an activation invitation.",
        [
            "Confirm the approved full name, institutional email, required role, and department assignment.",
            "Select Add Staff.",
            "Enter Full Name and Email Address.",
            "Select the System Role.",
            "Complete Department and Office Head fields when applicable.",
            "Select Add Staff.",
            "Confirm the roster entry and invitation status.",
        ],
        "The account is created and a registration invitation is sent to the approved email address.",
        notes="Assign the minimum role needed. Only a System Administrator may assign the protected administrator role.",
        screenshot=(
            "Add Staff Account",
            "Staff Accounts and open Add Staff",
            "the complete Add Staff Account dialog before submission",
            "Full Name, Email Address, System Role, department assignment fields, invitation note, Cancel, and Add Staff",
            "Use a synthetic identity and email; do not send an invitation solely for the screenshot.",
        ),
    )
    base.add_procedure(
        doc,
        "11.3 Edit Staff Identity and Assignment",
        "Correct account details or change approved access assignments.",
        [
            "Select Edit for the staff account.",
            "Verify that the selected account is the intended person.",
            "Update name or institutional email as approved.",
            "Change the role only when the new duty assignment is authorized.",
            "Update department or office-head context when applicable.",
            "Save the changes.",
            "Review the roster and Transaction Audit.",
        ],
        "The account shows the correct identity and approved assignment.",
        notes="Changing a role changes effective access. Use formal authorization and avoid modifying your own administrator assignment during routine maintenance.",
        screenshot=(
            "Edit Staff Account",
            "Staff Accounts and open Edit for a demonstration user",
            "the complete Edit Staff Account dialog",
            "identity fields, role selector, department/office-head fields, current account context, Cancel, and Save",
            "Use a synthetic account and blur all personal information.",
        ),
    )
    base.add_procedure(
        doc,
        "11.4 Disable or Enable an Account",
        "Immediately revoke or restore sign-in access.",
        [
            "Locate the account.",
            "Select Disable for an active account or Enable for a disabled account.",
            "Read the access-impact message.",
            "Confirm Disable Account or Enable Account.",
            "Verify the new roster status.",
            "Review active sessions or Login Audit when disabling for security reasons.",
        ],
        "The account is blocked or restored according to the approved decision.",
        notes="Disabling an account invalidates active access and blocks future authentication until re-enabled.",
        screenshot=(
            "Staff Account Status Confirmation",
            "Staff Accounts and open Disable or Enable for a demonstration account",
            "the complete status confirmation dialog without confirming",
            "staff identity, current action, access-impact message, Cancel, and Disable Account or Enable Account",
            "Use a synthetic account and blur its name and email.",
        ),
    )
    base.add_procedure(
        doc,
        "11.5 Resend an Invitation",
        "Issue a new registration email to an unverified or disabled account after confirming the address.",
        [
            "Locate the unverified or disabled staff account.",
            "Verify the displayed institutional email address.",
            "Select Resend Invite.",
            "Wait for the success or failure notification.",
            "Ask the recipient to use only the newest invitation and securely discard older links.",
        ],
        "A new invitation is sent to the verified account address.",
        notes="Do not resend repeatedly before checking email service health, address accuracy, and spam filtering.",
        screenshot=(
            "Resend Staff Invitation",
            "Staff Accounts with one demonstration unverified account visible",
            "the relevant roster row and the Resend Invite control before selecting it",
            "verification/account state, masked email, Resend Invite, Edit, and Enable/Disable actions",
            "Use a synthetic account and blur the email address.",
        ),
    )

    # 12
    base.add_chapter(
        doc,
        12,
        "System Settings",
        "System Settings contains seven administrator-controlled configuration areas. Changes should be authorized, documented, and verified.",
    )
    doc.add_heading("12.1 Settings Navigation and Save Control", level=2)
    base.add_bullets(
        doc,
        [
            "01 Institution: institutional identity, fund cluster, custodial office, address, responsibility-center code, and logo path.",
            "02 Signatories: signatory directory and official-form assignments.",
            "03 Inventory Rules: low/critical thresholds, strict stock enforcement, and units of issue.",
            "04 Numbering: read-only document sequence formats and previews.",
            "05 RFID: web scan policy and registered handheld scanner governance.",
            "06 Notifications: automated low-stock email settings and diagnostic email.",
            "07 Operations: session timeout, policy snapshot, and runtime telemetry.",
        ],
    )
    base.add_screenshot_direction(
        doc,
        "System Settings Navigation",
        "System Settings with the Institution tab selected",
        "the page header, Save Settings control, and all seven category tabs",
        "Institution, Signatories, Inventory Rules, Numbering, RFID, Notifications, Operations, tab numbers, and active-tab styling",
        "Use demonstration configuration and blur any institution-specific value that should not be published.",
    )

    base.add_procedure(
        doc,
        "12.2 Institution and Branding",
        "Maintain the institutional identity printed or displayed by SupplySync.",
        [
            "Open System Settings > Institution.",
            "Review Institution Name, Default Fund Cluster, Acronym, Custodial Office, Campus Address, Responsibility Center Code, and Logo Path.",
            "Update only approved values.",
            "Select Save Settings.",
            "Verify the success notification and inspect an affected header or document preview when appropriate.",
        ],
        "SupplySync uses the approved institutional identity and defaults.",
        notes="Branding and responsibility-center changes can affect official documents. Confirm spelling, codes, and formatting before saving.",
        screenshot=(
            "Institution and Branding Settings",
            "System Settings > Institution",
            "the complete institution settings panel",
            "institution name, fund cluster, acronym, custodial office, campus address, responsibility-center code, logo path, and Save Settings",
            "Use authorized demonstration values or blur official codes, addresses, and file paths.",
        ),
    )

    base.add_procedure(
        doc,
        "12.3 Signatory Directory and Form Assignments",
        "Maintain approved officials and connect them to official document signature blocks.",
        [
            "Open System Settings > Signatories.",
            "Review the current RIS approving and issuing officers, optional OIC prefix, RSMI officers, RPCI officers, and MOR issuing officer.",
            "To add a person, open Add New Signatory and enter Full Name, Official Designation/Title, and optional Office/Department.",
            "Assign the approved directory entry to the required form position.",
            "Complete any accompanying designation or position field.",
            "Select Save Settings.",
            "Verify the assignment in a safe document preview.",
        ],
        "Official forms draw their signature labels from the approved signatory assignments.",
        notes="Adding a directory entry does not itself authorize a person. Use only formally approved names and designations.",
        screenshot=(
            "Official Form Signatory Assignments",
            "System Settings > Signatories with demonstration assignments",
            "the form-assignment sections from RIS through the lower official-form assignments",
            "officer selectors, designation/position fields, OIC control, assigned names, and Save Settings",
            "Use synthetic officials or blur real names, titles, and office information.",
        ),
    )
    base.add_screenshot_direction(
        doc,
        "Add New Signatory",
        "System Settings > Signatories and open Add New Signatory",
        "the complete dialog before submission",
        "Full Name, Official Designation/Title, Office/Department, Cancel, and Add Signatory",
        "Use synthetic details and do not add a real official only for documentation.",
    )

    base.add_procedure(
        doc,
        "12.4 Stock and Reorder Rules",
        "Set organization-wide warning thresholds, enforcement policy, and standardized units.",
        [
            "Open System Settings > Inventory Rules.",
            "Review Low Stock Threshold and Critical Stock Threshold.",
            "Confirm the critical value does not exceed the low-stock value.",
            "Enable or disable Strict Stock Enforcement only under approved policy.",
            "Review the Units of Issue list; add or remove a unit only when its official usage is confirmed.",
            "Select Save Settings.",
            "Verify that validation succeeds and dashboard/item status behavior remains expected.",
        ],
        "Stock warnings and applicable quantity controls follow the approved policy.",
        notes="These are policy settings, not inventory transactions. Threshold changes can alter many item status indicators immediately.",
        screenshot=(
            "Stock and Reorder Rules",
            "System Settings > Inventory Rules",
            "the complete inventory-policy panel",
            "low-stock threshold, critical threshold, strict stock enforcement, unit list, add/remove controls, validation guidance, and Save Settings",
            "Use approved demonstration values; do not change production policy solely for a screenshot.",
        ),
    )

    base.add_procedure(
        doc,
        "12.5 Document Sequences",
        "Review the formats and examples used for system-generated official numbers.",
        [
            "Open System Settings > Numbering.",
            "Review the read-only RIS, RSMI, RPCI, Stock Card, and MOR/MR formats.",
            "Review the displayed previews and year-first numbering behavior.",
            "Record an unexpected format for technical investigation.",
            "Do not create an operational document merely to test a number from the administrator account.",
        ],
        "The administrator confirms the active read-only numbering formats and previews.",
        screenshot=(
            "Read-Only Document Sequence Previews",
            "System Settings > Numbering",
            "the complete numbering panel",
            "RIS, RSMI, RPCI, Stock Card, MOR/MR labels, formats, previews, and read-only explanation",
            "Mask any live next-number information if sequence confidentiality is required.",
        ),
    )

    base.add_procedure(
        doc,
        "12.6 Register an RFID Handheld Scanner",
        "Create a trusted device identity and securely transfer its one-time token.",
        [
            "Open System Settings > RFID.",
            "Review Warehouse Operating Mode and Browser Scan Debounce.",
            "Open the scanner registration section.",
            "Enter Device ID, Device Name, and Server URL.",
            "Select Register Device.",
            "Copy the one-time device token immediately through the approved secure credential process.",
            "Confirm that the device appears in the registered-scanner list.",
        ],
        "The scanner is registered and its one-time token is securely transferred.",
        notes="The token is a secret and may be shown only once. Never place it in a screenshot, manual, chat, ticket, or unsecured file.",
        screenshot=(
            "Register RFID Scanner",
            "System Settings > RFID and open the registration area before submission",
            "the registration controls without generating or showing a token",
            "warehouse mode, browser debounce, Device ID, Device Name, Server URL, and Register Device",
            "Use synthetic values. Do not capture the one-time token or a production server URL.",
        ),
    )
    base.add_procedure(
        doc,
        "12.7 Configure, Test, or Restrict an RFID Scanner",
        "Maintain registered-device connectivity, scanning behavior, and server trust.",
        [
            "Select the registered scanner.",
            "Review Device ID, Firmware, Last Seen, IP Address, Config Version, network status, and reader diagnostics.",
            "Update Station ID, Device Name, Wi-Fi request, Server URL, Scan Mode, RF Power, Timeout, Heartbeat, or Auto Reconnect as approved.",
            "Select Save & Apply Configuration.",
            "Select Test Connection and review the result.",
            "Use Rotate Secret only when coordinated device reconfiguration is ready.",
            "Use Enable/Disable Server Access or Revoke Scanner only under an approved access decision.",
            "Record the action and verify the resulting device status.",
        ],
        "The scanner reports the intended configuration and access state.",
        notes="This section governs scanner devices. It does not authorize operational item-tag assignment, tag replacement, or tag-conflict resolution.",
        screenshot=(
            "RFID Scanner Configuration and Diagnostics",
            "System Settings > RFID with a demonstration scanner selected",
            "the device summary, diagnostics, configuration fields, and device action controls",
            "firmware, last seen, masked IP, config/network status, diagnostics, station, server, scan mode, RF power, timeout, heartbeat, auto reconnect, save/test/secret/access/revoke controls",
            "Blur IP, SSID, Wi-Fi password, server URL, device token/secret, internal identifiers, and any production device data.",
        ),
    )

    base.add_procedure(
        doc,
        "12.8 Email and Notifications",
        "Configure low-stock alert delivery and verify outbound email.",
        [
            "Open System Settings > Notifications.",
            "Enable or disable automated low-stock warning emails.",
            "Enter the approved Alert Recipient Email.",
            "Select Save Settings.",
            "In Test Email Delivery, enter a test recipient or use the approved default.",
            "Select Send Test and confirm receipt.",
            "Review any error notification and dashboard Email Service status when delivery fails.",
        ],
        "Low-stock alerts use the saved recipient and diagnostic email delivery is verified.",
        screenshot=(
            "Email and Notification Settings",
            "System Settings > Notifications",
            "the complete alert and test-email panels",
            "low-stock toggle, alert recipient, test recipient, Save Settings, and Send Test",
            "Use a test mailbox or blur both email addresses. Do not expose mail-server credentials.",
        ),
    )

    base.add_procedure(
        doc,
        "12.9 Operations and Telemetry",
        "Maintain inactivity logout policy and review/export platform diagnostics.",
        [
            "Open System Settings > Operations.",
            "Set Session Inactivity Logout within the permitted 5–480 minute range.",
            "Select Save Settings if the value changed.",
            "Review Policy Backup & Archival Export.",
            "Select Download Policy Snapshot (JSON) only when an authorized configuration record is required.",
            "Review PHP Runtime, Laravel version, Database Driver, Operating Mode, and Server Node.",
            "Store exported policy and telemetry evidence only in the approved administrative repository.",
        ],
        "Session policy and runtime configuration evidence are available and controlled.",
        notes="Policy snapshots and telemetry can disclose institutional and infrastructure configuration.",
        screenshot=(
            "Operations and Telemetry",
            "System Settings > Operations",
            "the complete session, policy backup, and runtime telemetry panel",
            "inactivity range, Save Settings, policy-snapshot download, PHP, Laravel, database driver, operating mode, and server node",
            "Blur server node, infrastructure identifiers, and configuration values not approved for publication.",
        ),
    )

    # 13
    base.add_chapter(
        doc,
        13,
        "Profile and Account Security",
        "Maintain the signed-in administrator's identity, credentials, sessions, and authentication history.",
    )
    base.add_procedure(
        doc,
        "13.1 Update Personnel Information",
        "Correct the administrator's own name or institutional email.",
        [
            "Open Profile & Account Settings.",
            "Select Personnel Information.",
            "Update the permitted name or email fields.",
            "Review the role and account context displayed.",
            "Save the profile.",
        ],
        "The signed-in account displays the corrected identity.",
        notes="Role and administrative assignment should be maintained through Staff Accounts, not treated as an ordinary profile edit.",
        screenshot=(
            "Administrator Personnel Information",
            "Profile & Account Settings > Personnel Information",
            "the personnel header and complete profile form",
            "name, masked email, role/account context, verification status, and save control",
            "Use a demonstration account or blur every personal value.",
        ),
    )
    base.add_procedure(
        doc,
        "13.2 Change the Administrator Password",
        "Replace the current password using email OTP verification.",
        [
            "Open Security Credentials.",
            "Enter the current password.",
            "Enter and confirm the new strong password.",
            "Request the email verification code.",
            "Enter the six-digit OTP before it expires.",
            "Use Resend OTP only when necessary.",
            "Submit the change and confirm the success state.",
            "Review Authentication & Audit for unexpected sessions.",
        ],
        "The password changes only after current-password and OTP verification succeeds.",
        notes="Never capture, share, or store current passwords, new passwords, or OTPs.",
        screenshot=(
            "Password and OTP Security",
            "Profile & Account Settings > Security Credentials before entering any secret",
            "the complete password-change workflow",
            "current password, new/confirmation fields, requirements, OTP step, Resend OTP, and submit control",
            "Leave every password and OTP field empty and blur the destination email.",
        ),
    )
    base.add_procedure(
        doc,
        "13.3 Review Active Sessions and Login History",
        "Detect unexpected access to the administrator account.",
        [
            "Open Authentication & Audit.",
            "Review Active Sessions, devices, timestamps, and available session actions.",
            "Review Login History.",
            "If an event is unfamiliar, terminate the available session, change the password, and investigate Login Audit.",
            "Document the incident according to policy.",
        ],
        "Expected access is confirmed or an incident response is started.",
        screenshot=(
            "Administrator Sessions and Login History",
            "Profile & Account Settings > Authentication & Audit using a demonstration administrator",
            "the active-session and login-history panels",
            "device/session labels, masked source/location, timestamps, results, and available session action",
            "Blur IP addresses, locations, device fingerprints, emails, and session identifiers.",
        ),
    )
    base.add_procedure(
        doc,
        "13.4 Sign Out Securely",
        "End the current administrator session when work is complete.",
        [
            "Open the signed-in user menu in the sidebar footer.",
            "Select Sign Out.",
            "Review the confirmation dialog.",
            "Confirm sign out.",
            "Verify that the sign-in page is displayed.",
        ],
        "The current session ends and the protected workspace is no longer visible.",
        screenshot=(
            "Administrator Sign-Out Confirmation",
            "the System Administrator sidebar footer and select Sign Out",
            "the complete sign-out confirmation dialog before confirming",
            "signed-in context, confirmation message, Cancel, and Sign Out",
            "Use a demonstration account and blur its identity.",
        ),
    )

    # 14
    base.add_chapter(
        doc,
        14,
        "Security and Operating Practices",
        "Apply these controls consistently to protect access, availability, evidence, and recoverability.",
    )
    doc.add_heading("14.1 Daily Administrator Check", level=2)
    base.add_bullets(
        doc,
        [
            "Confirm Database, Email Service, Operating Mode, Failed Background Jobs, Storage, and Backup Status.",
            "Review critical/out-of-stock indicators and open-request counts as read-only monitoring.",
            "Review recent administrative activity and investigate unexpected events.",
            "Review failed login trends and important transaction-audit events.",
            "Confirm Maintenance, Staging, or Training mode has not remained active longer than authorized.",
        ],
    )
    doc.add_heading("14.2 Weekly Access and Configuration Check", level=2)
    base.add_bullets(
        doc,
        [
            "Review disabled, unverified, and pending-invitation staff accounts.",
            "Review System Administrator assignments and custom roles for least privilege.",
            "Review signatory assignments, stock thresholds, notification delivery, and scanner connectivity.",
            "Export or print only the audit evidence required by policy.",
            "Confirm policy snapshots and sensitive exports are stored in approved locations.",
        ],
    )
    doc.add_heading("14.3 Change-Control Rules", level=2)
    base.add_bullets(
        doc,
        [
            "Record the authorization, purpose, planned time, expected impact, verification method, and rollback approach before a service-affecting change.",
            "Use a specific reason for every operating-mode change.",
            "Test permission and configuration changes with a demonstration account or non-production environment when possible.",
            "Never remove the last working System Administrator assignment.",
            "Coordinate scanner secret rotation, access disablement, or revocation with physical device support.",
            "Review Transaction Audit after access, mode, or configuration changes.",
        ],
    )
    doc.add_heading("14.4 Screenshot Capture Standard", level=2)
    base.add_bullets(
        doc,
        [
            "Recommended size: 1440 × 900 or larger, browser zoom 100%, Light theme, and sidebar expanded unless directed otherwise.",
            "Capture the page title and enough navigation context to identify the location.",
            "Use synthetic data designed to show the function and relevant validation state.",
            "Do not crop warning messages, required-field markers, status indicators, or primary actions.",
            "Blur passwords, OTPs, invitation/reset links, tokens, secrets, Wi-Fi data, server URLs, IP addresses, personal data, signatures, and confidential documents.",
            "Name each file with its screenshot ID, for example SS-05_Dashboard_System_Status.png.",
        ],
    )
    base.add_screenshot_direction(
        doc,
        "Screenshot Style Reference",
        "Dashboard in Light theme at 100% browser zoom with the sidebar expanded and only demonstration data visible",
        "one clean full-window example used as the style reference for all later captures",
        "page title, active sidebar item, top controls, complete primary workspace, consistent margins, and readable text",
        "Confirm that every visible name, email, reference, IP address, infrastructure value, and operational value is synthetic or properly blurred.",
    )

    # 15
    base.add_chapter(
        doc,
        15,
        "System Administrator Troubleshooting",
        "Use the visible message, current mode, service status, and audit evidence before changing access or configuration.",
    )
    base.add_callout(
        doc,
        "ESCALATION PACKAGE",
        "Record the page, time, administrator identity, active operating mode, action attempted, exact message, relevant "
        "reference, and a privacy-safe screenshot. Include a filtered audit record or policy snapshot only when authorized. "
        "Never include passwords, OTPs, reset/invitation links, device secrets, or Wi-Fi credentials.",
        fill=base.PALE_AMBER,
        title_color=base.MAROON,
    )
    base.add_simple_table(
        doc,
        ["Issue", "Checks and Corrective Action"],
        [
            (
                "Cannot sign in",
                "Verify email spelling, account status, password, active system mode, and Login Audit. Use password recovery or a verified invitation as appropriate.",
            ),
            (
                "Invitation or reset email not received",
                "Confirm the account email, dashboard Email Service status, spam filtering, and diagnostic email. Resend only after verifying the address.",
            ),
            (
                "Dashboard shows a database or email problem",
                "Record the exact status and time, review recent activity and telemetry, avoid unrelated changes, and escalate with privacy-safe evidence.",
            ),
            (
                "System Settings will not save",
                "Review required fields, numeric ranges, threshold relationships, validation messages, permissions, current mode, and Transaction Audit.",
            ),
            (
                "Inventory or requisition write controls are missing",
                "This is expected for the System Administrator. Use the pages only for read-only monitoring and refer the operational task to its separate workflow owner.",
            ),
            (
                "Operating mode will not change",
                "Confirm the account is a System Administrator, select a different valid mode, provide a reason, review validation, and check Transaction Audit or application errors.",
            ),
            (
                "Role change does not appear effective",
                "Verify the role was saved, confirm the staff assignment, review the actual permission set, sign out and back in when required, and inspect Transaction Audit.",
            ),
            (
                "Cannot delete a role",
                "Confirm it is a custom role, not protected, and reassign any staff before deletion.",
            ),
            (
                "Account cannot be edited or disabled",
                "Confirm the target protection rules and that the current administrator has the necessary authority. Avoid disabling the last administrator account.",
            ),
            (
                "Audit results seem incomplete",
                "Clear filters, broaden the date range, verify module/action/status filters, switch Business/Technical view where applicable, and check pagination.",
            ),
            (
                "Audit ledger print is incomplete",
                "Apply filters before Print Ledger, use print preview, confirm orientation/scaling, and verify the approved printer or PDF destination.",
            ),
            (
                "RFID scanner will not connect",
                "Review enabled status, last seen, network revision, masked network/server settings, configuration version, diagnostics, Test Connection, and coordinated physical checks.",
            ),
            (
                "Unexpected session logout",
                "Review the 5–480 minute inactivity setting, account status, mode changes, active sessions, and Login Audit.",
            ),
        ],
        widths=[1.8, 5.15],
    )
    # Appendices
    base.add_chapter(doc, "A", "System Administrator Glossary")
    base.add_simple_table(
        doc,
        ["Term", "Definition"],
        [
            ("Active Account", "A staff account permitted to authenticate according to its assigned role."),
            ("Authentication Audit", "Recorded evidence of sign-in attempts, results, source information, and sessions."),
            ("Custom Role", "Administrator-created role whose permissions can be tailored and which may be deleted when safely retired."),
            ("Protected System Role", "Built-in role with safeguards against renaming or deletion."),
            ("Least Privilege", "Granting only the permissions needed to perform approved duties."),
            ("Operating Mode", "The active SupplySync environment state: production, staging, maintenance, or training."),
            ("Policy Snapshot", "JSON export of current policy, institutional, and signatory configuration."),
            ("Read-Only Monitoring", "Viewing operational records for governance without creating or changing transactions."),
            ("RIS", "Requisition and Issue Slip available to the administrator as read-only requisition evidence."),
            ("Session Timeout", "Configured inactivity period after which authentication ends."),
            ("Transaction Audit", "Recorded evidence of application actions, actors, times, status, metadata, and field changes."),
            ("One-Time Device Token", "Scanner-registration secret shown once and transferred through a secure credential process."),
            ("RFID Device Governance", "Registration, configuration, diagnostics, secret rotation, server access, and revocation of scanners—not item-tag operations."),
        ],
        widths=[2.05, 4.9],
    )

    base.add_chapter(doc, "B", "System Administrator Screenshot Checklist")
    base.add_callout(
        doc,
        "FILE NAMING",
        "Use the screenshot ID followed by a short title, for example SS-15_Operating_Mode_Change_Confirmation.png. "
        "Keep an editable source copy when arrows or redaction boxes are added.",
        fill=base.PALE_GREEN,
        title_color=base.BLUE_GRAY,
    )
    base.add_simple_table(
        doc,
        ["ID", "Screenshot", "Capture Direction"],
        [(sid, title, instruction) for sid, title, instruction in base.SCREENSHOTS],
        widths=[0.62, 1.65, 4.68],
    )

    base.add_chapter(doc, "C", "Administrator Handover Record")
    doc.add_paragraph(
        "Use this page when responsibility for SupplySync System Administration changes. Keep the completed record in an approved administrative repository."
    )
    base.add_simple_table(
        doc,
        ["Handover Item", "Completion / Notes"],
        [
            ("Outgoing administrator", ""),
            ("Incoming administrator", ""),
            ("Effective date and time", ""),
            ("Active operating mode and return plan confirmed", ""),
            ("At least one working protected administrator assignment confirmed", ""),
            ("Custom roles and permission exceptions reviewed", ""),
            ("Pending invitations, unverified users, and disabled accounts reviewed", ""),
            ("Login and transaction audit concerns handed over", ""),
            ("Database, email, jobs, storage, and backup status reviewed", ""),
            ("System Settings and policy snapshot location reviewed", ""),
            ("RFID scanner inventory, status, and secret-custody process reviewed", ""),
            ("Open monitoring concerns and escalation contacts handed over", ""),
            ("Manual version and outstanding changes recorded", ""),
        ],
        widths=[2.75, 4.2],
    )
    base.add_callout(
        doc,
        "FINAL CONTROL",
        "Do not write passwords, OTPs, invitation/reset links, scanner tokens, device secrets, or Wi-Fi credentials in "
        "this record. Transfer credentials only through the institution's approved secure process.",
        fill=base.PALE_AMBER,
        title_color=base.MAROON,
    )

    base.OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(base.OUTPUT)
    print(f"Created {base.OUTPUT}")
    print(f"Version: {VERSION}")
    print(f"Screenshot directions: {len(base.SCREENSHOTS)}")


if __name__ == "__main__":
    build_corrected_manual()
