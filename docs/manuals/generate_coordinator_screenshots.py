"""Generate all 21 illustrated screenshots with numbered guide badges and arrows for the Supply Coordinator User Manual."""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "output" / "screenshots" / "supply-coordinator-illustrated"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Branding and colors
CRIMSON = "#8B1E2D"
MAROON = "#702335"
WHITE = "#FFFFFF"
DARK = "#0F172A"
MUTED = "#64748B"
BORDER = "#E2E8F0"
LIGHT = "#F8FAFC"
BLUE = "#2563EB"
GREEN = "#16A34A"
AMBER = "#D97706"

# Fonts
FONT_TITLE = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 22)
FONT_HEADING = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 18)
FONT_BODY = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 15)
FONT_BOLD = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 15)
FONT_SMALL = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 13)
FONT_SMALL_BOLD = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 13)
FONT_BADGE = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 18)

UCN_LOGO = ROOT / "public" / "images" / "ucnlogo.png"
SUPPLYSYNC_LOGO = ROOT / "public" / "images" / "supplysync-sidebar-logo.png"


def draw_callout(draw, target_xy, badge_xy, number, color=CRIMSON):
    """Draw a callout arrow pointing from badge_xy to target_xy with white drop outline."""
    x, y = target_xy
    bx, by = badge_xy

    vx = x - bx
    vy = y - by
    dist = math.hypot(vx, vy)
    if dist < 1:
        dist = 1
    ux = vx / dist
    uy = vy / dist

    R = 17
    sx = int(bx + ux * R)
    sy = int(by + uy * R)

    # 1. White border outline
    draw.line([(sx, sy), (x, y)], fill=WHITE, width=6)
    # 2. Crimson inner stem
    draw.line([(sx, sy), (x, y)], fill=color, width=3)

    # 3. Arrowhead
    head_len = 12.0
    head_w = 6.0
    p1 = (x, y)
    p2 = (int(x - ux * head_len - uy * head_w), int(y - uy * head_len + ux * head_w))
    p3 = (int(x - ux * head_len + uy * head_w), int(y - uy * head_len - ux * head_w))
    draw.polygon([p1, p2, p3], fill=color)
    draw.line([p2, p1, p3], fill=WHITE, width=2)

    # 4. Circular badge
    draw.ellipse((bx - R, by - R, bx + R, by + R), fill=color, outline=WHITE, width=2)

    # 5. Badge number
    num_str = str(number)
    bbox = draw.textbbox((0, 0), num_str, font=FONT_BADGE)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((bx - tw // 2, by - th // 2 - 2), num_str, font=FONT_BADGE, fill=WHITE)


def add_window_frame(im, title="SupplySync | Delivery Unit Portal"):
    """Wrap content in a clean window mockup with a header."""
    w, h = im.size
    header_h = 36
    canvas = Image.new("RGB", (w, h + header_h), "#ECEFF1")
    draw = ImageDraw.Draw(canvas)

    # Window dots
    draw.ellipse((14, 12, 24, 22), fill="#EF4444")
    draw.ellipse((32, 12, 42, 22), fill="#F59E0B")
    draw.ellipse((50, 12, 60, 22), fill="#10B981")

    # Title text
    bbox = draw.textbbox((0, 0), title, font=FONT_SMALL_BOLD)
    tw = bbox[2] - bbox[0]
    draw.text(((w - tw) // 2, 9), title, font=FONT_SMALL_BOLD, fill="#475569")
    draw.line([(0, header_h - 1), (w, header_h - 1)], fill="#CBD5E1", width=1)
    canvas.paste(im, (0, header_h))
    return canvas


FIGURE_SPECS = {}

# -------------------------------------------------------------
# SC-01: Supply Coordinator Sign In Page
# -------------------------------------------------------------
def make_sc_01():
    w, h = 950, 620
    im = Image.new("RGB", (w, h), "#F1F5F9")
    d = ImageDraw.Draw(im)

    # Card
    cx, cy, cw, ch = 250, 40, 450, 540
    d.rounded_rectangle((cx + 2, cy + 3, cx + cw + 2, cy + ch + 3), radius=12, fill="#E2E8F0")
    d.rounded_rectangle((cx, cy, cx + cw, cy + ch), radius=12, fill=WHITE, outline=BORDER, width=1)

    # Logo
    if UCN_LOGO.exists():
        lg = Image.open(UCN_LOGO).convert("RGBA")
        lg.thumbnail((50, 50))
        im.paste(lg, (cx + 200, cy + 25), mask=lg)

    d.text((cx + 225 - 65, cy + 85), "Welcome back", font=FONT_TITLE, fill=DARK)
    d.text((cx + 225 - 130, cy + 118), "Sign in to your institutional account to access SupplySync.", font=FONT_SMALL, fill=MUTED)

    # Badge: Institutional Access
    d.rounded_rectangle((cx + 155, cy + 145, cx + 295, cy + 168), radius=6, fill="#FEF2F2", outline="#FECACA")
    d.text((cx + 168, cy + 150), "INSTITUTIONAL ACCESS", font=FONT_SMALL_BOLD, fill=CRIMSON)

    # Field 1: Email
    d.text((cx + 40, cy + 185), "Official Email Address", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 40, cy + 208, cx + cw - 40, cy + 250), radius=6, fill=LIGHT, outline="#CBD5E1")
    d.text((cx + 55, cy + 220), "coordinator.cas@unc-nemix.com", font=FONT_BODY, fill="#334155")

    # Field 2: Password
    d.text((cx + 40, cy + 265), "Password", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 40, cy + 288, cx + cw - 40, cy + 330), radius=6, fill=LIGHT, outline="#CBD5E1")
    d.text((cx + 55, cy + 302), "••••••••••••••••", font=FONT_BODY, fill="#334155")

    # Field 3: Remember me & Forgot Password
    d.rounded_rectangle((cx + 40, cy + 348, cx + 56, cy + 364), radius=4, fill=LIGHT, outline="#CBD5E1")
    d.text((cx + 65, cy + 348), "Remember me", font=FONT_SMALL, fill=DARK)
    d.text((cx + cw - 150, cy + 348), "Forgot password?", font=FONT_SMALL_BOLD, fill=CRIMSON)

    # Field 4: Sign In Button
    d.rounded_rectangle((cx + 40, cy + 385, cx + cw - 40, cy + 430), radius=6, fill=CRIMSON)
    d.text((cx + 190, cy + 398), "Sign In  →", font=FONT_BOLD, fill=WHITE)

    # Support footer
    d.text((cx + 95, cy + 455), "Need help? Contact SPMO Administrator", font=FONT_SMALL, fill=MUTED)

    # Pointers
    draw_callout(d, (cx + 250, cy + 229), (130, 229), 1)
    draw_callout(d, (cx + 250, cy + 309), (130, 309), 2)
    draw_callout(d, (cx + cw - 95, cy + 356), (820, 356), 3)
    draw_callout(d, (cx + 250, cy + 407), (130, 420), 4)

    im = add_window_frame(im, "SupplySync — Institutional Authentication")
    im.save(OUT_DIR / "SC-01.png", optimize=True)
    FIGURE_SPECS["SC-01"] = [
        ("Official Email Address", "Enter your registered institutional coordinator email address."),
        ("Password", "Enter the confidential password established during activation."),
        ("Remember Me & Forgot Password", "Toggle device session persistence or initiate self-service password recovery."),
        ("Sign In Button", "Authenticates credentials and opens the Delivery Unit coordinator workspace.")
    ]


# -------------------------------------------------------------
# SC-02: Password Recovery Form
# -------------------------------------------------------------
def make_sc_02():
    w, h = 950, 520
    im = Image.new("RGB", (w, h), "#F1F5F9")
    d = ImageDraw.Draw(im)

    cx, cy, cw, ch = 250, 40, 450, 440
    d.rounded_rectangle((cx + 2, cy + 3, cx + cw + 2, cy + ch + 3), radius=12, fill="#E2E8F0")
    d.rounded_rectangle((cx, cy, cx + cw, cy + ch), radius=12, fill=WHITE, outline=BORDER, width=1)

    if UCN_LOGO.exists():
        lg = Image.open(UCN_LOGO).convert("RGBA")
        lg.thumbnail((45, 45))
        im.paste(lg, (cx + 202, cy + 25), mask=lg)

    d.text((cx + 225 - 85, cy + 80), "Recover Password", font=FONT_TITLE, fill=DARK)
    d.text((cx + 45, cy + 115), "Forgot your password? Enter your official institutional email", font=FONT_SMALL, fill=MUTED)
    d.text((cx + 70, cy + 135), "address to receive a single-use password reset link.", font=FONT_SMALL, fill=MUTED)

    # Input: Official Email
    d.text((cx + 40, cy + 175), "Official Email Address", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 40, cy + 200, cx + cw - 40, cy + 245), radius=6, fill=LIGHT, outline="#CBD5E1")
    d.text((cx + 55, cy + 213), "coordinator.cas@unc-nemix.com", font=FONT_BODY, fill="#334155")

    # Action: Send Reset Link
    d.rounded_rectangle((cx + 40, cy + 270, cx + cw - 40, cy + 315), radius=6, fill=CRIMSON)
    d.text((cx + 155, cy + 283), "Send Reset Link  →", font=FONT_BOLD, fill=WHITE)

    # Link: Return to Sign In
    d.text((cx + 175, cy + 350), "← Return to Sign In", font=FONT_BOLD, fill=CRIMSON)

    draw_callout(d, (cx + 250, cy + 222), (130, 222), 1)
    draw_callout(d, (cx + 250, cy + 292), (130, 305), 2)
    draw_callout(d, (cx + 225, cy + 358), (820, 358), 3)

    im = add_window_frame(im, "SupplySync — Password Recovery")
    im.save(OUT_DIR / "SC-02.png", optimize=True)
    FIGURE_SPECS["SC-02"] = [
        ("Official Email Address Field", "Enter the registered email address tied to the coordinator staff account."),
        ("Send Reset Link Button", "Dispatches a time-limited reset link to the coordinator's verified institutional email."),
        ("Return to Sign In Link", "Cancels password recovery and returns to the primary authentication card.")
    ]


# -------------------------------------------------------------
# SC-03: Supply Coordinator Invitation Activation
# -------------------------------------------------------------
def make_sc_03():
    w, h = 950, 590
    im = Image.new("RGB", (w, h), "#F1F5F9")
    d = ImageDraw.Draw(im)

    cx, cy, cw, ch = 240, 30, 470, 530
    d.rounded_rectangle((cx + 2, cy + 3, cx + cw + 2, cy + ch + 3), radius=12, fill="#E2E8F0")
    d.rounded_rectangle((cx, cy, cx + cw, cy + ch), radius=12, fill=WHITE, outline=BORDER, width=1)

    if UCN_LOGO.exists():
        lg = Image.open(UCN_LOGO).convert("RGBA")
        lg.thumbnail((45, 45))
        im.paste(lg, (cx + 212, cy + 20), mask=lg)

    d.text((cx + 235 - 125, cy + 72), "Complete Staff Registration", font=FONT_TITLE, fill=DARK)
    d.text((cx + 235 - 110, cy + 104), "Activate your assigned Supply Coordinator account.", font=FONT_SMALL, fill=MUTED)

    # 1. Read-only email
    d.text((cx + 40, cy + 135), "Assigned Institutional Email", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 40, cy + 158, cx + cw - 40, cy + 198), radius=6, fill="#F1F5F9", outline="#CBD5E1")
    d.text((cx + 55, cy + 170), "coordinator.cas@unc-nemix.com (Locked)", font=FONT_BODY, fill="#64748B")

    # 2. Name & Password
    d.text((cx + 40, cy + 210), "Full Legal Name", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 40, cy + 233, cx + cw - 40, cy + 273), radius=6, fill=LIGHT, outline="#CBD5E1")
    d.text((cx + 55, cy + 245), "Dr. Maria Elena Santos", font=FONT_BODY, fill="#1E293B")

    d.text((cx + 40, cy + 285), "New Password & Confirmation", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 40, cy + 308, cx + cw - 40, cy + 348), radius=6, fill=LIGHT, outline="#CBD5E1")
    d.text((cx + 55, cy + 320), "••••••••••••••••", font=FONT_BODY, fill="#1E293B")

    # 3. Policy criteria
    d.text((cx + 40, cy + 360), "Password Requirements:", font=FONT_SMALL_BOLD, fill="#475569")
    d.text((cx + 40, cy + 380), "✓ 8+ characters    ✓ Upper & lowercase    ✓ Numbers & symbols", font=FONT_SMALL, fill=GREEN)

    # 4. Activate button
    d.rounded_rectangle((cx + 40, cy + 420, cx + cw - 40, cy + 465), radius=6, fill=CRIMSON)
    d.text((cx + 145, cy + 433), "Complete Registration & Sign In", font=FONT_BOLD, fill=WHITE)

    draw_callout(d, (cx + 250, cy + 178), (120, 178), 1)
    draw_callout(d, (cx + 250, cy + 328), (120, 328), 2)
    draw_callout(d, (cx + 340, cy + 385), (820, 385), 3)
    draw_callout(d, (cx + 250, cy + 442), (120, 460), 4)

    im = add_window_frame(im, "SupplySync — Account Activation")
    im.save(OUT_DIR / "SC-03.png", optimize=True)
    FIGURE_SPECS["SC-03"] = [
        ("Institutional Email Verification", "Displays the locked institutional email provisioned by the SPMO administrator."),
        ("Password Configuration Fields", "Set and confirm a compliant master password for the new coordinator account."),
        ("Password Complexity Checklist", "Real-time indicators verifying length, character diversity, and security policy compliance."),
        ("Complete Registration Button", "Activates the coordinator profile and signs directly into the Delivery Unit workspace.")
    ]


# -------------------------------------------------------------
# SC-04: Supply Coordinator Navigation
# -------------------------------------------------------------
def make_sc_04():
    w, h = 1100, 600
    im = Image.new("RGB", (w, h), WHITE)
    d = ImageDraw.Draw(im)

    sb_w = 260
    d.rectangle((0, 0, sb_w, h), fill="#1E293B")

    if SUPPLYSYNC_LOGO.exists():
        lg = Image.open(SUPPLYSYNC_LOGO).convert("RGBA")
        lg.thumbnail((36, 36))
        im.paste(lg, (20, 20), mask=lg)
    d.text((68, 22), "SupplySync", font=FONT_HEADING, fill=WHITE)
    d.text((68, 44), "Delivery Unit Portal", font=FONT_SMALL, fill="#94A3B8")

    d.text((20, 85), "OVERVIEW", font=FONT_SMALL_BOLD, fill="#64748B")
    d.rounded_rectangle((12, 105, sb_w - 12, 140), radius=6, fill=CRIMSON)
    d.text((45, 115), "Dashboard", font=FONT_BOLD, fill=WHITE)

    d.text((20, 160), "INVENTORY MANAGEMENT", font=FONT_SMALL_BOLD, fill="#64748B")
    d.text((45, 185), "Unit Inventory", font=FONT_BODY, fill="#CBD5E1")
    d.text((45, 220), "Stock Movements", font=FONT_BODY, fill="#CBD5E1")

    d.text((20, 265), "CATALOG & REQUESTS", font=FONT_SMALL_BOLD, fill="#64748B")
    d.text((45, 290), "Supply Catalog", font=FONT_BODY, fill="#CBD5E1")
    d.text((45, 325), "My Requests", font=FONT_BODY, fill="#CBD5E1")

    d.rounded_rectangle((16, 400, sb_w - 16, 455), radius=8, fill="#0F172A")
    d.text((26, 410), "ACTIVE ROLE", font=FONT_SMALL, fill="#64748B")
    d.text((26, 428), "Supply Coordinator", font=FONT_BOLD, fill="#F8FAFC")

    d.line([(0, h - 85), (sb_w, h - 85)], fill="#334155", width=1)
    d.text((20, h - 70), "Dr. Maria Elena Santos", font=FONT_BOLD, fill=WHITE)
    d.text((20, h - 50), "Account Settings  •  Light Theme", font=FONT_SMALL, fill="#94A3B8")
    d.text((20, h - 30), "Sign Out", font=FONT_SMALL_BOLD, fill="#F87171")

    d.rectangle((sb_w, 0, w, h), fill="#F8FAFC")
    d.rectangle((sb_w, 0, w, 65), fill=WHITE, outline=BORDER)
    d.text((sb_w + 30, 22), "College of Arts and Sciences — Supply Coordinator Dashboard", font=FONT_HEADING, fill=DARK)

    d.rounded_rectangle((sb_w + 30, 95, sb_w + 250, 195), radius=8, fill=WHITE, outline=BORDER)
    d.text((sb_w + 45, 110), "ACTIVE REQUESTS", font=FONT_SMALL_BOLD, fill=MUTED)
    d.text((sb_w + 45, 135), "2 Pending", font=FONT_TITLE, fill=BLUE)

    d.rounded_rectangle((sb_w + 270, 95, sb_w + 490, 195), radius=8, fill=WHITE, outline=BORDER)
    d.text((sb_w + 285, 110), "ITEMS IN STOCK", font=FONT_SMALL_BOLD, fill=MUTED)
    d.text((sb_w + 285, 135), "184 Units", font=FONT_TITLE, fill=GREEN)

    d.rounded_rectangle((sb_w + 510, 95, w - 30, 195), radius=8, fill=WHITE, outline=BORDER)
    d.text((sb_w + 525, 110), "FOR REPLENISHMENT", font=FONT_SMALL_BOLD, fill=MUTED)
    d.text((sb_w + 525, 135), "1 Low Stock", font=FONT_TITLE, fill=AMBER)

    draw_callout(d, (130, 205), (380, 240), 1)
    draw_callout(d, (130, 428), (380, 428), 2)
    draw_callout(d, (100, h - 50), (380, h - 50), 3)
    draw_callout(d, (50, h - 25), (380, h - 20), 4)

    im = add_window_frame(im, "SupplySync — Supply Coordinator Navigation")
    im.save(OUT_DIR / "SC-04.png", optimize=True)
    FIGURE_SPECS["SC-04"] = [
        ("Coordinator Navigation Menu", "Direct access to Dashboard, Unit Inventory, Movements, Catalog, and My Requests."),
        ("Supply Coordinator Role Badge", "Verifies active role scope, access permissions, and Delivery Unit boundary."),
        ("Account Settings Link", "Opens personal profile management, password security, and active sessions."),
        ("Theme Toggle & Sign Out", "Switch appearance mode (Light/Dark/System) and terminate the authenticated session.")
    ]


# -------------------------------------------------------------
# SC-05: Supply Coordinator Dashboard Overview
# -------------------------------------------------------------
def make_sc_05():
    base_path = ROOT / "tmp" / "extracted_assets" / "coordinator-redesign.jpg"
    if base_path.exists():
        src = Image.open(base_path).convert("RGB")
        im = src.crop((0, 0, min(src.width, 1265), min(src.height, 920)))
    else:
        im = Image.new("RGB", (1200, 800), LIGHT)

    d = ImageDraw.Draw(im)
    draw_callout(d, (1050, 95), (1050, 30), 1)
    draw_callout(d, (550, 210), (350, 110), 2)
    draw_callout(d, (600, 500), (300, 500), 3)
    draw_callout(d, (1050, 480), (1150, 380), 4)

    im = add_window_frame(im, "SupplySync — Delivery Unit Dashboard Overview")
    im.save(OUT_DIR / "SC-05.png", optimize=True)
    FIGURE_SPECS["SC-05"] = [
        ("Quick Action Triggers", "Direct shortcuts to create a New Request, browse Catalog, or record Issue Supplies."),
        ("Unit Inventory Metric Cards", "Real-time indicators of Active Requests, For Replenishment, and Total Units in Stock."),
        ("Inventory Movement Trends", "Visual tracking of central stock receipts versus local delivery distributions."),
        ("Recent Activity & Updates", "Account-scoped audit ledger detailing recent requisition approvals and stock issuances.")
    ]


# -------------------------------------------------------------
# SC-06: Central Supply Catalog
# -------------------------------------------------------------
def make_sc_06():
    base_path = ROOT / "tmp" / "extracted_assets" / "central-supply-catalog-preview.jpg"
    if base_path.exists():
        src = Image.open(base_path).convert("RGB")
        im = src.crop((0, 0, min(src.width, 1265), min(src.height, 920)))
    else:
        im = Image.new("RGB", (1200, 800), LIGHT)

    d = ImageDraw.Draw(im)
    draw_callout(d, (580, 220), (380, 140), 1)
    draw_callout(d, (520, 480), (320, 430), 2)
    draw_callout(d, (720, 480), (900, 430), 3)
    draw_callout(d, (850, 560), (1050, 560), 4)

    im = add_window_frame(im, "SupplySync — Central Supply Catalog")
    im.save(OUT_DIR / "SC-06.png", optimize=True)
    FIGURE_SPECS["SC-06"] = [
        ("Catalog Search & Availability Filters", "Filter central consumables by name, stock number, or requestable status."),
        ("In Supply Office Physical Balance", "Gross quantity physically stored in the central Supply and Property warehouse."),
        ("Available to Request Quantity", "Net unreserved stock balance eligible for requisition after deducting approved requests."),
        ("Request This Item Action", "Automatically transfers the consumable into line item 1 of a new requisition.")
    ]


# -------------------------------------------------------------
# SC-07: Catalog Request Item Prefill
# -------------------------------------------------------------
def make_sc_07():
    w, h = 1100, 600
    im = Image.new("RGB", (w, h), LIGHT)
    d = ImageDraw.Draw(im)

    d.rounded_rectangle((40, 50, 460, 420), radius=10, fill=WHITE, outline=BORDER)
    d.text((65, 75), "Central Catalog Item", font=FONT_SMALL_BOLD, fill=MUTED)
    d.text((65, 105), "A4 Copy Paper 80gsm", font=FONT_TITLE, fill=DARK)
    d.text((65, 140), "Stock No: SN-PAP-001  •  Unit: Ream", font=FONT_BODY, fill=MUTED)

    d.rounded_rectangle((65, 180, 230, 250), radius=8, fill="#F0FDF4", outline="#BBF7D0")
    d.text((80, 195), "AVAILABLE", font=FONT_SMALL_BOLD, fill=GREEN)
    d.text((80, 218), "180 Reams", font=FONT_HEADING, fill=GREEN)

    d.rounded_rectangle((250, 180, 415, 250), radius=8, fill="#F8FAFC", outline=BORDER)
    d.text((265, 195), "IN WAREHOUSE", font=FONT_SMALL_BOLD, fill=MUTED)
    d.text((265, 218), "250 Reams", font=FONT_HEADING, fill=DARK)

    d.rounded_rectangle((65, 300, 415, 350), radius=6, fill=CRIMSON)
    d.text((170, 315), "Request This Item  →", font=FONT_BOLD, fill=WHITE)

    d.line([(475, 240), (525, 240)], fill=CRIMSON, width=4)
    d.polygon([(535, 240), (520, 232), (520, 248)], fill=CRIMSON)

    d.rounded_rectangle((540, 50, w - 40, 480), radius=10, fill=WHITE, outline=BORDER)
    d.text((565, 75), "Create Supply Requisition (Prefilled)", font=FONT_TITLE, fill=DARK)
    d.line([(565, 115), (w - 65, 115)], fill=BORDER, width=1)

    d.text((565, 140), "Item Schedule Line 1 (Prefilled from Catalog)", font=FONT_BOLD, fill=CRIMSON)
    d.rectangle((565, 175, w - 65, 215), fill="#F1F5F9")
    d.text((580, 188), "Item Description", font=FONT_SMALL_BOLD, fill=DARK)
    d.text((780, 188), "Unit", font=FONT_SMALL_BOLD, fill=DARK)
    d.text((850, 188), "Central Stock", font=FONT_SMALL_BOLD, fill=DARK)
    d.text((950, 188), "Req Qty", font=FONT_SMALL_BOLD, fill=DARK)

    d.rectangle((565, 215, w - 65, 275), fill=WHITE, outline=BORDER)
    d.text((580, 235), "A4 Copy Paper 80gsm", font=FONT_BODY, fill=DARK)
    d.text((780, 235), "Ream", font=FONT_BODY, fill=DARK)
    d.text((865, 235), "180", font=FONT_BOLD, fill=GREEN)

    d.rounded_rectangle((945, 225, 1025, 265), radius=4, fill=LIGHT, outline=BORDER)
    d.text((965, 237), "25", font=FONT_BOLD, fill=CRIMSON)

    d.text((565, 305), "Purpose: Regular instructional and administrative supplies for midterm exam prep.", font=FONT_SMALL, fill=MUTED)

    draw_callout(d, (240, 325), (240, 460), 1)
    draw_callout(d, (680, 235), (680, 360), 2)
    draw_callout(d, (880, 235), (880, 360), 3)
    draw_callout(d, (985, 245), (985, 360), 4)

    im = add_window_frame(im, "SupplySync — Catalog Requisition Item Prefill")
    im.save(OUT_DIR / "SC-07.png", optimize=True)
    FIGURE_SPECS["SC-07"] = [
        ("Catalog Item Card Trigger", "Selecting 'Request This Item' initializes the requisition workflow."),
        ("Prefilled Item Schedule Row", "Consumable identity, stock number, and unit of measure are locked and prefilled."),
        ("Central Stock Verification", "Displays unreserved central balance to confirm supply feasibility before submission."),
        ("Requested Quantity Field", "Input the desired allocation quantity (must be a positive integer <= available stock).")
    ]


# -------------------------------------------------------------
# SC-08: Coordinator Assignment Guidance
# -------------------------------------------------------------
def make_sc_08():
    w, h = 1050, 520
    im = Image.new("RGB", (w, h), LIGHT)
    d = ImageDraw.Draw(im)

    cx, cy, cw, ch = 50, 40, w - 100, 440
    d.rounded_rectangle((cx, cy, cx + cw, cy + ch), radius=10, fill=WHITE, outline=BORDER)

    d.text((cx + 30, cy + 25), "Section 1 — Requesting Office Information", font=FONT_TITLE, fill=DARK)
    d.text((cx + 30, cy + 58), "Locked to the authenticated Supply Coordinator's administrator-assigned Delivery Unit.", font=FONT_SMALL, fill=MUTED)
    d.line([(cx + 30, cy + 85), (cx + cw - 30, cy + 85)], fill=BORDER, width=1)

    d.rounded_rectangle((cx + 30, cy + 105, cx + cw - 30, cy + 160), radius=6, fill="#EFF6FF", outline="#BFDBFE")
    d.text((cx + 45, cy + 120), "ℹ Delivery Unit Assignment Policy Notice:", font=FONT_BOLD, fill=BLUE)
    d.text((cx + 45, cy + 138), "This requisition will be formally recorded under your assigned department. The office head is automatically assigned as Requested By.", font=FONT_SMALL, fill="#1E40AF")

    d.text((cx + 30, cy + 185), "Requested By (Office Head)", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 30, cy + 210, cx + 430, cy + 255), radius=6, fill="#F1F5F9", outline="#CBD5E1")
    d.text((cx + 45, cy + 225), "Dr. Maria Elena Santos (Locked)", font=FONT_BODY, fill="#475569")

    d.text((cx + 470, cy + 185), "Division or Office", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 470, cy + 210, cx + cw - 30, cy + 255), radius=6, fill="#F1F5F9", outline="#CBD5E1")
    d.text((cx + 485, cy + 225), "College of Arts and Sciences (Locked)", font=FONT_BODY, fill="#475569")

    d.text((cx + 30, cy + 280), "Office Head Designation", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 30, cy + 305, cx + 430, cy + 350), radius=6, fill="#F1F5F9", outline="#CBD5E1")
    d.text((cx + 45, cy + 320), "Dean, College of Arts and Sciences (Locked)", font=FONT_BODY, fill="#475569")

    d.text((cx + 470, cy + 280), "Fund Cluster & Request Date", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 470, cy + 305, cx + cw - 30, cy + 350), radius=6, fill=WHITE, outline=BORDER)
    d.text((cx + 485, cy + 320), "01 - Regular Agency Fund  |  12 November 2026", font=FONT_BODY, fill=DARK)

    draw_callout(d, (cx + 250, cy + 130), (cx + 250, cy + 60), 1)
    draw_callout(d, (cx + 230, cy + 232), (cx + 230, cy + 380), 2)
    draw_callout(d, (cx + 650, cy + 232), (cx + 650, cy + 150), 3)
    draw_callout(d, (cx + 650, cy + 328), (cx + 650, cy + 400), 4)

    im = add_window_frame(im, "SupplySync — Requesting Office Assignment Guidance")
    im.save(OUT_DIR / "SC-08.png", optimize=True)
    FIGURE_SPECS["SC-08"] = [
        ("Delivery Unit Policy Banner", "Mandatory system notice confirming requisition ownership and departmental scoping."),
        ("Locked Office Head Signatory", "Designated approving head of office mapped directly from staff provisioning records."),
        ("Locked Organizational Unit", "Official institutional department under which unit inventory will be held."),
        ("Fund Cluster & Submission Date", "Selectable government fund cluster classification and active submission date.")
    ]


# -------------------------------------------------------------
# SC-09: Create Supply Requisition Form
# -------------------------------------------------------------
def make_sc_09():
    base_path = ROOT / "docs" / "manuals" / "screenshots" / "04-new-request.png"
    if base_path.exists():
        src = Image.open(base_path).convert("RGB")
        im = src.crop((550, 50, 1170, 750))
    else:
        im = Image.new("RGB", (620, 700), LIGHT)

    d = ImageDraw.Draw(im)
    draw_callout(d, (300, 190), (120, 190), 1)
    draw_callout(d, (250, 310), (90, 310), 2)
    draw_callout(d, (480, 360), (560, 320), 3)
    draw_callout(d, (300, 520), (120, 520), 4)
    draw_callout(d, (460, 640), (560, 600), 5)

    im = add_window_frame(im, "SupplySync — Create Supply Requisition Form")
    im.save(OUT_DIR / "SC-09.png", optimize=True)
    FIGURE_SPECS["SC-09"] = [
        ("Requisition Purpose Input", "Mandatory justification detailing the educational or administrative need."),
        ("Consumable Items Grid", "Searchable item selector with on-hand warehouse availability checking."),
        ("Requested Quantities & Line Addition", "Specify unit counts for each consumable and append additional lines as required."),
        ("Signatory Preview Section", "Read-only authorization overview showing approving Property Custodian and issuing officer."),
        ("Submit Supply Request Button", "Transmits the complete requisition to SPMO with status set to Pending Review.")
    ]


# -------------------------------------------------------------
# SC-10: My Supply Requests Workspace
# -------------------------------------------------------------
def make_sc_10():
    base_path = ROOT / "tmp" / "extracted_assets" / "coordinator-my-requests-preview.jpg"
    if base_path.exists():
        src = Image.open(base_path).convert("RGB")
        im = src.crop((0, 0, min(src.width, 1265), min(src.height, 950)))
    else:
        im = Image.new("RGB", (1200, 800), LIGHT)

    d = ImageDraw.Draw(im)
    draw_callout(d, (480, 190), (280, 120), 1)
    draw_callout(d, (450, 360), (200, 360), 2)
    draw_callout(d, (800, 360), (950, 280), 3)
    draw_callout(d, (1100, 360), (1180, 280), 4)

    im = add_window_frame(im, "SupplySync — My Supply Requests Workspace")
    im.save(OUT_DIR / "SC-10.png", optimize=True)
    FIGURE_SPECS["SC-10"] = [
        ("Lifecycle Status Filter Tabs", "Filter requests by Pending Review, Approved Awaiting Release, Issued, Rejected, or Cancelled."),
        ("Requisition Tracking Ledger", "Sequential list of owned requests showing official RIS references, item counts, and dates."),
        ("Workflow Status Badges", "Color-coded lifecycle indicators reflecting the current stage of Property Office processing."),
        ("Contextual Action Menu", "Access Details, Edit (for Pending requests), View RIS (for Approved), or Cancel Requisition.")
    ]


# -------------------------------------------------------------
# SC-11: Edit Pending Supply Request
# -------------------------------------------------------------
def make_sc_11():
    w, h = 950, 580
    im = Image.new("RGB", (w, h), LIGHT)
    d = ImageDraw.Draw(im)

    cx, cy, cw, ch = 50, 30, w - 100, 520
    d.rounded_rectangle((cx, cy, cx + cw, cy + ch), radius=10, fill=WHITE, outline=BORDER)

    d.text((cx + 30, cy + 20), "Edit Supply Requisition — RIS-2026-11-0042", font=FONT_TITLE, fill=DARK)
    d.text((cx + 30, cy + 52), "Modify request purpose or item allocations while status remains Pending Review.", font=FONT_SMALL, fill=MUTED)
    d.line([(cx + 30, cy + 78), (cx + cw - 30, cy + 78)], fill=BORDER, width=1)

    d.rounded_rectangle((cx + 30, cy + 95, cx + cw - 30, cy + 145), radius=6, fill="#F8FAFC", outline=BORDER)
    d.text((cx + 45, cy + 105), "Requesting Office: College of Arts and Sciences  •  Requested by: Dr. Maria Elena Santos", font=FONT_BOLD, fill=DARK)
    d.text((cx + 45, cy + 125), "Locked Snapshot: Organizational assignment cannot be altered on an existing requisition.", font=FONT_SMALL, fill=MUTED)

    d.text((cx + 30, cy + 165), "Purpose (Editable)", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 30, cy + 190, cx + cw - 30, cy + 245), radius=6, fill=LIGHT, outline="#CBD5E1")
    d.text((cx + 45, cy + 205), "Updated: Revised consumable supplies allocation for CAS midterm examination schedule.", font=FONT_BODY, fill=DARK)

    d.text((cx + 30, cy + 265), "Requested Items Schedule", font=FONT_BOLD, fill=DARK)
    d.rectangle((cx + 30, cy + 295, cx + cw - 30, cy + 330), fill="#F1F5F9")
    d.text((cx + 45, cy + 306), "Item Description", font=FONT_SMALL_BOLD, fill=DARK)
    d.text((cx + 400, cy + 306), "Stock No", font=FONT_SMALL_BOLD, fill=DARK)
    d.text((cx + 560, cy + 306), "On Hand", font=FONT_SMALL_BOLD, fill=DARK)
    d.text((cx + 680, cy + 306), "Qty", font=FONT_SMALL_BOLD, fill=DARK)
    d.text((cx + 760, cy + 306), "Action", font=FONT_SMALL_BOLD, fill=DARK)

    d.rectangle((cx + 30, cy + 330, cx + cw - 30, cy + 380), fill=WHITE, outline=BORDER)
    d.text((cx + 45, cy + 346), "A4 Copy Paper 80gsm", font=FONT_BODY, fill=DARK)
    d.text((cx + 400, cy + 346), "SN-PAP-001", font=FONT_BODY, fill=MUTED)
    d.text((cx + 575, cy + 346), "180", font=FONT_BODY, fill=GREEN)
    d.text((cx + 690, cy + 346), "30", font=FONT_BOLD, fill=CRIMSON)
    d.text((cx + 760, cy + 346), "Remove", font=FONT_SMALL_BOLD, fill="#EF4444")

    d.rounded_rectangle((cx + cw - 180, cy + 440, cx + cw - 30, cy + 485), radius=6, fill=CRIMSON)
    d.text((cx + cw - 150, cy + 453), "Save Changes", font=FONT_BOLD, fill=WHITE)

    d.rounded_rectangle((cx + cw - 300, cy + 440, cx + cw - 200, cy + 485), radius=6, fill=LIGHT, outline=BORDER)
    d.text((cx + cw - 270, cy + 453), "Cancel", font=FONT_BOLD, fill=DARK)

    draw_callout(d, (cx + 350, cy + 35), (cx + 650, cy + 45), 1)
    draw_callout(d, (cx + 350, cy + 120), (cx + 750, cy + 120), 2)
    draw_callout(d, (cx + 350, cy + 218), (cx + 750, cy + 218), 3)
    draw_callout(d, (cx + cw - 105, cy + 462), (cx + cw - 105, cy + 390), 4)

    im = add_window_frame(im, "SupplySync — Edit Pending Requisition")
    im.save(OUT_DIR / "SC-11.png", optimize=True)
    FIGURE_SPECS["SC-11"] = [
        ("Preserved RIS Identifier", "Retains the unique assigned requisition number while in Pending review status."),
        ("Locked Office Assignment Snapshot", "Prevents unauthorized alterations to the requesting organizational unit."),
        ("Editable Purpose & Line Items", "Update operational justification, adjust quantities, or swap consumable items."),
        ("Save Changes Submission Button", "Commits edits back to the Property Custodian review queue.")
    ]


# -------------------------------------------------------------
# SC-12: Approved Request Details
# -------------------------------------------------------------
def make_sc_12():
    base_path = ROOT / "docs" / "manuals" / "screenshots" / "02-request-details.png"
    if base_path.exists():
        src = Image.open(base_path).convert("RGB")
        im = src.crop((550, 30, 1160, 770))
    else:
        im = Image.new("RGB", (610, 740), LIGHT)

    d = ImageDraw.Draw(im)
    draw_callout(d, (300, 80), (120, 80), 1)
    draw_callout(d, (400, 360), (520, 300), 2)
    draw_callout(d, (300, 520), (120, 520), 3)
    draw_callout(d, (200, 700), (90, 650), 4)

    im = add_window_frame(im, "SupplySync — Approved Requisition Details")
    im.save(OUT_DIR / "SC-12.png", optimize=True)
    FIGURE_SPECS["SC-12"] = [
        ("Approved Awaiting Release Status", "Confirms that stock has been formally reserved for the Delivery Unit."),
        ("Quantity Reconciliation Grid", "Compares requested quantities against Property Custodian approved releases."),
        ("Approval Remarks & Timestamp", "Review custodian notes, allocation adjustments, or pickup scheduling guidance."),
        ("View RIS Preview Button", "Opens the official Requisition and Issue Slip (Appendix 63) for printing.")
    ]


# -------------------------------------------------------------
# SC-13: Approved RIS Preview
# -------------------------------------------------------------
def make_sc_13():
    base_path = ROOT / "docs" / "manuals" / "screenshots" / "03-ris-preview.png"
    if base_path.exists():
        src = Image.open(base_path).convert("RGB")
        im = src.crop((500, 80, 1220, 720))
    else:
        im = Image.new("RGB", (720, 640), LIGHT)

    d = ImageDraw.Draw(im)
    draw_callout(d, (360, 150), (150, 150), 1)
    draw_callout(d, (360, 320), (150, 320), 2)
    draw_callout(d, (360, 500), (150, 500), 3)
    draw_callout(d, (580, 595), (650, 530), 4)

    im = add_window_frame(im, "SupplySync — Approved RIS Document Preview")
    im.save(OUT_DIR / "SC-13.png", optimize=True)
    FIGURE_SPECS["SC-13"] = [
        ("Official Appendix 63 Header", "Includes institutional heading, entity name, fund cluster, and official RIS number."),
        ("Approved Supplies Schedule", "Itemized table displaying authorized stock numbers, descriptions, units, and quantities."),
        ("Four-Part Signatory Matrix", "Official certification blocks for Requisition, Approval, Issuance, and Physical Receipt."),
        ("Print & Download PDF Controls", "Produce the physical paper voucher required for signed physical release at SPMO.")
    ]


# -------------------------------------------------------------
# SC-14: Released Request and Unit Inventory Credit
# -------------------------------------------------------------
def make_sc_14():
    w, h = 1050, 580
    im = Image.new("RGB", (w, h), LIGHT)
    d = ImageDraw.Draw(im)

    d.rounded_rectangle((40, 40, 510, 520), radius=10, fill=WHITE, outline=BORDER)
    d.text((65, 65), "Requisition — RIS-2026-11-0042", font=FONT_TITLE, fill=DARK)

    d.rounded_rectangle((65, 105, 230, 140), radius=6, fill="#F0FDF4", outline="#BBF7D0")
    d.text((80, 115), "✓ ISSUED / RELEASED", font=FONT_BOLD, fill=GREEN)

    d.text((65, 160), "Release Details & Physical Handover:", font=FONT_BOLD, fill=DARK)
    d.text((65, 185), "• Released Date: 12 November 2026, 02:45 PM", font=FONT_SMALL, fill=MUTED)
    d.text((65, 208), "• Issued By: Roberto Gomez (SPMO Custodian)", font=FONT_SMALL, fill=MUTED)
    d.text((65, 231), "• Physical Pickup: Verified with signed paper RIS", font=FONT_SMALL, fill=MUTED)

    d.rectangle((65, 270, 485, 340), fill="#F8FAFC", outline=BORDER)
    d.text((80, 285), "A4 Copy Paper 80gsm", font=FONT_BOLD, fill=DARK)
    d.text((80, 310), "Released: 25 Reams  •  Batch Ref: BATCH-2026-088", font=FONT_SMALL, fill=MUTED)

    d.rounded_rectangle((540, 40, w - 40, 520), radius=10, fill=WHITE, outline=BORDER)
    d.text((565, 65), "Delivery Unit Inventory (Credited)", font=FONT_TITLE, fill=DARK)

    d.rounded_rectangle((565, 105, w - 65, 180), radius=8, fill="#EFF6FF", outline="#BFDBFE")
    d.text((585, 120), "AUTOMATIC INVENTORY INFLOW", font=FONT_SMALL_BOLD, fill=BLUE)
    d.text((585, 142), "Released quantities have been credited to your Delivery Unit stock.", font=FONT_BODY, fill="#1E40AF")

    d.rounded_rectangle((565, 205, w - 65, 360), radius=8, fill=WHITE, outline=BORDER)
    d.text((585, 225), "A4 Copy Paper 80gsm (SN-PAP-001)", font=FONT_HEADING, fill=DARK)
    d.text((585, 255), "Previous Unit Balance: 0 Reams", font=FONT_BODY, fill=MUTED)
    d.text((585, 285), "+ Released Quantity: 25 Reams", font=FONT_BOLD, fill=GREEN)
    d.line([(585, 315), (w - 85, 315)], fill=BORDER, width=1)
    d.text((585, 325), "Current On-Hand Balance: 25 Reams", font=FONT_TITLE, fill=DARK)

    d.text((565, 400), "Transaction Reference: REL-2026-11-0042", font=FONT_SMALL, fill=MUTED)
    d.text((565, 425), "Next Step: You can now issue supplies to office personnel.", font=FONT_SMALL_BOLD, fill=CRIMSON)

    draw_callout(d, (150, 122), (150, 40), 1)
    draw_callout(d, (200, 200), (200, 390), 2)
    draw_callout(d, (720, 290), (720, 460), 3)
    draw_callout(d, (750, 335), (950, 335), 4)

    im = add_window_frame(im, "SupplySync — Stock Release & Unit Inventory Credit")
    im.save(OUT_DIR / "SC-14.png", optimize=True)
    FIGURE_SPECS["SC-14"] = [
        ("Issued / Released Status", "Confirms physical pickup completion and formal warehouse release by Property Office."),
        ("Issuing Officer Details & Timestamp", "Records custodian identification and physical verification audit trail."),
        ("Automatic Delivery Unit Credit", "Approved quantities instantly credit to the signed-in coordinator's inventory."),
        ("Updated On-Hand Stock Balance", "Reconciled stock level now available for local distribution to faculty and staff.")
    ]


# -------------------------------------------------------------
# SC-15: Delivery Unit Inventory
# -------------------------------------------------------------
def make_sc_15():
    base_path = ROOT / "tmp" / "extracted_assets" / "coordinator-redesign.jpg"
    if base_path.exists():
        src = Image.open(base_path).convert("RGB")
        im = src.crop((0, min(src.height - 750, 500), min(src.width, 1265), min(src.height, 1266)))
    else:
        im = Image.new("RGB", (1200, 750), LIGHT)

    d = ImageDraw.Draw(im)
    draw_callout(d, (450, 120), (250, 60), 1)
    draw_callout(d, (350, 220), (150, 220), 2)
    draw_callout(d, (500, 380), (300, 440), 3)
    draw_callout(d, (1100, 380), (1180, 280), 4)

    im = add_window_frame(im, "SupplySync — Delivery Unit Inventory")
    im.save(OUT_DIR / "SC-15.png", optimize=True)
    FIGURE_SPECS["SC-15"] = [
        ("Delivery Unit Stock Metrics", "Counters showing active supplies on hand, total inventory value, and replenishment alerts."),
        ("Stock Threshold Filter Tabs", "Filter local inventory by All items, Available, Low stock, or Depleted status."),
        ("Owned Supplies Inventory Grid", "Itemized ledger displaying stock numbers, unit descriptions, and verified on-hand counts."),
        ("Unit Action Controls", "Direct action buttons to 'Record Issue' (local distribution) or generate 'Stock Card'.")
    ]


# -------------------------------------------------------------
# SC-16: Record a Unit Issue
# -------------------------------------------------------------
def make_sc_16():
    w, h = 950, 560
    im = Image.new("RGB", (w, h), LIGHT)
    d = ImageDraw.Draw(im)

    cx, cy, cw, ch = 200, 30, 550, 500
    d.rounded_rectangle((cx + 2, cy + 3, cx + cw + 2, cy + ch + 3), radius=12, fill="#E2E8F0")
    d.rounded_rectangle((cx, cy, cx + cw, cy + ch), radius=12, fill=WHITE, outline=BORDER, width=1)

    d.text((cx + 35, cy + 25), "Record Delivery Unit Issue", font=FONT_TITLE, fill=DARK)
    d.text((cx + 35, cy + 56), "Distribute stock to department office, faculty, or staff.", font=FONT_SMALL, fill=MUTED)
    d.line([(cx + 35, cy + 85), (cx + cw - 35, cy + 85)], fill=BORDER, width=1)

    d.rounded_rectangle((cx + 35, cy + 100, cx + cw - 35, cy + 160), radius=6, fill="#F8FAFC", outline=BORDER)
    d.text((cx + 50, cy + 112), "A4 Copy Paper 80gsm (SN-PAP-001)", font=FONT_BOLD, fill=DARK)
    d.text((cx + 50, cy + 135), "Current Available Balance: 25 Reams", font=FONT_SMALL_BOLD, fill=GREEN)

    d.text((cx + 35, cy + 180), "Quantity to Issue (Whole Number)", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 35, cy + 205, cx + cw - 35, cy + 250), radius=6, fill=LIGHT, outline="#CBD5E1")
    d.text((cx + 50, cy + 220), "5", font=FONT_HEADING, fill=CRIMSON)

    d.text((cx + 35, cy + 265), "Calculated Remaining Unit Balance: 20 Reams", font=FONT_SMALL_BOLD, fill=BLUE)

    d.text((cx + 35, cy + 300), "Receiving Office or End User", font=FONT_BOLD, fill=DARK)
    d.rounded_rectangle((cx + 35, cy + 325, cx + cw - 35, cy + 370), radius=6, fill=LIGHT, outline="#CBD5E1")
    d.text((cx + 50, cy + 340), "Dean's Office — Administrative Staff", font=FONT_BODY, fill=DARK)

    d.rounded_rectangle((cx + cw - 165, cy + 420, cx + cw - 35, cy + 465), radius=6, fill=CRIMSON)
    d.text((cx + cw - 135, cy + 433), "Save Issue", font=FONT_BOLD, fill=WHITE)

    d.rounded_rectangle((cx + cw - 275, cy + 420, cx + cw - 185, cy + 465), radius=6, fill=LIGHT, outline=BORDER)
    d.text((cx + cw - 250, cy + 433), "Cancel", font=FONT_BOLD, fill=DARK)

    draw_callout(d, (cx + 200, cy + 135), (90, 135), 1)
    draw_callout(d, (cx + 150, cy + 228), (90, 228), 2)
    draw_callout(d, (cx + 250, cy + 268), (90, 290), 3)
    draw_callout(d, (cx + 200, cy + 348), (90, 360), 4)
    draw_callout(d, (cx + cw - 100, cy + 442), (cx + cw + 80, cy + 442), 5)

    im = add_window_frame(im, "SupplySync — Record Delivery Unit Issue")
    im.save(OUT_DIR / "SC-16.png", optimize=True)
    FIGURE_SPECS["SC-16"] = [
        ("Selected Consumable & Unit Balance", "Confirms current physical stock held in Delivery Unit custody."),
        ("Quantity to Issue Input", "Whole integer specifying units to deduct (must be between 1 and available balance)."),
        ("Dynamic Balance Calculation", "Real-time preview of remaining stock after this distribution is saved."),
        ("Receiving Office or End User", "Mandatory recipient name or department designation for internal accountability."),
        ("Save Issue Confirmation Button", "Deducts stock immediately and logs the distribution into Stock Movements.")
    ]


# -------------------------------------------------------------
# SC-17: Generate Stock Card
# -------------------------------------------------------------
def make_sc_17():
    base_path = ROOT / "output" / "screenshots" / "inventory-staff" / "35-generate-stock-card.jpg"
    if base_path.exists():
        src = Image.open(base_path).convert("RGB")
        im = src.crop((270, 90, 1175, 800))
    else:
        im = Image.new("RGB", (900, 700), LIGHT)

    d = ImageDraw.Draw(im)
    draw_callout(d, (420, 240), (220, 200), 1)
    draw_callout(d, (420, 340), (220, 340), 2)
    draw_callout(d, (420, 450), (220, 450), 3)
    draw_callout(d, (750, 620), (840, 550), 4)

    im = add_window_frame(im, "SupplySync — Generate Appendix 58 Stock Card")
    im.save(OUT_DIR / "SC-17.png", optimize=True)
    FIGURE_SPECS["SC-17"] = [
        ("Reporting Period Options", "Select from All history, Current month, or a custom user-defined date span."),
        ("Custom Date Range Pickers", "Optional From and Through date inputs with chronological validation."),
        ("Target Item Reference", "Identifies the consumable item whose receipts and issues will populate the card."),
        ("Download PDF Action Button", "Produces the official COA Appendix 58 Stock Card with running balances.")
    ]


# -------------------------------------------------------------
# SC-18: My Unit Transaction History
# -------------------------------------------------------------
def make_sc_18():
    w, h = 1050, 560
    im = Image.new("RGB", (w, h), LIGHT)
    d = ImageDraw.Draw(im)

    cx, cy, cw, ch = 40, 30, w - 80, 500
    d.rounded_rectangle((cx, cy, cx + cw, cy + ch), radius=10, fill=WHITE, outline=BORDER)

    d.text((cx + 30, cy + 25), "Stock Movements & Unit Transaction History", font=FONT_TITLE, fill=DARK)
    d.text((cx + 30, cy + 55), "Account-scoped ledger of central warehouse receipts and local office distributions.", font=FONT_SMALL, fill=MUTED)
    d.line([(cx + 30, cy + 82), (cx + cw - 30, cy + 82)], fill=BORDER, width=1)

    d.rectangle((cx + 30, cy + 100, cx + cw - 30, cy + 140), fill="#F1F5F9")
    d.text((cx + 45, cy + 112), "Date & Time", font=FONT_SMALL_BOLD, fill=DARK)
    d.text((cx + 200, cy + 112), "Item / Reference", font=FONT_SMALL_BOLD, fill=DARK)
    d.text((cx + 460, cy + 112), "Movement", font=FONT_SMALL_BOLD, fill=DARK)
    d.text((cx + 580, cy + 112), "Quantity", font=FONT_SMALL_BOLD, fill=DARK)
    d.text((cx + 700, cy + 112), "Source / Recipient", font=FONT_SMALL_BOLD, fill=DARK)

    d.rectangle((cx + 30, cy + 140, cx + cw - 30, cy + 195), fill=WHITE, outline=BORDER)
    d.text((cx + 45, cy + 158), "12 Nov 2026, 02:45 PM", font=FONT_SMALL, fill=DARK)
    d.text((cx + 200, cy + 152), "A4 Copy Paper 80gsm", font=FONT_BOLD, fill=DARK)
    d.text((cx + 200, cy + 172), "Ref: RIS-2026-11-0042", font=FONT_SMALL, fill=MUTED)

    d.rounded_rectangle((cx + 460, cy + 155, cx + 540, cy + 180), radius=4, fill="#F0FDF4", outline="#BBF7D0")
    d.text((cx + 472, cy + 160), "Received", font=FONT_SMALL_BOLD, fill=GREEN)

    d.text((cx + 590, cy + 158), "+25", font=FONT_BOLD, fill=GREEN)
    d.text((cx + 700, cy + 158), "Supply Office (SPMO)", font=FONT_BODY, fill=DARK)

    d.rectangle((cx + 30, cy + 195, cx + cw - 30, cy + 250), fill="#F8FAFC", outline=BORDER)
    d.text((cx + 45, cy + 213), "12 Nov 2026, 03:15 PM", font=FONT_SMALL, fill=DARK)
    d.text((cx + 200, cy + 207), "A4 Copy Paper 80gsm", font=FONT_BOLD, fill=DARK)
    d.text((cx + 200, cy + 227), "Ref: UNIT-ISSUE-2026-001", font=FONT_SMALL, fill=MUTED)

    d.rounded_rectangle((cx + 460, cy + 210, cx + 540, cy + 235), radius=4, fill="#EFF6FF", outline="#BFDBFE")
    d.text((cx + 480, cy + 215), "Issued", font=FONT_SMALL_BOLD, fill=BLUE)

    d.text((cx + 590, cy + 213), "-5", font=FONT_BOLD, fill=BLUE)
    d.text((cx + 700, cy + 213), "Dean's Office — Admin Staff", font=FONT_BODY, fill=DARK)

    d.text((cx + 45, cy + 440), "Showing 1 to 2 of 2 records", font=FONT_SMALL, fill=MUTED)
    d.rounded_rectangle((cx + cw - 150, cy + 430, cx + cw - 30, cy + 465), radius=4, fill=LIGHT, outline=BORDER)
    d.text((cx + cw - 125, cy + 442), "Page 1 of 1", font=FONT_SMALL_BOLD, fill=DARK)

    draw_callout(d, (cx + 100, cy + 165), (cx + 100, cy + 300), 1)
    draw_callout(d, (cx + 500, cy + 168), (cx + 500, cy + 70), 2)
    draw_callout(d, (cx + 500, cy + 222), (cx + 500, cy + 310), 3)
    draw_callout(d, (cx + 780, cy + 215), (cx + 850, cy + 310), 4)

    im = add_window_frame(im, "SupplySync — Unit Transaction History & Movements")
    im.save(OUT_DIR / "SC-18.png", optimize=True)
    FIGURE_SPECS["SC-18"] = [
        ("Date & Chronological Ordering", "Timestamped movement trail recording when stock was received or issued."),
        ("Received Movement Badge (+Qty)", "Documents inbound stock releases credited from the central Supply Office."),
        ("Issued Movement Badge (-Qty)", "Documents local distributions deducted for departmental faculty and staff."),
        ("Source or Recipient Column", "Traceability reference confirming where stock came from or who received it.")
    ]


# -------------------------------------------------------------
# SC-19: Self Scoped Coordinator Login Audit
# -------------------------------------------------------------
def make_sc_19():
    base_path = ROOT / "tmp" / "extracted_assets" / "coordinator-login-audit-preview.jpg"
    if base_path.exists():
        src = Image.open(base_path).convert("RGB")
        im = src.crop((0, 0, min(src.width, 1265), min(src.height, 900)))
    else:
        im = Image.new("RGB", (1100, 750), LIGHT)

    d = ImageDraw.Draw(im)
    draw_callout(d, (480, 160), (280, 100), 1)
    draw_callout(d, (750, 260), (950, 200), 2)
    draw_callout(d, (500, 420), (300, 420), 3)
    draw_callout(d, (850, 160), (1050, 100), 4)

    im = add_window_frame(im, "SupplySync — Coordinator Login Audit")
    im.save(OUT_DIR / "SC-19.png", optimize=True)
    FIGURE_SPECS["SC-19"] = [
        ("Authentication Summary Metrics", "Total, successful, and failed login counts for the signed-in coordinator."),
        ("Status & Date Range Filters", "Isolate authentication events by Successful Login, Failed Login, or Logged Out."),
        ("Login Event Forensics", "Detailed timestamp, client IP address, operating system, and browser agent."),
        ("Self-Scoped Security Boundary", "Strict system policy ensuring coordinators only review their own authentication events.")
    ]


# -------------------------------------------------------------
# SC-20: Supply Coordinator Account Settings
# -------------------------------------------------------------
def make_sc_20():
    base_path = ROOT / "output" / "screenshots" / "inventory-staff" / "54-account-profile.jpg"
    if base_path.exists():
        src = Image.open(base_path).convert("RGB")
        im = src.crop((290, 395, 1425, 1050))
    else:
        im = Image.new("RGB", (1100, 650), LIGHT)

    d = ImageDraw.Draw(im)
    draw_callout(d, (200, 45), (100, 120), 1)
    draw_callout(d, (850, 380), (1000, 300), 2)
    draw_callout(d, (450, 220), (250, 220), 3)
    draw_callout(d, (950, 560), (1050, 480), 4)

    im = add_window_frame(im, "SupplySync — Account Settings & Profile")
    im.save(OUT_DIR / "SC-20.png", optimize=True)
    FIGURE_SPECS["SC-20"] = [
        ("Account Settings Tabs", "Seamless navigation between Profile info, Security credentials, and Login History."),
        ("Locked Role & Unit Designation", "Administrative assignments that cannot be changed from the personal user profile."),
        ("Editable Identity Fields", "Update permitted contact name and institutional email address."),
        ("Save Profile Changes Button", "Applies profile modifications and triggers re-verification if email was updated.")
    ]


# -------------------------------------------------------------
# SC-21: Password and OTP Security Flow
# -------------------------------------------------------------
def make_sc_21():
    base_path = ROOT / "output" / "screenshots" / "inventory-staff" / "55-account-security.jpg"
    if base_path.exists():
        src = Image.open(base_path).convert("RGB")
        im = src.crop((290, 395, 1425, 1160))
    else:
        im = Image.new("RGB", (1100, 750), LIGHT)

    d = ImageDraw.Draw(im)
    draw_callout(d, (450, 250), (200, 250), 1)
    draw_callout(d, (550, 480), (300, 480), 2)
    draw_callout(d, (850, 480), (1020, 420), 3)
    draw_callout(d, (850, 680), (1020, 620), 4)

    im = add_window_frame(im, "SupplySync — Password & OTP Security Verification")
    im.save(OUT_DIR / "SC-21.png", optimize=True)
    FIGURE_SPECS["SC-21"] = [
        ("Password Credential Inputs", "Enter current password followed by the new compliant replacement password."),
        ("6-Digit Email OTP Verification", "Enter the one-time verification code sent to the registered institutional inbox."),
        ("Expiration & Resend Cooldown", "Visual timer protecting against brute-force attacks and rate-limiting new codes."),
        ("Verify & Update Password Button", "Validates the one-time code and commits the password update securely.")
    ]


def main():
    print("Generating 21 illustrated screenshots...")
    make_sc_01()
    make_sc_02()
    make_sc_03()
    make_sc_04()
    make_sc_05()
    make_sc_06()
    make_sc_07()
    make_sc_08()
    make_sc_09()
    make_sc_10()
    make_sc_11()
    make_sc_12()
    make_sc_13()
    make_sc_14()
    make_sc_15()
    make_sc_16()
    make_sc_17()
    make_sc_18()
    make_sc_19()
    make_sc_20()
    make_sc_21()
    print(f"Successfully generated all 21 illustrated figures in {OUT_DIR}")
    # Export specs as JSON for the Word builder
    import json
    spec_file = OUT_DIR / "figure_specs.json"
    spec_file.write_text(json.dumps(FIGURE_SPECS, indent=2), encoding="utf-8")
    print(f"Saved figure specs to {spec_file}")


if __name__ == "__main__":
    main()
