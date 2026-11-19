from pathlib import Path
from datetime import date

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "SupplySync_System_Admin_Manual.docx"
UCN_LOGO = ROOT / "public" / "images" / "ucnlogo.png"
SUPPLYSYNC_LOGO = ROOT / "public" / "images" / "supplysync-sidebar-logo.png"

BLACK = "111827"
MAROON = "7F1D1D"
BLUE_GRAY = "334155"
MID_GRAY = "64748B"
LIGHT_GRAY = "E2E8F0"
PALE_GRAY = "F8FAFC"
PALE_BLUE = "EFF6FF"
PALE_AMBER = "FFFBEB"
PALE_GREEN = "F0FDF4"
WHITE = "FFFFFF"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_border(cell, **kwargs):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_borders = tc_pr.first_child_found_in("w:tcBorders")
    if tc_borders is None:
        tc_borders = OxmlElement("w:tcBorders")
        tc_pr.append(tc_borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        if edge not in kwargs:
            continue
        edge_data = kwargs.get(edge)
        tag = "w:{}".format(edge)
        element = tc_borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            tc_borders.append(element)
        for key in ("val", "sz", "space", "color"):
            if key in edge_data:
                element.set(qn("w:{}".format(key)), str(edge_data[key]))


def set_cell_margins(cell, top=90, start=100, bottom=90, end=100):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def prevent_row_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    tr_pr.append(cant_split)


def repeat_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def add_field(paragraph, instruction, fallback=""):
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = instruction
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = fallback
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instr, separate, text, end])


def set_update_fields(doc):
    settings = doc.settings._element
    update = settings.find(qn("w:updateFields"))
    if update is None:
        update = OxmlElement("w:updateFields")
        settings.append(update)
    update.set(qn("w:val"), "true")


def set_table_borders(table, color=LIGHT_GRAY, size=6):
    for row in table.rows:
        for cell in row.cells:
            border = {"val": "single", "sz": size, "space": "0", "color": color}
            set_cell_border(cell, top=border, left=border, bottom=border, right=border)


def add_labeled_paragraph(doc, label, text, style=None):
    p = doc.add_paragraph(style=style)
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.keep_together = True
    r = p.add_run(label)
    r.bold = True
    r.font.color.rgb = RGBColor.from_string(BLACK)
    p.add_run(text)
    return p


def add_bullets(doc, items, level=0):
    for item in items:
        p = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
        p.paragraph_format.space_after = Pt(2.5)
        p.paragraph_format.keep_together = True
        p.add_run(item)


def add_steps(doc, steps):
    for index, step in enumerate(steps, 1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.23)
        p.paragraph_format.first_line_indent = Inches(-0.23)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_together = True
        r = p.add_run(f"{index}. ")
        r.bold = True
        p.add_run(step)


def add_callout(doc, title, body, fill=PALE_GRAY, title_color=BLUE_GRAY):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    prevent_row_split(table.rows[0])
    cell = table.cell(0, 0)
    set_cell_shading(cell, fill)
    set_cell_margins(cell, 105, 135, 105, 135)
    border = {"val": "single", "sz": "8", "space": "0", "color": LIGHT_GRAY}
    left = {"val": "single", "sz": "24", "space": "0", "color": title_color}
    set_cell_border(cell, top=border, right=border, bottom=border, left=left)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_together = True
    r = p.add_run(title)
    r.bold = True
    r.font.color.rgb = RGBColor.from_string(title_color)
    r.font.size = Pt(9.5)
    body_p = cell.add_paragraph()
    body_p.paragraph_format.space_after = Pt(0)
    body_p.paragraph_format.keep_together = True
    body_p.add_run(body)
    # The following heading or paragraph provides its own spacing. Avoid adding
    # an empty paragraph here because it can be pushed onto a page by itself
    # immediately before a page-break-before chapter heading.


SCREENSHOTS = []


def add_screenshot_direction(doc, title, setup, capture, highlight, privacy=None):
    number = len(SCREENSHOTS) + 1
    shot_id = f"SS-{number:02d}"
    privacy_text = privacy or (
        "Use demonstration data. Blur personal email addresses, names, IP addresses, document numbers, "
        "RFID values, credentials, tokens, and any confidential operational information."
    )
    instruction = (
        f"Open {setup}. Prepare the screen exactly as described, then capture {capture}. "
        f"Make sure the image clearly shows {highlight}. {privacy_text}"
    )
    SCREENSHOTS.append((shot_id, title, instruction))
    add_callout(
        doc,
        f"SCREENSHOT DIRECTION {shot_id} — {title}",
        instruction,
        fill=PALE_BLUE,
        title_color=BLUE_GRAY,
    )


def add_procedure(
    doc,
    title,
    purpose,
    steps,
    expected,
    prerequisites=None,
    notes=None,
    screenshot=None,
):
    doc.add_heading(title, level=3)
    add_labeled_paragraph(doc, "Purpose: ", purpose)
    if prerequisites:
        add_labeled_paragraph(doc, "Before you begin: ", prerequisites)
    add_labeled_paragraph(doc, "Procedure: ", "")
    add_steps(doc, steps)
    add_labeled_paragraph(doc, "Expected result: ", expected)
    if notes:
        add_callout(doc, "IMPORTANT", notes, fill=PALE_AMBER, title_color=MAROON)
    if screenshot:
        add_screenshot_direction(doc, *screenshot)


def add_simple_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    table.autofit = True
    header = table.rows[0]
    repeat_header(header)
    for idx, text in enumerate(headers):
        cell = header.cells[idx]
        set_cell_shading(cell, BLUE_GRAY)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_cell_margins(cell)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(text)
        r.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        r.font.size = Pt(9)
    for row_data in rows:
        row = table.add_row()
        prevent_row_split(row)
        for idx, text in enumerate(row_data):
            cell = row.cells[idx]
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            set_cell_margins(cell)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.add_run(str(text))
        if len(table.rows) % 2 == 1:
            for cell in row.cells:
                set_cell_shading(cell, PALE_GRAY)
    set_table_borders(table)
    if widths:
        for row in table.rows:
            for idx, width in enumerate(widths):
                row.cells[idx].width = Inches(width)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return table


def add_chapter(doc, number, title, intro=None):
    heading = doc.add_heading(f"{number}. {title}", level=1)
    if intro:
        p = doc.add_paragraph(intro)
        p.paragraph_format.space_after = Pt(8)
    return heading


def configure_styles(doc):
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor.from_string(BLACK)
    normal.paragraph_format.space_after = Pt(5)
    normal.paragraph_format.line_spacing = 1.08
    normal.paragraph_format.widow_control = True

    for style_name in ("List Bullet", "List Bullet 2", "List Number"):
        style = styles[style_name]
        style.font.name = "Aptos"
        style.font.size = Pt(10.5)
        style.font.color.rgb = RGBColor.from_string(BLACK)

    h1 = styles["Heading 1"]
    h1.font.name = "Aptos Display"
    h1.font.size = Pt(18)
    h1.font.bold = True
    h1.font.color.rgb = RGBColor.from_string(BLACK)
    h1.paragraph_format.page_break_before = True
    h1.paragraph_format.keep_with_next = True
    h1.paragraph_format.space_before = Pt(0)
    h1.paragraph_format.space_after = Pt(8)

    h2 = styles["Heading 2"]
    h2.font.name = "Aptos Display"
    h2.font.size = Pt(14)
    h2.font.bold = True
    h2.font.color.rgb = RGBColor.from_string(BLACK)
    h2.paragraph_format.keep_with_next = True
    h2.paragraph_format.space_before = Pt(10)
    h2.paragraph_format.space_after = Pt(5)

    h3 = styles["Heading 3"]
    h3.font.name = "Aptos"
    h3.font.size = Pt(11.5)
    h3.font.bold = True
    h3.font.color.rgb = RGBColor.from_string(BLACK)
    h3.paragraph_format.keep_with_next = True
    h3.paragraph_format.space_before = Pt(8)
    h3.paragraph_format.space_after = Pt(4)

    title = styles["Title"]
    title.font.name = "Aptos Display"
    title.font.size = Pt(28)
    title.font.bold = True
    title.font.color.rgb = RGBColor.from_string(BLACK)

    subtitle = styles["Subtitle"]
    subtitle.font.name = "Aptos"
    subtitle.font.size = Pt(12.5)
    subtitle.font.color.rgb = RGBColor.from_string(MID_GRAY)


def configure_page(doc):
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.68)
    section.bottom_margin = Inches(0.65)
    section.left_margin = Inches(0.72)
    section.right_margin = Inches(0.72)
    section.header_distance = Inches(0.3)
    section.footer_distance = Inches(0.3)
    section.different_first_page_header_footer = True

    header = section.header
    p = header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("SupplySync  |  System Administrator Manual")
    r.font.name = "Aptos"
    r.font.size = Pt(8)
    r.font.color.rgb = RGBColor.from_string(MID_GRAY)
    p_pr = p._p.get_or_add_pPr()
    p_bdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "6")
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), LIGHT_GRAY)
    p_bdr.append(bottom)
    p_pr.append(p_bdr)

    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("Controlled Copy  •  Version 1.1  •  Page ")
    r.font.name = "Aptos"
    r.font.size = Pt(8)
    r.font.color.rgb = RGBColor.from_string(MID_GRAY)
    add_field(p, "PAGE", "1")
    p.add_run(" of ")
    add_field(p, "NUMPAGES", "1")


def add_cover(doc):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    if UCN_LOGO.exists():
        p.add_run().add_picture(str(UCN_LOGO), width=Inches(0.92))
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(16)
    if SUPPLYSYNC_LOGO.exists():
        p.add_run().add_picture(str(SUPPLYSYNC_LOGO), width=Inches(2.65))
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
    set_cell_shading(line.cell(0, 0), MAROON)
    set_cell_margins(line.cell(0, 0), 18, 0, 18, 0)
    set_cell_border(
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
    r.font.color.rgb = RGBColor.from_string(MID_GRAY)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("SYSTEM ADMINISTRATOR")
    r.bold = True
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor.from_string(BLACK)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(30)
    r = p.add_run("Version 1.0  |  11 November 2026")
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor.from_string(MID_GRAY)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    r = p.add_run("Internal Administrative Use")
    r.bold = True
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor.from_string(MAROON)
    doc.add_page_break()


def add_front_matter(doc):
    p = doc.add_paragraph()
    p.style = doc.styles["Heading 1"]
    p.paragraph_format.page_break_before = False
    p.add_run("Document Control")
    add_simple_table(
        doc,
        ["Control Item", "Value"],
        [
            ("Document ID", "SS-ADM-MAN-001"),
            ("Document title", "SupplySync System Administrator User Manual"),
            ("Version", "1.0"),
            ("Effective date", "11 November 2026"),
            ("Applicable role", "System Administrator"),
            ("System baseline", "SupplySync repository and interface verified on 11 November 2026"),
            ("Document owner", "SupplySync System Administration"),
            ("Classification", "Internal Administrative Use"),
            ("Review cycle", "After each major release, role-permission change, or at least annually"),
        ],
        widths=[1.75, 5.2],
    )
    doc.add_heading("Revision History", level=2)
    add_simple_table(
        doc,
        ["Version", "Date", "Description", "Prepared for"],
        [("1.0", "11 Nov 2026", "Initial complete System Administrator manual with screenshot capture directions.", "SupplySync System Administrators")],
        widths=[0.75, 1.15, 3.8, 1.5],
    )
    add_callout(
        doc,
        "DOCUMENT USE",
        "This manual describes the functions visible to the System Administrator in the current SupplySync build. "
        "Coordinator-only Central Supply Catalog and Unit Inventory pages are outside this manual unless the account "
        "is separately operating as a Supply Coordinator. Button visibility may still reflect deployed permissions, "
        "configuration, and data state.",
        fill=PALE_AMBER,
        title_color=MAROON,
    )

    doc.add_heading("How to Use This Manual", level=2)
    add_bullets(
        doc,
        [
            "Follow procedures in sequence when a function changes inventory, account access, system mode, or official records.",
            "Fields marked with an asterisk in SupplySync are required. Read-only fields are populated from settings or earlier workflow steps.",
            "Screenshot Direction boxes tell the documentation team exactly which page, data state, visible region, and controls to capture.",
            "Use test or demonstration records for screenshots. Never expose passwords, OTPs, invitation links, RFID secrets, Wi-Fi credentials, or live personal data.",
            "Where a confirmation dialog appears, read the impact statement before selecting the final action.",
        ],
    )
    doc.add_heading("Manual Conventions", level=2)
    add_simple_table(
        doc,
        ["Convention", "Meaning"],
        [
            ("Select", "Choose a menu, tab, record, option, or button."),
            ("Enter", "Type a value into an editable field."),
            ("System-generated", "SupplySync assigns or calculates the value; do not manually overwrite it."),
            ("Expected result", "The visible or recorded outcome that confirms the procedure succeeded."),
            ("Important", "A validation, security control, irreversible consequence, or operational limitation."),
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
    add_field(p, 'TOC \\o "1-3" \\h \\z \\u', "Open this document in Microsoft Word and update the Table of Contents field.")
    add_callout(
        doc,
        "TO UPDATE THE CONTENTS",
        "In Microsoft Word, click inside the table of contents, choose Update Table, then select Update entire table. "
        "The document is configured to request a field update when opened.",
        fill=PALE_GRAY,
        title_color=BLUE_GRAY,
    )


def build_manual():
    doc = Document()
    configure_styles(doc)
    configure_page(doc)
    set_update_fields(doc)
    doc.core_properties.title = "SupplySync System Administrator User Manual"
    doc.core_properties.subject = "Complete System Administrator procedures and screenshot capture directions"
    doc.core_properties.author = "SupplySync Documentation Team"
    doc.core_properties.keywords = "SupplySync, system administrator, consumable supplies, requisition, inventory, compliance"

    add_cover(doc)
    add_front_matter(doc)

    # 1
    add_chapter(
        doc,
        1,
        "Introduction and System Administrator Responsibilities",
        "The System Administrator maintains the operating environment, access control, inventory configuration, "
        "governance records, and system-wide settings that support SupplySync.",
    )
    doc.add_heading("1.1 System Administrator Scope", level=2)
    add_bullets(
        doc,
        [
            "Monitor system health, storage, jobs, email configuration, backups, stock conditions, requisitions, receiving, and issuance from the dashboard.",
            "Manage staff accounts, roles, and permissions, including protected System Administrator assignments.",
            "Configure institutional identity, signatories, stock rules, document sequences, RFID scanners, notifications, sessions, and telemetry settings.",
            "Operate the complete consumable-supplies lifecycle: requests, review, approval, pickup readiness, release, receiving, and manual issuance.",
            "Maintain suppliers, inventory item masters, receiving batches, RFID associations, official reports, analytics, and audit trails.",
            "Change the system operating mode only for a documented operational reason and review the resulting audit entry.",
        ],
    )
    doc.add_heading("1.2 High-Risk Actions", level=2)
    add_simple_table(
        doc,
        ["Action", "Primary Risk", "Required Administrative Control"],
        [
            ("Release supplies", "Immediately deducts available stock.", "Verify authorized quantities and signed RIS before release."),
            ("Disable staff account", "Revokes active sessions and access.", "Confirm identity and business reason; never disable your own account."),
            ("Delete custom role", "Can disrupt assigned access.", "Confirm no staff remain assigned; system roles cannot be deleted."),
            ("Change system mode", "Can restrict writes or alter the operating context.", "Enter a clear reason and notify affected users."),
            ("Rotate/revoke RFID scanner secret", "Can disconnect hardware.", "Coordinate with the scanner custodian and retain the one-time token securely."),
            ("Migrate historical reports", "Adds historical records to compliance datasets.", "Validate field mapping and duplicate/invalid-row counts before import."),
        ],
        widths=[1.45, 2.25, 3.25],
    )
    doc.add_page_break()
    doc.add_heading("1.3 Function Coverage", level=2)
    add_simple_table(
        doc,
        ["Area", "Functions Covered"],
        [
            ("Access", "Sign in, password recovery, invitation activation, sign out"),
            ("Overview", "Dashboard, shortcuts, system health, recent activity"),
            ("Operations", "My Requests, approval/release, inventory, receiving, issuance, RFID"),
            ("Governance", "Suppliers, compliance reports, analytics, login and transaction audits"),
            ("Access Control", "Roles and permissions, staff accounts, invitations, enable/disable"),
            ("Configuration", "Institution, signatories, stock rules, sequences, RFID/Wi-Fi, email, sessions, telemetry"),
            ("Personal Security", "Profile, password with OTP, sessions, login history, theme"),
        ],
        widths=[1.35, 5.6],
    )

    # 2
    add_chapter(doc, 2, "Accessing SupplySync", "Use an activated institutional account assigned to the System Administrator role.")
    add_procedure(
        doc,
        "2.1 Sign In",
        "Authenticate to SupplySync with an authorized institutional account.",
        [
            "Open the SupplySync web address supplied by the institution.",
            "Enter the Official Email Address.",
            "Enter the account Password.",
            "Optionally select Remember me only on a secured, institution-managed device.",
            "Select Sign In.",
            "Confirm that the System Administration Dashboard opens and the System Administrator role is shown in the account area.",
        ],
        "SupplySync creates an authenticated session and records the login event in Login Audit.",
        prerequisites="The staff account must be active and its invitation or password-reset process must already be completed.",
        notes="Do not use Remember me on public or shared devices. Repeated failed attempts are recorded and should be reviewed in Login Audit.",
        screenshot=(
            "Administrative Sign-In Page",
            "the SupplySync login page in Light theme",
            "the full authentication card without the browser address bar",
            "Official Email Address, Password, Remember me, Forgot password?, Sign In, and Contact IT support",
            "Use a generic example email. Keep the password field empty and do not capture browser password-manager suggestions.",
        ),
    )
    add_procedure(
        doc,
        "2.2 Recover a Forgotten Password",
        "Request and use a one-time password-reset link.",
        [
            "On the login page, select Forgot password?.",
            "Enter the registered Official Email Address.",
            "Select Send Reset Link.",
            "Open the institutional email account and use the most recent password-reset link.",
            "On Create New Password, verify the read-only email address.",
            "Enter New Password and Confirm New Password, then select Reset Password.",
            "Return to Sign In and authenticate with the new password.",
        ],
        "The password is replaced, existing reset tokens become unusable, and the login page displays a success message.",
        notes="Reset links expire and are single-use. A disabled staff account is not eligible for normal password reset until re-enabled.",
        screenshot=(
            "Password Recovery Form",
            "Forgot password? and arrive at Password Recovery",
            "the complete recovery card before submitting",
            "Official Email Address, Send Reset Link, and Return to Sign In",
            "Use a demonstration email address. Do not capture the reset email, token, or reset-link URL.",
        ),
    )
    add_procedure(
        doc,
        "2.3 Complete a Staff Invitation",
        "Activate a newly provisioned staff account from its invitation email.",
        [
            "Open the latest invitation email sent by SupplySync.",
            "Select the invitation link before it expires.",
            "On Complete Registration, verify the account information.",
            "Enter the staff member's name if requested, then enter and confirm a strong password.",
            "Submit the registration form.",
            "Sign in after the success message appears.",
        ],
        "The previously disabled account becomes active, the email is verified, and the user can sign in according to the assigned role.",
        notes="An invitation link that has expired or has already been used returns an unavailable-link message. A System Administrator can resend the invitation from Staff Accounts.",
        screenshot=(
            "Invitation Activation Page",
            "a valid test invitation link and display Complete Registration",
            "the registration card before the password is entered",
            "the activation title, institutional email, password fields, and submit control",
            "Use only a test invitation. Blur the email address and never capture the invitation URL or any entered password.",
        ),
    )

    # 3
    add_chapter(doc, 3, "Interface and Global Controls", "The same navigation, account, theme, and operating-mode controls are available throughout the authenticated application.")
    doc.add_heading("3.1 Main Interface Areas", level=2)
    add_simple_table(
        doc,
        ["Area", "Use"],
        [
            ("Sidebar", "Open Dashboard, My Requests, Inventory, RFID Scanner, Suppliers, Compliance, Audit Logs, Access Control, and System Settings."),
            ("Page header", "Shows the current page title, description, and page-specific primary actions."),
            ("System mode badge", "Shows the active operating mode and opens mode-management controls when authorized."),
            ("Account menu", "Opens Account Settings, theme options, and Sign Out."),
            ("Workspace", "Displays filters, summaries, tables, forms, dialogs, and record details."),
            ("Notifications", "Shows success, warning, and error messages after actions."),
        ],
        widths=[1.35, 5.6],
    )
    add_procedure(
        doc,
        "3.2 Navigate the Sidebar",
        "Move between System Administrator modules and their submodules.",
        [
            "Use the expand/collapse control to change the sidebar width.",
            "Select a top-level module such as Inventory, Compliance, Audit Logs, or Access Control.",
            "Select the required submodule.",
            "On a small screen, open the mobile menu, choose a page, and close the menu to maximize the workspace.",
        ],
        "The selected page opens and the corresponding module is visually marked as active.",
        screenshot=(
            "System Administrator Navigation",
            "the Dashboard with the sidebar expanded",
            "the full application window from the sidebar through the page header",
            "the three navigation groups, expanded submodules, system mode badge, account control, and active-page state",
            "Use demonstration dashboard data and blur names, emails, document references, and recent-activity details.",
        ),
    )
    add_procedure(
        doc,
        "3.3 Change the Theme",
        "Select the visual theme without changing system records.",
        [
            "Open the account or appearance menu.",
            "Choose Light, Dark, or System.",
            "Confirm the interface updates immediately.",
        ],
        "The theme is applied to the current user interface; System follows the operating-system preference.",
        screenshot=(
            "Theme Selector",
            "the account/appearance menu while signed in",
            "the menu with all theme choices visible",
            "Light, Dark, and System choices together with the current selection",
            "Crop out unrelated personal account information if it is not needed.",
        ),
    )
    add_procedure(
        doc,
        "3.4 Sign Out",
        "End the current authenticated session safely.",
        [
            "Open the account menu.",
            "Select Sign Out.",
            "Review the confirmation message.",
            "Confirm sign out.",
        ],
        "The session ends, the login page opens, and a logout event is written to Login Audit.",
        screenshot=(
            "Sign-Out Confirmation",
            "the account menu and select Sign Out",
            "the confirmation dialog before confirming",
            "the warning text and both cancel and confirm controls",
            "Blur the account name and email if they are visible behind the dialog.",
        ),
    )

    # 4
    add_chapter(doc, 4, "System Administration Dashboard", "Use the dashboard as the first review point after signing in.")
    add_procedure(
        doc,
        "4.1 Review System and Inventory Health",
        "Assess user activity, infrastructure configuration, inventory status, and requisition workload.",
        [
            "Open Dashboard.",
            "Review Total Users and Active Users.",
            "Confirm Database Connection, Email Configuration, and Current Operating Mode.",
            "Review Supply Items, Low/Critical Stock, Out of Stock, and requisition status counts.",
            "Investigate any warning card or non-healthy status before processing time-sensitive work.",
        ],
        "The administrator has a current summary of access, infrastructure, inventory, and requisition conditions.",
        screenshot=(
            "Dashboard Health Summary",
            "Dashboard and scroll to the top",
            "the page header and all top summary cards in one image",
            "user totals, database status, email status, operating mode, stock counts, and requisition counts",
            "Use test data; blur any named user or operational reference.",
        ),
    )
    add_procedure(
        doc,
        "4.2 Review Operational Attention and Activity",
        "Identify stock risks, recent inventory movements, failed jobs, storage, backup state, and administrative activity.",
        [
            "Scroll to Stock Requiring Attention and review critical or out-of-stock items.",
            "Review Recent Receiving and Recent Issuance for unexpected movements.",
            "Review Failed Jobs, Free Storage, and Backup Status.",
            "Review Recent System Activity for account, setting, mode, or inventory changes.",
            "Use the dashboard shortcuts to open User Management, Roles and Permissions, System Settings, diagnostics/backup, Login Audit, or Activity Audit.",
        ],
        "Warnings are identified and the relevant detailed workspace is opened for follow-up.",
        screenshot=(
            "Dashboard Operations and Shortcuts",
            "Dashboard and scroll to the lower operational panels",
            "Stock Requiring Attention, recent receiving/issuance, infrastructure status, shortcuts, and Recent System Activity",
            "warning badges, dates, quantities, shortcut labels, and activity types",
            "Blur item references, staff names, email addresses, and audit identifiers if live data is used.",
        ),
    )

    # 5
    add_chapter(doc, 5, "System Mode Management", "System mode identifies the intended operating context and can restrict write operations.")
    doc.add_heading("5.1 Available Modes", level=2)
    add_simple_table(
        doc,
        ["Mode", "Administrative Meaning"],
        [
            ("LIVE PRODUCTION", "Normal live institutional operation."),
            ("STAGING SANDBOX", "Controlled staging or validation environment."),
            ("MAINTENANCE MODE", "Restricts non-administrator write activity while maintenance is performed."),
            ("TRAINING SIMULATION", "Training-oriented operation separated by the system's configured mode context."),
        ],
        widths=[1.8, 5.15],
    )
    add_procedure(
        doc,
        "5.2 Change the Operating Mode",
        "Change the active mode with an auditable reason.",
        [
            "Select the current System Mode badge.",
            "Choose the target mode.",
            "Enter a specific reason describing the change, expected duration, and responsible administrator.",
            "Review the impact statement.",
            "Confirm the mode change.",
            "Verify the new mode badge and review Recent System Activity or Transaction Audit.",
        ],
        "The selected mode becomes active and the mode change, administrator, time, and reason are recorded.",
        notes="Use MAINTENANCE MODE only with an approved maintenance window. Non-administrator writes are restricted while it is active.",
        screenshot=(
            "System Mode Change Dialog",
            "the System Mode control and open the change dialog",
            "the complete dialog with all mode options and an example reason",
            "the current mode, four available modes, reason field, impact message, and confirmation controls",
            "Use a generic reason. Blur server identifiers or operational notes that reveal sensitive infrastructure details.",
        ),
    )

    # 6
    add_chapter(doc, 6, "My Requests", "System Administrators can create and manage their own consumable-supply requisitions.")
    doc.add_heading("6.1 Request Statuses", level=2)
    add_simple_table(
        doc,
        ["Status", "Meaning / Next Action"],
        [
            ("Pending", "Submitted and awaiting the next workflow action."),
            ("Pending Verification", "Supporting document awaits review."),
            ("For Correction", "Requester must correct information or replace the supporting document."),
            ("Under Review", "Request is being evaluated in the approval workspace."),
            ("Approved", "Quantities are approved; additional pickup steps may apply."),
            ("Ready for Pickup", "Requester may present the required signed RIS and collect supplies."),
            ("Issued / Released", "Supplies were released and stock was deducted."),
            ("Rejected", "Request was denied with a recorded reason."),
            ("Cancelled", "Requester cancelled the request before completion."),
        ],
        widths=[1.45, 5.5],
    )
    add_procedure(
        doc,
        "6.2 Search, Filter, and Open a Request",
        "Locate requests and review their status.",
        [
            "Open My Requests.",
            "Use search and available status/date filters to narrow the list.",
            "Select a request to view its details, line items, quantities, remarks, approvals, supporting document, and RIS availability.",
        ],
        "The selected requisition record opens with its current workflow information.",
        screenshot=(
            "My Requests Registry",
            "My Requests with several test requests in different statuses",
            "the page header, filters, request table/cards, status badges, and primary create action",
            "search, status filters, request number, date, purpose, status, and row actions",
            "Blur requester names, offices, references, and supporting-document names.",
        ),
    )
    add_procedure(
        doc,
        "6.3 Create a Supply Request",
        "Submit a requisition for one or more inventory items.",
        [
            "Select Create Request or the equivalent primary action.",
            "Verify or enter Requested by/Recipient, Date Requested, Division/Office, Designation, Fund Cluster, and Purpose.",
            "Review the read-only approving and issuing authorities populated from System Settings.",
            "Add an item line, select the inventory item, and enter the requested quantity.",
            "Add more item lines as needed and remove accidental lines before submission.",
            "If required, select the supporting-document type: Approved MOA, Approved Research, Approved Letter, or Others.",
            "Upload a PDF, JPG, JPEG, or PNG file no larger than 10 MB.",
            "Review the request and submit it.",
        ],
        "A new requisition is created with a system-generated reference and the appropriate initial workflow status.",
        notes="Availability shown during requesting does not replace final stock enforcement. Approved or released quantities may differ from requested quantities.",
        screenshot=(
            "Create Request — Request Details",
            "My Requests, start a new request, and remain at the upper part of the form",
            "the requester, date, office, designation, fund cluster, purpose, and authority fields",
            "all field labels and which authority fields are read-only",
            "Use fictional names and office data. Do not capture real signatures or confidential purpose text.",
        ),
    )
    add_screenshot_direction(
        doc,
        "Create Request — Items and Supporting Document",
        "the lower part of the same Create Request form with two demonstration item lines and the supporting-document section expanded",
        "the complete item-entry and upload area including the submit controls",
        "item selectors, quantity fields, add/remove line controls, document type, accepted formats/limit, and submit button",
        "Use non-sensitive demo items. Show only a harmless test filename and never include the file contents.",
    )
    add_procedure(
        doc,
        "6.4 Edit or Correct a Request",
        "Update a request while the current workflow status allows requester changes.",
        [
            "Open the request from My Requests.",
            "Select Edit or Correct Request when available.",
            "Review any correction remarks.",
            "Update request details, item quantities, purpose, or supporting document as required.",
            "Submit the corrected request.",
        ],
        "The revised request returns to the applicable verification or review stage.",
        notes="Edit controls are intentionally unavailable after workflow states that lock requester changes.",
        screenshot=(
            "Request Correction Screen",
            "a test request in For Correction status and open its edit action",
            "the correction remarks and editable form fields",
            "the status, reviewer remarks, fields needing correction, and resubmit control",
            "Use a generic correction remark and blur document references.",
        ),
    )
    add_procedure(
        doc,
        "6.5 View, Download, Print, or Cancel",
        "Review the complete requisition record, obtain permitted documents, or cancel an eligible request.",
        [
            "Open the request details.",
            "Use View RIS or Preview RIS when the document is available.",
            "Use Download Supporting Document only when authorized and necessary.",
            "Use Print from the RIS preview for a controlled paper or PDF copy.",
            "To stop an eligible request, select Cancel, review the confirmation, and confirm.",
        ],
        "The requested document opens/downloads, or the requisition is marked Cancelled without proceeding to release.",
        screenshot=(
            "Request Details and Document Actions",
            "a test request that has a supporting document and RIS available",
            "the details page with status timeline, item table, document controls, RIS action, and Cancel if eligible",
            "status, approved versus requested quantities, remarks, supporting-document action, and RIS controls",
            "Blur names, signatures, email addresses, document numbers, and the supporting-document filename.",
        ),
    )

    # 7
    add_chapter(doc, 7, "Requisition Review, Approval, Pickup, and Release", "Use the approval workspace to move requests through verification, authorization, and final stock release.")
    add_procedure(
        doc,
        "7.1 Verify a Supporting Document",
        "Accept a valid supporting document or return it for correction.",
        [
            "Open Inventory > Issuance and select Approval Workspace.",
            "Locate a request in Pending Verification.",
            "Open the supporting document and compare it with the request.",
            "Select Verified when the document is complete and applicable.",
            "If correction is required, choose Return for Correction, enter clear remarks, and confirm.",
        ],
        "A verified request proceeds to review; a returned request becomes For Correction with visible remarks.",
        notes="Do not download or retain supporting documents outside approved institutional storage.",
        screenshot=(
            "Supporting Document Review",
            "Approval Workspace and open a demonstration request awaiting verification",
            "the verification panel and document-review controls",
            "request reference, document type, view/download control, Verified, Return for Correction, and remarks field",
            "Use a harmless test document and blur names, document contents, file names, and reference numbers.",
        ),
    )
    add_procedure(
        doc,
        "7.2 Review and Approve Authorized Quantities",
        "Approve all or part of the requested quantities.",
        [
            "In Approval Workspace, use search and queue filters to locate the request.",
            "Open the request and review purpose, office, fund cluster, requested items, available stock, and remarks.",
            "Enter each Authorized Quantity, or use Approve All Full where appropriate.",
            "Use Reset Quantities if the proposed approvals must be recalculated.",
            "Enter review remarks when needed.",
            "Select Approve and confirm.",
        ],
        "The approved quantities are recorded and the request advances to the next applicable status.",
        notes="Authorized quantities cannot be negative and should not exceed policy or available stock. Strict stock enforcement may block excessive quantities.",
        screenshot=(
            "Approval Workspace Quantity Review",
            "Approval Workspace and open a multi-item request under review",
            "the request summary and full quantity authorization table",
            "requested, available, and authorized quantities, Approve All Full, Reset Quantities, remarks, Approve, and Reject",
            "Use demonstration quantities and blur request references and personal details.",
        ),
    )
    add_procedure(
        doc,
        "7.3 Reject a Request",
        "Deny a request with a traceable explanation.",
        [
            "Open the request in Approval Workspace.",
            "Select Reject.",
            "Enter the required rejection reason.",
            "Review the impact and confirm.",
        ],
        "The request is marked Rejected and the reason is available to the requester and audit trail.",
        screenshot=(
            "Reject Request Dialog",
            "a demonstration request in Approval Workspace and select Reject",
            "the rejection confirmation before final submission",
            "request reference, required reason field, cancel control, and reject control",
            "Use a neutral example reason. Blur the requester and document reference.",
        ),
    )
    add_procedure(
        doc,
        "7.4 Update Approved Quantities",
        "Correct approved quantities before final release when the workflow permits.",
        [
            "Open the approved request.",
            "Select the action to update approved quantities.",
            "Edit only the affected line values.",
            "Enter an explanatory remark if prompted.",
            "Save the update and review the revised RIS preview.",
        ],
        "The approved quantities and official preview reflect the authorized correction.",
        notes="Do not use this function to bypass authorization policy. Any change should be supported by an auditable business reason.",
        screenshot=(
            "Update Approved Quantities",
            "an approved demonstration request and open the quantity-update action",
            "the editable approved quantity panel and save controls",
            "original/requested quantities, updated approved values, remarks, and save/cancel buttons",
            "Use demonstration data and blur personal information and references.",
        ),
    )
    add_procedure(
        doc,
        "7.5 Mark Ready for Pickup",
        "Notify the requester that an approved request requiring pickup documentation is ready.",
        [
            "Open the approved request.",
            "Preview the RIS and confirm approved quantities.",
            "Select Mark Ready for Pickup.",
            "Confirm the notification action.",
        ],
        "The request becomes Ready for Pickup and the requester is notified through the configured channel.",
        screenshot=(
            "Ready for Pickup Action",
            "an approved request that requires the pickup stage",
            "the action area and confirmation dialog",
            "current status, RIS preview action, Mark Ready for Pickup, and notification message",
            "Blur recipient contact information and request references.",
        ),
    )
    add_procedure(
        doc,
        "7.6 Confirm Signed RIS and Release Supplies",
        "Complete final issuance and deduct released quantities from stock.",
        [
            "Open a Ready for Pickup or otherwise releasable request.",
            "Verify the identity of the recipient and inspect the signed RIS according to institutional policy.",
            "Confirm that approved quantities can be physically issued.",
            "Select Confirm Signed RIS / Release Supplies.",
            "Review the stock deduction warning.",
            "Confirm the release.",
            "Open the completed record and verify Issued/Released status and resulting stock balances.",
        ],
        "The request is completed, the issuance is registered, and inventory stock is deducted.",
        notes="Release is a stock-changing action. Do not confirm until the signed document and actual handover are complete.",
        screenshot=(
            "Final Release Confirmation",
            "a releasable demonstration request and select the final release action",
            "the complete confirmation dialog before committing",
            "recipient, approved item quantities, signed-RIS confirmation, stock-deduction warning, and final release control",
            "Blur names, signatures, request/RIS numbers, and any identification details.",
        ),
    )
    add_procedure(
        doc,
        "7.7 View Archived RIS",
        "Retrieve completed requisition and issue slip records.",
        [
            "Open the completed or archived area of the approval/issuance workspace.",
            "Search by request/RIS reference, recipient, office, or available filters.",
            "Open the record.",
            "Preview, print, or download the RIS as permitted.",
        ],
        "The historical RIS opens without changing inventory or workflow state.",
        screenshot=(
            "Archived RIS Registry",
            "the completed/archived RIS view with several demonstration records",
            "the filters, completed record list, status, and document actions",
            "search controls, RIS/reference number, recipient, date, status, and preview/print action",
            "Blur names, offices, signatures, and official reference numbers.",
        ),
    )

    # 8
    add_chapter(doc, 8, "Inventory — All Items", "Maintain the active consumable-supply catalog and review stock history.")
    add_procedure(
        doc,
        "8.1 Search and Filter Inventory",
        "Locate items by identity, supplier, or stock status.",
        [
            "Open Inventory > All Items.",
            "Search by item name or SKU/supplier stock number.",
            "Filter by Supplier and Status.",
            "Open an item to review stock, valuation, receiving batches, and issuance history.",
        ],
        "The inventory list and summary display only matching items.",
        screenshot=(
            "All Items Registry",
            "Inventory > All Items with demonstration items in multiple stock states",
            "the header, summary, search, supplier/status filters, item table, and Add Item action",
            "item name, SKU, unit, supplier, stock, valuation, status, and row actions",
            "Use demonstration values; blur any internal stock numbers if required by policy.",
        ),
    )
    add_procedure(
        doc,
        "8.2 Add an Item Master",
        "Create a catalog item, optionally with an opening receiving batch.",
        [
            "Select Add Item.",
            "Enter Item Name, Unit of Issue, and Description/Specifications.",
            "Select the Preferred Supplier.",
            "Review the system-generated supplier stock number/SKU.",
            "If creating an initial batch, enter Initial Stock and Unit Cost.",
            "Review the calculated Amount and initial stock Status.",
            "Save the item.",
        ],
        "A new inventory item is available in the active catalog; any entered opening batch contributes to stock and valuation.",
        notes="Resolve duplicate-item warnings before saving. Do not create a second master for spelling or formatting differences.",
        screenshot=(
            "Add Inventory Item",
            "Inventory > All Items and select Add Item",
            "the complete item form with a demonstration initial batch",
            "item name, unit, description, preferred supplier, generated SKU, initial stock, unit cost, amount, status, and save control",
            "Use fictional item specifications and supplier data.",
        ),
    )
    add_screenshot_direction(
        doc,
        "Duplicate Item Warning",
        "the Add Item form and enter a name/specification that matches an existing demonstration item",
        "the warning and the relevant item identity fields",
        "the detected duplicate message and the control used to return to or open the existing item",
        "Use a test item and do not expose confidential supplier pricing.",
    )
    add_procedure(
        doc,
        "8.3 View Item Details and History",
        "Inspect current stock, valuation, batches, and movements.",
        [
            "Open the item from All Items.",
            "Review item identity, supplier/SKU, current stock, status, and valuation.",
            "Review receiving batches and unit costs.",
            "Review issuance history and related references.",
            "Use the RFID action when tag administration is required.",
        ],
        "The administrator can trace the item's current balance to recorded receipts and issues.",
        screenshot=(
            "Inventory Item Details",
            "a demonstration item with both receiving and issuance history",
            "the complete item details page, including summary and history sections",
            "current stock, valuation, status, receiving batches, issuance history, Edit, RFID, and archive/delete action",
            "Blur document references, recipients, suppliers, and sensitive pricing if required.",
        ),
    )
    add_procedure(
        doc,
        "8.4 Edit Item Identity",
        "Correct the catalog information without creating a duplicate item.",
        [
            "Open the item details.",
            "Select Edit.",
            "Update permitted identity fields such as name, unit, description/specifications, or preferred supplier.",
            "Review any duplicate warning.",
            "Save changes.",
        ],
        "The active catalog and future selections show the revised item information.",
        notes="Use receiving or issuance functions for stock changes; do not alter item identity to simulate a stock adjustment.",
        screenshot=(
            "Edit Inventory Item",
            "an item details page and select Edit",
            "the editable item identity form",
            "editable fields, read-only/system-generated identifiers, and save/cancel controls",
            "Use test data and blur internal identifiers if necessary.",
        ),
    )
    add_procedure(
        doc,
        "8.5 Archive or Remove an Item from the Active Catalog",
        "Remove an obsolete item from normal active selection when permitted.",
        [
            "Open the item details.",
            "Select Archive/Delete from Active Catalog.",
            "Review dependencies, stock state, and warning text.",
            "Confirm only when the item should no longer be available for new transactions.",
        ],
        "The item no longer appears as a normal active selection while historical movements remain traceable according to system behavior.",
        notes="Do not remove an item solely to correct its name or supplier. Review open requests and remaining stock first.",
        screenshot=(
            "Archive Item Confirmation",
            "a zero-stock demonstration item and select its archive/delete action",
            "the full confirmation dialog",
            "item identity, impact warning, cancel, and confirm controls",
            "Use an expendable test item with no live dependencies.",
        ),
    )

    # 9
    add_chapter(doc, 9, "Inventory — Receiving", "Record stock received from suppliers and maintain batch-level cost history.")
    add_procedure(
        doc,
        "9.1 Search and Review Receiving Records",
        "Locate receiving transactions by item, SKU, or supplier.",
        [
            "Open Inventory > Receiving.",
            "Search by item name or SKU.",
            "Filter by Supplier.",
            "Open a record to inspect quantity, unit cost, total, received date, supplier, and item.",
        ],
        "The matching receiving records are displayed.",
        screenshot=(
            "Receiving Registry",
            "Inventory > Receiving with demonstration batches from multiple suppliers",
            "the page header, search/filter controls, receiving table, Record Receiving, and RFID Bulk Receiving",
            "item, SKU, supplier, quantity, unit cost, amount, received date, and row actions",
            "Blur supplier-sensitive pricing if the manual will be widely distributed.",
        ),
    )
    add_procedure(
        doc,
        "9.2 Record Receiving",
        "Add a new receiving batch and increase stock.",
        [
            "Select Record Receiving.",
            "Select the Inventory Item.",
            "Select the Supplier and verify the automatic supplier stock number.",
            "Enter Quantity Received and Unit Cost.",
            "Review the calculated Batch Total.",
            "Enter Date Received.",
            "Save the receiving record.",
            "Verify the updated item stock and valuation.",
        ],
        "A receiving batch is created and the item's stock and valuation are updated.",
        screenshot=(
            "Record Receiving Form",
            "Inventory > Receiving and select Record Receiving",
            "the full form with demonstration values before saving",
            "item, supplier, automatic stock number, quantity, unit cost, calculated total, received date, and save control",
            "Use demonstration supplier and cost values.",
        ),
    )
    add_procedure(
        doc,
        "9.3 View or Update a Receiving Record",
        "Review or correct permitted receiving information.",
        [
            "Open the receiving record.",
            "Review the item, supplier, quantity, unit cost, total, date, and audit information.",
            "Select Edit/Update when available.",
            "Correct the permitted fields and save.",
            "Verify the affected stock/valuation and transaction audit entry.",
        ],
        "The receiving record and calculated inventory values reflect the approved correction.",
        notes="Correcting quantity or unit cost can affect stock and valuation. Record the business basis for the correction according to policy.",
        screenshot=(
            "Receiving Details and Update",
            "a demonstration receiving record and open its details",
            "the record summary and update action",
            "batch values, audit metadata, and edit/update control",
            "Blur internal references and supplier-sensitive costs if needed.",
        ),
    )
    add_procedure(
        doc,
        "9.4 RFID Bulk Receiving",
        "Receive up to 100 tagged item lines through an assigned RFID scanner/station.",
        [
            "Select RFID Bulk Receiving.",
            "Select the scanner/station.",
            "Scan physical tags or manually enter/simulate test tags.",
            "For each line, select or verify the item and supplier, then enter quantity and unit cost.",
            "Set the receiving date.",
            "Resolve duplicate or invalid tag messages.",
            "Review all lines and select Receive Items.",
        ],
        "Valid receiving lines are recorded and associated RFID information is processed.",
        notes="The workspace accepts up to 100 items per batch. Confirm the scanner context and never reuse a tag already linked to another item.",
        screenshot=(
            "RFID Bulk Receiving Workspace",
            "Inventory > Receiving and open RFID Bulk Receiving with three demonstration scanned lines",
            "the scanner selector, tag-entry area, line grid, receiving date, validation states, and final action",
            "station, tag status, item, supplier, quantity, unit cost, and Receive Items",
            "Blur real RFID tag IDs, device tokens, network details, and supplier-sensitive costs.",
        ),
    )

    # 10
    add_chapter(doc, 10, "Inventory — Issuance", "Use Issuance for the approval workspace and the registry of released or manually recorded stock issues.")
    add_procedure(
        doc,
        "10.1 Use Approval Workspace and Issuance Registry Tabs",
        "Switch between requisition processing and completed issuance records.",
        [
            "Open Inventory > Issuance.",
            "Select Approval Workspace to process requisitions as described in Chapter 7.",
            "Select Issuance Registry to review issued stock records.",
            "Use search and available filters to locate a transaction.",
        ],
        "The selected workspace displays its relevant requests or issuance records.",
        screenshot=(
            "Issuance Tabs and Registry",
            "Inventory > Issuance and select Issuance Registry",
            "the page header, both tabs, search/filters, registry table, and Record Stock Issuance action",
            "recipient, office, date, items/quantity summary, reference, and document actions",
            "Blur recipients, offices, and official references.",
        ),
    )
    add_procedure(
        doc,
        "10.2 Manually Record Stock Issuance",
        "Record a legitimate issuance that is entered directly rather than released from a digital requisition.",
        [
            "Select Record Stock Issuance.",
            "Enter Recipient, Date Issued, Division/Office, Recipient Designation, Fund Cluster, and Purpose.",
            "Review the read-only Approved By and Issued By authorities.",
            "Add one or more inventory item lines and enter quantities.",
            "Review available stock and validation messages.",
            "Save the issuance.",
        ],
        "An issuance record is created and stock is deducted for valid quantities.",
        notes="Strict stock enforcement can block quantities above available stock. Do not use manual issuance to bypass the requisition workflow when a digital request is required.",
        screenshot=(
            "Manual Stock Issuance Form",
            "Issuance Registry and select Record Stock Issuance",
            "the complete form with two demonstration item lines",
            "recipient details, office, fund cluster, purpose, authority fields, item quantities, stock indicators, and save action",
            "Use fictional recipients and blur any official document reference.",
        ),
    )
    add_procedure(
        doc,
        "10.3 View Issuance Details and RIS",
        "Inspect released stock and obtain the official requisition/issue document.",
        [
            "Open the issuance record.",
            "Review recipient, purpose, authorities, item quantities, date, and stock movement information.",
            "Select View/Preview RIS.",
            "Use Print or Download PDF as permitted.",
        ],
        "The complete issuance and its official RIS are available for review without changing stock.",
        screenshot=(
            "Issuance Details and RIS Actions",
            "a completed demonstration issuance record",
            "the record details and document controls",
            "recipient, issue date, line items, approved/issued authorities, reference, View RIS, Print, and Download",
            "Blur names, signatures, offices, references, and personal information.",
        ),
    )

    # 11
    add_chapter(doc, 11, "RFID Scanner", "Assign, replace, or remove RFID tags linked to inventory items.")
    add_procedure(
        doc,
        "11.1 Select an Item and Connect to a Scanner",
        "Prepare an inventory item for RFID assignment.",
        [
            "Open RFID Scanner.",
            "Select the inventory item.",
            "Review whether the item is Tagged or Untagged.",
            "Review the hardware connection state.",
            "If disconnected, select Retry Connection and verify the configured scanner/station.",
        ],
        "The selected item and scanner state are ready for tag input.",
        screenshot=(
            "RFID Scanner Workspace",
            "RFID Scanner with a demonstration untagged item selected",
            "the full assignment workspace",
            "item selector, tagged/untagged state, connection indicator, scan/manual controls, and action area",
            "Blur real tag values, scanner identifiers, IP addresses, and tokens.",
        ),
    )
    add_procedure(
        doc,
        "11.2 Scan or Manually Enter a Tag and Assign It",
        "Link an RFID tag to the selected inventory item.",
        [
            "Scan the physical tag using the connected hardware, or use manual/simulated entry for authorized testing.",
            "Review the captured Tag ID.",
            "Select Assign Tag.",
            "Wait for the success state.",
            "Copy the Tag ID only if required for authorized documentation.",
            "Select View Item or Select Next Item.",
        ],
        "The item shows as Tagged with the assigned tag ID.",
        notes="Treat tag IDs as controlled asset identifiers. A failed assignment should be retried only after reviewing the error.",
        screenshot=(
            "Successful RFID Assignment",
            "the RFID Scanner after assigning a test tag to a demonstration item",
            "the success state and post-assignment controls",
            "item name, tagged status, masked/example tag ID, Copy, View Item, and Select Next Item",
            "Use a fabricated or masked tag ID. Never expose a production tag identifier.",
        ),
    )
    add_procedure(
        doc,
        "11.3 Resolve a Tag Conflict, Replace, or Unassign",
        "Handle a tag already assigned elsewhere or change an existing item-tag relationship.",
        [
            "When a conflict appears, review the linked existing item.",
            "Select Open Existing Item to confirm the current association.",
            "Return to the intended item.",
            "Use Replace Tag only after verifying the operational need.",
            "Use Unassign Tag when a tag is damaged, retired, or incorrectly linked.",
            "Confirm the warning and verify the resulting tagged/untagged state.",
        ],
        "The conflict is resolved and the inventory item reflects the correct tag relationship.",
        notes="Replacing or unassigning a tag affects future scans. Coordinate physical label changes at the same time.",
        screenshot=(
            "RFID Tag Conflict and Resolution",
            "a controlled test in which a demonstration tag is already linked to another test item",
            "the conflict message and available resolution controls",
            "conflicting item, Open Existing Item, Replace Tag, Unassign Tag, retry, and cancel options",
            "Mask both item identifiers and RFID tag IDs.",
        ),
    )

    # 12
    add_chapter(doc, 12, "Suppliers", "Maintain suppliers of consumable office supplies and their compliance status.")
    add_procedure(
        doc,
        "12.1 Search and Filter Suppliers",
        "Locate suppliers by name, tax identifier, registration, or status.",
        [
            "Open Suppliers > Supplier Registry.",
            "Search by business name, TIN, or registration number.",
            "Filter by Status.",
            "Open a supplier profile.",
        ],
        "The registry shows matching supplier records.",
        screenshot=(
            "Supplier Registry",
            "Suppliers > Supplier Registry with demonstration suppliers in each status",
            "the page header, search/status filter, supplier table, and Register Supplier action",
            "business name, masked TIN, registration, category, status, and row actions",
            "Use fictional suppliers or mask TIN, registration, addresses, and contact information.",
        ),
    )
    add_procedure(
        doc,
        "12.2 Register a Supplier",
        "Add an authorized supplier to the registry.",
        [
            "Select Register Supplier.",
            "Enter Business Name, TIN, Business Address, and Registration Number.",
            "Confirm the fixed Category: Consumable Office Supplies.",
            "Choose Active/Compliant, Pending Renewal, or Blacklisted.",
            "Save the supplier.",
        ],
        "The supplier is available for inventory and receiving selections according to its status.",
        screenshot=(
            "Register Supplier Form",
            "Supplier Registry and select Register Supplier",
            "the complete form with demonstration values before saving",
            "business name, TIN, address, registration number, fixed category, status choices, and save control",
            "Use fictitious registration and tax information.",
        ),
    )
    add_procedure(
        doc,
        "12.3 View and Update a Supplier",
        "Review supplier profile information and update compliance status or identity details.",
        [
            "Open the supplier profile.",
            "Review registered details and current status.",
            "Select Edit/Update.",
            "Change only verified supplier information.",
            "Save changes and verify the profile.",
        ],
        "The supplier profile and status are updated.",
        notes="The current interface does not present supplier deletion as a normal user-facing function. Preserve supplier history and update status instead.",
        screenshot=(
            "Supplier Profile and Update",
            "a demonstration supplier profile",
            "the profile details and edit action",
            "identity fields, category, status, related context, and Edit/Update",
            "Mask TIN, registration number, address, and other sensitive supplier information.",
        ),
    )

    # 13
    add_chapter(doc, 13, "Compliance Reports", "Generate, register, preview, print, download, and migrate official compliance data.")
    doc.add_heading("13.1 Supported Report Types", level=2)
    add_simple_table(
        doc,
        ["Type", "Purpose", "Type-Specific Input"],
        [
            ("RSMI", "Report of Supplies and Materials Issued.", "Uses selected coverage period; yearly output may contain a multi-page package."),
            ("RPCI", "Report on the Physical Count of Inventories.", "Optional supplier filter; landscape preview."),
            ("Stock Card", "Chronological receipt/issue ledger with running balance.", "A specific Target Item is required."),
            ("Memorandum Receipt (MR)", "Acknowledgement of property/equipment issued to an accountable officer.", "An End User / Accountable Officer is required."),
        ],
        widths=[1.25, 3.2, 2.75],
    )
    add_procedure(
        doc,
        "13.2 Search and Open the Report Registry",
        "Locate generated compliance documents.",
        [
            "Open Compliance > Manage Reports.",
            "Search Documents by reference or title.",
            "Filter by All Report Types or a specific type.",
            "Select View or COA Form.",
        ],
        "The selected registered report opens in the official form preview.",
        screenshot=(
            "Compliance Report Registry",
            "Compliance > Manage Reports with demonstration records of all four report types",
            "the search/type filter, Migrate Data, Generate Report, registry columns, and row actions",
            "Reference No., Form Type, Document Title, Coverage Period, Date Generated, View, and COA Form",
            "Blur official references, supplier names, accountable officers, and report content.",
        ),
    )
    add_procedure(
        doc,
        "13.3 Configure and Preview a New Report",
        "Build an authoritative report dataset before recording the document.",
        [
            "Select Generate Report.",
            "Choose RSMI, RPCI, Stock Card, or Memorandum Receipt.",
            "Enter a Document Title and confirm Report Generation Date.",
            "Choose All Records/Full Ledger, Specific Date, Date Range, Monthly, or Yearly.",
            "Complete the period fields.",
            "For Stock Card, select the Target Item.",
            "For MR, select the End User / Accountable Officer.",
            "For RPCI, optionally select a Supplier.",
            "Select Preview Official Report.",
            "Review record count, total units, total amount when shown, generated reference preview, coverage, and official form.",
        ],
        "A two-step authoritative preview displays without reserving the final report number.",
        notes="A preview does not reserve a document number. The final year-first reference is reserved only when the document is saved.",
        screenshot=(
            "Generate Report — Configuration",
            "Compliance > Manage Reports, select Generate Report, and configure a demonstration Stock Card",
            "the complete Step 1 configuration dialog",
            "report type, title, generation date, period format, date controls, required Target Item, Cancel, and Preview Official Report",
            "Use a demonstration item and non-sensitive dates.",
        ),
    )
    add_screenshot_direction(
        doc,
        "Generate Report — Authoritative Preview",
        "Step 2 of the Generate Official COA Report dialog after preview data loads",
        "the dataset summary banner and enough of the official paper to identify the report",
        "record count, total units/amount when shown, reference, coverage, Back to Configure, Print Preview, and Save & Record Document",
        "Blur report references, item costs, officers, signatures, and institutional data not intended for publication.",
    )
    add_procedure(
        doc,
        "13.4 Save and Record a Report",
        "Create the report registry record after validating the preview.",
        [
            "In the preview step, compare report totals and rows with source records.",
            "Use Back to Configure if any period or type-specific input is incorrect.",
            "Optionally select Print Preview for a pre-save review.",
            "Select Save & Record Document.",
            "Wait for the registry confirmation.",
            "Open the new record and verify its final reference and coverage.",
        ],
        "The report is stored in the registry with a reserved year-first document number and snapshot data.",
        screenshot=(
            "Saved Compliance Report",
            "the report registry immediately after saving a demonstration report",
            "the success notification and the new registry row",
            "final reference, form type, title, coverage period, generated date, View, and COA Form",
            "Mask the final reference if the screenshot will leave the controlled environment.",
        ),
    )
    add_procedure(
        doc,
        "13.5 Print or Download an Existing Report",
        "Create an official paper copy or PDF from a registered report.",
        [
            "Open the report using View or COA Form.",
            "Review the metadata and official form.",
            "Select Print Form/Print to open the browser print workflow, or select Download PDF.",
            "Choose the approved printer or Save as PDF according to institutional policy.",
            "Verify page orientation; RPCI is designed for landscape presentation.",
        ],
        "A printable or downloaded official report is produced without changing the registry record.",
        notes="If PDF generation fails, use Print Form and the browser's Save as PDF option.",
        screenshot=(
            "Compliance Report Preview Actions",
            "a registered demonstration report in its official form preview",
            "the preview header and document action bar",
            "report type/title/reference, Print Form, Download PDF, and Close",
            "Blur report body data, signatures, costs, references, and personal names.",
        ),
    )
    add_procedure(
        doc,
        "13.6 Migrate Historical Compliance Data",
        "Import validated legacy RSMI, RPCI, Stock Card, or MR rows for reporting continuity.",
        [
            "Select Migrate Data.",
            "Choose the Form Type.",
            "Enter a Legacy Source / Archive Batch Identifier.",
            "Upload an Excel (.xlsx, .xls), CSV, PDF, Word (.docx), or legacy Word (.doc) file.",
            "Wait for extraction and review Total Detected, Valid, Invalid, and other validation counts.",
            "Review the field-mapping matrix, sheet tabs/batches, detected rows, references, dates, items, quantities, and row errors.",
            "Correct the source document when required, then upload it again.",
            "Confirm migration only when valid records and source identification are correct.",
            "Review the completion message showing migrated and skipped duplicate/invalid rows.",
        ],
        "Valid historical rows are stored in the report-type historical dataset; duplicates and invalid rows are skipped.",
        notes="A server request accepts up to 500 rows; larger files are submitted in 500-row batches. Keep the original archive file under institutional records management.",
        screenshot=(
            "Historical Data Migration Workspace",
            "Manage Reports, select Migrate Data, choose a report type, and upload a harmless demonstration spreadsheet",
            "the full workspace after extraction",
            "form type, source identifier, supported formats, uploaded filename, validation cards, mapping table, detected rows, errors, and confirm action",
            "Use synthetic records. Blur filenames, paths, references, names, costs, and any extracted document content.",
        ),
    )

    # 14
    add_chapter(doc, 14, "Consumable Supply Analytics", "Analyze requisition demand, issue trends, stock attention, departments, and items under a shared reporting scope.")
    add_procedure(
        doc,
        "14.1 Set the Reporting Scope",
        "Apply one period and record scope to every chart and table.",
        [
            "Open Compliance > Consumable Supply Analytics.",
            "Use This Month, This Year, or Last Year, or set From Date, To Date, Year, and Month.",
            "Expand Refine Records.",
            "Optionally select Department or Office, Category (supplier classification), Consumable Item, and Requisition Status.",
            "Remove individual filter chips or select Reset Filters.",
            "Wait for the Updating charts and tables message to finish.",
        ],
        "Every analytics component reflects the same active filters.",
        screenshot=(
            "Analytics Filters",
            "Consumable Supply Analytics with Refine Records expanded and two demonstration filters active",
            "the complete Analytics Filters panel",
            "period presets, date/year/month fields, department/category/item/status selectors, active chips, Reset Filters, and update status",
            "Use demonstration departments and items; avoid sensitive operational names.",
        ),
    )
    add_procedure(
        doc,
        "14.2 Review Overview and Stock Attention",
        "Assess high-level demand, issuance, and stock conditions.",
        [
            "Select the Overview view when available.",
            "Review Total Requisitions, Most Requested Item, Highest/Lowest Requesting Department, Total Supplies Issued, and Active Requesting Offices.",
            "Review stock status/valuation/quantity visualizations and Stock Requiring Attention.",
            "Open a focused item list or modal when a summary is selectable.",
            "Investigate critical, low-stock, and out-of-stock items in All Items.",
        ],
        "The administrator identifies demand and replenishment priorities for the selected period.",
        screenshot=(
            "Analytics Overview",
            "Consumable Supply Analytics after filters finish loading",
            "the KPI summary and first set of stock/demand visuals",
            "selected period, KPI values, comparison indicators, stock status, valuation/quantity charts, and Stock Requiring Attention",
            "Use demonstration data and blur department or item details if required.",
        ),
    )
    add_procedure(
        doc,
        "14.3 Analyze Departments and Items",
        "Compare requesting offices and identify high-frequency or high-quantity items.",
        [
            "Open the Departments or relevant rankings view.",
            "Choose Total Quantity Requested, Number of Requisitions, or Total Quantity Issued.",
            "Review the top five highest and lowest requesting offices.",
            "Open the Items view and choose Request Frequency or Total Requested Quantity.",
            "Review the Top 10 Most Requested Items and open the full searchable item table.",
            "For detailed office analysis, select an office and review most/least frequent items, quantity comparison, and monthly history.",
        ],
        "The administrator can compare offices and items using consistent demand metrics.",
        screenshot=(
            "Department and Item Rankings",
            "Consumable Supply Analytics with the department-ranking section visible",
            "the highest/lowest panels and metric selector",
            "metric choices, top five highest, top five lowest, values, and active filters",
            "Use generic office labels if the screenshot is intended for public presentation.",
        ),
    )
    add_screenshot_direction(
        doc,
        "Departmental Item Demand",
        "the Departmental Item Demand Analysis and select one demonstration office",
        "the office selector, most/least frequent summaries, chart, and beginning of the demand table",
        "selected office, requested versus issued quantities, frequency, monthly history, and table search",
        "Use non-sensitive office and item names.",
    )
    add_procedure(
        doc,
        "14.4 Review Trends, Heatmap, and Complete Records",
        "Compare current and previous periods and inspect complete office usage.",
        [
            "Open the Trends view.",
            "Switch between Monthly View and Yearly View.",
            "Compare Selected Reporting Period with Previous Reporting Period.",
            "Review the Departmental Demand Heatmap and its selected metric.",
            "Open Records to review Department and Office Supply Usage, including zero-activity offices when configured.",
            "Search, sort, or page through the data tables.",
        ],
        "The administrator can distinguish trend changes, seasonal demand, and office-level activity.",
        screenshot=(
            "Supply Trends and Demand Heatmap",
            "the Trends analytics view with demonstration data",
            "the selected/previous period trend charts and heatmap",
            "monthly/yearly selector, comparison periods, chart legends, heatmap scale, and active filter summary",
            "Use generic departments if necessary and avoid exposing sensitive demand patterns externally.",
        ),
    )

    # 15
    add_chapter(doc, 15, "Login Audit", "Review authentication successes, failures, logout events, roles, IP addresses, and session evidence.")
    add_procedure(
        doc,
        "15.1 Filter Login Events",
        "Locate authentication activity by identity, role, result, or period.",
        [
            "Open Audit Logs > Login Audit.",
            "Search by name, email, or IP address.",
            "Filter by Role.",
            "Filter by Successful Login, Failed Login, or Logged Out.",
            "Choose All Dates, Today, Last 7 Days, Last 30 Days, or Custom Range.",
            "Use Reset to clear active filters.",
        ],
        "The summary and event table update to match the filters.",
        screenshot=(
            "Login Audit Filters and Summary",
            "Login Audit with Failed Login and Last 7 Days selected",
            "the toolbar and all summary cards",
            "search, role/status/date filters, Reset, Total Records, Successful, Failed Logins, and Unique Users",
            "Use synthetic events or blur names, emails, IP addresses, and timestamps.",
        ),
    )
    add_procedure(
        doc,
        "15.2 Review Login Forensics",
        "Inspect the technical evidence associated with an authentication event.",
        [
            "Select or expand a login-audit row.",
            "Review User Details, Access Role, Date & Time, IP Address, and Result.",
            "Review expanded Authentication Audit Forensics, including user ID when present, source IP, event, status, and user agent.",
            "Use Copy IP only for authorized investigation.",
            "Compare suspicious events with staff status and transaction activity.",
        ],
        "The administrator has sufficient evidence to identify expected or suspicious authentication activity.",
        screenshot=(
            "Expanded Login Audit Record",
            "Login Audit and expand a synthetic failed-login row",
            "the selected row and complete expanded forensic panel",
            "unknown/known identity behavior, role, timestamp, masked IP, event result, status, and user agent",
            "Mask most of the IP address, email, user ID, and user-agent details unless the screenshot remains in a restricted incident file.",
        ),
    )
    add_procedure(
        doc,
        "15.3 Print the Login Audit Ledger",
        "Create an official filtered authentication ledger.",
        [
            "Apply the required login-audit filters.",
            "Select Print Ledger.",
            "Review the print preview, date scope, role/status filters, summary, and event rows.",
            "Print or save as PDF according to records policy.",
        ],
        "A print-formatted ledger is produced for the current filtered scope.",
        screenshot=(
            "Login Audit Print Ledger",
            "Login Audit with a controlled filter set and select Print Ledger",
            "the browser print preview or printable ledger page",
            "institution heading, date printed, date scope, role/status filters, summary, and ledger columns",
            "Use synthetic events or redact user accounts, emails, IP addresses, and session-status text.",
        ),
    )

    # 16
    add_chapter(doc, 16, "Transaction Audit", "Review recorded business transactions, stock movements, configuration changes, and administrative activity.")
    add_procedure(
        doc,
        "16.1 Filter Transaction Events",
        "Locate activity by user, action, reference, item, module, action type, or period.",
        [
            "Open Audit Logs > Transaction Audit.",
            "Search by user, action, RIS number, reference, or item name.",
            "Filter by Module and Action.",
            "Choose All Dates, Today, Last 7 Days, Last 30 Days, or Custom Range.",
            "Select Reset to remove filters.",
        ],
        "The summary and table show matching transaction events.",
        screenshot=(
            "Transaction Audit Filters and Summary",
            "Transaction Audit with one module, one action, and a custom test period selected",
            "the toolbar and summary cards",
            "search, Module, Action, Date, Reset, Total Records, Verified Actions, Flagged Entries, and Modules Represented",
            "Use synthetic activity and blur users, references, item names, and timestamps.",
        ),
    )
    add_procedure(
        doc,
        "16.2 Review Expanded Transaction Details",
        "Inspect the actor, action, module, result, timestamp, grouped events, and metadata.",
        [
            "Select a transaction row or its expand arrow.",
            "Review User, Role, Activity, Module, Result, and Date & Time.",
            "Review secondary text and any grouped child-event count.",
            "Inspect expanded metadata, resource identifiers, request context, and child events.",
            "Compare the event with the related record before escalating an exception.",
        ],
        "The administrator can trace a business or administrative change to its actor and context.",
        screenshot=(
            "Expanded Transaction Audit Record",
            "Transaction Audit and expand a synthetic setting or inventory change",
            "the selected row and complete expanded details",
            "user/role, action, module, verified/flagged result, time, resource metadata, and child events",
            "Mask user identity, IP address, record IDs, old/new values, and any sensitive metadata.",
        ),
    )
    add_procedure(
        doc,
        "16.3 Print the Transaction Audit Ledger",
        "Create an official filtered activity ledger.",
        [
            "Apply the required search and filters.",
            "Select Print Ledger.",
            "Review the filter scope, summary, and transaction rows in print preview.",
            "Print or save as PDF under records policy.",
        ],
        "A print-formatted transaction ledger is produced for the active filters.",
        screenshot=(
            "Transaction Audit Print Ledger",
            "Transaction Audit with a controlled filter set and select Print Ledger",
            "the printable ledger page or browser print preview",
            "institution heading, filter scope, summary, user, activity, module, result, date/time, and footer",
            "Redact users, record references, metadata, and internal operational details.",
        ),
    )

    # 17
    add_chapter(doc, 17, "Roles and Permissions", "Create and maintain custom roles while preserving protected system roles.")
    add_procedure(
        doc,
        "17.1 Search and Review Roles",
        "Inspect role assignments and permission coverage.",
        [
            "Open Access Control > Roles & Permissions.",
            "Search by role name.",
            "Open a role to review permissions grouped by module.",
            "Confirm whether the role is a protected system role or a custom role.",
        ],
        "The role's effective permission selection is visible.",
        screenshot=(
            "Roles and Permissions Registry",
            "Access Control > Roles & Permissions",
            "the role search, role list/cards, protected indicators, assignment counts if shown, and Create Role",
            "system roles, custom roles, edit actions, and protected state",
            "Use generic custom-role names if the deployed role model is sensitive.",
        ),
    )
    add_procedure(
        doc,
        "17.2 Create a Custom Role",
        "Define a least-privilege role for an institutional responsibility.",
        [
            "Select Create Role.",
            "Enter a clear role name.",
            "Search permissions or expand each module group.",
            "Select only the required permissions.",
            "Use Select All within a module only when the job requires the complete module.",
            "Review Inventory, Receiving, Issuance, Requests, RFID, Suppliers, Compliance, Audit Logs, Access Control, and System permissions.",
            "Save the role.",
        ],
        "The custom role becomes available for staff assignment.",
        notes="Apply least privilege. Avoid duplicating a protected role under a different name merely to grant broad access.",
        screenshot=(
            "Create Custom Role",
            "Roles & Permissions and select Create Role",
            "the full role editor with at least two permission groups expanded",
            "role name, permission search, module groups, Select All, individual checkboxes, and save/cancel controls",
            "Use a demonstration role and do not reveal sensitive permission architecture outside the administrative audience.",
        ),
    )
    add_procedure(
        doc,
        "17.3 Edit or Delete a Custom Role",
        "Update permission coverage or remove an unused custom role.",
        [
            "Open the custom role.",
            "To edit, change the role name or permissions and save.",
            "Review affected staff assignments after any permission reduction.",
            "To delete, confirm that no staff are assigned.",
            "Select Delete and confirm the warning.",
        ],
        "The custom role is updated, or it is deleted when no assignments prevent removal.",
        notes="Protected system roles cannot be deleted. A role assigned to staff must be unassigned before deletion.",
        screenshot=(
            "Custom Role Edit and Delete Controls",
            "an unused demonstration custom role",
            "the edit screen or details panel showing save and delete controls",
            "permission changes, protected/custom indicator, assignment constraint, Delete, and confirmation warning",
            "Use a disposable test role with no staff assignments.",
        ),
    )

    # 18
    add_chapter(doc, 18, "Staff Accounts", "Provision, invite, update, enable, and disable institutional staff access.")
    add_procedure(
        doc,
        "18.1 Search and Filter Staff",
        "Locate staff by identity, department, office head, or account state.",
        [
            "Open Access Control > Staff Accounts.",
            "Search staff name, department, or office head.",
            "Filter Active or Disabled.",
            "Open the staff record.",
        ],
        "The matching staff account details and available actions are displayed.",
        screenshot=(
            "Staff Accounts Registry",
            "Access Control > Staff Accounts with active and disabled demonstration users",
            "the search/status filter, staff list, role/unit/head information, and Add Staff",
            "name, masked email, role, delivery unit, office head, status, invitation action, and row actions",
            "Use test accounts or blur all names, emails, departments, and office-head information.",
        ),
    )
    add_procedure(
        doc,
        "18.2 Add Staff and Send an Invitation",
        "Provision a disabled account and send an activation invitation.",
        [
            "Select Add Staff.",
            "Enter Full Name and Email.",
            "Select the Role.",
            "If required, select the Delivery Unit and Office Head.",
            "Review the read-only Office-Head Designation.",
            "Save the staff account.",
            "Confirm that the new account is Disabled/Pending Activation and that an invitation email was sent.",
        ],
        "A disabled staff account is created and the invitation workflow begins.",
        notes="Supply Coordinator requires a delivery unit and an active office head with a designation. Only authorized System Administrators should assign the protected System Administrator role.",
        screenshot=(
            "Add Staff Account",
            "Staff Accounts and select Add Staff",
            "the complete staff form with a demonstration non-admin role",
            "full name, email, role, delivery unit, office head, read-only designation, activation behavior, and save action",
            "Use a test mailbox and fictional identity.",
        ),
    )
    add_procedure(
        doc,
        "18.3 Resend an Invitation",
        "Issue a new activation link to a still-disabled invited user.",
        [
            "Locate the disabled staff account.",
            "Select Resend Invitation.",
            "Confirm the destination email and action.",
            "Tell the recipient to use only the newest email.",
        ],
        "A new invitation email is sent and older/expired links remain unusable according to token rules.",
        screenshot=(
            "Resend Staff Invitation",
            "a disabled demonstration staff record and select Resend Invitation",
            "the confirmation dialog and masked destination email",
            "staff identity, current disabled state, destination, cancel, and resend control",
            "Mask the email address and never capture the invitation link.",
        ),
    )
    add_procedure(
        doc,
        "18.4 Edit Staff Assignment",
        "Update identity, email, role, delivery unit, or office-head assignment.",
        [
            "Open the staff record and select Edit.",
            "Update Full Name or Email only after identity verification.",
            "Change Role according to approved access.",
            "Update Delivery Unit and Office Head when required.",
            "Review the read-only designation and save.",
            "Verify resulting access in Roles & Permissions and audit logs.",
        ],
        "The staff profile and authorization context are updated.",
        notes="Role changes take effect according to session and permission behavior. Coordinate high-privilege changes and review active sessions.",
        screenshot=(
            "Edit Staff Account",
            "a demonstration staff account and select Edit",
            "the editable account form",
            "identity, masked email, role, delivery unit, office head, designation, status context, and save/cancel controls",
            "Blur all personal data and use a test account.",
        ),
    )
    add_procedure(
        doc,
        "18.5 Enable or Disable an Account",
        "Control whether a staff member may authenticate.",
        [
            "Open the staff account.",
            "Select Enable Account or Disable Account.",
            "Review the impact and confirm the authorized action.",
            "For a disabled account, verify that sessions/tokens are revoked.",
            "Review Login Audit and Transaction Audit when the action is security-related.",
        ],
        "The account state changes immediately; disabling prevents access and revokes sessions/tokens.",
        notes="You cannot disable your own account. Confirm that another authorized administrator remains available before changing high-privilege access.",
        screenshot=(
            "Disable Account Confirmation",
            "an active demonstration staff account and select Disable Account",
            "the full confirmation dialog",
            "staff identity, session-revocation warning, cancel, and disable control",
            "Use a disposable test account and blur identity information.",
        ),
    )

    # 19
    add_chapter(doc, 19, "System Settings", "Configure institution-wide defaults and operational controls. Changes are applied through the global Save Settings action.")
    add_callout(
        doc,
        "GLOBAL SAVE AND RESET",
        "System Settings uses shared Save Settings and Reset controls. Unsaved-change warnings protect edits when navigating away. "
        "Review every changed tab before saving, because settings can affect documents, thresholds, notifications, RFID devices, and sessions.",
        fill=PALE_AMBER,
        title_color=MAROON,
    )
    add_procedure(
        doc,
        "19.1 Institution and Branding",
        "Set the institution identity printed or displayed throughout SupplySync.",
        [
            "Open System Settings > Institution and Branding.",
            "Enter Institution Name, Default Fund Cluster, Acronym, Custodial Office, Campus/Postal Address, and Responsibility Center Code.",
            "Enter or update the Logo Path according to deployment file conventions.",
            "Review the preview or displayed branding.",
            "Select Save Settings.",
        ],
        "Institutional identity and applicable document defaults are updated.",
        screenshot=(
            "Institution and Branding Settings",
            "System Settings and select Institution and Branding",
            "the full settings panel and global action bar",
            "institution name, fund cluster, acronym, custodial office, address, responsibility center, logo path, Save Settings, and Reset",
            "Use approved public institutional information; blur internal paths if they reveal server structure.",
        ),
    )
    add_procedure(
        doc,
        "19.2 Consumable Signatories",
        "Configure names and designations used on official inventory and compliance forms.",
        [
            "Open Consumable Signatories.",
            "Set RIS Approving Officer/Designation and RIS Issuing Custodian/Designation.",
            "Configure the OIC toggle and prefix when applicable.",
            "Set RSMI Certified By and Posted By.",
            "Set RPCI Accountable Officer/Designation, Certified By, and Verified By/Designation.",
            "Set MOR/MR Issuing Custodian/Designation and Appendix Number.",
            "Add or remove signatory-directory entries as authorized.",
            "Save settings and preview an affected form.",
        ],
        "Newly generated official forms use the configured signatory information.",
        notes="Changing signatories does not retroactively rewrite stored document snapshots unless the system explicitly regenerates a form.",
        screenshot=(
            "Consumable Signatory Settings",
            "System Settings > Consumable Signatories with demonstration names",
            "the full signatory panel, including directory controls",
            "RIS, RSMI, RPCI, MOR/MR fields, OIC controls, appendix number, add/delete entry, and Save Settings",
            "Use fictional names or blur real officer names and designations if the document is not restricted.",
        ),
    )
    add_procedure(
        doc,
        "19.3 Stock and Reorder Rules",
        "Define low/critical thresholds, strict stock behavior, and allowed units of issue.",
        [
            "Open Stock and Reorder Rules.",
            "Enter the Low-Stock Threshold.",
            "Enter the Critical-Stock Threshold.",
            "Enable or disable Strict Stock Enforcement according to approved policy.",
            "Add required Units of Issue and remove obsolete units only after checking item usage.",
            "Save settings.",
        ],
        "Stock status and quantity validation follow the saved rules.",
        notes="Critical-stock threshold cannot exceed the low-stock threshold. Strict stock enforcement can block approval or issuance quantities above available stock.",
        screenshot=(
            "Stock and Reorder Rules",
            "System Settings > Stock and Reorder Rules",
            "the complete settings panel",
            "low-stock threshold, critical threshold, strict stock enforcement, units list, add/remove controls, validation, and Save Settings",
            "Use safe demonstration thresholds and do not change production values solely for the screenshot.",
        ),
    )
    add_procedure(
        doc,
        "19.4 Document Sequences",
        "Review the formats and previews used for official document numbering.",
        [
            "Open Document Sequences.",
            "Review the read-only formats and previews for RIS, RSMI, RPCI, Stock Card, and MOR/MR.",
            "Confirm that the preview reflects year-first numbering.",
            "Create a controlled test document only when sequence behavior must be validated.",
        ],
        "The administrator understands the active system-generated formats.",
        notes="The final number is reserved when the document is created, not when a preview is generated.",
        screenshot=(
            "Document Sequence Previews",
            "System Settings > Document Sequences",
            "the complete read-only format and preview list",
            "RIS, RSMI, RPCI, Stock Card, MOR/MR formats and year-first examples",
            "Use examples generated by the interface; mask live next numbers if sequence confidentiality is required.",
        ),
    )
    add_procedure(
        doc,
        "19.5 Register an RFID Scanner",
        "Create a scanner/station identity and obtain its one-time connection secret.",
        [
            "Open RFID and Bin Storage.",
            "Select Register Scanner.",
            "Enter the Station ID and Device Name.",
            "Save the scanner registration.",
            "Copy the one-time token immediately to the approved secure configuration channel.",
            "Close the token display only after confirming secure receipt.",
        ],
        "The scanner is registered and a one-time token is issued.",
        notes="The secret may be shown only once. Never place it in screenshots, manuals, tickets, chat messages, or unsecured files.",
        screenshot=(
            "Register RFID Scanner",
            "System Settings > RFID and Bin Storage and open Register Scanner before submission",
            "the registration dialog without generating a real token",
            "Station ID, Device Name, explanatory text, cancel, and register control",
            "Do not capture the one-time token. If a post-registration screen is required, fully obscure the secret before capturing.",
        ),
    )
    add_procedure(
        doc,
        "19.6 Configure and Diagnose an RFID Scanner",
        "Manage device connectivity, network configuration, scan behavior, and server access.",
        [
            "Select the registered scanner.",
            "Review status, firmware, last seen, IP address, configuration versions, diagnostics, and queue state.",
            "Set Station ID and Device Name as needed.",
            "Scan nearby Wi-Fi networks, select a network or enter a manual SSID, and provide the password unless it is an open network.",
            "Set Server URL.",
            "Choose Single Scan or Inventory Scan mode.",
            "Set RF Power, Timeout, Heartbeat Interval, and Auto Reconnect.",
            "Select Save/Apply, then Test Connection.",
            "Use Rotate Secret, Enable/Disable Server Access, or Revoke Scanner only with coordinated hardware support.",
        ],
        "The device receives the saved configuration and reports an updated connectivity/diagnostic state.",
        notes="Rotating the secret or revoking the scanner can interrupt service. Record the change and coordinate physical device reconfiguration.",
        screenshot=(
            "RFID Scanner Configuration and Diagnostics",
            "System Settings > RFID and Bin Storage with a demonstration scanner selected",
            "the device summary, diagnostics, and configuration controls, excluding secret values",
            "status, firmware, last seen, masked IP, queue, Wi-Fi selector, server URL, mode, RF power, timeout, heartbeat, auto reconnect, Test Connection, and access controls",
            "Fully blur SSID if sensitive, Wi-Fi password, server URL, IP address, device secret/token, and internal configuration identifiers.",
        ),
    )
    add_procedure(
        doc,
        "19.7 Email and Notifications",
        "Configure low-stock alert delivery and verify outbound email.",
        [
            "Open Email and Notifications.",
            "Enable or disable Low-Stock Warning Emails.",
            "Enter the Recipient Email.",
            "Save settings.",
            "Select Send Diagnostic Test Email.",
            "Confirm receipt and review any error notification.",
        ],
        "Low-stock notifications use the configured state and recipient; the diagnostic confirms mail delivery.",
        screenshot=(
            "Email and Notification Settings",
            "System Settings > Email and Notifications",
            "the entire settings panel",
            "low-stock email toggle, recipient field, Save Settings, and Send Diagnostic Test Email",
            "Use a test mailbox or blur the recipient address. Do not expose mail server credentials or diagnostic internals.",
        ),
    )
    add_procedure(
        doc,
        "19.8 Operations and Telemetry",
        "Set inactivity logout and review/download the active runtime policy snapshot.",
        [
            "Open Operations and Telemetry.",
            "Set Session Inactivity Logout between 5 and 480 minutes.",
            "Review PHP version, Laravel version, database driver, operating mode, and server node.",
            "Select Download Policy Snapshot JSON when an authorized configuration record is required.",
            "Save settings if the inactivity value changed.",
        ],
        "The session timeout follows the saved value and the runtime/policy information is available for diagnostics.",
        notes="Policy snapshots and runtime data can disclose infrastructure information. Store them only in approved administrative locations.",
        screenshot=(
            "Operations and Telemetry",
            "System Settings > Operations and Telemetry",
            "the complete settings/runtime panel",
            "inactivity range, policy snapshot action, PHP, Laravel, database driver, operating mode, server node, and Save Settings",
            "Blur the server node and any infrastructure-specific identifiers.",
        ),
    )

    # 20
    add_chapter(doc, 20, "Account Settings", "Maintain the signed-in administrator's identity, password, theme, sessions, and login history.")
    add_procedure(
        doc,
        "20.1 Update Profile",
        "Correct the administrator's legal name or institutional email.",
        [
            "Open Account Settings > Profile.",
            "Update Full Legal Name and Institutional Email.",
            "Review read-only Department and Role.",
            "Save the profile.",
        ],
        "The profile shows the updated identity while department and role remain centrally managed.",
        screenshot=(
            "Account Profile Settings",
            "Account Settings > Profile",
            "the complete profile panel",
            "full legal name, masked institutional email, read-only department/role, and save control",
            "Use a test account or blur all personal information.",
        ),
    )
    add_procedure(
        doc,
        "20.2 Change Password with Email OTP",
        "Replace the current password using a six-digit verification code.",
        [
            "Open Password/Security.",
            "Enter Current Password.",
            "Enter New Password and Confirmation.",
            "Request or wait for the six-digit email OTP.",
            "Enter the OTP.",
            "Use Resend OTP only when the previous code did not arrive or expired.",
            "Submit the password change and wait for the completion state.",
        ],
        "The password changes only after current-password and OTP validation succeeds.",
        notes="Never capture or share current/new passwords or OTP values. Confirm the email channel is secure before beginning.",
        screenshot=(
            "Password and OTP Security",
            "Account Settings > Password/Security before entering any secrets",
            "the full password-change workflow with all sensitive fields empty",
            "current password, new/confirmation fields, OTP section, Resend OTP, and submit control",
            "All password and OTP fields must be empty. Blur the destination email.",
        ),
    )
    add_procedure(
        doc,
        "20.3 Review Sessions and Login History",
        "Identify unexpected access associated with the administrator account.",
        [
            "Open Account Security.",
            "Review Active Sessions, devices, times, and available session actions.",
            "Review Login History.",
            "If an event is unfamiliar, change the password and review Login Audit.",
            "Sign out from unneeded sessions when the interface provides the action.",
        ],
        "The administrator confirms expected access or begins an incident response.",
        screenshot=(
            "Account Sessions and Login History",
            "Account Settings > Account Security using a test account",
            "the active sessions and login-history panels",
            "device/session labels, masked location/IP, timestamps, status, and session action",
            "Mask IP addresses, locations, device fingerprints, email addresses, and session identifiers.",
        ),
    )

    # 21
    add_chapter(doc, 21, "Security and Operating Practices", "Use these controls to keep administration consistent, auditable, and recoverable.")
    doc.add_heading("21.1 Daily Checklist", level=2)
    add_bullets(
        doc,
        [
            "Confirm Database Connection, Email Configuration, Operating Mode, Failed Jobs, Free Storage, and Backup Status on the dashboard.",
            "Review critical/out-of-stock items and urgent requisitions.",
            "Review recent receiving and issuance for obvious anomalies.",
            "Review failed login counts and flagged transaction entries.",
            "Return the system from Maintenance Mode when approved maintenance is complete.",
        ],
    )
    doc.add_heading("21.2 Weekly Checklist", level=2)
    add_bullets(
        doc,
        [
            "Review disabled staff, pending invitations, protected-role assignments, and unused custom roles.",
            "Confirm low/critical stock thresholds, alert delivery, supplier statuses, and RFID scanner connectivity.",
            "Review compliance report generation and historical migration activity.",
            "Save or print filtered audit ledgers when required by policy.",
        ],
    )
    doc.add_heading("21.3 Monthly or Release Checklist", level=2)
    add_bullets(
        doc,
        [
            "Review all System Settings tabs and validate signatories, fund cluster, document previews, session timeout, and runtime details.",
            "Review active permission design against current duties and least-privilege requirements.",
            "Test password recovery, invitation mail, diagnostic email, and a non-production RFID connection where permitted.",
            "Update this manual when labels, workflows, fields, roles, permissions, or report formats change.",
        ],
    )
    doc.add_heading("21.4 Screenshot Capture Standard", level=2)
    add_bullets(
        doc,
        [
            "Recommended capture size: 1440 × 900 or larger, browser zoom 100%, Light theme, sidebar expanded unless the instruction says otherwise.",
            "Use demonstration data designed to show the function and its validation state.",
            "Capture the page title and enough navigation context to identify the location.",
            "Do not crop out warning messages, disabled states, required-field markers, confirmation text, or primary action buttons.",
            "Blur passwords, OTPs, invitation/reset URLs, one-time tokens, RFID IDs, Wi-Fi credentials, server URLs, IP addresses, personal data, signatures, and confidential documents.",
            "Add arrows or rectangles after capture; do not edit values inside the application solely to create a misleading image.",
            "Save files using the ID in each blue Screenshot Direction box, for example SS-01_Administrative_Sign-In_Page.png.",
        ],
    )
    add_screenshot_direction(
        doc,
        "Screenshot Style Reference",
        "Dashboard in Light theme at 100% browser zoom with the sidebar expanded and only demonstration data visible",
        "one clean full-window example that will be used as the style reference for later captures",
        "page title, active sidebar item, top controls, complete primary workspace, consistent margins, and readable text",
        "Confirm that every visible name, email, reference, IP address, and operational value is synthetic or properly blurred.",
    )

    # 22
    add_chapter(doc, 22, "Troubleshooting", "Use the visible message, current status, and audit evidence before changing data or configuration.")
    add_simple_table(
        doc,
        ["Issue", "Checks and Corrective Action"],
        [
            ("Cannot sign in", "Verify email spelling, Active account status, password, system mode, and failed events in Login Audit. Use password recovery or resend invitation as appropriate."),
            ("Reset/invitation email not received", "Confirm the account email, Email Configuration dashboard status, spam folder, recipient settings, and Send Diagnostic Test Email. Resend only after verifying the address."),
            ("Settings will not save", "Review required fields and validation messages, confirm thresholds and numeric ranges, and check Transaction Audit for a rejected action."),
            ("Release blocked", "Review request status, supporting-document verification, authorized quantities, available stock, signed RIS confirmation, and Strict Stock Enforcement."),
            ("Stock seems incorrect", "Review item receiving batches, issuance history, manual issuance, released requests, receiving updates, and related transaction audit events."),
            ("RFID will not connect", "Check scanner selection, enabled server access, last seen, IP/network, server URL, queue, Test Connection, token rotation history, and physical power/network state."),
            ("RFID tag conflict", "Open the linked existing item and verify the physical tag before replacing or unassigning."),
            ("Report preview is empty", "Verify report type, period, Target Item for Stock Card, Accountable Officer for MR, supplier filter for RPCI, and existence of source transactions."),
            ("Report PDF fails", "Use Print Form and browser Save as PDF; confirm orientation and browser print permissions."),
            ("Migration has invalid rows", "Review field mappings and row errors, correct the source file, preserve headers/tables, and upload again. Invalid/duplicate rows are skipped."),
            ("Analytics does not match expectation", "Confirm all active date, department, category, item, and status filters. Wait until chart updates finish and compare the defined selected/previous periods."),
            ("Unexpected session logout", "Review the 5–480 minute inactivity setting, account state, mode changes, and login history."),
        ],
        widths=[1.65, 5.3],
    )
    add_callout(
        doc,
        "ESCALATION PACKAGE",
        "When escalating a problem, record the page, time, user role, operating mode, action attempted, exact message, relevant reference, and a privacy-safe screenshot. "
        "Include a filtered audit record or policy snapshot only when authorized. Never include passwords, OTPs, reset/invitation links, RFID secrets, or Wi-Fi credentials.",
        fill=PALE_AMBER,
        title_color=MAROON,
    )

    # Appendices
    add_chapter(doc, "A", "Status and Control Glossary")
    add_simple_table(
        doc,
        ["Term", "Definition"],
        [
            ("Available Stock", "Current quantity available for issue after recorded stock movements."),
            ("Authorized Quantity", "Quantity approved for issue; it may be lower than the requested quantity."),
            ("Critical Stock", "Stock at or below the configured critical threshold."),
            ("Low Stock", "Stock at or below the configured low threshold but not necessarily critical."),
            ("Out of Stock", "No available quantity remains."),
            ("Strict Stock Enforcement", "Policy that blocks quantities above available stock in applicable workflows."),
            ("RIS", "Requisition and Issue Slip."),
            ("RSMI", "Report of Supplies and Materials Issued."),
            ("RPCI", "Report on the Physical Count of Inventories."),
            ("Stock Card", "Item-level chronological receipt, issue, and running-balance record."),
            ("MR / MOR", "Memorandum Receipt terminology used by the compliance form/settings context."),
            ("Protected System Role", "Built-in role that cannot be deleted and may have assignment restrictions."),
            ("One-Time Scanner Token", "Secret shown during scanner registration and used to establish device trust."),
            ("Policy Snapshot", "Downloaded JSON representation of current applicable policy/configuration."),
        ],
        widths=[1.75, 5.2],
    )

    add_chapter(doc, "B", "Screenshot Capture Checklist")
    add_callout(
        doc,
        "FILE NAMING",
        "Use the screenshot ID followed by a short title, for example SS-13_Approval_Workspace_Quantity_Review.png. "
        "Keep a separate editable source copy if arrows or redaction boxes are added.",
        fill=PALE_GREEN,
        title_color=BLUE_GRAY,
    )
    add_simple_table(
        doc,
        ["ID", "Screenshot", "Capture Direction"],
        [(sid, title, instruction) for sid, title, instruction in SCREENSHOTS],
        widths=[0.62, 1.65, 4.68],
    )

    add_chapter(doc, "C", "Administrator Handover Record")
    doc.add_paragraph(
        "Use this page when responsibility for SupplySync administration changes. Keep the completed record in an approved administrative repository."
    )
    add_simple_table(
        doc,
        ["Handover Item", "Completion / Notes"],
        [
            ("Outgoing administrator", ""),
            ("Incoming administrator", ""),
            ("Effective date and time", ""),
            ("System mode confirmed", ""),
            ("Protected-role assignments reviewed", ""),
            ("Pending invitations and disabled accounts reviewed", ""),
            ("Email diagnostics confirmed", ""),
            ("RFID scanner status and secret custody reviewed", ""),
            ("Backup/storage/failed jobs reviewed", ""),
            ("Open requisitions and critical stock reviewed", ""),
            ("Audit review completed", ""),
            ("Manual/version and outstanding issues handed over", ""),
        ],
        widths=[2.55, 4.4],
    )
    add_callout(
        doc,
        "FINAL CONTROL",
        "Do not write passwords, OTPs, reset/invitation links, scanner secrets, or Wi-Fi credentials in this handover record. "
        "Transfer secrets only through the institution's approved secure credential process.",
        fill=PALE_AMBER,
        title_color=MAROON,
    )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT)
    print(f"Created {OUTPUT}")
    print(f"Screenshot directions: {len(SCREENSHOTS)}")


if __name__ == "__main__":
    from build_supplysync_system_admin_manual_v11 import build_corrected_manual

    build_corrected_manual()
