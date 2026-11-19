from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt

import build_supplysync_inventory_staff_manual as manual


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "SupplySync_Authorized_Personnel_Manual.docx"
UCN_LOGO = ROOT / "public" / "images" / "ucnlogo.png"
SUPPLYSYNC_LOGO = ROOT / "public" / "images" / "supplysync-sidebar-logo.png"

VERSION = "1.0"
EFFECTIVE_DATE = "12 November 2026"
DOCUMENT_ID = "SS-AP-MAN-001"

BLACK = manual.BLACK
MID_GRAY = manual.MID_GRAY
MAROON = manual.MAROON

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
    run = paragraph.add_run("SupplySync  |  Authorized Personnel Manual")
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
    shot_id = f"AP-SS-{number:02d}"
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
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.left_indent = Inches(0.18)
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(1.5)
    paragraph.paragraph_format.keep_together = True
    run = paragraph.add_run(f"SCREENSHOT DIRECTION {shot_id} - {title}")
    run.bold = True
    run.font.color.rgb = manual.rgb(BLACK)
    manual.add_labeled_paragraph(doc, "Screen and setup: ", screen)
    manual.add_labeled_paragraph(doc, "Capture: ", capture)
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
    doc.add_heading(title, level=2)
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
        picture = paragraph.add_run().add_picture(str(UCN_LOGO), width=Inches(0.92))
        picture._inline.docPr.set("descr", "University of Camarines Norte logo")
        picture._inline.docPr.set("title", "University of Camarines Norte")

    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(15)
    if SUPPLYSYNC_LOGO.exists():
        picture = paragraph.add_run().add_picture(str(SUPPLYSYNC_LOGO), width=Inches(2.65))
        picture._inline.docPr.set("descr", "SupplySync consumable supplies management system logo")
        picture._inline.docPr.set("title", "SupplySync")

    paragraph = doc.add_paragraph(style="Title")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(24)
    paragraph.add_run("AUTHORIZED PERSONNEL\nUSER MANUAL")

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
    run = paragraph.add_run("AUTHORIZED PERSONNEL ONLY")
    run.bold = True
    run.font.size = Pt(15)
    run.font.color.rgb = manual.rgb(BLACK)

    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(11)
    run = paragraph.add_run(
        "Document backed supply requests, correction and resubmission,\n"
        "pickup tracking, and account scoped Delivery Unit inventory"
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
            ("Document title", "SupplySync Authorized Personnel User Manual"),
            ("Version", VERSION),
            ("Effective date", EFFECTIVE_DATE),
            ("Applicable role", "Authorized Personnel only"),
            (
                "Scope basis",
                "Audit of seeded permissions, route authorization, record ownership, controller validation, supporting document storage, workflow services, navigation, interface controls, and automated tests",
            ),
            ("Document owner", "SupplySync Authorized Request Operations"),
            ("Classification", "Internal Operational Use"),
            ("Review cycle", "After each major release, role permission change, workflow change, or at least annually"),
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
                "Initial Authorized Personnel manual based on a role and workflow audit, with screenshot capture directions.",
                "Authorized Personnel",
            )
        ],
        widths=[0.7, 1.1, 3.85, 1.15],
    )

    manual.add_labeled_paragraph(
        doc,
        "Strict role boundary: ",
        "This manual covers the standard Authorized Personnel role only. The role can create and manage its own document backed requests and account scoped Delivery Unit stock. It cannot verify its own supporting document, approve or reject requests, prepare pickup, release stock, manage central inventory, use RFID administration, maintain suppliers, access university analytics, change access control, or administer system settings.",
    )
    manual.add_labeled_paragraph(
        doc,
        "Screenshot status: ",
        "The manual contains directions for screenshots but does not insert live system images. Capture the images after deployment and demonstration data are ready, then place each image beneath its matching screenshot direction.",
    )

    doc.add_heading("How to Use This Manual", level=2)
    manual.add_bullets(
        doc,
        [
            "Use an Authorized Personnel demonstration account while following the procedures. Do not use an administrator or Inventory Staff account to expose unavailable controls.",
            "The signed in user's name is recorded as Requested by. A Delivery Unit assignment is optional; an assigned unit is locked, while an unassigned user must choose a Division or Office in the request form.",
            "Every new request requires an approved supporting document. Requests and unit inventory remain owned by the signed in account.",
            "A hidden menu or action is an access control result. Do not use another user's account or a copied direct URL as a workaround.",
            "Use demonstration records for screenshots. Never expose passwords, OTPs, invitation links, reset links, signatures, personal identifiers, private documents, or live references.",
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
            ("Screenshot direction", "The screen state and visible details to capture for the final illustrated manual."),
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
    doc.core_properties.title = "SupplySync Authorized Personnel User Manual"
    doc.core_properties.subject = "Authorized Personnel procedures, supporting document workflow, role boundaries, and screenshot capture directions"
    doc.core_properties.author = "SupplySync Documentation Team"
    doc.core_properties.keywords = "SupplySync, Authorized Personnel, supporting document, requisition, pickup, Delivery Unit"

    add_cover(doc)
    add_front_matter(doc)

    manual.add_chapter(
        doc,
        1,
        "Role Audit Scope and Responsibility Boundary",
        "The manual scope was established by comparing role permissions with server side role checks, ownership filters, request validation, workflow services, private file access, interface controls, and automated tests.",
    )
    doc.add_heading("1.1 Role Audit Outcome", level=2)
    manual.add_table(
        doc,
        ["Area", "Audit Finding", "Treatment in This Manual"],
        [
            ("Dashboard", "Uses the coordinator workspace and displays account scoped stock, requests, and movements.", "Included."),
            ("Central Supply Catalog", "Read only central catalog inherited from the coordinator role.", "Included."),
            ("My Requests", "Owner only creation, viewing, editing, cancellation, alerts, RIS access, and private supporting document access.", "Included."),
            ("Supporting document", "Required for each request and gated by separate SPMO verification that the requester cannot perform.", "Included."),
            ("Delivery Unit Inventory", "Owned stock, local issue, Stock Card, and movement functions inherited from the coordinator role.", "Included."),
            ("Login Audit", "Not guaranteed. If separately assigned, results remain restricted to the signed in account.", "Permission dependent."),
            ("Central operations and governance", "Central inventory, approval, verification, release, analytics, access control, and settings are not requester functions.", "Excluded."),
        ],
        widths=[1.35, 3.85, 1.6],
    )

    doc.add_heading("1.2 Standard Authorized Personnel Functions", level=2)
    manual.add_bullets(
        doc,
        [
            "Review the account scoped Delivery Unit dashboard and request pipeline.",
            "Browse the Central Supply Catalog without editing central stock or transaction data.",
            "Create an owner only supply request with an Approved MOA, Approved Research, Approved Letter, or Others as the supporting document type.",
            "Preview or download the private document attached to the signed in user's request.",
            "Edit an eligible request, respond to For Correction remarks, replace the file when required, and resubmit for verification.",
            "Track verification, inventory review, approval, pickup preparation, release, rejection, or cancellation status.",
            "Preview or download the official RIS after approval and present the signed form for physical release.",
            "Receive released quantities into the signed in account's Delivery Unit inventory, record local issues, generate Stock Cards, and review private movements.",
            "Use personal Account Settings, password security, personal login history, theme controls, and sign out.",
        ],
    )

    doc.add_heading("1.3 Enforced Ownership and Workflow Rules", level=2)
    manual.add_table(
        doc,
        ["Rule", "Effect"],
        [
            ("Requester identity", "SupplySync records the signed in Authorized Personnel user's name as Requested by."),
            ("Division or Office", "An assigned Delivery Unit is locked. Without an assignment, the requester must choose a Division or Office."),
            ("Document requirement", "The requirement is stored on the request and remains even if the user's role changes later."),
            ("Private document", "Only the request owner and authorized SPMO reviewers can open the file. The private storage path is not exposed."),
            ("Separate verification", "Uploading does not verify the document. The requester cannot verify the requester's own file."),
            ("Approval gate", "Inventory approval, pickup preparation, and release are blocked until document verification is recorded."),
            ("Request ownership", "Another Authorized Personnel account cannot view, edit, cancel, or download the owner's request or document."),
            ("Release before receipt", "Approved stock is reserved. Unit inventory changes only after signed RIS release is confirmed."),
        ],
        widths=[1.65, 5.15],
    )

    doc.add_heading("1.4 Functions Not Covered", level=2)
    manual.add_bullets(
        doc,
        [
            "Verifying, approving, rejecting, preparing, or releasing a request.",
            "Viewing another person's request, supporting document, unit stock, Stock Card, or movement history.",
            "Creating or editing central inventory items, receiving batches, central issuances, suppliers, or RFID tags.",
            "Using compliance reports or university wide consumable supply analytics.",
            "Changing roles, staff accounts, signatories, system settings, backups, email, numbering, hardware, or security configuration.",
        ],
    )

    doc.add_heading('1.5 Audit Evidence and Current Limitations', level=2)
    doc.add_paragraph('This manual reflects the repository reviewed on 12 November 2026. The role audit compared permission migrations, server authorization, request ownership, document validation and storage, workflow services, navigation, and interface controls. It does not certify permissions customized in a deployed database.')
    doc.add_paragraph('The relevant automated checks passed with 26 tests and 516 assertions. They cover Authorized Personnel requests, protected documents, invalid uploads, correction and resubmission, verification gates, pickup and release, request alerts, and the inherited Delivery Unit inventory workflow.')
    doc.add_paragraph('The main evidence is app/Models/User.php, app/Http/Middleware/AuthorizeAction.php, the SupplyRequestController, SupportingDocumentService and SupplyRequestService in Modules/Inventory, app/Http/Controllers/CoordinatorInventoryController.php, app/Services/CoordinatorInventoryService.php, the role migrations dated 2, 21 and 22 October 2026, and the AuthorizedPersonnelWorkflowTest, CoordinatorInventoryTest and SupplyRequestAlertTest suites.')
    doc.add_paragraph('Current catalog limitation: Ready for Pickup stock remains reserved in the workflow, but the catalog currently subtracts Approved reservations only. The displayed Available to request quantity can therefore be higher than the unreserved quantity. Confirm fulfillment with SPMO and report a discrepancy through the approved support channel.')
    doc.add_paragraph('Screenshots are capture directions for the matching manual style. No live application screenshots are included. Demonstrate the procedures with a standard Authorized Personnel account before institutional release of this manual.')

    manual.add_chapter(doc, 2, "Accessing SupplySync", "Use an active, verified Authorized Personnel account created and assigned by an authorized administrator.")
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
            "Confirm that the Delivery Unit Dashboard opens and the account area identifies Authorized Personnel.",
        ],
        "SupplySync creates an authenticated session and opens the account scoped dashboard.",
        prerequisites="Invitation or password setup must be complete, the account must be active, and the email must be verified.",
        important="Do not use Remember me on shared or public devices.",
        screenshot=(
            "Authorized Personnel Sign In Page",
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
        "Activate a newly provisioned Authorized Personnel account.",
        [
            "Open the most recent SupplySync invitation email.",
            "Select the invitation link before it expires.",
            "Verify the institutional account information on Complete Registration.",
            "Enter the requested name and a strong password, then confirm the password.",
            "Submit the registration form and sign in after activation succeeds.",
        ],
        "The account becomes active and can use only its assigned requester functions.",
        important="Do not forward invitation links. Ask an administrator to resend an expired or used invitation.",
        screenshot=(
            "Authorized Personnel Invitation Activation",
            "Open a valid test invitation and display Complete Registration before typing a password.",
            "Capture the registration card only.",
            "Page title, institutional email, password fields, guidance, and submit control.",
            "Use a test invitation. Blur the email and never capture the invitation URL or an entered password.",
        ),
    )
    add_procedure(
        doc,
        "2.4 Navigate the Authorized Personnel Workspace",
        "Use the requester workspace and account controls.",
        [
            "Review the sidebar groups for Overview, Inventory Management, Catalog and Requests, and Administration.",
            "Use Dashboard, Unit Inventory, Stock Movements, Supply Catalog, and My Requests for normal work.",
            "Open Account settings and the theme control from the user area at the bottom of the sidebar.",
            "If a control named in this manual is missing, stop and confirm the account role or permission with the System Administrator.",
        ],
        "The selected authorized page opens without a 403 error.",
        important="Hidden central modules are intentional. Do not use a copied direct URL or another person's account.",
        screenshot=(
            "Authorized Personnel Navigation",
            "Sign in with a demonstration Authorized Personnel account using its normal deployed permissions.",
            "Capture the full application from sidebar to page header.",
            "Requester menu groups, Authorized Personnel designation, Account settings, theme control, and active page indicator.",
            "Blur the user's name and email. Do not temporarily grant central permissions for the screenshot.",
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

    manual.add_chapter(doc, 3, "Authorized Personnel Dashboard", "The dashboard summarizes only the signed in user's unit stock, requests, receipts, distributions, and recent activity.")
    doc.add_heading("3.1 Dashboard Information", level=2)
    manual.add_table(
        doc,
        ["Dashboard Area", "What It Shows"],
        [
            ("Active requests", "Pending, Pending Verification, For Correction, Under Review, Approved, and Ready for Pickup requests owned by the signed in user."),
            ("For replenishment", "Owned unit stock types at or below the configured threshold."),
            ("Items in stock", "Total quantity currently held in the account scoped Delivery Unit inventory."),
            ("Item types", "Owned stock types with a positive balance."),
            ("Monthly movement", "Quantities received from the Supply Office, locally issued, and total movement entries."),
            ("Stock requiring attention", "Low or depleted unit stock with a Request action."),
            ("Inventory movement trends", "Starting balance, receipts, issues, and ending balance by period."),
            ("Recent activity and requests", "Latest account scoped movements and request status updates."),
        ],
        widths=[1.75, 5.05],
    )
    add_procedure(
        doc,
        "3.2 Review the Dashboard",
        "Identify requests requiring correction, verification follow up, pickup, or replenishment.",
        [
            "Select Dashboard.",
            "Review Active requests and open My Requests when a status needs attention.",
            "Treat For Correction as the highest requester follow up priority and read the recorded remarks.",
            "Review For replenishment and Stock requiring attention for low or empty unit stock.",
            "Review monthly movement and the Inventory movement trends period selector.",
            "Use Quick links for Unit stock cards, Supply catalog, My requests, or Stock movements.",
        ],
        "The requester has identified current document, pickup, and unit inventory follow up items.",
        important="Dashboard values are account scoped snapshots. Refresh after SPMO staff change a request or release stock.",
        screenshot=(
            "Authorized Personnel Dashboard Overview",
            "Open Dashboard with a Pending Verification request, a For Correction example, released unit stock, and recent movement.",
            "Capture the workspace banner, summary cards, stock attention, trend chart, recent activity, and quick links.",
            "New Request, request updates, stock indicators, and account scoped metrics.",
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
        "Matching catalog cards display without creating or changing a request.",
        important="Catalog browsing never transfers stock to the requester. The audited catalog subtracts Approved reservations but omits Ready for Pickup reservations, so Available to request can overstate supply availability. Treat the display as provisional and rely on the quantities confirmed by SPMO.",
        screenshot=(
            "Central Supply Catalog",
            "Open Supply Catalog with available, fully reserved, and out of stock demonstration items.",
            "Capture the page heading, read only notice, search and availability controls, and several item cards.",
            "In Supply Office, Available to request, stock status, and Request This Item.",
            "Use fictional item details or blur real stock numbers and quantities.",
        ),
    )
    add_procedure(
        doc,
        "4.2 Start a Request from the Catalog",
        "Open a new request with the selected item already added.",
        [
            "Locate an available item in Supply Catalog.",
            "Select Request This Item.",
            "Confirm that New Supply Request opens and the item is listed once.",
            "Enter a valid requested quantity and continue with the document backed request procedure.",
        ],
        "The request form opens with the chosen item prefilled but nothing is submitted yet.",
        screenshot=(
            "Catalog Request Item Prefill",
            "Select Request This Item on a demonstration catalog card and stop after the request form opens.",
            "Capture the catalog context and the request form with the prefilled line.",
            "Selected item, requested quantity, Available indicator, and Add another item.",
            "Use demonstration items and do not submit during capture.",
        ),
    )

    manual.add_chapter(doc, 5, "Create a Document Backed Supply Request", "Every Authorized Personnel request requires requester details, purpose, item quantities, and an approved supporting document.")
    doc.add_heading("5.1 Requester and Division Rules", level=2)
    manual.add_table(
        doc,
        ["Account State", "Form Behavior"],
        [
            ("Delivery Unit assigned", "Requested by shows the signed in user's name. Division or Office is filled from the account and locked."),
            ("No Delivery Unit assigned", "Requested by still shows the signed in user's name. The user must choose a Division or Office."),
            ("Designation", "Recipient Designation may be entered when the official title is required on the RIS."),
            ("Ownership", "The signed in account becomes the request owner and the destination owner of released unit stock."),
        ],
        widths=[1.65, 5.15],
    )
    add_procedure(
        doc,
        "5.2 Complete the Request Details",
        "Describe the requesting office, purpose, and consumables needed.",
        [
            "Select My Requests, then New Request, or begin from Request This Item in the catalog.",
            "Confirm that Requested by displays the signed in user's name.",
            "If Division or Office is assigned, verify the locked value. If it is blank, choose the correct Division or Office.",
            "Enter Recipient Designation when needed for the official RIS.",
            "Review the Fund Cluster and Date Requested.",
            "Enter a clear requisition purpose.",
            "Select one or more available items and enter a whole requested quantity of at least one for each line.",
            "Remove duplicate or unavailable lines and review the displayed availability.",
        ],
        "The request details are complete and ready for a supporting document.",
        important="An item with zero central stock cannot be submitted. A requested quantity is not a stock reservation or a guarantee of fulfillment. Availability may change before staff approval.",
        screenshot=(
            "Authorized Personnel Request Details",
            "Open New Request with a demonstration Authorized Personnel account and enter safe unsaved values.",
            "Capture the upper and item sections of the request form.",
            "Requested by, optional assigned unit behavior, Division or Office, designation, purpose, item selector, quantity, and availability.",
            "Use fictional purpose and item quantities. Blur any live office or account identity.",
        ),
    )
    add_procedure(
        doc,
        "5.3 Attach the Supporting Document",
        "Provide the approved evidence that establishes authority for the requisition.",
        [
            "Under Supporting Document, use Document type to select Approved MOA, Approved Research, Approved Letter, or Others.",
            "Choose a PDF, JPG, JPEG, or PNG file no larger than 10 MB.",
            "Confirm the selected filename.",
            "Select Preview when the file can be checked safely in the browser.",
            "If the wrong file was selected, choose Remove selection and select the correct file.",
            "Verify that the document is complete, legible, approved, and consistent with the request.",
        ],
        "A permitted document type and file are selected for upload with the request.",
        important="The supporting document is separate from the generated RIS. Uploading it does not verify authenticity or approve the request.",
        screenshot=(
            "Supporting Document Selection",
            "Complete an unsaved demonstration request and select a harmless sample PDF or image.",
            "Capture only the Supporting Document section.",
            "Document type choices, file control, filename, Preview, Remove selection, and file guidance.",
            "Use a blank sample document. Never capture a real approval, signature, personal address, identification number, or private file content.",
        ),
    )
    add_procedure(
        doc,
        "5.4 Submit the Request",
        "Send the request and document into the SPMO verification queue.",
        [
            "Review requester details, Division or Office, purpose, item quantities, document type, and selected file.",
            "Select Submit Supply Request.",
            "Correct any highlighted validation error and submit again only after the form is accurate.",
            "Return to My Requests and locate the new official RIS reference.",
            "Confirm that the status is Pending Verification.",
        ],
        "SupplySync stores the document privately, records the request, alerts eligible staff, and displays Pending Verification.",
        important="Do not submit the same request repeatedly while waiting for staff review.",
        screenshot=(
            "Pending Verification Request",
            "Submit a complete demonstration request and open its Details view.",
            "Capture the request header, status, requester details, item summary, and Supporting Document panel.",
            "Pending Verification, official reference, document type, privacy safe filename, Preview document, and Download document.",
            "Blur names, offices, references, filenames, and quantities that resemble live data. Do not open the document body.",
        ),
    )

    manual.add_chapter(doc, 6, "Document Verification and Request Follow Up", "SPMO staff review the private document before the normal inventory decision. Authorized Personnel monitor the result and correct only the signed in user's request.")
    doc.add_heading("6.1 Authorized Personnel Status Reference", level=2)
    manual.add_table(
        doc,
        ["Status", "Meaning", "Requester Action"],
        [
            ("Pending Verification", "The document is waiting for designated SPMO review.", "Wait, review Details, or edit and resubmit if an error is found."),
            ("For Correction", "SPMO returned the document with required remarks.", "Read the remarks, correct the request or file, and resubmit."),
            ("Under Review", "The document was verified and the request is waiting for inventory decision.", "Monitor the request; editing is no longer available."),
            ("Approved", "Approved quantities are reserved and pickup preparation has not yet been completed.", "Review quantities and RIS; wait for Ready for Pickup."),
            ("Ready for Pickup", "SPMO prepared the approved supplies and notified the requester.", "Print the RIS, obtain required signatures, and collect the supplies."),
            ("Released", "Signed handover was confirmed and the approved quantities entered owned unit inventory.", "Confirm stock and keep the RIS record."),
            ("Rejected", "The inventory review ended the request with a recorded reason.", "Read the reason and create a new request only when appropriate."),
            ("Cancelled", "The request was stopped before release.", "No further workflow action is available."),
        ],
        widths=[1.35, 3.25, 2.2],
    )
    add_procedure(
        doc,
        "6.2 Review a Request and Its Private Document",
        "Check status, staff remarks, quantities, and the stored document.",
        [
            "Select My Requests.",
            "Search by RIS number, item, recipient, or purpose, or filter by status.",
            "Select Details on the target request.",
            "Review Current Status, Requested by, Division or Office, purpose, and requested quantities.",
            "Under Supporting Document, review document type, filename, reviewer information, and remarks when present.",
            "Select Preview document or Download document only through the provided protected links.",
            "Close the file and return to the request details.",
        ],
        "The requester has reviewed the current workflow state and supporting evidence without exposing the private storage path.",
        important="Do not share the protected link or downloaded file. Document access is recorded in the transaction audit trail.",
        screenshot=(
            "Authorized Personnel Request Details",
            "Open a demonstration request with completed document review metadata.",
            "Capture the Details view without opening the document.",
            "Status, Supporting Document, reviewer line, remarks, requested and approved quantities, and relevant actions.",
            "Blur the reviewer, requester, reference, filename, office, and any sensitive remarks.",
        ),
    )
    add_procedure(
        doc,
        "6.3 Correct and Resubmit a Returned Request",
        "Resolve For Correction remarks and return the request to document verification.",
        [
            "Open My Requests and locate the For Correction request.",
            "Read the complete document verification remarks in Details.",
            "Select Edit.",
            "Correct the request details identified by the reviewer.",
            "Confirm the supporting document type and select a corrected replacement file when the document is incomplete, unreadable, inconsistent, expired, or otherwise deficient.",
            "Preview the corrected selection and confirm the request items and purpose remain accurate.",
            "Select Save Changes.",
            "Confirm that the status returns to Pending Verification and prior verification metadata is reset.",
        ],
        "The corrected request returns to the SPMO document queue for a new review decision. The existing file may be retained if the correction concerns only request details; document type is still required, and saving resets the review metadata.",
        important="A new file replaces the previous private file only after the database update succeeds. Do not resubmit without addressing the recorded correction.",
        screenshot=(
            "Correction and Resubmission Form",
            "Open Edit on a For Correction demonstration request and select a corrected harmless replacement file.",
            "Capture the remarks context and the lower document section before saving.",
            "For Correction status or remarks, current document, replacement filename, document type, Preview, and update action.",
            "Use generic remarks and a blank sample file. Do not show real document content or identities.",
        ),
    )
    add_procedure(
        doc,
        "6.4 Edit or Cancel an Eligible Request",
        "Correct an owner only request or stop it before final release.",
        [
            "Use Edit only while the request is Pending, Pending Verification, or For Correction.",
            "Review all fields and select Save Changes. An eligible document backed request returns to Pending Verification even when the existing file is retained.",
            "Use Cancel only while the request is Pending, Pending Verification, For Correction, Under Review, Approved, or Ready for Pickup.",
            "Confirm the cancellation only after verifying that the request should not proceed.",
            "Review the final Cancelled status.",
        ],
        "The owned request is updated and re-enters verification, or is stopped before release.",
        important="Released, Rejected, and Cancelled requests cannot be edited or cancelled through the normal requester interface.",
    )

    add_procedure(doc, '6.5 Review Request Alerts', "Open staff review and pickup updates for the signed in user's requests.", ['Select Request alerts in the sidebar. Expand the sidebar first if only the bell icon is visible.', 'Review the request reference and current status. Open an alert to mark it read and display the corresponding request Details in My Requests.', 'Use the older alert control when more history is available.', 'For For Correction, follow section 6.3. For Ready for Pickup, follow section 7.3.', 'If an expected update is absent, refresh My Requests and inspect the request directly.'], 'The matching owned request opens and the read alert no longer counts as unread.', important='The pending number covers Pending, Pending Verification, and Under Review only. It excludes For Correction and Ready for Pickup. An alert is a prompt to inspect the current request; it is not proof of release.')

    manual.add_chapter(doc, 7, "Inventory Review RIS Pickup and Release", "After document verification, designated staff decide quantities, prepare approved supplies, and release them only after signed RIS confirmation.")
    add_procedure(
        doc,
        "7.1 Review Inventory Decision and Approved Quantities",
        "Understand the result of SPMO inventory review.",
        [
            "Open My Requests and select Details.",
            "When status is Under Review, wait for the authorized inventory decision.",
            "When status is Approved, compare Requested Qty with Approved or Final Qty for every line.",
            "Read Property Custodian Review remarks when present.",
            "If every approved quantity is acceptable, continue to the RIS procedure and wait for pickup preparation.",
            "If status is Rejected, read the reason and contact SPMO only when clarification is required.",
        ],
        "The requester understands the approved quantities, adjustments, remarks, or rejection reason.",
        important="Approved means stock is reserved. It does not mean the physical supplies have been released or added to unit inventory.",
        screenshot=(
            "Approved Request Quantities",
            "Open an Approved demonstration request with at least one adjusted quantity.",
            "Capture the Details view from status through the item table and review remarks.",
            "Approved status, requested quantity, approved quantity, adjustment indicator, reviewer, and remarks.",
            "Use demonstration quantities and blur requester, reviewer, office, and reference details.",
        ),
    )
    add_procedure(
        doc,
        "7.2 Preview Print or Download the RIS",
        "Prepare the official Requisition and Issue Slip for signing and pickup.",
        [
            "Open an Approved, Ready for Pickup, or Released request.",
            "Select View RIS or View or Print RIS.",
            "Review entity, fund cluster, Division or Office, official RIS number, purpose, requested items, approved quantities, and signatory sections.",
            "Print or download the RIS through the provided PDF controls.",
            "Obtain the signatures required by institutional procedure before physical release.",
        ],
        "The official RIS is ready for authorized signature and presentation to SPMO.",
        important="The supporting document is not a substitute for the RIS. Before release, the official PDF leaves Issue Qty blank; printed issue and receipt dates do not confirm handover. View RIS can open an application preview with different date labels, so use the official downloaded PDF for signing. Do not edit it or reuse another request's RIS.",
        screenshot=(
            "Authorized Personnel RIS Preview",
            "Open the official RIS for an Approved demonstration request.",
            "Capture the first page at a readable scale.",
            "Official RIS number, Division or Office, purpose, item rows, approved quantities, and signature sections.",
            "Use demonstration data and obscure names, signatures, references, quantities, and dates when necessary.",
        ),
    )
    add_procedure(
        doc,
        "7.3 Respond to Ready for Pickup",
        "Collect verified and approved supplies after SPMO preparation.",
        [
            "Open the in application request alert or My Requests.",
            "Confirm that the target request shows Ready for Pickup.",
            "Review the final approved quantities and official RIS reference.",
            "Bring the required signed RIS and institutional identification or authority required by local procedure.",
            "At SPMO, compare physical item descriptions and quantities with the RIS before acknowledging receipt.",
            "Allow authorized staff to confirm release in SupplySync.",
        ],
        "The requester presents the signed RIS and receives only the approved prepared supplies.",
        important="Ready for Pickup does not deduct central stock or increase unit stock. The release action does both once.",
        screenshot=(
            "Ready for Pickup Request",
            "Open a demonstration request after SPMO has marked it Ready for Pickup.",
            "Capture the alert or request card and its Details view.",
            "Ready for Pickup status, official RIS reference, final quantities, and View RIS action.",
            "Blur identities, references, quantities, and timestamps that resemble live activity.",
        ),
    )
    add_procedure(
        doc,
        "7.4 Confirm Released Stock",
        "Verify that completed handover was recorded and credited once.",
        [
            "After physical release, refresh My Requests.",
            "Confirm that the request status is Released.",
            "Review Release and Distribution details and the archived RIS.",
            "Open Unit Inventory and confirm that approved quantities were added once.",
            "Open Stock Movements and locate the receipt using the RIS reference.",
            "Report any mismatch before distributing the supplies.",
        ],
        "The Released request, unit stock receipt, and movement record agree with the physical handover.",
        important="A repeated release is blocked. Do not ask staff to release the same request again to correct a mismatch.",
        screenshot=(
            "Released Request and Unit Receipt",
            "Open a Released demonstration request, then its matching Unit Inventory or Stock Movements entry.",
            "Capture the final request state and the matching receipt in separate images.",
            "Released status, release details, RIS reference, received quantity, and Supply Office source.",
            "Use fictional references and blur identities, dates, quantities, and values as needed.",
        ),
    )

    manual.add_chapter(doc, 8, "Delivery Unit Inventory", "Unit Inventory contains only stock credited to the signed in account after central release.")
    add_procedure(
        doc,
        "8.1 Review Owned Unit Stock",
        "Check on hand quantities, values, and item specific actions.",
        [
            "Select Unit Inventory.",
            "Review Supplies in stock, Total units, and Inventory value.",
            "Search by item name or stock number when needed.",
            "Review On Hand, Unit Cost, Total Value, and the available actions for each item.",
            "Use Request Supplies when more central stock is required.",
        ],
        "The requester sees only stock owned by the signed in account.",
        important="Another user's stock cannot be exposed by changing a URL or query parameter.",
        screenshot=(
            "Authorized Personnel Unit Inventory",
            "Open Unit Inventory with several demonstration stock receipts and at least one low balance.",
            "Capture the page header, summary cards, search, table, and actions.",
            "Item, Stock No, On Hand, Unit Cost, Total Value, Stock Card, and Record Issue.",
            "Blur the user name, stock numbers, costs, values, and any live office information.",
        ),
    )

    manual.add_chapter(doc, 9, "Record a Delivery Unit Issue", "A unit issue records distribution from owned stock to an office or end user.")
    add_procedure(
        doc,
        "9.1 Record an Issue",
        "Deduct a local distribution from owned unit stock.",
        [
            "Open Unit Inventory and locate the target item.",
            "Select Record Issue.",
            "Review the item, stock number, and available quantity.",
            "Enter Quantity to issue as a whole number from one through the available balance.",
            "Enter the Receiving office or end user.",
            "Review the displayed remaining quantity.",
            "Select Save Issue.",
            "Confirm the new on hand balance and review the entry in Stock Movements.",
        ],
        "SupplySync deducts the quantity from owned unit stock and adds a local issue movement.",
        important="A unit issue does not change central Supply Office stock. Verify quantity and recipient before saving because the requester interface has no normal reversal action.",
        screenshot=(
            "Record a Unit Issue",
            "Open Record Issue for an available demonstration item and enter an unsaved valid quantity and recipient.",
            "Capture the complete dialog before selecting Save Issue.",
            "Item summary, available quantity, Quantity to issue, remaining quantity, Receiving office or end user, and Save Issue.",
            "Use a fictional recipient and quantity. Do not capture real personal information.",
        ),
    )

    manual.add_chapter(doc, 10, "Generate a Stock Card", "SupplySync generates an official Appendix 58 PDF from an owned item's receipt and issue movements.")
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
            "Open the PDF and review entity, item, stock number, unit, reorder point, fund cluster, owner name, receipts, issues, recipients, and running balances.",
        ],
        "An Appendix 58 Stock Card PDF downloads for the selected owned item and period.",
        important="A date filtered Stock Card carries the opening balance into the selected period and excludes later movements.",
        screenshot=(
            "Generate Stock Card",
            "Open Stock Card for a demonstration item with both receipt and issue history.",
            "Capture the reporting period dialog and the first page of the downloaded PDF in separate images.",
            "All history, This month, Custom dates, Download PDF, item identity, entries, and running balance.",
            "Use demonstration movements and blur the owner name and recipient details.",
        ),
    )

    manual.add_chapter(doc, 11, "Unit Transaction History", "Stock Movements is the account's private ledger of central receipts and local distributions.")
    add_procedure(
        doc,
        "11.1 Review Stock Movements",
        "Confirm that a release or unit distribution was recorded.",
        [
            "Select Stock Movements in the sidebar or Transaction History in Unit Inventory.",
            "Review Date, Item or Reference, Movement, Quantity, and Source or Recipient.",
            "Identify receipts by the Received badge, positive quantity, and Supply Office source.",
            "Identify local distributions by the Issued badge, negative quantity, and recorded recipient.",
            "Use page controls when more than 20 entries exist.",
            "Open the item's Stock Card when a running balance or period report is required.",
        ],
        "The expected owned receipt or local issue is visible with its reference and quantity.",
        important="Shared Transaction Audit is not an Authorized Personnel function. Use this private movement page for unit stock activity.",
        screenshot=(
            "Authorized Personnel Stock Movements",
            "Open Stock Movements with several demonstration receipts and unit issues across more than one item.",
            "Capture the table and pagination controls.",
            "Date, item, reference, Received and Issued badges, signed quantity, Supply Office source, and recipient.",
            "Use fictional references and recipients. Blur account identity.",
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
        "The user reviews only authentication events belonging to the signed in account.",
        availability="Requires the Login Audit permission. The role remains self scoped even when the permission is assigned.",
        important="Transaction Audit is not an Authorized Personnel function. Use Stock Movements for unit inventory transactions.",
        screenshot=(
            "Self Scoped Authorized Personnel Login Audit",
            "Use a demonstration Authorized Personnel account that legitimately has Login Audit permission.",
            "Capture the summary, filters, and several personal events.",
            "Successful Login, Failed Login, Logged Out, dates, and account scoped event rows.",
            "Blur email, IP address, user agent, device, location, and timestamps that identify real activity.",
        ),
    )

    manual.add_chapter(doc, 13, "Account Settings and Personal Security", "Each Authorized Personnel user is responsible for protecting the assigned account and reviewing personal access information.")
    add_procedure(
        doc,
        "13.1 Update Profile Information",
        "Keep permitted account identity fields accurate.",
        [
            "Select Account settings from the sidebar user area.",
            "Open the Profile tab.",
            "Review department, role, email verification, and account creation information.",
            "Edit permitted name or email fields.",
            "Select Save Profile and complete email verification when requested.",
        ],
        "The profile displays the updated permitted values.",
        important="The personal profile cannot change the Authorized Personnel role or administrator managed Delivery Unit assignment.",
        screenshot=(
            "Authorized Personnel Account Settings",
            "Open Account settings and the Profile tab with a demonstration account.",
            "Capture the tab bar and profile summary and edit area.",
            "Profile, Security, Login History, role and department summary, editable fields, and Save.",
            "Blur the user's name, email, department, and account dates.",
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

    manual.add_chapter(doc, 14, "Security and Daily Operating Practices", "Use these practices to protect authorization evidence, requests, released supplies, and accountability records.")
    manual.add_bullets(
        doc,
        [
            "Use only the assigned individual account. Do not share credentials or let another person submit or receive supplies under your session.",
            "Confirm Requested by, Division or Office, designation, purpose, item quantities, and supporting document before submission.",
            "Upload only the approved evidence relevant to the request. Do not use a generated RIS as the supporting document.",
            "Keep private document links and downloads within approved institutional handling channels.",
            "Respond to For Correction remarks promptly and replace the document when the file itself is deficient.",
            "Treat Approved and Ready for Pickup as different states. Wait for pickup notification before collection.",
            "Compare approved quantities, physical supplies, and the signed RIS before accepting release.",
            "Confirm Unit Inventory immediately after release and report a mismatch before distributing stock.",
            "Verify item, quantity, and recipient before saving a unit issue because the requester interface has no normal reversal action.",
            "Never reveal passwords, OTPs, reset or invitation links, signatures, private documents, references, or live personal data in screenshots.",
            "Report missing controls or unexpected 403 errors instead of requesting broader access than the task requires.",
        ],
    )

    manual.add_chapter(doc, 15, "Troubleshooting and Escalation", "Record the page, time, role, exact message, reference, attempted action, and a privacy safe screenshot before escalating.")
    manual.add_table(
        doc,
        ["Symptom", "Likely Cause", "Authorized Personnel Action"],
        [
            ("Division or Office is blank", "The account has no Delivery Unit assignment.", "Choose the correct Division or Office in the request form. Ask an administrator only when a permanent assignment is required."),
            ("Assigned Division or Office is wrong", "The administrator managed account assignment is outdated.", "Stop submission and ask an administrator to correct the Staff Account assignment."),
            ("Document will not upload", "File type, extension, detected format, or size is invalid.", "Use a genuine PDF, JPG, JPEG, or PNG no larger than 10 MB. Do not rename a different file type."),
            ("Request remains Pending Verification", "Designated SPMO staff have not completed document review.", "Review Details for remarks or alerts, then follow the approved support channel without creating a duplicate."),
            ("Request is For Correction", "SPMO found missing, unreadable, inconsistent, expired, or otherwise unacceptable evidence.", "Read the remarks, edit the request, replace the file when required, and save to resubmit."),
            ("Request cannot be edited", "The request is Under Review, Approved, Ready for Pickup, Released, Rejected, Cancelled, or not owned by the signed in account.", "Review Details and contact SPMO if a material correction is required after the edit window."),
            ("RIS action is missing", "The request is not yet Approved, Ready for Pickup, or Released.", "Wait for inventory approval. Do not treat the supporting document as the RIS."),
            ("Approved request is not ready", "SPMO has not completed pickup preparation.", "Review the approved quantities and wait for Ready for Pickup notification."),
            ("Released stock is absent from Unit Inventory", "Refresh is needed or release credit failed.", "Confirm Released status, refresh Unit Inventory, then escalate with the RIS reference if the mismatch remains."),
            ("Record Issue will not save", "Quantity is zero, noninteger, above available stock, recipient is blank, or stock belongs to another account.", "Correct the highlighted fields and confirm the selected owned item."),
            ("Central inventory or analytics returns 403", "The role is explicitly restricted from central operational and university wide pages.", "Return to Dashboard, Supply Catalog, My Requests, Unit Inventory, or Stock Movements."),
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
            "Authorized Personnel username or staff ID shared only through the approved support channel",
            "RIS, item, or request reference with personal data minimized",
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
            ("RIS", "Requisition and Issue Slip used for inventory approval, signatures, pickup, and release documentation."),
            ("SPMO", "Supply and Property Management Office."),
            ("Supporting Document", "Private evidence establishing authorization for the request; it is separate from the generated RIS."),
            ("Approved MOA", "An approved memorandum of agreement selected as the supporting document type."),
            ("Approved Research", "An approved research record selected as the supporting document type."),
            ("Approved Letter", "An approved letter selected as the supporting document type."),
            ("Pending Verification", "The supporting document awaits designated SPMO review."),
            ("For Correction", "SPMO returned the request with remarks that must be addressed before resubmission."),
            ("Under Review", "The document is verified and the request awaits inventory decision."),
            ("Approved", "Approved quantities are reserved and await pickup preparation."),
            ("Ready for Pickup", "SPMO prepared approved supplies and notified the requester."),
            ("Released", "Signed handover was confirmed and approved quantities were credited to owned unit inventory."),
            ("Delivery Unit Inventory", "Stock owned by the signed in account after central release."),
            ("Unit Issue", "A local distribution that deducts only owned unit stock."),
            ("Stock Card", "Appendix 58 PDF showing receipts, issues, recipients, and running balances for one owned item."),
        ],
        widths=[1.65, 5.15],
    )

    manual.add_chapter(doc, 17, "Screenshot Capture Register", "Capture the following images using a demonstration Authorized Personnel account and place each image beneath its matching direction in the manual.")
    manual.add_table(
        doc,
        ["ID", "Screenshot", "Primary Screen"],
        [(shot["id"], shot["title"], shot["screen"]) for shot in SCREENSHOTS],
        widths=[0.85, 2.2, 3.75],
    )
    doc.add_heading("17.1 Screenshot Quality Checklist", level=2)
    manual.add_bullets(
        doc,
        [
            "Use the same browser zoom, window size, theme, and sidebar state throughout the manual.",
            "Capture the page title and enough navigation context to identify the location.",
            "Show the control named in the procedure and the data state that makes it available.",
            "Crop out the browser address bar when it reveals a private host or token.",
            "Use PNG format and a readable resolution. Do not photograph the monitor.",
            "Blur or replace real names, emails, offices, signatures, references, filenames, item quantities, costs, values, recipients, IP addresses, and dates.",
            "Never capture the body of a real supporting document.",
            "Do not add arrows or highlights that cover labels or validation messages.",
            "Name files with the screenshot ID, for example AP-SS-01.png and AP-SS-02.png.",
        ],
    )

    manual.add_chapter(doc, 18, "Authorized Personnel Handover Checklist", "Use this page when requester responsibility or account assignment changes. Each person must use an individual account. Stock remains with its recorded account owner; coordinate reconciliation and reassignment with SPMO and the administrator. Do not share the outgoing user's credentials.")
    manual.add_table(
        doc,
        ["Check", "Handover Item", "Completed or Notes"],
        [
            ("[ ]", "Authorized Personnel account is active, verified, and uses an individual institutional email.", ""),
            ("[ ]", "Optional Delivery Unit assignment is correct, or the user knows how to choose Division or Office when unassigned.", ""),
            ("[ ]", "Dashboard, Supply Catalog, My Requests, Unit Inventory, Stock Movements, and Account settings open correctly.", ""),
            ("[ ]", "Supported document types, file formats, 10 MB limit, and privacy rules were reviewed.", ""),
            ("[ ]", "A demonstration request can be submitted with a document and reaches Pending Verification.", ""),
            ("[ ]", "For Correction remarks, replacement file selection, resubmission, and verification reset were rehearsed.", ""),
            ("[ ]", "Approved quantities, RIS preview, Ready for Pickup, signed RIS, and physical collection procedures were reviewed.", ""),
            ("[ ]", "Released stock appears in Unit Inventory once and reconciles to the RIS and Stock Movements.", ""),
            ("[ ]", "Record Issue, Stock Card periods, and recipient naming standards were rehearsed with demonstration data.", ""),
            ("[ ]", "Password was changed by the new user and personal sessions and login history were reviewed.", ""),
            ("[ ]", "No credentials, OTPs, invitation links, signatures, private documents, exported RIS files, or Stock Cards were left in an insecure location.", ""),
        ],
        widths=[0.45, 4.9, 1.45],
    )
    manual.add_labeled_paragraph(doc, "Outgoing Authorized Personnel: ", "________________________________    Date: ________________")
    manual.add_labeled_paragraph(doc, "Incoming Authorized Personnel: ", "________________________________    Date: ________________")
    manual.add_labeled_paragraph(doc, "Supervisor or Office Head: ", "________________________________    Date: ________________")

    ids = [shot["id"] for shot in SCREENSHOTS]
    expected = [f"AP-SS-{index:02d}" for index in range(1, len(ids) + 1)]
    if ids != expected:
        raise RuntimeError(f"Screenshot IDs are not sequential: {ids}")

    doc.save(OUTPUT)
    print(f"Created {OUTPUT}")
    print(f"Screenshot directions: {len(SCREENSHOTS)}")


if __name__ == "__main__":
    build_manual()

