from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

import build_supplysync_system_admin_manual as base


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "SupplySync_Inventory_Staff_Manual.docx"
UCN_LOGO = ROOT / "public" / "images" / "ucnlogo.png"
SUPPLYSYNC_LOGO = ROOT / "public" / "images" / "supplysync-sidebar-logo.png"

VERSION = "1.0"
EFFECTIVE_DATE = "12 November 2026"
DOCUMENT_ID = "SS-INV-MAN-001"

BLACK = "111111"
DARK_GRAY = "374151"
MID_GRAY = "64748B"
LIGHT_GRAY = "D1D5DB"
PALE_GRAY = "F3F4F6"
MAROON = "7F1D1D"

SCREENSHOTS = []


def rgb(value):
    return RGBColor.from_string(value)


def set_update_fields(doc):
    settings = doc.settings._element
    update = settings.find(qn("w:updateFields"))
    if update is None:
        update = OxmlElement("w:updateFields")
        settings.append(update)
    update.set(qn("w:val"), "true")


def add_field(paragraph, instruction, fallback=""):
    base.add_field(paragraph, instruction, fallback)


def configure_styles(doc):
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(10.25)
    normal.font.color.rgb = rgb(BLACK)
    normal.paragraph_format.space_after = Pt(4.5)
    normal.paragraph_format.line_spacing = 1.06
    normal.paragraph_format.widow_control = True

    for style_name in ("List Bullet", "List Bullet 2", "List Number"):
        style = styles[style_name]
        style.font.name = "Aptos"
        style.font.size = Pt(10.25)
        style.font.color.rgb = rgb(BLACK)
        style.paragraph_format.space_after = Pt(2.5)

    h1 = styles["Heading 1"]
    h1.font.name = "Aptos Display"
    h1.font.size = Pt(18)
    h1.font.bold = True
    h1.font.color.rgb = rgb(BLACK)
    h1.paragraph_format.page_break_before = True
    h1.paragraph_format.keep_with_next = True
    h1.paragraph_format.space_before = Pt(0)
    h1.paragraph_format.space_after = Pt(8)

    h2 = styles["Heading 2"]
    h2.font.name = "Aptos Display"
    h2.font.size = Pt(14)
    h2.font.bold = True
    h2.font.color.rgb = rgb(BLACK)
    h2.paragraph_format.keep_with_next = True
    h2.paragraph_format.space_before = Pt(9)
    h2.paragraph_format.space_after = Pt(5)

    h3 = styles["Heading 3"]
    h3.font.name = "Aptos"
    h3.font.size = Pt(11.5)
    h3.font.bold = True
    h3.font.color.rgb = rgb(BLACK)
    h3.paragraph_format.keep_with_next = True
    h3.paragraph_format.space_before = Pt(7)
    h3.paragraph_format.space_after = Pt(4)

    title = styles["Title"]
    title.font.name = "Aptos Display"
    title.font.size = Pt(28)
    title.font.bold = True
    title.font.color.rgb = rgb(BLACK)

    subtitle = styles["Subtitle"]
    subtitle.font.name = "Aptos"
    subtitle.font.size = Pt(12.5)
    subtitle.font.color.rgb = rgb(MID_GRAY)


def configure_page(doc):
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.72)
    section.bottom_margin = Inches(0.68)
    section.left_margin = Inches(0.75)
    section.right_margin = Inches(0.75)
    section.header_distance = Inches(0.32)
    section.footer_distance = Inches(0.32)
    section.different_first_page_header_footer = True

    header = section.header
    p = header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("SupplySync  |  Inventory Staff Manual")
    r.font.name = "Aptos"
    r.font.size = Pt(8)
    r.font.color.rgb = rgb(MID_GRAY)

    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(f"Controlled Copy  •  Version {VERSION}  •  Page ")
    r.font.name = "Aptos"
    r.font.size = Pt(8)
    r.font.color.rgb = rgb(MID_GRAY)
    add_field(p, "PAGE", "1")
    p.add_run(" of ")
    add_field(p, "NUMPAGES", "1")


def add_labeled_paragraph(doc, label, text, italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_together = True
    r = p.add_run(label)
    r.bold = True
    r.font.color.rgb = rgb(BLACK)
    body = p.add_run(text)
    body.italic = italic
    return p


def add_bullets(doc, items, level=0):
    for item in items:
        p = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
        p.paragraph_format.keep_together = True
        p.add_run(item)


def add_steps(doc, steps):
    for number, step in enumerate(steps, 1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.24)
        p.paragraph_format.first_line_indent = Inches(-0.24)
        p.paragraph_format.space_after = Pt(3.5)
        p.paragraph_format.keep_together = True
        r = p.add_run(f"{number}. ")
        r.bold = True
        p.add_run(step)


def add_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    table.autofit = True
    header = table.rows[0]
    base.repeat_header(header)
    for idx, text in enumerate(headers):
        cell = header.cells[idx]
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        base.set_cell_shading(cell, PALE_GRAY)
        base.set_cell_margins(cell, 80, 90, 80, 90)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = rgb(BLACK)
    for row_data in rows:
        row = table.add_row()
        base.prevent_row_split(row)
        for idx, value in enumerate(row_data):
            cell = row.cells[idx]
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            base.set_cell_margins(cell, 75, 90, 75, 90)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(str(value))
            r.font.size = Pt(9)
        if widths:
            for idx, width in enumerate(widths):
                row.cells[idx].width = Inches(width)
    if widths:
        for idx, width in enumerate(widths):
            header.cells[idx].width = Inches(width)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return table


def add_screenshot_direction(doc, title, screen, capture, show, privacy):
    number = len(SCREENSHOTS) + 1
    shot_id = f"INV-SS-{number:02d}"
    SCREENSHOTS.append(
        {
            "id": shot_id,
            "title": title,
            "screen": screen,
            "capture": capture,
            "show": show,
            "privacy": privacy,
        }
    )
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(1.5)
    p.paragraph_format.keep_together = True
    r = p.add_run(f"SCREENSHOT DIRECTION {shot_id} — {title}")
    r.bold = True
    r.font.color.rgb = rgb(BLACK)
    add_labeled_paragraph(doc, "Screen and setup: ", screen)
    add_labeled_paragraph(doc, "Capture: ", capture)
    add_labeled_paragraph(doc, "Make visible: ", show)
    add_labeled_paragraph(doc, "Privacy: ", privacy, italic=True)


def add_procedure(
    doc,
    title,
    purpose,
    steps,
    expected,
    availability=None,
    prerequisites=None,
    important=None,
    screenshot=None,
):
    doc.add_heading(title, level=3)
    add_labeled_paragraph(doc, "Purpose: ", purpose)
    if availability:
        add_labeled_paragraph(doc, "Availability: ", availability)
    if prerequisites:
        add_labeled_paragraph(doc, "Before you begin: ", prerequisites)
    add_labeled_paragraph(doc, "Procedure: ", "")
    add_steps(doc, steps)
    add_labeled_paragraph(doc, "Expected result: ", expected)
    if important:
        add_labeled_paragraph(doc, "Important: ", important)
    if screenshot:
        add_screenshot_direction(doc, *screenshot)


def add_chapter(doc, number, title, intro=None):
    doc.add_heading(f"{number}. {title}", level=1)
    if intro:
        p = doc.add_paragraph(intro)
        p.paragraph_format.space_after = Pt(7)


def add_cover(doc):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    if UCN_LOGO.exists():
        p.add_run().add_picture(str(UCN_LOGO), width=Inches(0.92))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(15)
    if SUPPLYSYNC_LOGO.exists():
        p.add_run().add_picture(str(SUPPLYSYNC_LOGO), width=Inches(2.65))

    p = doc.add_paragraph(style="Title")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(24)
    p.add_run("INVENTORY STAFF\nUSER MANUAL")

    p = doc.add_paragraph(style="Subtitle")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run(
        "SupplySync: A Web-Based Consumable Supplies Management System\n"
        "with Digital Requisition Processing and Automated Reports"
    )

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(28)
    r = p.add_run("ROLE SCOPE")
    r.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = rgb(MID_GRAY)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("INVENTORY STAFF ONLY")
    r.bold = True
    r.font.size = Pt(15)
    r.font.color.rgb = rgb(BLACK)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(11)
    r = p.add_run(
        "Supporting-document review, pickup preparation, and assigned\n"
        "inventory operations"
    )
    r.font.size = Pt(10)
    r.font.color.rgb = rgb(MID_GRAY)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(28)
    r = p.add_run(f"Version {VERSION}  |  {EFFECTIVE_DATE}")
    r.font.size = Pt(10)
    r.font.color.rgb = rgb(MID_GRAY)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(9)
    r = p.add_run("Internal Operational Use")
    r.bold = True
    r.font.size = Pt(9)
    r.font.color.rgb = rgb(MAROON)
    doc.add_page_break()


def add_front_matter(doc):
    p = doc.add_paragraph()
    p.style = doc.styles["Heading 1"]
    p.paragraph_format.page_break_before = False
    p.add_run("Document Control")

    add_table(
        doc,
        ["Control Item", "Value"],
        [
            ("Document ID", DOCUMENT_ID),
            ("Document title", "SupplySync Inventory Staff User Manual"),
            ("Version", VERSION),
            ("Effective date", EFFECTIVE_DATE),
            ("Applicable role", "Inventory Staff only"),
            (
                "Scope basis",
                "Role audit of permissions, routes, authorization middleware, navigation, controllers, interface actions, and documented workflow behavior",
            ),
            ("Document owner", "SupplySync Inventory Operations"),
            ("Classification", "Internal Operational Use"),
            ("Review cycle", "After each major release, role-permission change, or at least annually"),
        ],
        widths=[1.65, 5.15],
    )

    doc.add_heading("Revision History", level=2)
    add_table(
        doc,
        ["Version", "Date", "Description", "Prepared for"],
        [
            (
                "1.0",
                "12 Nov 2026",
                "Initial Inventory Staff-only manual based on a role and authorization audit, with screenshot capture directions.",
                "Inventory Staff",
            )
        ],
        widths=[0.7, 1.1, 3.85, 1.15],
    )

    add_labeled_paragraph(
        doc,
        "Strict role boundary: ",
        "This manual is written only for the Inventory Staff role. It does not teach System Administrator governance, Supply Coordinator unit workflows, or requester-side supporting-document submission. Approval, rejection, release, RFID administration, supplier maintenance, reporting, analytics, and transaction-audit actions are included only as permission-dependent Inventory Staff functions and must be skipped when the relevant control is not visible.",
    )
    add_labeled_paragraph(
        doc,
        "Screenshot status: ",
        "The manual contains directions for screenshots but does not insert live system images. Capture the images after the deployment and demonstration data are ready, then place each image beneath its matching screenshot direction.",
    )

    doc.add_heading("How to Use This Manual", level=2)
    add_bullets(
        doc,
        [
            "Use an Inventory Staff account while following the procedures. Do not use an administrator account to make an unavailable Inventory Staff control appear.",
            "A menu or button appears only when the Inventory Staff role has the required permission and the record is in the correct workflow state.",
            "Fields marked with an asterisk are required. Read-only values are generated from settings or earlier transactions.",
            "Use demonstration records when capturing screenshots. Never expose passwords, OTPs, invitation links, reset links, personal contact information, full RFID identifiers, or confidential supporting documents.",
            "Read validation and confirmation messages before saving any stock movement or official record.",
        ],
    )

    doc.add_heading("Manual Conventions", level=2)
    add_table(
        doc,
        ["Convention", "Meaning"],
        [
            ("Select", "Choose a menu, tab, record, option, or button."),
            ("Enter", "Type a value into an editable field."),
            ("Permission-dependent", "Use the procedure only if the assigned Inventory Staff permissions display the named menu or action."),
            ("System-generated", "SupplySync assigns or calculates the value; do not overwrite it."),
            ("Expected result", "The visible or recorded outcome that confirms the procedure succeeded."),
            ("Screenshot direction", "The exact screen state and visible details to capture for the final illustrated manual."),
        ],
        widths=[1.5, 5.3],
    )

    doc.add_page_break()
    p = doc.add_paragraph()
    p.style = doc.styles["Heading 1"]
    p.paragraph_format.page_break_before = False
    p.add_run("Contents")
    p = doc.add_paragraph()
    add_field(p, 'TOC \\o "1-3" \\h \\z \\u', "Open this document in Microsoft Word and update the Table of Contents field.")
    add_labeled_paragraph(
        doc,
        "To update the contents: ",
        "In Microsoft Word, click inside the table of contents, choose Update Table, and select Update entire table.",
    )


def build_manual():
    SCREENSHOTS.clear()
    doc = Document()
    configure_styles(doc)
    configure_page(doc)
    set_update_fields(doc)
    doc.core_properties.title = "SupplySync Inventory Staff User Manual"
    doc.core_properties.subject = "Inventory Staff-only procedures and screenshot capture directions"
    doc.core_properties.author = "SupplySync Documentation Team"
    doc.core_properties.keywords = "SupplySync, Inventory Staff, document verification, receiving, issuance, RFID, reports"

    add_cover(doc)
    add_front_matter(doc)

    add_chapter(
        doc,
        1,
        "Role Audit, Scope, and Responsibility Boundary",
        "The manual scope was established before writing by comparing role-specific permissions, workflow restrictions, navigation rules, and record-ownership behavior.",
    )
    doc.add_heading("1.1 Role Audit Outcome", level=2)
    add_table(
        doc,
        ["Role", "Dedicated Functions Identified", "Treatment in This Manual"],
        [
            (
                "Inventory Staff",
                "Supporting-document access, document verification or return for correction, and Ready for Pickup. Operational modules may be added through permissions.",
                "Included. Permission-dependent functions are clearly labeled.",
            ),
            (
                "System Administrator",
                "System mode, roles and permissions, staff accounts, system settings, signatories, device secrets, backups, and platform-wide login governance.",
                "Excluded.",
            ),
            (
                "Supply Coordinator",
                "Central Supply Catalog, Unit Inventory, unit issue history, Stock Cards, and the coordinator's own requisitions.",
                "Excluded.",
            ),
            (
                "Authorized Personnel",
                "Requester-side requisition creation, supporting-document upload, correction, replacement, and resubmission.",
                "Excluded.",
            ),
            (
                "Property Custodian / Property Staff",
                "Request approval, rejection, release, and broader institutional record-management authority when configured.",
                "Not assumed. Included only when those exact permissions are also assigned to Inventory Staff.",
            ),
        ],
        widths=[1.35, 3.55, 2.0],
    )

    doc.add_heading("1.2 Guaranteed Inventory Staff Functions", level=2)
    add_bullets(
        doc,
        [
            "Open the private supporting document attached to an eligible requisition.",
            "Review document authenticity, completeness, and prior approval.",
            "Record Verified — proceed to inventory review.",
            "Return a document For Correction with required remarks.",
            "Mark a verified and approved request Ready for Pickup and notify the requester.",
            "Use Dashboard and personal Account Settings available to authenticated users.",
        ],
    )
    add_labeled_paragraph(
        doc,
        "Production expectation: ",
        "Inventory Staff is the designated SPMO document-processing role. A requester cannot verify the requester's own document. Document-verification permission by itself does not grant authority to approve, reject, or release supplies.",
    )

    doc.add_heading("1.3 Permission-Dependent Inventory Staff Functions", level=2)
    add_table(
        doc,
        ["Module or Action", "Typical Capability", "Use Only When"],
        [
            ("Inventory — All Items", "Search, view, register, edit, or archive item master records.", "The Inventory menu and corresponding action buttons are visible."),
            ("Receiving", "Record supplier deliveries, receive by RFID, and update receiving records.", "Receiving and the required create/update controls are visible."),
            ("Issuance Registry", "Search issued records, inspect details, preview RIS, and create direct issuance vouchers.", "Issuance and Record Issuance are visible."),
            ("Request Approval / Rejection / Release", "Adjust approved quantities, reject with reasons, print RIS, and release signed requests.", "The exact request-action permission has been assigned."),
            ("RFID Scanner", "View scanner state; assign, replace, or unassign tags.", "RFID Scanner and the relevant controls are visible."),
            ("Supplier Registry", "Search, register, and update consumable-supply suppliers.", "Suppliers is visible."),
            ("Compliance Reports / Analytics", "Generate reports, migrate historical records, preview official forms, and analyze supply use.", "The corresponding Compliance page is visible."),
            ("Transaction Audit", "Search and print operational business events.", "Transaction Audit is visible."),
        ],
        widths=[1.8, 3.3, 1.8],
    )

    doc.add_heading("1.4 Functions Not Covered", level=2)
    add_bullets(
        doc,
        [
            "Changing the system operating mode.",
            "Creating or editing roles, permissions, or staff accounts.",
            "Changing System Settings, signatories, document numbering, email, backup, session, telemetry, or RFID device secrets and Wi-Fi configuration.",
            "Using Login Audit as a platform administrator.",
            "Creating the Inventory Staff member's own requester requisition or uploading a requester supporting document.",
            "Managing a Supply Coordinator's Central Supply Catalog, Unit Inventory, Unit Issues, or Stock Cards.",
        ],
    )

    add_chapter(doc, 2, "Accessing SupplySync", "Use an active Inventory Staff account created and assigned by an authorized administrator.")
    add_procedure(
        doc,
        "2.1 Sign In",
        "Authenticate to SupplySync with the assigned institutional account.",
        [
            "Open the SupplySync web address supplied by the institution.",
            "Enter the Official Email Address.",
            "Enter the account Password.",
            "Select Remember me only on a secured institution-managed device, if desired.",
            "Select Sign In.",
            "Confirm that Dashboard opens and the account area identifies the Inventory Staff role or its approved institutional designation.",
        ],
        "SupplySync creates an authenticated session and opens the dashboard.",
        prerequisites="The invitation or password setup must be complete, the account must be active, and the email must be verified.",
        important="Do not use Remember me on shared or public devices.",
        screenshot=(
            "Inventory Staff Sign-In Page",
            "Open the SupplySync login page in Light theme before entering a password.",
            "Capture the complete authentication card without the browser address bar.",
            "Official Email Address, Password, Remember me, Forgot password?, Sign In, and support text.",
            "Use a demonstration email; leave Password empty and hide password-manager suggestions.",
        ),
    )
    add_procedure(
        doc,
        "2.2 Recover a Forgotten Password",
        "Request and use a single-use password-reset link.",
        [
            "On Sign In, select Forgot password?.",
            "Enter the registered Official Email Address.",
            "Select Send Reset Link.",
            "Open the latest reset email and use its link before expiration.",
            "Enter New Password and Confirm New Password, then select Reset Password.",
            "Return to Sign In and authenticate with the new password.",
        ],
        "The new password replaces the previous password and the reset token becomes unusable.",
        important="A disabled account cannot regain access through password reset. Contact the System Administrator if the account has been deactivated.",
        screenshot=(
            "Password Recovery Form",
            "Open Forgot password? and stop before submitting the recovery request.",
            "Capture the full recovery card.",
            "Official Email Address, Send Reset Link, and Return to Sign In.",
            "Use a demonstration email. Never capture the reset email, token, or reset-link URL.",
        ),
    )
    add_procedure(
        doc,
        "2.3 Complete a Staff Invitation",
        "Activate a newly provisioned Inventory Staff account.",
        [
            "Open the most recent SupplySync invitation email.",
            "Select the invitation link before it expires.",
            "Verify the institutional account information on Complete Registration.",
            "Enter the requested name and a strong password, then confirm the password.",
            "Submit the registration form and sign in after activation succeeds.",
        ],
        "The account becomes active and can use only the permissions assigned to Inventory Staff.",
        important="Do not forward invitation links. If the link is expired or already used, ask the System Administrator to resend it.",
        screenshot=(
            "Invitation Activation Page",
            "Open a valid test invitation and display Complete Registration before typing a password.",
            "Capture the registration card only.",
            "Page title, institutional email, password fields, password guidance, and submit control.",
            "Use a test invitation. Blur the email and never capture the invitation URL or an entered password.",
        ),
    )
    add_procedure(
        doc,
        "2.4 Navigate Permission-Based Menus",
        "Use only the modules assigned to the Inventory Staff account.",
        [
            "Review the sidebar groups: Overview, Logistics & Operations, and Administration & Governance.",
            "Expand Inventory, Compliance, or Audit Logs only when those modules are visible.",
            "Select the required page and confirm that its sidebar item becomes active.",
            "Use Account settings and the theme control from the user area at the bottom of the sidebar.",
            "If a procedure in this manual names a control that is not visible, stop and verify the role assignment with the System Administrator.",
        ],
        "The selected authorized page opens without a 403 error.",
        important="Hidden menus are an access-control result, not a reason to use another person's account.",
        screenshot=(
            "Inventory Staff Navigation",
            "Sign in with a demonstration Inventory Staff account using its normal deployed permissions.",
            "Capture the full application from sidebar to page header.",
            "Visible menu groups, Inventory Staff account designation, Account settings, theme control, and active-page indicator.",
            "Blur the staff name and email. Do not temporarily grant administrator permissions just for the screenshot.",
        ),
    )
    add_procedure(
        doc,
        "2.5 Sign Out",
        "End the current authenticated session.",
        [
            "Finish or cancel any open form.",
            "Select Sign Out in the sidebar user area.",
            "Confirm sign-out if a confirmation dialog appears.",
            "Verify that the Sign In page opens.",
        ],
        "The current session ends and protected pages require authentication again.",
    )

    add_chapter(doc, 3, "Inventory Staff Dashboard", "Dashboard summarizes current stock and operational conditions. It does not itself authorize a transaction.")
    doc.add_heading("3.1 Dashboard Information", level=2)
    add_table(
        doc,
        ["Dashboard Area", "What Inventory Staff Uses It For"],
        [
            ("System Summary", "Review total items, stock position, receiving, issuance, and movement totals."),
            ("Critical Stock", "Identify items at or below configured thresholds and prioritize replenishment review."),
            ("Inventory Movement", "Compare receiving and issuance over the selected period."),
            ("Recent Receiving / Issuance", "Confirm recent stock movements and references."),
            ("RFID Status", "Check tagging coverage or scanner condition when RFID access is assigned."),
            ("Supplier Status", "Review active, pending-renewal, or blacklisted supplier conditions."),
            ("Compliance Status", "Review report readiness or saved-report indicators."),
            ("Recent System Activity", "Confirm recent operational actions without replacing the Transaction Audit page."),
        ],
        widths=[1.85, 4.95],
    )
    add_procedure(
        doc,
        "3.2 Review the Dashboard",
        "Assess current inventory conditions before beginning daily work.",
        [
            "Select Dashboard.",
            "Read the summary cards and note any critical-stock count.",
            "Review the movement chart for unusual receiving or issuance changes.",
            "Review recent receiving, issuance, RFID, supplier, compliance, and activity sections that are visible.",
            "Open the relevant authorized module for any item requiring action.",
        ],
        "The user has an up-to-date operational overview and a list of records that require follow-up.",
        important="Dashboard values are a snapshot. Refresh or revisit Dashboard after another user records a stock movement.",
        screenshot=(
            "Inventory Staff Dashboard Overview",
            "Open Dashboard with safe demonstration stock, receiving, and issuance data.",
            "Capture the page header, top summary, critical-stock area, movement chart, and visible status cards.",
            "Inventory Staff heading, stock levels, receiving, issuance, movement, RFID, supplier, compliance, and recent activity areas.",
            "Blur staff names, document references, and any real supplier or departmental information.",
        ),
    )

    add_chapter(
        doc,
        4,
        "Supporting-Document Review",
        "This is the Inventory Staff role's primary dedicated workflow. Documents are private and may be opened only through the authenticated request review interface.",
    )
    doc.add_heading("4.1 Workflow Status Reference", level=2)
    add_table(
        doc,
        ["Status", "Meaning for Inventory Staff", "Next Authorized Action"],
        [
            ("Pending Verification", "A supporting document is waiting for SPMO review.", "Verify it or return it for correction."),
            ("Under Review", "The document was verified and the request awaits inventory decision.", "Wait for an authorized approver or act only if approval permission is assigned."),
            ("For Correction", "The requester must correct or replace information and resubmit.", "Wait for resubmission; review the new document when it returns to Pending Verification."),
            ("Approved", "Authorized quantities are approved and stock is reserved according to policy.", "Mark Ready for Pickup when document verification is recorded."),
            ("Ready for Pickup", "The requester was notified that prepared supplies may be collected.", "Wait for release by a user with release permission."),
            ("Released / Issued", "The signed handover was confirmed and stock was deducted.", "View the archived RIS or transaction record."),
            ("Rejected / Cancelled", "The request is terminal and cannot continue through normal processing.", "Review the recorded reason or audit trail only."),
        ],
        widths=[1.25, 3.35, 2.2],
    )
    add_procedure(
        doc,
        "4.2 Open the Request Review Queue",
        "Locate requests that require supporting-document review.",
        [
            "Select Inventory, then Issuance.",
            "Open the Approvals & Request Queue view when it is available.",
            "Select Pending or the equivalent queue tab.",
            "Locate a request with Pending Verification status.",
            "Expand or open the request to display requester, department, purpose, requested items, and Supporting Document.",
        ],
        "The target request is open and its Supporting Document panel is visible.",
        availability="The deployed Inventory Staff role must expose the request-review queue. Document-review permissions are assigned to Inventory Staff, but the visible queue may also depend on the deployment's Issuance review permissions.",
        important="If Inventory Staff has document-verification permission but the Approvals & Request Queue view is missing, report the role/UI mismatch to the System Administrator. Do not use an administrator account as a workaround.",
        screenshot=(
            "Inventory Staff Request Review Queue",
            "Open Inventory > Issuance and select the request-review view with at least one Pending Verification demonstration request.",
            "Capture the queue header, status tabs, and one expanded request.",
            "Pending Verification badge, RIS or request reference, requester/office, requested items, and Supporting Document section.",
            "Use a demonstration request. Blur names, office identifiers, document names, and reference numbers if they resemble live data.",
        ),
    )
    add_procedure(
        doc,
        "4.3 Preview or Download the Supporting Document",
        "Inspect the submitted evidence before recording a decision.",
        [
            "In the expanded request, locate Supporting Document.",
            "Confirm the displayed document type and filename.",
            "Select Preview document to open the protected file in a new browser tab, or select Download document when offline inspection is required.",
            "Check authenticity, completeness, legibility, requester identity, approval evidence, dates, and consistency with the requisition.",
            "Close the preview tab and return to the request queue.",
        ],
        "The document has been reviewed and the Inventory Staff member is ready to record Verified or Return for correction.",
        important="Do not share the protected document URL. Viewing and downloading are recorded in the transaction audit trail.",
        screenshot=(
            "Supporting Document Panel",
            "Expand a Pending Verification demonstration request without opening the document itself.",
            "Capture only the Supporting Document section and nearby request reference.",
            "Document type, privacy-safe filename, Preview document, Download document, verification decision, remarks, and Save Document Review.",
            "Use a harmless sample file. Do not capture the real document contents, signatures, personal addresses, or identification numbers.",
        ),
    )
    add_procedure(
        doc,
        "4.4 Verify a Supporting Document",
        "Accept a complete and authentic document so the requisition can proceed to inventory review.",
        [
            "Complete the preview or download review.",
            "Under Verification decision, select Verified — proceed to inventory review.",
            "Enter concise remarks when useful, such as the approval reference reviewed or a non-sensitive verification note.",
            "Select Save Document Review.",
            "Confirm that the status changes from Pending Verification to Under Review and the reviewer name and date are shown.",
        ],
        "The document-verification metadata is recorded and the requisition moves to Under Review.",
        prerequisites="The request must require a supporting document, have an accessible stored file, and be in Pending Verification status. The reviewer must not be the requester.",
        important="Verification confirms the document review only. It does not approve requested quantities or authorize release.",
        screenshot=(
            "Verified Document Decision",
            "Set a demonstration request's Verification decision to Verified — proceed to inventory review before saving.",
            "Capture the decision field, optional privacy-safe remarks, and Save Document Review.",
            "The selected Verified decision and the request's Pending Verification status.",
            "Do not show the document body or real approval details.",
        ),
    )
    add_procedure(
        doc,
        "4.5 Return a Document for Correction",
        "Send a deficient document back to the requester with actionable remarks.",
        [
            "Review the submitted document and identify the exact deficiency.",
            "Under Verification decision, select Return for correction.",
            "Enter required remarks that state what is missing, unreadable, inconsistent, expired, or otherwise unacceptable.",
            "Select Save Document Review.",
            "Confirm that the request changes to For Correction and displays the recorded remarks.",
        ],
        "The requester receives an updated alert and can correct or replace the document before resubmitting.",
        prerequisites="The request must be in Pending Verification and the remarks must not be blank.",
        important="Write factual correction instructions. Do not place passwords, sensitive personal data, or internal security information in remarks.",
        screenshot=(
            "Return for Correction Decision",
            "Set a demonstration request's Verification decision to Return for correction and enter a generic correction note.",
            "Capture the decision, required remarks, and Save Document Review.",
            "Return for correction, the required-remarks indicator, and a clear example such as 'Upload a complete, legible approval page.'",
            "Use invented remarks and a demonstration request.",
        ),
    )
    add_procedure(
        doc,
        "4.6 Review a Resubmitted Document",
        "Process a replacement document after the requester corrects the request.",
        [
            "Refresh the request queue or revisit Inventory > Issuance.",
            "Locate the request after it returns to Pending Verification.",
            "Read the prior correction remarks so the new document can be checked against them.",
            "Preview the replacement document; do not assume the previous decision remains valid.",
            "Record Verified or Return for correction again using the normal procedure.",
        ],
        "The replacement document receives a new review decision and audit entry.",
        important="Verification is reset when the requester replaces and resubmits a supporting document.",
        screenshot=(
            "Completed Document Review Record",
            "Open a demonstration request after document review has been saved.",
            "Capture the status, reviewer summary, date, and verification remarks.",
            "Document reviewed or Returned for correction, reviewer designation, timestamp, and remarks.",
            "Blur the reviewer name and any live request identifiers.",
        ),
    )

    add_chapter(doc, 5, "Prepare an Approved Request for Pickup", "Ready for Pickup is a dedicated Inventory Staff action for requests that required and passed supporting-document review.")
    add_procedure(
        doc,
        "5.1 Mark Ready for Pickup",
        "Notify the requester that verified and approved supplies are prepared for collection.",
        [
            "Open Inventory > Issuance and the request-review queue.",
            "Open an Approved request that requires a supporting document.",
            "Confirm that a document-verification date and reviewer are recorded.",
            "Confirm that the approved item quantities physically match the prepared supplies.",
            "Select Mark Ready for Pickup & Notify Requester.",
            "Confirm that the request changes to Ready for Pickup.",
        ],
        "SupplySync records the preparation event and refreshes the requester's alert as unread.",
        prerequisites="The request must require a supporting document, be Approved, and have completed document verification.",
        important="Ready for Pickup does not deduct stock. Final stock deduction occurs only when a user with release permission confirms the signed RIS and releases the request.",
        screenshot=(
            "Ready for Pickup Action",
            "Open a verified Approved demonstration request immediately before selecting the action.",
            "Capture the approved-request action area.",
            "Approved status, verification summary, Preview / Print RIS, and Mark Ready for Pickup & Notify Requester.",
            "Use demonstration item quantities and blur requester and RIS details.",
        ),
    )
    add_procedure(
        doc,
        "5.2 Confirm Pickup Readiness",
        "Verify that the requester notification and workflow status were recorded.",
        [
            "After saving, confirm the Ready for Pickup status badge.",
            "Review the prepared quantities and the printable RIS reference.",
            "Keep the supplies secured until the authorized recipient presents the required signed RIS.",
            "Do not select any release control unless release permission has been explicitly assigned and the signed document is present.",
        ],
        "The request remains Ready for Pickup until authorized release or requester cancellation according to policy.",
        screenshot=(
            "Ready for Pickup Status",
            "Open the same demonstration request after the Ready action succeeds.",
            "Capture the request header and action area.",
            "Ready for Pickup badge, RIS reference, prepared quantities, and any release control only if it is legitimately assigned.",
            "Blur names and references. Do not stage a fake release permission for this image.",
        ),
    )

    add_chapter(doc, 6, "Inventory Item Master — Permission-Dependent", "Use this chapter only when Inventory > All Items is visible to the Inventory Staff account.")
    add_procedure(
        doc,
        "6.1 Search, Filter, and View an Item",
        "Find an item and inspect its identity, stock, valuation, receiving batches, and recent issuance history.",
        [
            "Select Inventory > All Items.",
            "Use Search name or SKU, All Suppliers, or All Statuses to narrow the list.",
            "Select View on the target item.",
            "Review Item Name, Specifications, Unit of Issue, On Hand, valuation, suppliers, batch details, RFID state, and recent movements.",
            "Select Close when finished.",
        ],
        "The correct item record is reviewed without changing stock.",
        availability="Requires inventory view permission.",
        screenshot=(
            "All Items Registry",
            "Open Inventory > All Items with demonstration records and one filter left clear.",
            "Capture the page header, toolbar, and the first several rows.",
            "Search, supplier and status filters, Add Item when authorized, columns, status badges, and row actions.",
            "Blur supplier names or stock numbers that identify live contracts.",
        ),
    )
    add_procedure(
        doc,
        "6.2 Register an Item Master",
        "Create a new consumable item identity, optionally with opening stock.",
        [
            "Select Add Item.",
            "Enter Item Name and select Unit of Issue.",
            "Enter Description / Specifications when needed.",
            "If the duplicate warning appears, review the existing item instead of creating a duplicate.",
            "For opening stock, expand Opening stock, select Preferred Supplier, and verify the system-generated Supplier Stock No. / SKU.",
            "Enter Initial Stock and Unit Cost; verify Batch Total.",
            "Select Save Item Master.",
        ],
        "The item appears in All Items and opening stock, if entered, is represented by an inventory batch.",
        availability="Requires item-create permission. Opening stock also depends on valid supplier and receiving data rules.",
        prerequisites="Use a consistent item name and recognized unit of issue. An active supplier is required when Initial Stock is greater than zero.",
        important="Do not create another item master merely because the same item arrives from a different supplier or at a different cost. Record a new receiving batch instead.",
        screenshot=(
            "Register Item Master Form",
            "Open Add Item and enter safe demonstration values; expand Opening stock without saving.",
            "Capture the complete modal in two images if scrolling is required.",
            "Item Name, Unit of Issue, Description, duplicate warning area, Preferred Supplier, generated Supplier Stock No. / SKU, Initial Stock, Unit Cost, Batch Total, and Save Item Master.",
            "Use fictional item and supplier data. Do not show live contract prices.",
        ),
    )
    add_procedure(
        doc,
        "6.3 Edit Item Identity",
        "Correct descriptive item-master information without directly rewriting transaction history.",
        [
            "Locate the item and select Edit, or open View and select Edit Item Identity.",
            "Update Item Name, Unit of Issue, or Description / Specifications as authorized.",
            "Review the read-only Current Stock & Valuation summary.",
            "Select Save Changes.",
        ],
        "The item identity is updated while stock and valuation continue to derive from receiving batches and issuance allocations.",
        availability="Requires item-update permission and ownership or broader institutional management authority.",
        important="Inventory Staff may be unable to edit a record created by another user unless broader management access was assigned.",
        screenshot=(
            "Item Details and Edit Action",
            "Open a demonstration item in View mode.",
            "Capture the identity, stock and valuation summary, receiving information, and footer actions.",
            "Tag RFID when authorized, Edit Item Identity when authorized, and Close.",
            "Mask full RFID values, supplier stock numbers, and real prices.",
        ),
    )
    add_procedure(
        doc,
        "6.4 Delete or Archive an Item",
        "Remove an unused item from the active master list when the deployment permits it.",
        [
            "Open the item's More actions menu and select Delete.",
            "Read the decommissioning confirmation and verify the item name and Stock No. / SKU.",
            "Select Delete Item only when the item is eligible and removal is authorized.",
            "If SupplySync reports that the item is referenced by transactions, cancel and retain or deactivate the item according to institutional procedure.",
        ],
        "An eligible unused item is removed from the active master list, or the system safely blocks removal of a referenced item.",
        availability="Requires item-delete permission and applicable ownership authority.",
        important="Never delete an item to correct stock. Use receiving, issuance, or an authorized adjustment workflow so the audit history remains intact.",
    )

    add_chapter(doc, 7, "Receiving — Permission-Dependent", "Use this chapter only when Inventory > Receiving is visible.")
    add_procedure(
        doc,
        "7.1 Search and Review Receiving Records",
        "Find incoming supplier deliveries and inspect their remaining batch quantities and values.",
        [
            "Select Inventory > Receiving.",
            "Use Search item or SKU and Filter by Supplier.",
            "Select View for the target record.",
            "Review Supplier, Supplier Stock No., Quantity Received, Batch Remaining, Unit Cost, Batch Value, Date Recorded, and RFID origin if present.",
            "Select Close or Update Record when authorized.",
        ],
        "The correct receiving batch is identified and reviewed.",
        availability="Requires receiving view permission.",
        screenshot=(
            "Receiving Registry",
            "Open Inventory > Receiving with demonstration records.",
            "Capture the page header, toolbar, and receiving table.",
            "Search, supplier filter, Scan RFID (Optional), Record Receiving, RFID badges, quantities, costs, dates, and View/Update actions.",
            "Mask real suppliers, stock numbers, costs, and staff identities.",
        ),
    )
    add_procedure(
        doc,
        "7.2 Record a Manual Receiving",
        "Add an incoming supplier delivery to inventory.",
        [
            "Select Record Receiving.",
            "Search and select the Inventory Item.",
            "Select an active Supplier.",
            "Verify the generated Supplier Stock No.",
            "Enter Quantity Received and Unit Cost; verify Batch Total.",
            "Enter Date Received.",
            "Select Save Receiving.",
            "Confirm the new record and updated item stock.",
        ],
        "SupplySync creates a receiving batch, increases stock, updates valuation, and records an audit event.",
        availability="Requires receiving-create permission.",
        prerequisites="The item master and an eligible active supplier must already exist.",
        important="Verify quantity, cost, supplier, and date against the source delivery documents before saving.",
        screenshot=(
            "Manual Receiving Form",
            "Open Record Receiving and enter fictional demonstration values without submitting.",
            "Capture the full form.",
            "Inventory Item, Supplier, generated Supplier Stock No., Quantity Received, Unit Cost, Batch Total, Date Received, and Save Receiving.",
            "Use fictional delivery data and prices.",
        ),
    )
    add_procedure(
        doc,
        "7.3 Receive Stock by RFID",
        "Create one or more receiving lines from RFID tags already associated with item masters.",
        [
            "Select Scan RFID (Optional).",
            "Choose the Hardware Device when more than one device is listed, or enter the assigned Station ID when required.",
            "Scan a tag with the reader or enter a valid tag and press Enter.",
            "For each recognized item, select Supplier and enter Quantity and Unit Cost.",
            "Remove any unintended scan and resolve duplicate or unassigned-tag notices.",
            "Enter Date Received and review the line count, total units, and total cost.",
            "Select Receive Item or Receive Items.",
        ],
        "Each accepted line creates a traceable receiving batch and records the scanned RFID tag snapshot.",
        availability="Requires receiving-create permission; scanner feed endpoints are available to staff with receiving permission.",
        prerequisites="Each scanned tag must already be assigned to an inventory item. A batch supports up to 100 lines.",
        important="An unassigned tag cannot identify an item for receiving. Use the RFID Scanner workflow first when tag assignment is authorized.",
        screenshot=(
            "RFID Receiving Modal",
            "Open Scan RFID (Optional) with two demonstration tags already queued.",
            "Capture the device/station area, scan entry, queued lines, and totals.",
            "RFID scan field, item names, Supplier, Quantity, Unit Cost, Date Received, validation notices, and Receive Items.",
            "Mask most of every RFID identifier and use fictional suppliers and costs.",
        ),
    )
    add_procedure(
        doc,
        "7.4 Update a Receiving Record",
        "Correct an eligible receiving record while preserving traceability.",
        [
            "Locate the record and select Update, or open View and select Update Record.",
            "Correct the authorized supplier, quantity, unit cost, or date fields.",
            "For an RFID-originated receipt, confirm that the item remains locked to preserve tag traceability.",
            "Select Update Receiving.",
            "Review the revised batch remaining quantity and valuation.",
        ],
        "The receiving record and affected inventory balances are recalculated and audited.",
        availability="Requires receiving-update permission and applicable ownership authority.",
        important="The current Receiving screen exposes View and Update. Although a protected void endpoint exists, do not attempt a direct URL; escalate a required void to the specifically authorized role and retain the supporting explanation.",
        screenshot=(
            "Receiving Details and Update",
            "Open a demonstration receiving record in View mode.",
            "Capture the detail summary and footer actions.",
            "Supplier, stock number, received and remaining quantities, cost, value, date, RFID origin when applicable, and Update Record.",
            "Mask real supplier data, prices, RFID values, and record references.",
        ),
    )

    add_chapter(doc, 8, "Issuance and Request Decisions — Permission-Dependent", "The Inventory Staff role does not automatically receive approval, rejection, direct-issuance, or release authority. Use each procedure only when the named control is visible.")
    add_procedure(
        doc,
        "8.1 Review the Issuance Registry and RIS",
        "Search issued records, inspect distribution details, and open the official Requisition and Issue Slip.",
        [
            "Select Inventory > Issuance.",
            "Select Issuance Registry & Slips.",
            "Use Search issuance or the Recipient filter.",
            "Select View to inspect Recipient, Division / Office, Date Issued, Fund Cluster, Purpose, issued items, quantities, Approved By, and Issued By.",
            "Select RIS Form to preview the official slip, then print or download only through the provided controls.",
        ],
        "The issuance record and official RIS are reviewed without changing stock.",
        availability="Requires issuance view permission.",
        screenshot=(
            "Issuance Registry and RIS Actions",
            "Open Inventory > Issuance and select Issuance Registry & Slips.",
            "Capture the page header, search/filter toolbar, and registry rows.",
            "RIS No., Recipient / Office, Items Issued, Total Quantity, Date Issued, status, View, RIS Form, and Record Issuance when authorized.",
            "Blur recipient names, offices, RIS numbers, and item quantities from live transactions.",
        ),
    )
    add_procedure(
        doc,
        "8.2 Record a Direct Issuance",
        "Create an issuance voucher that does not originate from a digital requisition.",
        [
            "Select Record Issuance.",
            "Enter Recipient Name and Date Issued.",
            "Select Division / Office and enter Recipient Designation when applicable.",
            "Select Fund Cluster and enter Purpose.",
            "Choose each item and enter its issue quantity; use Add another item for additional lines.",
            "Review the read-only Approved By and Issued By signatories and dates.",
            "Select Record Issuance.",
            "Open the new registry record and RIS to verify the result.",
        ],
        "SupplySync creates the issuance, allocates stock by policy, deducts inventory, and records the official reference.",
        availability="Requires direct issuance-create permission and a visible Record Issuance button.",
        prerequisites="Confirm physical authorization, recipient details, available stock, fund cluster, and source documents.",
        important="A direct issuance immediately affects stock. Do not use it to bypass the digital requisition workflow when a requisition is required.",
        screenshot=(
            "Direct Issuance Form",
            "Open Record Issuance and enter fictional values without submitting.",
            "Capture the form in enough images to show recipient, fund/purpose, item lines, and signatory sections.",
            "Recipient Name, Date Issued, Division / Office, Designation, Fund Cluster, Purpose, item and quantity rows, Approved By, Issued By, and Record Issuance.",
            "Use fictional recipients and items; mask signatory names if they are live configuration values.",
        ),
    )
    add_procedure(
        doc,
        "8.3 Approve a Requisition",
        "Approve all or part of a verified request when Inventory Staff has explicit approval authority.",
        [
            "Open Approvals & Request Queue and expand an Under Review or eligible Pending request.",
            "Review requested quantities, available and unreserved stock, purpose, requester, and document-review status.",
            "Enter the Authorized / Approved Qty for each item, or use the available helper controls.",
            "Enter Custodian Review Remarks & Allocation Notes when needed.",
            "Select Approve Requisition.",
            "Confirm that the request moves to Approved and receives an official RIS reference.",
        ],
        "Approved quantities are recorded and reserved according to the configured stock safeguard.",
        availability="Requires the explicit request-approval permission. Document-verification permission alone is insufficient.",
        important="Do not approve a document-required request until its supporting document is verified. Never approve quantities solely because they were requested.",
        screenshot=(
            "Conditional Requisition Approval",
            "Use an Inventory Staff demonstration account that legitimately has approval permission and open an eligible request before saving.",
            "Capture requested versus approved quantities, stock indicators, remarks, and action buttons.",
            "Approve Requisition, Reject Requisition, document-review state, and stock safeguard guidance.",
            "Use demonstration quantities and blur requester and reference data.",
        ),
    )
    add_procedure(
        doc,
        "8.4 Reject a Requisition",
        "Record a terminal rejection with a clear reason when explicit rejection authority is assigned.",
        [
            "Open an eligible Pending or Under Review request.",
            "Select Reject Requisition.",
            "Enter the required Rejection Justification / Reason.",
            "Select Confirm Rejection.",
            "Confirm that the status changes to Rejected and the reason is retained.",
        ],
        "The request becomes Rejected and cannot proceed through normal pickup or release.",
        availability="Requires the explicit request-rejection permission.",
        important="A correctable supporting-document deficiency should normally use Return for correction, not rejection.",
    )
    add_procedure(
        doc,
        "8.5 Release an Approved Request",
        "Complete the handover and deduct stock after the signed RIS is physically presented.",
        [
            "Open an Approved request, or Ready for Pickup when a supporting document was required.",
            "Select Preview / Print RIS and verify the final approved quantities.",
            "Confirm the identity of the authorized recipient and the physically signed RIS.",
            "Select Recipient presented physically signed RIS form. Ready to distribute stock.",
            "Select Confirm Release & Deduct Stock.",
            "Confirm that the request becomes Released or Issued and the archived RIS is available.",
        ],
        "SupplySync creates or links the issuance, deducts stock once, records allocations, and completes the request.",
        availability="Requires the explicit request-release permission. It is not part of the guaranteed Inventory Staff role.",
        prerequisites="For document-required requests, status must be Ready for Pickup. The signed RIS must be physically present.",
        important="Release is irreversible through the normal request queue and immediately changes inventory. Never confirm the checkbox without the signed RIS.",
        screenshot=(
            "Conditional Signed-RIS Release",
            "Use a legitimately release-authorized demonstration Inventory Staff account and open a Ready for Pickup test request before confirmation.",
            "Capture the release confirmation area only.",
            "Signed-RIS checkbox, Ready for Pickup status, final quantities, and Confirm Release & Deduct Stock.",
            "Use a demonstration request and do not capture a real signed RIS or signature.",
        ),
    )

    add_chapter(doc, 9, "RFID Tag Workspace — Permission-Dependent", "RFID tags identify item masters. Scanning a tag does not by itself receive or issue stock.")
    add_procedure(
        doc,
        "9.1 Assign an RFID Tag",
        "Link a physical RFID identifier to an inventory item.",
        [
            "Select RFID Scanner.",
            "Choose the Hardware scanner if more than one device is available.",
            "Search Item Catalog and select the target item.",
            "Present the physical tag to the reader, or use Manual Tag Entry when the scanner is unavailable.",
            "Review the captured tag and selected item.",
            "Select Assign RFID Tag.",
            "Confirm RFID Successfully Assigned and review the tag registry.",
        ],
        "The tag is linked to the item and becomes available for item lookup and RFID receiving.",
        availability="Requires RFID view and assign permissions.",
        important="Verify the physical label and item before assignment. Never publish a complete live RFID identifier in screenshots or messages.",
        screenshot=(
            "RFID Tagging Workspace",
            "Open RFID Scanner, select a demonstration item, and stop at Scanner Active & Listening or RFID Signal Captured.",
            "Capture hardware status, item selector, selected-item summary, scanner panel, and tag registry heading.",
            "Hardware Online or applicable status, Search Item Catalog, selected item, manual-entry fallback, and Assign RFID Tag when captured.",
            "Mask most of the RFID identifier and any device UUID or station details.",
        ),
    )
    add_procedure(
        doc,
        "9.2 Resolve an RFID Conflict",
        "Avoid assigning a tag that is already linked to another item.",
        [
            "When RFID Tag Already In Use appears, read the existing linked item.",
            "Select Scan Another Tag to preserve the current association, or select the existing item for review.",
            "Use a replace workflow only when the account has replace authority and the physical reassignment is verified.",
            "Record the operational reason according to local procedure.",
        ],
        "The duplicate association is prevented or resolved by an authorized reassignment.",
        availability="Conflict review requires RFID view; replacement requires the additional replace/assign authority enforced by the deployment.",
        screenshot=(
            "RFID Conflict or Unassign Confirmation",
            "Use demonstration tags to display RFID Tag Already In Use or the Unassign RFID Tag confirmation.",
            "Capture the conflict/confirmation state and available actions.",
            "Existing item summary, masked tag, Scan Another Tag, review option, or Unassign RFID.",
            "Use only test tags and mask device or tag identifiers.",
        ),
    )
    add_procedure(
        doc,
        "9.3 Unassign an RFID Tag",
        "Detach a tag from an item so it can be reassigned.",
        [
            "Select the tagged item in RFID Scanner or the tag registry.",
            "Choose Unassign RFID.",
            "Verify the item and current tag in the confirmation dialog.",
            "Select Unassign RFID.",
            "Confirm RFID Tag Removed, then optionally select Scan New RFID Tag.",
        ],
        "The tag is dissociated from the item without changing stock.",
        availability="Requires RFID unassign permission.",
    )

    add_chapter(doc, 10, "Supplier Registry — Permission-Dependent", "Use this chapter only when Suppliers > Supplier Registry is visible.")
    add_procedure(
        doc,
        "10.1 Search and View Suppliers",
        "Locate an accredited consumable-supply supplier and review its status and inventory relationship.",
        [
            "Select Suppliers > Supplier Registry.",
            "Search by supplier, TIN, or registration number.",
            "Filter by All Statuses, Active / Compliant, Pending Renewal, or Blacklisted.",
            "Select View on the target supplier.",
            "Review business identity, address, registration, status, receiving batches, received value, and current inventory value.",
        ],
        "The correct supplier record is reviewed without modification.",
        availability="Requires supplier view permission.",
        screenshot=(
            "Supplier Registry",
            "Open Supplier Registry with fictional demonstration suppliers.",
            "Capture the page header, search/status filters, and supplier table.",
            "Search supplier, TIN or registration, status filter, Register Supplier when authorized, supplier rows, statuses, View, and Update.",
            "Use fictional suppliers and mask TIN and registration numbers.",
        ),
    )
    add_procedure(
        doc,
        "10.2 Register a Supplier",
        "Add an accredited supplier for receiving and reporting.",
        [
            "Select Register Supplier.",
            "Enter Business Name, Tax ID (TIN), Business Address, and Registration Number.",
            "Confirm the fixed consumable-supplies classification.",
            "Select Accreditation Status: Active / Compliant, Pending Renewal, or Blacklisted.",
            "Review the status explanation and select Register Supplier.",
        ],
        "The supplier appears in the registry and is available according to its accreditation status.",
        availability="Requires supplier-create permission.",
        important="Only Active / Compliant suppliers are eligible for normal receiving. Validate official registration documents before saving.",
        screenshot=(
            "Register Supplier Form",
            "Open Register Supplier and enter fictional values without submitting.",
            "Capture the full modal.",
            "Business Name, TIN, Business Address, Registration Number, classification, Accreditation Status, and Register Supplier.",
            "Use fictional supplier identity and registration data.",
        ),
    )
    add_procedure(
        doc,
        "10.3 Update a Supplier",
        "Correct supplier identity or accreditation status.",
        [
            "Select Update on the supplier row or from Supplier Information.",
            "Correct the authorized business, registration, address, or status fields.",
            "Select Save Changes.",
            "Reopen Supplier Information and verify the update.",
        ],
        "The supplier record is updated and the change is audited.",
        availability="Requires supplier-update permission and applicable ownership authority.",
        important="Inventory Staff may be unable to edit a supplier created by another user unless broader management authority was assigned. The current page exposes View and Update; do not attempt hidden delete routes.",
    )

    add_chapter(doc, 11, "Compliance Reports and Analytics — Permission-Dependent", "Compliance pages are available only when the Inventory Staff role has the corresponding permissions.")
    doc.add_heading("11.1 Supported Official Report Types", level=2)
    add_table(
        doc,
        ["Report", "Purpose", "Special Input"],
        [
            ("RSMI", "Report of Supplies and Materials Issued from approved RIS activity.", "Coverage period; yearly output may contain a multi-page package."),
            ("RPCI", "Report on the Physical Count of Inventories.", "Optional supplier filter; landscape preview."),
            ("Stock Card", "Chronological receipts, issuances, and running balance for one item.", "Target Item is required."),
            ("Memorandum Receipt", "Acknowledgement for property or equipment issued to an accountable officer.", "End User / Accountable Officer is required."),
        ],
        widths=[1.15, 3.65, 2.0],
    )
    add_procedure(
        doc,
        "11.2 Search and View Saved Reports",
        "Find an official report and open its preserved form snapshot.",
        [
            "Select Compliance > Manage Reports.",
            "Use Search documents and Report Type.",
            "Locate the Reference No., Form Type, Document Title, Coverage Period, and Date Generated.",
            "Select View or COA Form.",
            "Use Print Form or Download PDF when those controls and permissions are available.",
        ],
        "The saved report opens with its historical data and signatory snapshot.",
        availability="Requires compliance reports view permission.",
        screenshot=(
            "Compliance Report Registry",
            "Open Compliance > Manage Reports with demonstration reports.",
            "Capture the toolbar and report registry.",
            "Search documents, type filter, Migrate Data and Generate Report when authorized, references, form types, coverage, dates, View, and COA Form.",
            "Use demonstration references and mask signatory or supplier details.",
        ),
    )
    add_procedure(
        doc,
        "11.3 Generate and Save an Official Report",
        "Create an authoritative report preview and save its snapshot.",
        [
            "Select Generate Report.",
            "Choose Report Type, enter Document Title, and verify Report Generation Date.",
            "Choose Period Format: All Records, Specific Date, Date Range, Monthly, or Yearly, then complete the displayed dates.",
            "For Stock Card select Target Item; for Memorandum Receipt select End User / Accountable Officer; for RPCI optionally select Supplier.",
            "Select Preview Official Report and inspect the complete form, totals, dates, signatories, page orientation, and page breaks.",
            "Use Print Preview when a print/PDF review is required.",
            "Select Save & Record Document only after the preview is correct.",
        ],
        "A report reference and preserved data snapshot are recorded in the registry.",
        availability="Requires report store and preview-dataset permissions; printing or PDF download may require additional export permission.",
        important="A browser print preview is not proof that a physical copy printed successfully. Verify the printer or saved PDF separately.",
        screenshot=(
            "Generate Official Report Configuration",
            "Open Generate Report and complete a fictional monthly RSMI or another safe demonstration report without saving.",
            "Capture the Configure step.",
            "Report Type, Document Title, Generation Date, Period Format, conditional fields, and Preview Official Report.",
            "Use demonstration dates, item names, supplier names, and accountable officers.",
        ),
    )
    add_screenshot_direction(
        doc,
        "Official Report Preview",
        "Advance the same demonstration report to Step 2: Preview.",
        "Capture the preview workspace and enough of the official form to identify its layout.",
        "Reference, form title, reporting period, page orientation, Print Preview, and Save & Record Document.",
        "Use demonstration data and mask signatory names if the deployment uses real officers.",
    )
    add_procedure(
        doc,
        "11.4 Migrate Historical Report Data",
        "Import supported legacy report records into the compliance datasets.",
        [
            "Select Migrate Data.",
            "Choose the historical form type.",
            "Enter a Legacy Source / Archive Batch Identifier.",
            "Upload the supported Excel, CSV, PDF, or Word file.",
            "Review detected rows, field mapping, valid and invalid counts, duplicate warnings, and extracted values.",
            "Correct the source or mapping until the preview is acceptable.",
            "Submit the migration and verify the imported records in the report registry or target dataset.",
        ],
        "Valid historical rows are imported with a recorded source batch and audit entry.",
        availability="Requires one or more compliance migration permissions.",
        important="Never import the same archive repeatedly. Preserve the source file and migration result for reconciliation.",
    )
    add_procedure(
        doc,
        "11.5 Use Consumable Supply Analytics",
        "Analyze requisitions, requested items, released quantities, offices, inventory condition, and trends.",
        [
            "Select Compliance > Consumable Supply Analytics.",
            "Choose a reporting period using This month, This year, Last year, From date, To date, Year, or Month.",
            "Optionally refine by Department or office, supplier Category, Consumable item, or Requisition status.",
            "Review KPI cards, department rankings, demand, supply trends, stock attention, inventory overview, and valuation charts.",
            "Remove individual filters or select Reset filters to return to university-wide scope.",
        ],
        "Every chart and table reflects the selected reporting scope.",
        availability="Requires compliance analytics permission. Coordinators and Authorized Personnel are intentionally blocked from university-wide analytics even when a route permission is mistakenly added.",
        important="Analytics count confirmed releases according to the implemented rules; do not treat pending requests as issued stock.",
        screenshot=(
            "Consumable Supply Analytics",
            "Open analytics with a demonstration monthly period and one optional non-sensitive filter.",
            "Capture the filter panel, KPI summary, and representative charts/tables.",
            "Reporting period, active filter indicator, Total Requisitions, Total Supplies Issued, requesting-office metrics, and stock/demand visuals.",
            "Use demonstration departments and item names; blur any sensitive operational values.",
        ),
    )

    add_chapter(doc, 12, "Transaction Audit — Permission-Dependent", "Transaction Audit supports operational verification. Login Audit and platform security review remain outside the normal Inventory Staff scope.")
    add_procedure(
        doc,
        "12.1 Search Operational Events",
        "Verify that a document review, readiness action, receiving, issuance, RFID, supplier, or report operation was recorded.",
        [
            "Select Audit Logs > Transaction Audit.",
            "Keep Business Events selected for a readable top-level activity view.",
            "Search by user, action, RIS number, reference, or item name.",
            "Filter by Module, Action, and Date, including a custom date range when needed.",
            "Expand a row to review business details and related technical child events.",
            "Use All Technical Events only when troubleshooting requires the raw stream.",
            "Select Print Ledger when an authorized filtered audit copy is required.",
        ],
        "The relevant event, actor, module, result, timestamp, and affected records are identified.",
        availability="Requires Transaction Audit permission.",
        important="Audit metadata may contain operational identifiers. Print or export only for an approved purpose and store the result securely.",
        screenshot=(
            "Inventory Transaction Audit",
            "Open Transaction Audit in Business Events mode with a demonstration Inventory or Supply Request filter.",
            "Capture the summary, toolbar, and first several rows with one row expanded.",
            "Business Events, search, Module, Action, Date, Reset, Print Ledger, result, timestamp, and expanded details.",
            "Blur user names, IP addresses, references, RFID values, and sensitive metadata.",
        ),
    )

    add_chapter(doc, 13, "Account Settings and Personal Security", "Every Inventory Staff user is responsible for protecting the assigned account and reviewing personal access information.")
    add_procedure(
        doc,
        "13.1 Update Profile Information",
        "Keep the permitted account identity fields accurate.",
        [
            "Select Account settings from the sidebar user area.",
            "Open the Profile tab.",
            "Review department, role, email verification, and account creation information.",
            "Edit the permitted name or email fields.",
            "Select Save and complete email verification when the system requests it.",
        ],
        "The profile displays the updated permitted values.",
        important="Role and department assignments are controlled through authorized staff administration, not the personal profile page.",
        screenshot=(
            "Inventory Staff Account Settings",
            "Open Account settings > Profile using a demonstration account.",
            "Capture the tab bar and profile summary/edit area.",
            "Profile, Security, Login History, role/department summary, editable identity fields, and Save.",
            "Blur the user's name, email, department, and account dates.",
        ),
    )
    add_procedure(
        doc,
        "13.2 Change the Password with OTP",
        "Replace the password using current-password verification and an emailed one-time code.",
        [
            "Open Account settings > Security.",
            "Enter Current Password, New Password, and Confirm New Password.",
            "Review the password requirements and select the control that sends or continues to the security code step.",
            "Open the registered email account and enter the six-digit OTP before expiration.",
            "Select Verify and Update Password.",
            "Confirm Password Updated Successfully and sign in again if the current session is invalidated.",
        ],
        "The password changes only after the correct current password and OTP are verified.",
        important="Never disclose an OTP. Failed attempts, expiration, resend cooldowns, and request limits are enforced.",
        screenshot=(
            "Password and OTP Security Flow",
            "Open the Security tab and show either the password-details step or an OTP step using a test account.",
            "Capture the form without any secrets entered.",
            "Current/New/Confirm Password labels or six OTP boxes, expiration guidance, resend control, and Verify and Update Password.",
            "Leave password and OTP fields empty; mask the destination email.",
        ),
    )
    add_procedure(
        doc,
        "13.3 Review Personal Sessions and Login History",
        "Identify unfamiliar account access.",
        [
            "Open the Security tab and review Active System Sessions.",
            "Identify the Current Session and compare device, browser, approximate location, and time when shown.",
            "Open Login History and review recent successful or failed personal authentication events.",
            "Change the password and report the event immediately if an unfamiliar session or login is found.",
        ],
        "The user has verified that recent account access is expected or has begun the incident-response process.",
        important="The Inventory Staff personal Login History is not the same as the administrator's platform-wide Login Audit.",
    )
    add_procedure(
        doc,
        "13.4 Change Theme and Sign Out",
        "Use the preferred visual theme and securely end work.",
        [
            "Select the theme control in the sidebar user area and choose the preferred available theme.",
            "Complete or cancel open forms before leaving the system.",
            "Select Sign Out and confirm if prompted.",
        ],
        "The theme preference is applied and the session ends at sign-out.",
    )

    add_chapter(doc, 14, "Security and Daily Operating Practices", "Use these controls to protect stock records, documents, and accountability evidence.")
    add_bullets(
        doc,
        [
            "Use only your assigned account. Do not share credentials or let another person approve, verify, or release under your session.",
            "Check the role and active menu set after sign-in, especially after a permission change.",
            "Preview every supporting document before recording a decision, and write correction remarks that are specific and actionable.",
            "Reconcile physical quantities, source documents, suppliers, dates, and costs before saving a receiving or issuance.",
            "Treat Ready for Pickup and Released as different states: readiness notifies the requester; release deducts stock.",
            "Never reveal full RFID tags, device identifiers, passwords, OTPs, private files, or live personal data in screenshots.",
            "Use Business Events for normal transaction review and Technical Events only for approved troubleshooting.",
            "Refresh lists and Dashboard after another user completes a transaction that affects the current record.",
            "Report missing controls or unexpected 403 errors instead of requesting broader access than the task requires.",
        ],
    )

    add_chapter(doc, 15, "Troubleshooting and Escalation", "Record the page, time, role, exact message, reference, attempted action, and a privacy-safe screenshot before escalating.")
    add_table(
        doc,
        ["Symptom", "Likely Cause", "Inventory Staff Action"],
        [
            ("Menu or button is missing", "The relevant permission is not assigned, the record is in the wrong state, or the UI capability gate is not satisfied.", "Confirm the account role and record status; send the page and missing control to the System Administrator."),
            ("403 Unauthorized", "The direct route is not permitted or record ownership blocks management.", "Return to the sidebar; do not retry a hidden URL. Request a permission review with the business reason."),
            ("Document review queue is missing", "The role has document review but the deployed Issuance review view is not exposed.", "Report a role/UI mismatch. Include the Inventory Staff role and expected Pending Verification request."),
            ("Supporting document will not open", "File is missing, request is ineligible, access failed, or browser blocked the new tab.", "Retry from the authenticated panel, check browser pop-up behavior, then escalate with the request reference only."),
            ("Return for correction will not save", "Required remarks are blank or exceed the limit.", "Enter concise remarks and retry."),
            ("Ready for Pickup is unavailable", "Request is not Approved, verification is absent, or the request does not require a supporting document.", "Verify the status and document-review metadata; do not bypass prerequisites."),
            ("Receiving cannot be saved", "Item/supplier missing, supplier inactive, invalid quantity/cost/date, or insufficient permission.", "Correct highlighted fields; confirm an active supplier and the required create permission."),
            ("RFID tag is unassigned or duplicate", "No item association exists or the tag belongs to another item.", "Use authorized tag assignment or scan another tag; do not force duplicate association."),
            ("Issuance or approval reports insufficient stock", "The stock safeguard or unreserved stock blocks the quantity.", "Reduce the quantity or wait for receiving; do not falsify stock."),
            ("Report preview/export fails", "Invalid filters, no matching data, large dataset, or transient export problem.", "Narrow the period, verify required conditional fields, retry preview, then escalate with report type and filters."),
            ("OTP expired or locked", "The code expired, failed attempts reached the limit, or resend is rate-limited.", "Request a new code after the displayed cooldown and restart the password flow when required."),
        ],
        widths=[1.6, 2.7, 2.5],
    )

    doc.add_heading("15.1 Escalation Record", level=2)
    add_bullets(
        doc,
        [
            "Page and module",
            "Date and local time",
            "Inventory Staff username or staff ID, shared only through the approved support channel",
            "Record or request reference, with personal data minimized",
            "Action attempted and exact visible message",
            "Whether the problem repeats after refresh and sign-in",
            "Privacy-safe screenshot using the directions in this manual",
        ],
    )

    add_chapter(doc, 16, "Glossary and Quick Reference", "Use these terms consistently when recording actions and reporting issues.")
    add_table(
        doc,
        ["Term", "Meaning"],
        [
            ("RIS", "Requisition and Issue Slip used for request approval, pickup, and release documentation."),
            ("SPMO", "Supply and Property Management Office."),
            ("Supporting Document", "Private requester evidence establishing authorization; it is separate from the generated RIS."),
            ("Pending Verification", "A supporting document awaits designated SPMO review."),
            ("Under Review", "The document is verified and the request awaits inventory decision."),
            ("For Correction", "The requester must correct or replace the supporting document and resubmit."),
            ("Ready for Pickup", "Verified and approved supplies are prepared and the requester has been notified."),
            ("Release", "Final signed handover that deducts stock and completes the request."),
            ("Item Master", "The reusable identity of a consumable item; stock and cost are maintained through batches and allocations."),
            ("Receiving Batch", "A supplier delivery with quantity, cost, date, and remaining stock."),
            ("RFID Tag", "An identifier linked to an item master; it does not independently create a stock movement."),
            ("Permission-Dependent", "Available only when the Inventory Staff role has the named authorization."),
        ],
        widths=[1.55, 5.25],
    )

    add_chapter(doc, 17, "Screenshot Capture Register", "Capture the following images using a demonstration Inventory Staff account and place each image beneath its matching direction in the manual.")
    add_table(
        doc,
        ["ID", "Screenshot", "Primary Screen"],
        [(shot["id"], shot["title"], shot["screen"]) for shot in SCREENSHOTS],
        widths=[0.85, 2.2, 3.75],
    )

    doc.add_heading("17.1 Screenshot Quality Checklist", level=2)
    add_bullets(
        doc,
        [
            "Use the same browser zoom, window size, theme, and sidebar state throughout the manual.",
            "Capture the page title and enough navigation context to identify the location.",
            "Show the control named in the procedure and the data state that makes it available.",
            "Crop out the browser address bar when it reveals a private host or token.",
            "Use PNG format and a readable resolution; avoid phone photos of the monitor.",
            "Blur or replace real names, email addresses, departments, signatures, references, TINs, costs, RFID identifiers, device details, and supporting-document contents.",
            "Do not add arrows or highlights that cover labels or validation messages.",
            "Name files with the screenshot ID, for example INV-SS-01.png, INV-SS-02.png, and so on.",
        ],
    )

    add_chapter(doc, 18, "Inventory Staff Handover Checklist", "Use this page when Inventory Staff responsibility or assigned permissions change.")
    add_table(
        doc,
        ["Check", "Handover Item", "Completed / Notes"],
        [
            ("☐", "Inventory Staff account is active, verified, and uses an individual institutional email.", ""),
            ("☐", "Core document, verification, and Ready for Pickup permissions are confirmed.", ""),
            ("☐", "Permission-dependent menus match the staff member's actual duties.", ""),
            ("☐", "A demonstration Pending Verification request can be opened in the review queue.", ""),
            ("☐", "Supporting-document preview, verify, correction, and Ready for Pickup were rehearsed.", ""),
            ("☐", "Receiving, issuance, RFID, supplier, reports, analytics, and audit procedures were rehearsed only where assigned.", ""),
            ("☐", "Scanner station and physical RFID handling rules are known when RFID is assigned.", ""),
            ("☐", "Source documents, signatories, stock safeguards, and escalation contacts are known.", ""),
            ("☐", "Password was changed by the new user and active sessions were reviewed.", ""),
            ("☐", "No credentials, OTPs, invitation links, private documents, or exported reports were left in an insecure location.", ""),
        ],
        widths=[0.45, 4.9, 1.45],
    )
    add_labeled_paragraph(doc, "Outgoing Inventory Staff: ", "________________________________    Date: ________________")
    add_labeled_paragraph(doc, "Incoming Inventory Staff: ", "________________________________    Date: ________________")
    add_labeled_paragraph(doc, "Supervisor / Custodian: ", "________________________________    Date: ________________")

    ids = [shot["id"] for shot in SCREENSHOTS]
    expected = [f"INV-SS-{i:02d}" for i in range(1, len(ids) + 1)]
    if ids != expected:
        raise RuntimeError(f"Screenshot IDs are not sequential: {ids}")

    doc.save(OUTPUT)
    print(f"Created {OUTPUT}")
    print(f"Screenshot directions: {len(SCREENSHOTS)}")


if __name__ == "__main__":
    build_manual()
