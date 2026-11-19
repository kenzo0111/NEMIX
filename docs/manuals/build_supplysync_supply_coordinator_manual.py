import json
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt

import build_supplysync_inventory_staff_manual as manual


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "SupplySync_Supply_Coordinator_Manual.docx"
UCN_LOGO = ROOT / "public" / "images" / "ucnlogo.png"
SUPPLYSYNC_LOGO = ROOT / "public" / "images" / "supplysync-sidebar-logo.png"
ILLUSTRATED_DIR = ROOT / "output" / "screenshots" / "supply-coordinator-illustrated"
SPECS_PATH = ILLUSTRATED_DIR / "figure_specs.json"
SPECS = json.loads(SPECS_PATH.read_text(encoding="utf-8")) if SPECS_PATH.exists() else {}

VERSION = "1.0 Illustrated"
EFFECTIVE_DATE = "19 November 2026"
DOCUMENT_ID = "SS-SC-MAN-001"

BLACK = manual.BLACK
MID_GRAY = manual.MID_GRAY
MAROON = manual.MAROON
CRIMSON = manual.MAROON

SCREENSHOTS = []


def remove_paragraph_border(style):
    ppr = style.element.get_or_add_pPr()
    for border in list(ppr.findall(qn("w:pBdr"))):
        ppr.remove(border)


def configure_styles(doc):
    manual.configure_styles(doc)
    remove_paragraph_border(doc.styles["Title"])
    doc.styles["Title"].font.color.rgb = manual.rgb(BLACK)


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
    paragraph = header.paragraphs[0]
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    paragraph.paragraph_format.space_after = Pt(0)
    run = paragraph.add_run("SupplySync  |  Supply Coordinator Manual")
    run.font.name = "Aptos"
    run.font.size = Pt(8)
    run.font.color.rgb = manual.rgb(MID_GRAY)

    footer = section.footer
    paragraph = footer.paragraphs[0]
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_after = Pt(0)
    run = paragraph.add_run(f"Controlled Copy  |  Version {VERSION}  |  Page ")
    run.font.name = "Aptos"
    run.font.size = Pt(8)
    run.font.color.rgb = manual.rgb(MID_GRAY)
    manual.add_field(paragraph, "PAGE", "1")
    paragraph.add_run(" of ")
    manual.add_field(paragraph, "NUMPAGES", "1")


def add_screenshot_direction(doc, title, screen, capture, show, privacy):
    number = len(SCREENSHOTS) + 1
    shot_id = f"SC-SS-{number:02d}"
    fig_key = f"SC-{number:02d}"
    SCREENSHOTS.append(
        {
            "id": shot_id,
            "fig_key": fig_key,
            "title": title,
            "screen": screen,
            "capture": capture,
            "show": show,
            "privacy": privacy,
        }
    )

    img_path = ILLUSTRATED_DIR / f"{fig_key}.png"
    if img_path.exists():
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        p_img.paragraph_format.keep_with_next = True
        run = p_img.add_run()
        run.add_picture(str(img_path), width=Inches(6.25))

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(6)
        p_cap.paragraph_format.keep_with_next = True
        run_cap = p_cap.add_run(f"Figure {fig_key} — {title}")
        run_cap.bold = True
        run_cap.font.name = "Aptos"
        run_cap.font.size = Pt(9.5)
        run_cap.font.color.rgb = manual.rgb(MAROON)

        if fig_key in SPECS:
            p_guide_hdr = doc.add_paragraph()
            p_guide_hdr.paragraph_format.left_indent = Inches(0.18)
            p_guide_hdr.paragraph_format.space_before = Pt(4)
            p_guide_hdr.paragraph_format.space_after = Pt(2)
            p_guide_hdr.paragraph_format.keep_with_next = True
            r_hdr = p_guide_hdr.add_run("Visual Guide Callouts and Pointer Actions:")
            r_hdr.bold = True
            r_hdr.font.name = "Aptos"
            r_hdr.font.size = Pt(9)
            r_hdr.font.color.rgb = manual.rgb(BLACK)

            for idx, (label, detail) in enumerate(SPECS[fig_key], 1):
                p_ptr = doc.add_paragraph()
                p_ptr.paragraph_format.left_indent = Inches(0.35)
                p_ptr.paragraph_format.space_before = Pt(1)
                p_ptr.paragraph_format.space_after = Pt(2)
                p_ptr.paragraph_format.keep_with_next = True

                r_badge = p_ptr.add_run(f"Pointer {idx} ({label}): ")
                r_badge.bold = True
                r_badge.font.name = "Aptos"
                r_badge.font.size = Pt(8.8)
                r_badge.font.color.rgb = manual.rgb(MAROON)

                r_desc = p_ptr.add_run(detail)
                r_desc.font.name = "Aptos"
                r_desc.font.size = Pt(8.8)
                r_desc.font.color.rgb = manual.rgb(BLACK)

    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.left_indent = Inches(0.18)
    paragraph.paragraph_format.space_before = Pt(5)
    paragraph.paragraph_format.space_after = Pt(1.5)
    paragraph.paragraph_format.keep_together = True
    run = paragraph.add_run(f"SCREENSHOT SPECIFICATION {shot_id} — {title}")
    run.bold = True
    run.font.color.rgb = manual.rgb(BLACK)
    manual.add_labeled_paragraph(doc, "Screen and setup: ", screen)
    manual.add_labeled_paragraph(doc, "Make visible: ", show)
    manual.add_labeled_paragraph(doc, "Privacy: ", privacy, italic=True)


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
    manual.add_labeled_paragraph(doc, "Purpose: ", purpose)
    if availability:
        manual.add_labeled_paragraph(doc, "Availability: ", availability)
    if prerequisites:
        manual.add_labeled_paragraph(doc, "Before you begin: ", prerequisites)
    manual.add_labeled_paragraph(doc, "Procedure: ", "")
    manual.add_steps(doc, steps)
    manual.add_labeled_paragraph(doc, "Expected result: ", expected)
    if important:
        manual.add_labeled_paragraph(doc, "Important: ", important)
    if screenshot:
        add_screenshot_direction(doc, *screenshot)


def add_cover(doc):
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(8)
    if UCN_LOGO.exists():
        paragraph.add_run().add_picture(str(UCN_LOGO), width=Inches(0.92))

    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(15)
    if SUPPLYSYNC_LOGO.exists():
        paragraph.add_run().add_picture(str(SUPPLYSYNC_LOGO), width=Inches(2.65))

    paragraph = doc.add_paragraph(style="Title")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(24)
    paragraph.add_run("SUPPLY COORDINATOR\nUSER MANUAL")

    paragraph = doc.add_paragraph(style="Subtitle")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.add_run(
        "SupplySync A Web Based Consumable Supplies Management System\n"
        "with Digital Requisition Processing and Automated Reports"
    )

    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(28)
    run = paragraph.add_run("ROLE SCOPE")
    run.bold = True
    run.font.size = Pt(9.5)
    run.font.color.rgb = manual.rgb(MID_GRAY)

    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run("SUPPLY COORDINATOR ONLY")
    run.bold = True
    run.font.size = Pt(15)
    run.font.color.rgb = manual.rgb(BLACK)

    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(11)
    run = paragraph.add_run(
        "Delivery Unit requests, released stock, local distributions,\n"
        "Stock Cards, and account scoped records"
    )
    run.font.size = Pt(10)
    run.font.color.rgb = manual.rgb(MID_GRAY)

    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(28)
    run = paragraph.add_run(f"Version {VERSION}  |  {EFFECTIVE_DATE}")
    run.font.size = Pt(10)
    run.font.color.rgb = manual.rgb(MID_GRAY)

    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(9)
    run = paragraph.add_run("Internal Operational Use")
    run.bold = True
    run.font.size = Pt(9)
    run.font.color.rgb = manual.rgb(MAROON)
    doc.add_page_break()


def add_front_matter(doc):
    paragraph = doc.add_paragraph()
    paragraph.style = doc.styles["Heading 1"]
    paragraph.paragraph_format.page_break_before = False
    paragraph.add_run("Document Control")

    manual.add_table(
        doc,
        ["Control Item", "Value"],
        [
            ("Document ID", DOCUMENT_ID),
            ("Document title", "SupplySync Supply Coordinator User Manual"),
            ("Version", VERSION),
            ("Effective date", EFFECTIVE_DATE),
            ("Applicable role", "Supply Coordinator only"),
            (
                "Scope basis",
                "Audit of seeded permissions, route authorization, ownership rules, controllers, services, navigation, interface controls, documented workflows, and automated tests",
            ),
            ("Document owner", "SupplySync Delivery Unit Operations"),
            ("Classification", "Internal Operational Use"),
            ("Review cycle", "After each major release, role permission change, or at least annually"),
        ],
        widths=[1.65, 5.15],
    )

    doc.add_heading("Revision History", level=2)
    manual.add_table(
        doc,
        ["Version", "Date", "Description", "Prepared for"],
        [
            (
                "1.0",
                "12 Nov 2026",
                "Initial Supply Coordinator manual based on a role and workflow audit, with screenshot capture directions.",
                "Supply Coordinators",
            ),
            (
                "1.0 Illustrated",
                "19 Nov 2026",
                "Illustrated Edition: integrated 21 application screenshots with numbered visual guide badges, callout arrows, and pointer legends.",
                "Supply Coordinators",
            ),
        ],
        widths=[0.9, 1.0, 3.65, 1.15],
    )

    manual.add_labeled_paragraph(
        doc,
        "Strict role boundary: ",
        "This manual covers the standard Supply Coordinator role only. It does not grant central inventory maintenance, receiving, requisition approval, rejection, stock release, supporting document verification, RFID administration, supplier maintenance, compliance reporting, university analytics, access control, system settings, or visibility into another user's records.",
    )
    manual.add_labeled_paragraph(
        doc,
        "Screenshot status: ",
        "This illustrated user manual includes 21 direct application screenshots featuring numbered visual guide badges, precision callout arrows, and itemized pointer legends for every operational procedure. Demonstration records are used throughout with strict privacy protections applied.",
    )

    doc.add_heading("How to Use This Manual", level=2)
    manual.add_bullets(
        doc,
        [
            "Use a Supply Coordinator demonstration account while following the procedures. Do not use an administrator account to make unavailable controls appear.",
            "Complete Delivery Unit and office head assignment is required before a standard Supply Coordinator can submit a request.",
            "Requests, unit inventory, Stock Cards, and movement history are owned by the signed in account, even when two coordinators share one department.",
            "A hidden menu or action is an access control result. Do not use another user's account or a direct URL as a workaround.",
            "Use demonstration records for screenshots. Never expose passwords, OTPs, invitation links, reset links, personal contact information, signatures, or live references.",
        ],
    )

    doc.add_heading("Manual Conventions", level=2)
    manual.add_table(
        doc,
        ["Convention", "Meaning"],
        [
            ("Select", "Choose a menu, tab, record, option, or button."),
            ("Enter", "Type a value into an editable field."),
            ("Read only", "The value is displayed for reference and cannot be changed from that screen."),
            ("System generated", "SupplySync assigns or calculates the value; do not overwrite it."),
            ("Permission dependent", "Use the procedure only if the assigned role displays the named menu or action."),
            ("Expected result", "The visible or recorded outcome that confirms the procedure succeeded."),
            ("Screenshot direction", "The exact screen state and visible details to capture for the final illustrated manual."),
        ],
        widths=[1.5, 5.3],
    )

    doc.add_page_break()
    paragraph = doc.add_paragraph()
    paragraph.style = doc.styles["Heading 1"]
    paragraph.paragraph_format.page_break_before = False
    paragraph.add_run("Contents")
    paragraph = doc.add_paragraph()
    manual.add_field(
        paragraph,
        'TOC \\o "1-3" \\h \\z \\u',
        "Open this document in Microsoft Word and update the Table of Contents field.",
    )
    manual.add_labeled_paragraph(
        doc,
        "To update the contents: ",
        "In Microsoft Word, click inside the table of contents, choose Update Table, and select Update entire table.",
    )


def build_manual():
    SCREENSHOTS.clear()
    doc = Document()
    configure_styles(doc)
    configure_page(doc)
    manual.set_update_fields(doc)
    doc.core_properties.title = "SupplySync Supply Coordinator User Manual"
    doc.core_properties.subject = "Supply Coordinator procedures, role boundaries, and screenshot capture directions"
    doc.core_properties.author = "SupplySync Documentation Team"
    doc.core_properties.keywords = "SupplySync, Supply Coordinator, Delivery Unit, requests, Stock Card, unit inventory"

    add_cover(doc)
    add_front_matter(doc)

    manual.add_chapter(
        doc,
        1,
        "Role Audit Scope and Responsibility Boundary",
        "The manual scope was established by comparing default permissions with server side role checks, record ownership, navigation gates, controllers, services, and automated workflow tests.",
    )
    doc.add_heading("1.1 Role Audit Outcome", level=2)
    manual.add_table(
        doc,
        ["Area", "Audit Finding", "Treatment in This Manual"],
        [
            ("Dashboard", "Always available after authentication and scoped to the signed in coordinator's stock, requests, and movements.", "Included."),
            ("Central Supply Catalog", "Default coordinator permission plus an explicit Supply Coordinator role check. Read only.", "Included."),
            ("My Requests", "Default view, create, edit, and cancel permissions with owner only record access.", "Included."),
            ("Delivery Unit Inventory", "Default view, local issue, and Stock Card permissions with owner only stock and movement access.", "Included."),
            ("Login Audit", "Not a default coordinator permission. If separately assigned, results remain restricted to the signed in coordinator.", "Permission dependent."),
            ("Central operations and governance", "Explicitly blocked for coordinator accounts even when a central route permission is accidentally assigned.", "Excluded."),
        ],
        widths=[1.35, 3.85, 1.6],
    )

    doc.add_heading("1.2 Guaranteed Supply Coordinator Functions", level=2)
    manual.add_bullets(
        doc,
        [
            "Review the Delivery Unit dashboard and account scoped request pipeline.",
            "Browse the Central Supply Catalog without editing central item, supplier, cost, RFID, or transaction data.",
            "Create, search, review, edit, and cancel the signed in account's eligible requests.",
            "Preview or download the official RIS after approval and review the release result.",
            "Receive released quantities automatically into the signed in account's Delivery Unit inventory.",
            "Record local issues to an office or end user from owned unit stock.",
            "Generate an Appendix 58 Stock Card for each owned unit stock item.",
            "Review private receipts and unit distributions in Transaction History.",
            "Use personal Account Settings, password security, theme controls, and sign out.",
        ],
    )

    doc.add_heading("1.3 Enforced Ownership and Workflow Rules", level=2)
    manual.add_table(
        doc,
        ["Rule", "Effect"],
        [
            ("Delivery Unit assignment", "The administrator assigned department, active office head, and designation are required for a standard coordinator request."),
            ("Request ownership", "Only the submitting account sees and manages its requests. A shared department does not create shared request access."),
            ("Assignment snapshot", "The request keeps its recorded unit and office head details even if the account assignment changes later."),
            ("Release before receipt", "Approval reserves central stock. Only Property Office release deducts central stock and credits the coordinator's unit inventory."),
            ("Unit inventory ownership", "Stock, issues, Stock Cards, and movement pages are filtered by the signed in coordinator account."),
            ("Transaction audit boundary", "Coordinator accounts use their private Stock Movements page. The shared Transaction Audit redirects to that page."),
        ],
        widths=[1.65, 5.15],
    )

    doc.add_heading("1.4 Functions Not Covered", level=2)
    manual.add_bullets(
        doc,
        [
            "Creating or editing central inventory item masters, receiving batches, or central issuances.",
            "Approving, rejecting, verifying, preparing, or releasing another user's request.",
            "RFID tagging, supplier management, compliance reports, or university wide analytics.",
            "Viewing another coordinator's requests, unit stock, Stock Cards, or movement history.",
            "Changing roles, staff accounts, system mode, signatories, document numbering, email, backups, hardware devices, or system settings.",
        ],
    )

    manual.add_chapter(doc, 2, "Accessing SupplySync", "Use an active, verified Supply Coordinator account created and assigned by an authorized administrator.")
    add_procedure(
        doc,
        "2.1 Sign In",
        "Authenticate with the assigned institutional account.",
        [
            "Open the SupplySync web address supplied by the institution.",
            "Enter the Official Email Address.",
            "Enter the account Password.",
            "Select Remember me only on a secured institution managed device, if desired.",
            "Select Sign In.",
            "Confirm that the Delivery Unit Dashboard opens and the account area identifies the Supply Coordinator role.",
        ],
        "SupplySync creates an authenticated session and opens the coordinator dashboard.",
        prerequisites="Invitation or password setup must be complete, the account must be active, and the email must be verified.",
        important="Do not use Remember me on shared or public devices.",
        screenshot=(
            "Supply Coordinator Sign In Page",
            "Open the SupplySync login page in Light theme before entering a password.",
            "Capture the complete authentication card without the browser address bar.",
            "Official Email Address, Password, Remember me, Forgot password, Sign In, and support text.",
            "Use a demonstration email, leave Password empty, and hide password manager suggestions.",
        ),
    )
    add_procedure(
        doc,
        "2.2 Recover a Forgotten Password",
        "Request and use a single use password reset link.",
        [
            "On Sign In, select Forgot password.",
            "Enter the registered Official Email Address.",
            "Select Send Reset Link.",
            "Open the latest reset email and use its link before expiration.",
            "Enter New Password and Confirm New Password, then select Reset Password.",
            "Return to Sign In and authenticate with the new password.",
        ],
        "The new password replaces the previous password and the reset token becomes unusable.",
        important="A disabled account cannot regain access through password reset. Contact the System Administrator if the account is inactive.",
        screenshot=(
            "Password Recovery Form",
            "Open Forgot password and stop before submitting the recovery request.",
            "Capture the complete recovery card.",
            "Official Email Address, Send Reset Link, and Return to Sign In.",
            "Use a demonstration email. Never capture the reset email, token, or reset link URL.",
        ),
    )
    add_procedure(
        doc,
        "2.3 Complete a Staff Invitation",
        "Activate a newly provisioned Supply Coordinator account.",
        [
            "Open the most recent SupplySync invitation email.",
            "Select the invitation link before it expires.",
            "Verify the institutional account information on Complete Registration.",
            "Enter the requested name and a strong password, then confirm the password.",
            "Submit the registration form and sign in after activation succeeds.",
        ],
        "The account becomes active and can use only its assigned coordinator functions.",
        important="Do not forward invitation links. Ask an administrator to resend an expired or used invitation.",
        screenshot=(
            "Supply Coordinator Invitation Activation",
            "Open a valid test invitation and display Complete Registration before typing a password.",
            "Capture the registration card only.",
            "Page title, institutional email, password fields, guidance, and submit control.",
            "Use a test invitation. Blur the email and never capture the invitation URL or an entered password.",
        ),
    )
    add_procedure(
        doc,
        "2.4 Navigate the Coordinator Workspace",
        "Use the coordinator specific menu and account controls.",
        [
            "Review the sidebar groups for Overview, Inventory Management, Catalog and Requests, and Administration.",
            "Use Dashboard, Unit Inventory, Stock Movements, Supply Catalog, and My Requests for normal work.",
            "Open Account settings and the theme control from the user area at the bottom of the sidebar.",
            "If a control named in this manual is missing, stop and confirm the account role or permission with the System Administrator.",
        ],
        "The selected coordinator page opens without a 403 error.",
        important="Hidden central modules are intentional. Do not use a copied direct URL or another person's account.",
        screenshot=(
            "Supply Coordinator Navigation",
            "Sign in with a demonstration Supply Coordinator account using its normal deployed permissions.",
            "Capture the full application from sidebar to page header.",
            "Coordinator menu groups, role designation, Account settings, theme control, and active page indicator.",
            "Blur the coordinator name and email. Do not temporarily grant central permissions for the screenshot.",
        ),
    )
    add_procedure(
        doc,
        "2.5 Sign Out",
        "End the current authenticated session.",
        [
            "Finish or cancel any open form.",
            "Select Sign Out in the sidebar user area.",
            "Confirm sign out if a confirmation dialog appears.",
            "Verify that the Sign In page opens.",
        ],
        "The current session ends and protected pages require authentication again.",
    )

    manual.add_chapter(doc, 3, "Supply Coordinator Dashboard", "The dashboard summarizes only the signed in coordinator's unit stock, requests, receipts, distributions, and recent activity.")
    doc.add_heading("3.1 Dashboard Information", level=2)
    manual.add_table(
        doc,
        ["Dashboard Area", "What It Shows"],
        [
            ("Active requests", "Pending and approved requests owned by the signed in coordinator."),
            ("For replenishment", "Unit stock types at or below the configured threshold."),
            ("Items in stock", "Total quantity currently held by the Delivery Unit."),
            ("Item types", "Owned stock types with a positive balance."),
            ("Monthly movement", "Quantities received from the Supply Office, locally issued, and total movement entries."),
            ("Stock requiring attention", "Low or depleted unit stock with a Request action."),
            ("Inventory movement trends", "Starting balance, received quantities, issued quantities, and ending balance by period."),
            ("Recent activity and requests", "Latest account scoped movements and request status updates."),
        ],
        widths=[1.75, 5.05],
    )
    add_procedure(
        doc,
        "3.2 Review the Dashboard",
        "Identify work that needs request, replenishment, pickup, or distribution action.",
        [
            "Select Dashboard.",
            "Review Active requests and open My Requests when a status needs attention.",
            "Review For replenishment and Stock requiring attention for low or empty unit stock.",
            "Review Items in stock, Item types, and the monthly movement cards.",
            "Use the period selector on Inventory movement trends when another time view is required.",
            "Use Quick links for Unit stock cards, Supply catalog, My requests, or Stock movements.",
        ],
        "The coordinator has identified current request and unit inventory follow up items.",
        important="Dashboard values are account scoped snapshots. Refresh after the Property Office releases stock or after recording a unit issue.",
        screenshot=(
            "Supply Coordinator Dashboard Overview",
            "Open Dashboard with demonstration requests, released unit stock, and at least one movement.",
            "Capture the workspace banner, summary cards, stock attention, trend chart, recent activity, and quick links.",
            "New Request, Awaiting release, Issue supplies, View catalog, account scoped metrics, and Request updates.",
            "Blur names, references, recipient labels, and any live quantities if needed.",
        ),
    )

    manual.add_chapter(doc, 4, "Central Supply Catalog", "The catalog is a read only view of consumable supplies held by the Supply Office.")
    add_procedure(
        doc,
        "4.1 Search and Filter Central Supplies",
        "Find a consumable and understand its requestable quantity.",
        [
            "Select Supply Catalog in the sidebar or View catalog on Dashboard.",
            "Search by item name or stock number when needed.",
            "Choose All supplies, Available to request, or Currently unavailable.",
            "Review In Supply Office and Available to request for the target item.",
            "Select Refresh when another transaction may have changed availability.",
        ],
        "The matching central catalog cards display without creating or changing a request.",
        important="Available to request excludes quantities reserved by approved requests. Catalog browsing never transfers stock to the Delivery Unit.",
        screenshot=(
            "Central Supply Catalog",
            "Open Supply Catalog with available, fully reserved, and out of stock demonstration items.",
            "Capture the page heading, read only notice, search and availability controls, and several item cards.",
            "In Supply Office, Available to request, stock status, Request This Item, and unavailable button states.",
            "Use demonstration items. Do not capture real contract, supplier, cost, or RFID information.",
        ),
    )
    add_procedure(
        doc,
        "4.2 Start a Request from the Catalog",
        "Open a new requisition with one available item already selected.",
        [
            "Locate an item with a positive Available to request quantity.",
            "Select Request This Item.",
            "Confirm that Create Supply Requisition opens and Item number 1 contains the selected item.",
            "Complete the remaining request fields and requested quantity before submitting.",
        ],
        "The request form opens with the chosen available item prefilled.",
        important="The prefilled form is not saved until Submit Supply Request succeeds. Unavailable or archived items are not prefilled.",
        screenshot=(
            "Catalog Request Item Prefill",
            "Select Request This Item for an available demonstration consumable.",
            "Capture the catalog card and the resulting request form item row in separate images if needed.",
            "Available quantity, Request This Item, selected item, On Hand Stock, and Qty.",
            "Use fictional item identity and quantity values.",
        ),
    )

    manual.add_chapter(doc, 5, "Create a Supply Request", "A standard Supply Coordinator request uses the administrator assigned Delivery Unit and office head.")
    doc.add_heading("5.1 Assignment Prerequisite", level=2)
    manual.add_bullets(
        doc,
        [
            "The account must have a Department or Delivery Unit.",
            "The account must have an active Department or Office Head.",
            "The selected head must have a name and designation.",
            "The request form locks Requested by, Division or Office, and Office Head Designation to the assignment.",
            "The coordinator account remains the system submitter and cannot change its own assignment through the request form.",
        ],
    )
    add_screenshot_direction(
        doc,
        "Coordinator Assignment Guidance",
        "Open New Request with a correctly assigned demonstration coordinator, then separately stage a test account with an incomplete assignment if available.",
        "Capture the assignment guidance at the top of the request form and the locked requesting office fields.",
        "Assigned Delivery Unit explanation, Requested by, Division or Office, Office Head Designation, and any missing assignment warning.",
        "Use fictional head and unit names. Do not expose live staff records.",
    )
    add_procedure(
        doc,
        "5.2 Submit a New Request",
        "Create a requisition for one or more available consumable items.",
        [
            "Select My Requests, then select New Request. You may also use New Request on Dashboard.",
            "Verify the read only Requested by office head, Division or Office, and Office Head Designation.",
            "Verify or select Date Requested and Fund Cluster.",
            "Enter a clear Purpose.",
            "Search for Item number 1 by item name or stock number.",
            "Review On Hand Stock and enter a positive Qty.",
            "Use Add another item for each additional distinct consumable.",
            "Review the read only Approved By and Issued By signatory sections.",
            "Select Submit Supply Request and read the confirmation message.",
        ],
        "SupplySync creates an owned Pending request with a preserved RIS reference and sends it for Property Custodian review.",
        prerequisites="The Delivery Unit assignment must be complete and each selected item must currently have positive central stock.",
        important="Submission does not deduct central stock or add unit stock. The Property Custodian may approve a lower quantity than requested.",
        screenshot=(
            "Create Supply Requisition Form",
            "Open New Request with a complete demonstration assignment and two in stock demonstration items.",
            "Capture the form in enough images to show the four numbered sections and submit control.",
            "Locked office details, date, fund cluster, purpose, item search, stock, quantities, signatories, and Submit Supply Request.",
            "Use fictional names, units, item data, and quantities. Do not enter passwords, signatures, or live personal data.",
        ),
    )

    manual.add_chapter(doc, 6, "Manage My Requests", "My Requests lists only requisitions owned by the signed in coordinator account.")
    doc.add_heading("6.1 Standard Status Reference", level=2)
    manual.add_table(
        doc,
        ["Status", "Meaning", "Coordinator Action"],
        [
            ("Pending Review", "Submitted and awaiting Property Custodian decision.", "Review details, edit while still Pending, or cancel."),
            ("Approved Awaiting Release", "Approved quantities are reserved in central stock.", "Review adjustments, print the RIS, prepare for pickup, or cancel if no longer needed."),
            ("Issued Released", "Physical release was confirmed and approved quantities entered unit inventory.", "Review release details and confirm unit stock."),
            ("Rejected", "The Property Custodian declined the request and recorded a reason.", "Review the reason. Create a new request if a corrected need remains."),
            ("Cancelled", "The coordinator ended the request before release.", "No further normal action is available."),
        ],
        widths=[1.55, 2.95, 2.3],
    )
    add_procedure(
        doc,
        "6.2 Search Filter and Review Requests",
        "Find an owned request and inspect its recorded details.",
        [
            "Select My Requests.",
            "Use the summary cards or Status filter to narrow the list.",
            "Search by RIS number, item, recipient, or purpose when needed.",
            "Select Details on the target request.",
            "Review status, RIS number, submitter, requested by office head, division or office, date, fund cluster, purpose, and item quantities.",
            "Review approval remarks, adjusted quantities, and release details when present.",
        ],
        "The correct owned request is displayed without exposing another coordinator's records.",
        screenshot=(
            "My Supply Requests Workspace",
            "Open My Requests with Pending, Approved, Issued, Rejected, and Cancelled demonstration records.",
            "Capture the summary cards, workflow banner, search and status controls, and request list.",
            "RIS reference, date, supplies, purpose, office, status badges, Details, Edit, View RIS, and Cancel when eligible.",
            "Use demonstration references and blur names, office labels, and quantities when they resemble live data.",
        ),
    )
    add_procedure(
        doc,
        "6.3 Edit a Pending Request",
        "Correct an owned request before approval.",
        [
            "Locate a request with Pending Review status.",
            "Select Edit.",
            "Keep the original locked Delivery Unit and office head details.",
            "Correct Date Requested, Fund Cluster, Purpose, item selection, or quantities as needed.",
            "Remove any item that has become unavailable and choose another in stock item if appropriate.",
            "Select Save Changes and confirm the updated request details.",
        ],
        "The Pending request is updated while its original unit and office head snapshot remains unchanged.",
        important="Approved, Issued, Rejected, and Cancelled requests cannot be edited through the coordinator form.",
        screenshot=(
            "Edit Pending Supply Request",
            "Open Edit on a demonstration Pending request.",
            "Capture the form title, locked assignment fields, editable purpose and item lines, and Save Changes.",
            "Edit Requisition reference, unavailable item warning if staged, and Save Changes.",
            "Use fictional request data. Do not expose real office heads or request references.",
        ),
    )
    add_procedure(
        doc,
        "6.4 Cancel an Eligible Request",
        "Stop an owned request before physical release.",
        [
            "Locate a Pending Review or Approved Awaiting Release request.",
            "Select Cancel.",
            "Read the confirmation and verify the correct RIS reference.",
            "Confirm cancellation.",
            "Verify that the request status becomes Cancelled.",
        ],
        "The request becomes Cancelled. Any approved reservation no longer reduces central availability.",
        important="Cancellation is unavailable after the request is Issued or Released.",
    )

    manual.add_chapter(doc, 7, "Approval RIS and Physical Release", "The Property Custodian controls approval and release. The coordinator reviews the decision, prints the RIS, and presents the signed form at pickup.")
    add_procedure(
        doc,
        "7.1 Review an Approval Decision",
        "Confirm final approved quantities and remarks before pickup.",
        [
            "Open My Requests and select an Approved Awaiting Release request.",
            "Select Details.",
            "Compare Requested Qty with the approved quantity for every line.",
            "Read any Property Custodian remarks and note adjusted quantities.",
            "Confirm the official RIS number and the Requested by and Division or Office details.",
        ],
        "The coordinator understands the quantities authorized for physical release.",
        important="Do not expect requested quantities that were reduced to be released. Approval reserves stock but does not yet add it to unit inventory.",
        screenshot=(
            "Approved Request Details",
            "Open Details for a demonstration Approved request with at least one adjusted line.",
            "Capture the status and RIS header, request information, requested and approved item table, and review remarks.",
            "Approved Awaiting Release, official RIS number, adjusted quantity label, approver, date, and remarks.",
            "Use demonstration data and blur names, RIS number, office, and quantities if needed.",
        ),
    )
    add_procedure(
        doc,
        "7.2 Preview Print or Download the RIS",
        "Prepare the official Requisition and Issue Slip for physical handover.",
        [
            "From an Approved request, select View RIS.",
            "Review the entity, fund cluster, division or office, RIS number, purpose, requested by details, and approved item lines.",
            "Verify that the approved quantities match the request details.",
            "Use Print for the signed paper process or Download PDF for an authorized working copy.",
            "Close the preview and return to My Requests.",
        ],
        "A readable approved RIS is available for the physical pickup workflow.",
        important="Printing the approved RIS does not release stock. Issue quantities are completed only after authorized physical handover.",
        screenshot=(
            "Approved RIS Preview",
            "Open View RIS for a demonstration Approved request.",
            "Capture the preview workspace and enough of the official form to identify the layout.",
            "RIS reference, approved items, signatory sections, Print, and Download PDF.",
            "Use demonstration names and references. Never capture real signatures.",
        ),
    )
    add_procedure(
        doc,
        "7.3 Complete Physical Pickup",
        "Receive approved supplies from the Property Office and verify the resulting unit inventory credit.",
        [
            "Bring the required signed RIS and follow the institution's physical pickup process.",
            "Compare the physical items with the final approved quantities.",
            "The Property Custodian confirms the signed RIS and completes release in SupplySync.",
            "Refresh My Requests and verify that the status becomes Issued Released.",
            "Open Details and review Release and Distribution Details.",
            "Open Unit Inventory and verify that the released approved quantities appear once.",
        ],
        "Central stock is deducted once, the request is completed, and the coordinator's unit stock is credited once.",
        important="The coordinator cannot release the request in the system. Report a quantity mismatch before local distribution.",
        screenshot=(
            "Released Request and Unit Inventory Credit",
            "Use a demonstration request immediately after an authorized Property Custodian release.",
            "Capture the Issued Released request details and the matching Unit Inventory stock row in separate images.",
            "Release date, issued by details, final quantities, item name, on hand balance, and stock value.",
            "Use demonstration records. Do not capture signatures or live personal data.",
        ),
    )

    manual.add_chapter(doc, 8, "Delivery Unit Inventory", "Unit Inventory contains only stock credited to the signed in coordinator after central release.")
    add_procedure(
        doc,
        "8.1 Search and Review Unit Stock",
        "Find owned unit stock and identify replenishment needs.",
        [
            "Select Unit Inventory.",
            "Review Supplies in stock, Inventory value, and For replenishment.",
            "Open Supplies on Hand.",
            "Search by item name or stock number when needed.",
            "Choose All items, Available, Low stock, or Out of stock.",
            "Review item name, stock number, on hand quantity, status, stock value, and available actions.",
        ],
        "The target owned stock row is identified without changing its balance.",
        important="A released item appears in the owner account's unit inventory only. It is not shared automatically with another coordinator in the same department.",
        screenshot=(
            "Delivery Unit Inventory",
            "Open Unit Inventory with available, low, and depleted demonstration stock.",
            "Capture the summary cards, process banner, tabs, search and status controls, and stock rows.",
            "Supplies on Hand, Transaction History, item, on hand, status, stock value, Record Issue, and Stock Card.",
            "Use fictional item and value data. Blur coordinator and office identity.",
        ),
    )

    manual.add_chapter(doc, 9, "Record a Delivery Unit Issue", "A unit issue records distribution from the coordinator's owned stock to an office or end user.")
    add_procedure(
        doc,
        "9.1 Save a Unit Distribution",
        "Deduct an issued quantity from owned unit stock and record the recipient.",
        [
            "Open Unit Inventory and locate the target stock item.",
            "Select Record Issue.",
            "Review the item, stock number, and available quantity.",
            "Enter Quantity to issue. The value must be a whole number from 1 through the available balance.",
            "Enter the Receiving office or end user.",
            "Review the displayed remaining quantity.",
            "Select Save Issue.",
            "Confirm the new on hand balance and review the entry in Transaction History.",
        ],
        "SupplySync deducts the quantity from the coordinator's unit stock and adds a local issue movement with a UNIT ISSUE reference.",
        important="A unit issue does not change central Supply Office stock. The interface has no normal edit or reversal action, so verify quantity and recipient before saving.",
        screenshot=(
            "Record a Unit Issue",
            "Open Record Issue for an available demonstration stock item and enter an unsaved valid quantity and recipient.",
            "Capture the complete dialog before selecting Save Issue.",
            "Item summary, available quantity, Quantity to issue, remaining quantity, Receiving office or end user, and Save Issue.",
            "Use a fictional recipient and quantity. Do not capture real personal information.",
        ),
    )

    manual.add_chapter(doc, 10, "Generate a Stock Card", "SupplySync generates an official Appendix 58 PDF from the owned item's receipt and issue movements.")
    add_procedure(
        doc,
        "10.1 Download a Stock Card",
        "Produce an all history, current month, or custom date Stock Card.",
        [
            "Open Unit Inventory and locate the item.",
            "Select Stock Card.",
            "Choose All history, This month, or Custom dates.",
            "For Custom dates, optionally enter From and Through. The end date must not precede the start date.",
            "Select Download PDF.",
            "Open the PDF and review entity, item, stock number, unit, reorder point, fund cluster, coordinator name, receipts, issues, recipients, and running balances.",
        ],
        "An Appendix 58 Stock Card PDF downloads for the selected owned item and period.",
        important="A date filtered Stock Card carries the opening balance into the selected period and excludes movements after the end date.",
        screenshot=(
            "Generate Stock Card",
            "Open Stock Card for a demonstration item with both receipt and issue history.",
            "Capture the reporting period dialog and the first page of the downloaded PDF in separate images.",
            "All history, This month, Custom dates, Download PDF, item identity, entries, and running balance.",
            "Use demonstration movements and blur the coordinator name and recipient details.",
        ),
    )

    manual.add_chapter(doc, 11, "Unit Transaction History", "Transaction History is the coordinator's private ledger of central receipts and local distributions.")
    add_procedure(
        doc,
        "11.1 Review Stock Movements",
        "Confirm that a release or unit distribution was recorded.",
        [
            "Select Stock Movements in the sidebar or Transaction History in Unit Inventory.",
            "Review Date, Item or Reference, Movement, Quantity, and Source or Recipient.",
            "Identify receipts by the Received badge, positive quantity, and Supply Office source.",
            "Identify local distributions by the Issued badge, negative quantity, and recorded recipient.",
            "Use the page controls when more than 20 entries exist.",
            "Open the item's Stock Card when a running balance or period report is required.",
        ],
        "The expected owned receipt or local issue is visible with its reference and quantity.",
        important="Query parameters cannot expose another coordinator's movements. Shared Transaction Audit links redirect coordinator accounts to this private history.",
        screenshot=(
            "My Unit Transaction History",
            "Open Transaction History with several demonstration receipts and unit issues across more than one item.",
            "Capture the table and pagination controls.",
            "Date, item, reference, Received and Issued badges, signed quantity, Supply Office source, and recipient.",
            "Use fictional references and recipients. Blur coordinator identity.",
        ),
    )

    manual.add_chapter(doc, 12, "Login Audit Permission Dependent", "The standard role does not automatically receive the shared Login Audit permission. Personal Login History remains available in Account Settings.")
    add_procedure(
        doc,
        "12.1 Review Self Scoped Login Audit",
        "Review authentication events when Login Audit has been separately assigned.",
        [
            "Select Audit Logs, then Login Audit, only when the menu is visible.",
            "Review total, successful, failed, and unique account metrics within the displayed scope.",
            "Search or filter by status and date when needed.",
            "Review event time, status, IP address, browser, and device details.",
            "Report unfamiliar access and change the password immediately.",
        ],
        "The coordinator reviews only authentication events belonging to the signed in account.",
        availability="Requires the Login Audit permission. The role remains self scoped even when the permission is assigned.",
        important="Transaction Audit is not a coordinator function. Use Stock Movements for unit inventory transactions.",
        screenshot=(
            "Self Scoped Coordinator Login Audit",
            "Use a demonstration Supply Coordinator account that legitimately has Login Audit permission.",
            "Capture the summary, filters, and several personal events.",
            "Successful Login, Failed Login, Logged Out, dates, and account scoped event rows.",
            "Blur email, IP address, user agent, device, location, and timestamps that identify real activity.",
        ),
    )

    manual.add_chapter(doc, 13, "Account Settings and Personal Security", "Each Supply Coordinator is responsible for protecting the assigned account and reviewing personal access information.")
    add_procedure(
        doc,
        "13.1 Update Profile Information",
        "Keep permitted account identity fields accurate.",
        [
            "Select Account settings from the sidebar user area.",
            "Open the Profile tab.",
            "Review department, role, email verification, and account creation information.",
            "Edit permitted name or email fields.",
            "Select Save and complete email verification when requested.",
        ],
        "The profile displays the updated permitted values.",
        important="The personal profile cannot change the Supply Coordinator role, Delivery Unit, or office head assignment.",
        screenshot=(
            "Supply Coordinator Account Settings",
            "Open Account settings and the Profile tab with a demonstration coordinator account.",
            "Capture the tab bar and profile summary and edit area.",
            "Profile, Security, Login History, role and department summary, editable fields, and Save.",
            "Blur the user's name, email, department, office head, and account dates.",
        ),
    )
    add_procedure(
        doc,
        "13.2 Change the Password with OTP",
        "Replace the password using current password verification and an emailed one time code.",
        [
            "Open Account settings, then Security.",
            "Enter Current Password, New Password, and Confirm New Password.",
            "Review the password requirements and continue to the security code step.",
            "Open the registered email account and enter the six digit OTP before expiration.",
            "Select Verify and Update Password.",
            "Confirm Password Updated Successfully and sign in again if the session is invalidated.",
        ],
        "The password changes only after the correct current password and OTP are verified.",
        important="Never disclose an OTP. Failed attempts, expiration, resend cooldowns, and request limits are enforced.",
        screenshot=(
            "Password and OTP Security Flow",
            "Open the Security tab and show the password details step or an OTP step using a test account.",
            "Capture the form without any secrets entered.",
            "Current, New, and Confirm Password labels or six OTP boxes, expiration guidance, resend control, and Verify and Update Password.",
            "Leave password and OTP fields empty and mask the destination email.",
        ),
    )
    add_procedure(
        doc,
        "13.3 Review Personal Sessions and Login History",
        "Identify unfamiliar account access.",
        [
            "Open Security and review Active System Sessions.",
            "Identify the Current Session and compare device, browser, approximate location, and time when shown.",
            "Open Login History and review recent successful or failed personal authentication events.",
            "Change the password and report the event immediately if access is unfamiliar.",
        ],
        "Recent account access has been confirmed or the incident response process has started.",
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
        "The theme preference is applied and the session ends at sign out.",
    )

    manual.add_chapter(doc, 14, "Security and Daily Operating Practices", "Use these practices to protect Delivery Unit stock, requests, and accountability records.")
    manual.add_bullets(
        doc,
        [
            "Use only the assigned individual account. Do not share credentials or let another person record a request or unit issue under your session.",
            "Verify Delivery Unit and office head assignment before submitting the first request after an account change.",
            "Review central availability and avoid speculative or duplicate requests.",
            "Compare final approved quantities with the printed RIS and the physical supplies before accepting release.",
            "Confirm Unit Inventory immediately after release and report a mismatch before distributing stock.",
            "Verify item, quantity, and recipient before saving a local issue because the coordinator interface has no normal edit or reversal action.",
            "Use Stock Cards and Transaction History for reconciliation. Do not use the shared central Transaction Audit.",
            "Never reveal passwords, OTPs, reset or invitation links, signatures, private references, or live personal data in screenshots.",
            "Report missing controls or unexpected 403 errors instead of requesting broader access than the task requires.",
        ],
    )

    manual.add_chapter(doc, 15, "Troubleshooting and Escalation", "Record the page, time, role, exact message, reference, attempted action, and a privacy safe screenshot before escalating.")
    manual.add_table(
        doc,
        ["Symptom", "Likely Cause", "Supply Coordinator Action"],
        [
            ("New Request is disabled", "Delivery Unit, active office head, or office head designation is missing.", "Ask an administrator to complete the Staff Account assignment. Do not type replacement assignment values elsewhere."),
            ("Item cannot be selected", "The item is out of stock, archived, or no longer eligible for requisition.", "Refresh the form, remove the unavailable line, or choose another available item."),
            ("Requested item shows less available stock", "Approved requests have reserved part or all of central stock.", "Use the displayed Available to request value and expect final approval adjustment if needed."),
            ("Request cannot be edited", "The request is no longer Pending or is not owned by the signed in account.", "Review Details. Contact the Property Custodian for an approved request change or create a new request when appropriate."),
            ("Request cannot be cancelled", "The request was already issued, released, rejected, or cancelled.", "Review the final status and escalate only if it is incorrect."),
            ("Approved stock is absent from Unit Inventory", "The Property Custodian approved but did not complete physical release, or refresh is needed.", "Check for Issued Released status, refresh, then escalate with the RIS reference if the release is complete."),
            ("Record Issue will not save", "Quantity is zero, noninteger, above available stock, recipient is blank, or stock belongs to another account.", "Correct the highlighted fields and confirm the selected owned item."),
            ("Stock Card date range is invalid", "Through precedes From.", "Choose an end date on or after the start date, then download again."),
            ("Central inventory or analytics returns 403", "The coordinator role is explicitly blocked from central operational and university wide pages.", "Return to the coordinator sidebar. Use Supply Catalog, My Requests, Unit Inventory, or Stock Movements."),
            ("OTP expired or locked", "The code expired, attempts reached the limit, or resend is rate limited.", "Wait for the displayed cooldown, request a new code, and restart the password flow if required."),
        ],
        widths=[1.55, 2.65, 2.6],
    )
    doc.add_heading("15.1 Escalation Record", level=2)
    manual.add_bullets(
        doc,
        [
            "Page and module",
            "Date and local time",
            "Supply Coordinator username or staff ID shared only through the approved support channel",
            "RIS, Stock Card, item, or UNIT ISSUE reference with personal data minimized",
            "Action attempted and exact visible message",
            "Whether the problem repeats after refresh and sign in",
            "Privacy safe screenshot using the directions in this manual",
        ],
    )

    manual.add_chapter(doc, 16, "Glossary and Quick Reference", "Use these terms consistently when recording actions and reporting issues.")
    manual.add_table(
        doc,
        ["Term", "Meaning"],
        [
            ("RIS", "Requisition and Issue Slip used for request approval and physical release documentation."),
            ("SPMO", "Supply and Property Management Office."),
            ("Delivery Unit", "The department or office assigned to the coordinator account."),
            ("Office Head", "The active assigned signatory shown as Requested by on the coordinator's request."),
            ("Central Supply Catalog", "Read only list of central consumables and quantities available after approved reservations."),
            ("Pending Review", "The request awaits Property Custodian decision."),
            ("Approved Awaiting Release", "Approved quantities are reserved, but central and unit stock have not yet moved."),
            ("Issued Released", "Physical release was confirmed and approved quantities were credited to unit inventory."),
            ("Unit Inventory", "Stock owned by the signed in coordinator account after central release."),
            ("Unit Issue", "A local distribution that deducts only the coordinator's unit stock."),
            ("Stock Card", "Appendix 58 PDF showing receipts, issues, recipients, and running balances for one owned item."),
            ("Stock Movements", "Private coordinator history of central receipts and local issues."),
        ],
        widths=[1.65, 5.15],
    )

    manual.add_chapter(doc, 17, "Screenshot Capture Register", "The following register indexes the 21 illustrated figures integrated directly into this manual, along with their primary screens and visual guide coverage.")
    manual.add_table(
        doc,
        ["ID", "Figure & Screenshot Title", "Visual Guide Callouts"],
        [(shot["fig_key"], shot["title"], f"{len(SPECS.get(shot['fig_key'], []))} Callout Pointers with Direct Arrows") for shot in SCREENSHOTS],
        widths=[0.85, 2.7, 3.25],
    )
    doc.add_heading("17.1 Screenshot Quality Checklist", level=2)
    manual.add_bullets(
        doc,
        [
            "All 21 figures are integrated directly beneath their matching procedures with high-contrast callout arrows.",
            "Each numbered badge corresponds directly to an itemized pointer in the accompanying guide legend.",
            "Use the same browser zoom, window size, theme, and sidebar state throughout the manual.",
            "Capture the page title and enough navigation context to identify the location.",
            "Show the control named in the procedure and the data state that makes it available.",
            "Crop out the browser address bar when it reveals a private host or token.",
            "Use PNG format and a readable resolution. Do not photograph the monitor.",
            "Blur or replace real names, emails, departments, office heads, signatures, RIS numbers, costs, values, recipients, IP addresses, and dates.",
            "Do not add arrows or highlights that cover labels or validation messages.",
            "Name files with the screenshot ID, for example SC-01.png, SC-02.png, and so on.",
        ],
    )

    manual.add_chapter(doc, 18, "Supply Coordinator Handover Checklist", "Use this page when Supply Coordinator responsibility or account assignment changes.")
    manual.add_table(
        doc,
        ["Check", "Handover Item", "Completed or Notes"],
        [
            ("[ ]", "Supply Coordinator account is active, verified, and uses an individual institutional email.", ""),
            ("[ ]", "Delivery Unit, active office head, and office head designation are correct.", ""),
            ("[ ]", "Dashboard, Supply Catalog, My Requests, Unit Inventory, Stock Movements, and Account settings open correctly.", ""),
            ("[ ]", "A demonstration request can be submitted, edited while Pending, reviewed, and cancelled.", ""),
            ("[ ]", "Approved quantity review, RIS preview or download, and physical pickup procedures were rehearsed.", ""),
            ("[ ]", "Released stock appears in Unit Inventory once and can be reconciled to the RIS.", ""),
            ("[ ]", "Record Issue was rehearsed using demonstration data and the recipient naming standard is known.", ""),
            ("[ ]", "Stock Card periods, opening balance behavior, and Transaction History were reviewed.", ""),
            ("[ ]", "Password was changed by the new user and personal sessions and login history were reviewed.", ""),
            ("[ ]", "No credentials, OTPs, invitation links, signatures, exported RIS files, or Stock Cards were left in an insecure location.", ""),
        ],
        widths=[0.45, 4.9, 1.45],
    )
    manual.add_labeled_paragraph(doc, "Outgoing Supply Coordinator: ", "________________________________    Date: ________________")
    manual.add_labeled_paragraph(doc, "Incoming Supply Coordinator: ", "________________________________    Date: ________________")
    manual.add_labeled_paragraph(doc, "Supervisor or Office Head: ", "________________________________    Date: ________________")

    ids = [shot["id"] for shot in SCREENSHOTS]
    expected = [f"SC-SS-{index:02d}" for index in range(1, len(ids) + 1)]
    if ids != expected:
        raise RuntimeError(f"Screenshot IDs are not sequential: {ids}")

    doc.save(OUTPUT)
    print(f"Created {OUTPUT}")
    print(f"Screenshot directions: {len(SCREENSHOTS)}")


if __name__ == "__main__":
    build_manual()
