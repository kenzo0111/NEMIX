"""Build NEMIX manuals from verified routes and user-supplied screenshots.

Run: python docs/manuals/build_manuals.py
"""

from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
    TableStyle, KeepTogether, Flowable, PageBreak,
)
from reportlab.lib.utils import ImageReader
from PIL import Image as PILImage


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)
MAROON = colors.HexColor("#702335")
INK = colors.HexColor("#172232")
MUTED = colors.HexColor("#586579")
PALE = colors.HexColor("#f4f6f9")
LINE = colors.HexColor("#d8dee7")
GOLD = colors.HexColor("#d5a94a")
WHITE = colors.white

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleX", fontName="Helvetica-Bold", fontSize=28, leading=32, textColor=MAROON, spaceAfter=15))
styles.add(ParagraphStyle(name="SubX", fontName="Helvetica", fontSize=12, leading=17, textColor=MUTED, spaceAfter=15))
styles.add(ParagraphStyle(name="H1X", fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=MAROON, spaceBefore=12, spaceAfter=9))
styles.add(ParagraphStyle(name="H2X", fontName="Helvetica-Bold", fontSize=11, leading=15, textColor=INK, spaceBefore=9, spaceAfter=5))
styles.add(ParagraphStyle(name="BodyX", fontName="Helvetica", fontSize=9.2, leading=13.6, textColor=INK, spaceAfter=6))
styles.add(ParagraphStyle(name="SmallX", fontName="Helvetica", fontSize=8, leading=11.5, textColor=MUTED, spaceAfter=5))
styles.add(ParagraphStyle(name="StepX", fontName="Helvetica", fontSize=9.2, leading=14, textColor=INK, leftIndent=18, firstLineIndent=-16, spaceAfter=5))
styles.add(ParagraphStyle(name="NoteX", fontName="Helvetica", fontSize=8.8, leading=12.5, textColor=MAROON, backColor=colors.HexColor("#fbf4f5"), borderPadding=8, spaceBefore=6, spaceAfter=9))
styles.add(ParagraphStyle(name="TableX", fontName="Helvetica", fontSize=8, leading=10.5, textColor=INK))
styles.add(ParagraphStyle(name="TableHeadX", fontName="Helvetica-Bold", fontSize=8, leading=10.5, textColor=WHITE))


class ManualDoc(BaseDocTemplate):
    def __init__(self, filename, title):
        super().__init__(str(filename), pagesize=(595.28, 841.89), leftMargin=49, rightMargin=49, topMargin=63, bottomMargin=53, title=title, author="NEMIX project documentation")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id="normal", frames=[frame], onPage=self.decorate))

    def decorate(self, canv, doc):
        canv.saveState()
        w, h = doc.pagesize
        canv.setFillColor(MAROON)
        canv.rect(0, h - 7, w, 7, fill=1, stroke=0)
        canv.setFont("Helvetica-Bold", 8)
        canv.setFillColor(MAROON)
        canv.drawString(49, h - 36, "NEMIX  |  UNIVERSITY INVENTORY SYSTEM")
        canv.setStrokeColor(LINE)
        canv.line(49, 43, w - 49, 43)
        canv.setFont("Helvetica", 8)
        canv.setFillColor(MUTED)
        canv.drawString(49, 29, "Documentation based on repository interface and routes | 03 Oct 2026")
        canv.drawRightString(w - 49, 29, f"{doc.page}")
        canv.restoreState()


class UISketch(Flowable):
    """Vector image of a screen section with numbered function callouts."""
    def __init__(self, title, rows, width=497, height=185):
        super().__init__()
        self.title, self.rows, self.width, self.height = title, rows, width, height

    def draw(self):
        c = self.canv
        W, H = self.width, self.height
        c.setStrokeColor(LINE); c.setFillColor(WHITE)
        c.roundRect(0, 0, W, H, 8, stroke=1, fill=1)
        c.setFillColor(MAROON); c.roundRect(0, H-34, W, 34, 8, stroke=0, fill=1)
        c.rect(0, H-34, W, 16, stroke=0, fill=1)
        c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 11)
        c.drawString(14, H-22, self.title)
        row_h = (H-44)/max(1,len(self.rows))
        for i, (label, detail) in enumerate(self.rows, 1):
            y = H-39 - i*row_h
            c.setFillColor(PALE if i%2 else WHITE)
            c.rect(8, y+3, W-16, row_h-3, stroke=0, fill=1)
            c.setFillColor(GOLD); c.circle(25, y+row_h/2+2, 10, stroke=0, fill=1)
            c.setFillColor(INK); c.setFont("Helvetica-Bold", 9)
            c.drawCentredString(25, y+row_h/2-1, str(i))
            c.setFillColor(INK); c.setFont("Helvetica-Bold", 9)
            c.drawString(44, y+row_h/2+1, label)
            c.setFillColor(MUTED); c.setFont("Helvetica", 8)
            c.drawRightString(W-16, y+row_h/2+1, detail)


class Screenshot(Flowable):
    """Cropped source screenshot with numbered arrows to original pixel positions."""
    def __init__(self, name, crop, markers, width=497):
        super().__init__()
        self.path = ROOT / "docs" / "manuals" / "screenshots" / name
        self.crop = crop
        self.markers = markers
        self.width = width
        l,t,r,b = crop
        self.height = width * (b-t) / (r-l)

    def draw(self):
        c = self.canv
        l,t,r,b = self.crop
        with PILImage.open(self.path) as original:
            clipped = original.crop((l,t,r,b)).convert("RGB")
            c.drawImage(ImageReader(clipped), 0, 0, self.width, self.height)
        scale = self.width / (r-l)
        c.setStrokeColor(LINE)
        c.rect(0,0,self.width,self.height,stroke=1,fill=0)
        import math
        for n,x,y in self.markers:
            px,py=(x-l)*scale,(b-y)*scale
            dx = -34 if px > self.width*0.25 else 34
            dy = 29 if n % 2 else -29
            if not 17 < py+dy < self.height-17:
                dy = -dy
            if not 17 < px+dx < self.width-17:
                dx = -dx
            bx,by = px+dx,py+dy
            length = math.hypot(px-bx,py-by)
            ux,uy = (px-bx)/length,(py-by)/length
            sx,sy = bx+ux*12,by+uy*12
            c.setStrokeColor(INK); c.setLineWidth(4.2)
            c.line(sx,sy,px,py)
            c.setStrokeColor(GOLD); c.setLineWidth(2.2)
            c.line(sx,sy,px,py)
            tip=c.beginPath()
            tip.moveTo(px,py)
            tip.lineTo(px-ux*9-uy*4.5,py-uy*9+ux*4.5)
            tip.lineTo(px-ux*9+uy*4.5,py-uy*9-ux*4.5)
            tip.close()
            c.setFillColor(GOLD); c.drawPath(tip,fill=1,stroke=0)
            c.setFillColor(GOLD); c.setStrokeColor(WHITE); c.setLineWidth(1.5)
            c.circle(bx,by,11,stroke=1,fill=1)
            c.setFillColor(INK); c.setFont("Helvetica-Bold",8)
            c.drawCentredString(bx,by-3,str(n))


class Architecture(Flowable):
    def __init__(self, width=497, height=285):
        super().__init__(); self.width=width; self.height=height

    def draw(self):
        c=self.canv
        def box(x,y,w,h,label,sub,fill=PALE):
            c.setFillColor(fill); c.setStrokeColor(LINE); c.roundRect(x,y,w,h,7,fill=1,stroke=1)
            c.setFillColor(INK); c.setFont("Helvetica-Bold",9); c.drawCentredString(x+w/2,y+h/2+3,label)
            c.setFillColor(MUTED); c.setFont("Helvetica",7.5); c.drawCentredString(x+w/2,y+h/2-10,sub)
        def arrow(x1,y1,x2,y2):
            c.setStrokeColor(MAROON); c.setLineWidth(1.7); c.line(x1,y1,x2,y2)
            import math
            a=math.atan2(y2-y1,x2-x1)
            p=c.beginPath(); p.moveTo(x2,y2)
            for d in (a+2.65,a-2.65): p.lineTo(x2+7*math.cos(d),y2+7*math.sin(d))
            p.close(); c.setFillColor(MAROON); c.drawPath(p,fill=1,stroke=0)
        box(165,225,167,45,"User browser","React + Inertia")
        box(165,146,167,45,"Laravel application","routes, middleware, controllers")
        box(5,66,110,45,"Inventory","items, requests, stock")
        box(130,66,110,45,"Suppliers","supplier registry")
        box(255,66,110,45,"Compliance","reports, PDFs")
        box(380,66,110,45,"Access + Audit","roles, trails")
        box(165,0,167,39,"PostgreSQL","shared persistence")
        arrow(248,225,248,194)
        for x in (60,185,310,435): arrow(248,146,x,113)
        for x in (60,185,310,435): arrow(x,64,248,41)


def P(text, style="BodyX"):
    return Paragraph(text, styles[style])


def steps(items):
    return [P(f'<b>{i}.</b> {s}', "StepX") for i,s in enumerate(items,1)]


def table(rows, widths=None):
    data=[[P(str(cell),"TableHeadX" if i == 0 else "TableX") for cell in row] for i,row in enumerate(rows)]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),MAROON),("TEXTCOLOR",(0,0),(-1,0),WHITE),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE,PALE]),
        ("GRID",(0,0),(-1,-1),0.35,LINE),("VALIGN",(0,0),(-1,-1),"TOP"),
        ("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),
        ("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7),
    ]))
    return t


def section(title, sketch, items, note=None):
    out=[P(title,"H1X"), sketch, Spacer(1,8)]
    out += steps(items)
    if note: out.append(P(note,"NoteX"))
    return out


def make_user():
    s=[P("NEMIX User Manual","TitleX"),P("Screenshots with numbered functions and practical steps","SubX")]
    s += [P("For Supply Coordinators, Property Custodians, inventory staff and administrators. The screenshots were supplied by the user on 03 Oct 2026. Numbered arrows point to the controls described in the matching steps. Available actions depend on role permissions.","BodyX")]

    s += [P("1. Find a function from the dashboard","H1X"),Screenshot("01-dashboard.png",(0,0,1530,790),[(1,93,107),(2,97,136),(3,97,198),(4,97,224),(5,96,345),(6,1391,102)])]
    s += steps(["Select <b>Dashboard</b> for totals, stock alerts and recent activity.","Select <b>My Requests</b> to submit and track supply requisitions.","Expand <b>Inventory</b> for All Items, Receiving and Issuance.","Open <b>RFID Scanner</b> for tag assignment and scan work.","Use Suppliers, Compliance, Audit Logs, Access Control or System Settings when your role allows it.","Select <b>Manage RFID Hardware</b> to investigate the tagging alert."])

    s += [PageBreak(),P("2. Submit a supply request","H1X"),Screenshot("04-new-request.png",(565,65,1150,738),[(1,756,205),(2,742,344),(3,767,442),(4,1008,700)],width=405)]
    s += steps(["In <b>My Requests</b>, select <b>New Request</b>. Enter recipient name, date, division or office, and designation.","Choose the fund cluster and enter the purpose.","Search for each item, enter the requested quantity, and use <b>Add another item</b> as needed. Check on-hand stock.","Review the read-only authorization section, then select <b>Submit Supply Request</b>."])
    s += [P("Submitted requests appear in My Supply Requests. A Property Custodian reviews them under Inventory > Issuance.","NoteX")]

    s += [PageBreak(),P("3. Track the request and inspect the RIS","H1X"),Screenshot("02-request-details.png",(600,35,1115,765),[(1,807,130),(2,763,385),(3,825,520),(4,831,652),(5,694,730)],width=390)]
    s += steps(["Select <b>View</b> on a request row to open its official RIS details and current status.","Compare requested quantities with approved or final quantities.","Read the Property Custodian review and remarks.","For a released request, check the issue and release details.","Select <b>View / Print RIS</b> to open the official form."])

    s += [PageBreak(),P("4. Print or download the RIS","H1X"),Screenshot("03-ris-preview.png",(525,95,1195,700),[(1,826,216),(2,773,322),(3,1053,669),(4,1094,669)],width=450)]
    s += steps(["Confirm the RIS reference, recipient and form header.","Check the requisition and issue quantities before handover.","Select <b>Download PDF</b> to keep a copy.","Select <b>Print</b> for the signed paper workflow."])
    s += [P("Approval reserves quantities. Stock is deducted when the custodian confirms physical release, not when the request is first approved.","NoteX")]

    s += [PageBreak(),P("5. Search the item master","H1X"),Screenshot("05-all-items.png",(390,77,1540,720),[(1,1050,119),(2,1200,119),(3,1340,119),(4,1463,119),(5,1420,205),(6,1459,205)])]
    s += steps(["Open <b>Inventory > All Items</b> and search by name or SKU.","Filter the list by supplier.","Filter by status, including Available, Low Stock or Out of Stock.","Select <b>Add Item</b> to register an item master.","Use <b>View</b> to inspect its stock and receiving batches.","Use <b>Edit</b> to change the item identity fields, if permitted."])

    s += [PageBreak(),P("6. Register a new item","H1X"),Screenshot("08-new-item.png",(660,126,1053,668),[(1,794,290),(2,806,333),(3,784,390),(4,849,520),(5,969,638)],width=390)]
    s += steps(["Enter the required item name.","Select the unit of issue, such as piece, ream or box.","Optionally enter specifications or a description.","In <b>Initial Receiving Batch</b>, choose a preferred supplier and enter initial stock and unit cost when needed. The supplier stock number is generated automatically.","Select <b>Save Item Master</b> and check the new row in All Items."])

    s += [PageBreak(),P("7. Inspect an item and its batches","H1X"),Screenshot("06-item-details.png",(603,169,1114,626),[(1,773,305),(2,849,362),(3,872,490),(4,936,595),(5,1022,595)],width=470)]
    s += steps(["Select <b>View</b> on an item row and verify the stock number, unit, total on-hand quantity and valuation.","Read the item description and specifications.","Inspect <b>Receiving History &amp; Active Batches</b> for supplier stock numbers, received and remaining quantities, and unit costs.","Use <b>Tag RFID</b> if the item needs a hardware tag.","Select <b>Edit Item Identity</b> to update name, unit or description."])
    s += [P("The edit form shows current stock and valuation as aggregated values from active batches. Use receiving or issuance transactions to change stock.","NoteX")]

    s += [PageBreak(),P("8. Edit an item master","H1X"),Screenshot("07-edit-item.png",(655,160,1055,637),[(1,813,309),(2,815,355),(3,827,413),(4,867,526),(5,974,607)],width=420)]
    s += steps(["Open an item with <b>Edit</b> or <b>Edit Item Identity</b>.","Correct the item name and unit of issue.","Update the optional description or specifications.","Check the current stock and valuation display. These totals are derived from batches.","Select <b>Save Changes</b>."])

    s += [PageBreak(),P("9. Record a receiving transaction","H1X"),Screenshot("12-new-receiving.png",(660,175,1052,636),[(1,809,284),(2,810,345),(3,811,407),(4,769,482),(5,838,538),(6,965,588)],width=430)]
    s += steps(["Open <b>Inventory > Receiving</b>, then select <b>Record Receiving</b> and choose the inventory item.","Choose the supplier.","Check the automatically generated supplier stock number.","Enter quantity received and unit cost; review the calculated batch total.","Choose the date received.","Select <b>Save Receiving</b> and verify the record in the list."])

    s += [PageBreak(),P("10. Inspect a receiving record","H1X"),Screenshot("09-receiving-details.png",(685,155,1030,646),[(1,843,197),(2,821,286),(3,816,402),(4,819,469),(5,949,610)],width=400)]
    s += steps(["Open a receiving row with <b>View</b> to see its transaction reference.","Confirm the item, SKU and RFID tag when present.","Check the supplier and supplier stock number.","Compare received quantity, batch remaining, cost, value and date with the delivery record.","Select <b>Update Record</b> when a correction is authorized."])

    s += [PageBreak(),P("11. Correct a receiving record","H1X"),Screenshot("10-edit-receiving.png",(665,145,1051,649),[(1,828,264),(2,818,350),(3,823,413),(4,797,505),(5,826,564),(6,970,619)],width=415)]
    s += steps(["Open the row's <b>Update</b> action and confirm the selected inventory item. An RFID-originated item can be locked for traceability.","Choose the correct supplier if needed.","Keep the automatic supplier stock number associated with the batch.","Correct quantity received or unit cost and verify the recalculated batch total.","Correct the date received.","Select <b>Update Receiving</b> and review the updated record."])

    s += [PageBreak(),P("12. Receive with RFID","H1X"),Screenshot("11-rfid-receiving.png",(607,150,1110,642),[(1,845,252),(2,822,332),(3,836,435),(4,668,545),(5,1040,609)],width=470)]
    s += steps(["From <b>Inventory > Receiving</b>, select <b>Scan RFID</b> and choose station hardware if available.","Scan a tag with the reader or enter a tag manually, then select <b>Add Tag</b>.","Review scanned items and enter inspected quantities and actual unit costs before saving.","Select the date received.","Select <b>Receive Items</b> and confirm the resulting records."])
    s += [P("For supplier setup, compliance reports, access control and system settings, use the corresponding sidebar modules. These screens were not included in the supplied screenshot set; the technical manual maps their routes and owners.","SmallX")]
    ManualDoc(OUT/"NEMIX_User_Manual_Arrow_Callouts.pdf","NEMIX User Manual").build(s)


def make_technical():
    s=[P("NEMIX Technical Manual","TitleX"),P("Architecture, installation, operations and support reference","SubX")]
    s += [P("Audience: maintainers, deployment operators and system administrators. This manual describes the repository state as of 03 Oct 2026. Validate environment specific values before production changes.","BodyX")]
    s += [P("1. System architecture","H1X"),Architecture(),Spacer(1,10),P("NEMIX is a Laravel 12 modular monolith. Inertia connects server rendered route data to React/TypeScript pages. Modules include Inventory, Suppliers, AuditLogs and UserManagement. The shared database is PostgreSQL in the supplied Docker Compose configuration.","BodyX")]
    s += [table([["Layer","Implementation / location"],["Web routes and middleware","routes/web.php; module routes under Modules/*/routes/web.php"],["UI","resources/js/Pages and resources/js/utils/sidebarConfig.tsx"],["Business modules","Modules/Inventory, Modules/Suppliers, Modules/AuditLogs, Modules/UserManagement"],["Persistence","Laravel Eloquent models and database/migrations"],["Hardware","firmware/rfid-scanner and routes/api.php"]],[150,347])]
    s += [PageBreak(), P("2. Local installation","H1X"), UISketch("Setup sequence",[("Copy .env.example to .env","configure local values"),("Start app, queue and db","docker compose up -d"),("Generate key and migrate","artisan commands"),("Build assets and verify","npm run build / tests")],height=202)]
    s += steps(["Install Docker/Compose, then copy <b>.env.example</b> to <b>.env</b>. Set unique DB credentials, APP_URL and mail settings. Do not commit secrets.","Run <b>docker compose up -d --build</b>. The supplied Compose file binds the app to <b>127.0.0.1:8080</b>.","Run <b>docker compose exec app php artisan key:generate</b> and <b>docker compose exec app php artisan migrate</b>.","Build the front end with <b>npm run build</b>. Open the local app and verify sign in, dashboard and a permitted module."])
    s += [P("The README and composer scripts contain older Sail service names and host settings. For this checkout, use docker-compose.yml as the local container reference (service <b>app</b>, DB host <b>db</b>).","NoteX")]
    s += [P("3. Functional routes and ownership","H1X"),table([["Area","Primary route","Owner"],["Dashboard","/dashboard","core app"],["All Items","/inventories","Inventory"],["Receiving","/inventory/receiving","Inventory"],["Issuance","/inventory/issuance","Inventory"],["My Requests","/inventory/my-requests","Inventory"],["Suppliers","/suppliers","Suppliers"],["Compliance reports","/compliance/reports","core app"],["RFID workspace","/rfid-scanner","core app"],["Access Control","/access-control/*","core app"],["Audit Logs","/audit-logs/*","AuditLogs"]],[150,180,167])]
    s += [PageBreak(), P("4. Supply request transaction","H1X"),UISketch("State and stock effects",[("Pending","editable request; no reservation"),("Approved","reserves approved quantity"),("Issued","release creates issuance and deducts stock"),("Rejected / Cancelled","no release; reservation removed")],height=202)]
    s += steps(["SupplyRequestController receives submission from the coordinator. Store item IDs and requested quantities.","Approval records reviewer, time and RIS reference, and reserves the approved quantity. The physical item balance stays unchanged.","Release requires explicit signed RIS confirmation, rechecks stock inside a database transaction, creates a linked issuance and allocates FIFO batches.","A repeated release is rejected. Linked issuances cannot be independently edited or voided; a separate reversal workflow would be needed for post-release corrections."])
    s += [P("5. RFID integration","H1X"),UISketch("Hardware request path",[("ESP32 + YRM100","read tag"),("HTTPS /api/hardware/rfid/*","configuration, scan, heartbeat"),("HMAC middleware","ID, timestamp, nonce, signature"),("Laravel controller and database","validate and record event")],height=202)]
    s += [P("Provision the device in <b>System Settings > RFID</b>. Firmware setup uses a temporary access point and stores network, server URL, device ID and a one-time signing secret in ESP32 NVS. Hardware requests use X-Device-ID, X-Timestamp, X-Nonce and X-Signature headers. Review firmware/rfid-scanner/README.md before flashing or changing device configuration.","BodyX")]
    s += [PageBreak(), P("6. Security and access","H1X")]
    s += steps(["Operational web pages use auth and verified middleware. Role and route permissions govern visible menus and controller actions.","Keep APP_DEBUG=false, secure session cookies, unique secrets and a working queue in production.","Keep PostgreSQL and pgAdmin off public interfaces. The supplied Compose mapping binds pgAdmin to loopback only when its admin profile is enabled.","Use an authorized backup process before migrations, and verify restore procedures separately from routine deployment."])
    s += [P("7. Operations and verification","H1X"),table([["Task","Command or check"],["Container health","docker compose ps"],["Application logs","docker compose logs -f app"],["Queue logs","docker compose logs -f queue"],["Migration status","docker compose exec app php artisan migrate:status"],["PHP tests","docker compose exec app php artisan test"],["Front-end build","npm run build"],["Config refresh","docker compose exec app php artisan optimize:clear"]],[170,327])]
    s += [P("Deployment order: back up data; review migration impact; deploy code and built assets; run migrations; refresh caches; restart queue; check health and a representative receiving/request/report workflow. Use DEPLOYMENT_CHEATSHEET.md for the current host procedure, but verify every server specific value before execution.","BodyX")]
    s += [P("8. Troubleshooting map","H1X"),table([["Failure","Inspect first"],["Page unavailable","Container status, routes, Apache log, APP_URL and proxy settings"],["Access denied","User role, permission mapping, auth and email verification"],["Stock mismatch","Receiving, issuance, reservation and linked request records"],["No email","Mail settings, queue worker and failed jobs"],["Scanner offline","Device Wi-Fi, heartbeat, time sync, HMAC identity and server TLS"],["Report discrepancy","Reporting period, source transactions and signatory settings"]],[170,327])]
    s += [PageBreak(),P("9. Screen-to-code trace","H1X"),P("The following user-supplied screenshots provide a visual cross-check for maintainers. Numbered arrows point to UI functions and their implementation areas.","BodyX")]
    s += [Screenshot("05-all-items.png",(390,77,1540,370),[(1,1463,119),(2,1420,205),(3,1459,205)]),Spacer(1,7)]
    s += [table([["Marker / function","Route and implementation"],["1 Add Item","GET /inventories; resources/js/Pages/Inventory/AllItems; InventoryController"],["2 View","Inventory details modal and receiving batch data"],["3 Edit","Item master form; update action in InventoryController"]],[150,347])]
    s += [PageBreak(),P("10. Receiving implementation trace","H1X"),Screenshot("12-new-receiving.png",(650,170,1060,635),[(1,805,284),(2,815,345),(3,825,478),(4,969,589)],width=390),Spacer(1,7)]
    s += [table([["Marker / function","Route and implementation"],["1 Inventory item","POST /inventory/receiving; InventoryController::storeReceiving"],["2 Supplier","Suppliers module relation on receiving"],["3 Quantity and cost","Receiving batch stock and valuation inputs"],["4 Save Receiving","Persists receipt and affects item stock"]],[150,347])]
    s += [P("Source references","H1X"),P("routes/web.php; routes/api.php; Modules/Inventory/routes/web.php; Modules/Suppliers/routes/web.php; Modules/AuditLogs/routes/web.php; resources/js/utils/sidebarConfig.tsx; docs/SUPPLY_REQUEST_WORKFLOW.md; firmware/rfid-scanner/README.md; docker-compose.yml; DEPLOYMENT_CHEATSHEET.md.","SmallX")]
    ManualDoc(OUT/"NEMIX_Technical_Manual_Arrow_Callouts.pdf","NEMIX Technical Manual").build(s)


if __name__ == "__main__":
    make_user(); make_technical()
    print(OUT/"NEMIX_User_Manual_Arrow_Callouts.pdf")
    print(OUT/"NEMIX_Technical_Manual_Arrow_Callouts.pdf")
