from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
import json, math, shutil, sys, re

ROOT=Path(__file__).resolve().parents[2]
QA=ROOT/'.qa_inventory_staff_illustrated'
RAW=ROOT/'output/screenshots/inventory-staff'
ART=QA/'annotated'
spec=json.loads((QA/'annotation_manifest.json').read_text(encoding='utf-8'))
S={int(k):v for k,v in spec['specs'].items()}
manifest=json.loads((RAW/'manifest.json').read_text(encoding='utf-8'))['screenshots']
def point(n,i,x,y,text=None):
    S[n][1][i-1][0:2]=[x,y]
    if text: S[n][1][i-1][2]=text
def crop(n,box): S[n][0]=box
def masks(n,boxes): S[n][2]=boxes
point(1,3,1340,850)
point(2,4,1258,480)
point(4,1,565,650); point(4,2,550,756); point(4,3,916,756)
point(7,1,1270,470); point(7,2,1293,514); point(7,3,1290,555); crop(7,[1140,365,1415,580])
point(8,1,700,492); point(8,2,710,595); point(8,3,910,695); crop(8,[480,385,985,730])
point(9,1,665,260); point(9,3,570,320); point(9,4,1363,466,'Check the receiving date and compare received and remaining batch quantities.'); crop(9,[290,60,1425,950])
point(10,2,700,424); point(10,3,670,656); point(10,4,867,823)
point(11,2,738,457); point(11,3,745,567); masks(11,[[630,389,930,414]])
point(12,3,710,725); point(12,4,865,881); masks(12,[[516,277,749,299]])
point(15,1,838,491); point(15,2,1210,491); point(15,3,760,845); point(15,4,680,1125)
crop(15,[320,450,1400,1270]); masks(15,[[345,691,618,714],[1108,578,1360,600],[347,1150,1070,1175]])
crop(16,[270,500,1170,1305]); point(16,1,571,563); point(16,2,716,785); point(16,3,1020,1260,'Use Download PDF or Print for the archived RIS after reviewing the form.')
masks(16,[[460,1132,1080,1170]])
point(18,3,1278,565); masks(18,[[512,506,650,1030]])
crop(22,[383,130,1057,1000]); point(22,1,558,391); point(22,2,796,696); point(22,3,715,839)
masks(22,[[420,285,670,312],[420,821,1010,865]])
crop(26,[783,455,1406,1060]); point(26,1,997,680,'Manual Tag Entry is the approved fallback when a physical reader is unavailable.')
point(26,2,1080,830); point(26,3,1230,895,'Simulate Scan passes the entered identifier through the scan workflow; verify the selected item before continuing.')
point(27,1,570,343); point(27,2,1290,343); point(27,3,1296,479); point(27,4,1362,479)
masks(27,[[616,456,790,1048]])
crop(28,[463,70,978,931]); point(28,1,625,309); point(28,2,635,527); point(28,3,658,724); point(28,4,867,891)
crop(29,[431,135,1009,869]); point(29,2,660,514); point(29,3,670,663); point(29,4,907,827)
masks(29,[[495,384,900,407]])
point(30,2,655,528); point(30,3,673,726); point(30,4,900,877)
masks(30,[[706,278,961,309],[480,514,704,548]])
point(31,1,540,325); point(31,2,929,325); point(31,3,1085,325); point(31,4,1390,481)
masks(31,[[904,758,1020,781]])
crop(32,[270,190,1170,814]); point(32,1,732,413); point(32,2,578,552); point(32,3,596,691); point(32,4,1040,772)
for n in [34,35,36]: crop(n,[270,S[n][0][1],1175,S[n][0][3]])
for n in [38,39,41]:
    point(n,2,S[n][1][1][0],S[n][1][1][1]+100)
crop(40,[230,150,1260,885]); point(40,3,1150,837)
masks(38,[[950,372,1170,394]])
masks(39,[[380,720,1080,760]])
masks(41,[[343,662,1100,697],[350,763,1100,823]])
point(43,1,730,1650,'Compare the highest and lowest requesting offices using the selected ranking metric.')
point(43,2,1220,1940,'Select an office for Departmental Item Demand Analysis.')
point(43,3,716,2200,'Compare requested and issued item quantities for the selected office.'); crop(43,[320,1430,1405,2470])
point(44,1,738,1620); point(44,2,928,2200,'Compare Quantity requested and Supplies issued in the item records table.')
point(44,3,1310,2000,'Use Search requested items or Export CSV for the item records.'); crop(44,[320,1440,1405,2540])
point(45,1,763,1690,'Compare monthly requested and issued quantities in Supply Requisition Trends.')
point(45,2,855,2919,'Choose the quantity metric for the departmental demand heatmap.')
point(45,3,1230,3070,'Darker cells show greater demand for an office in the selected month.')
point(48,2,1100,812,'Review the Canonical Event and the account mapping for the selected login.')
point(49,1,468,565); point(49,2,529,644); point(49,3,340,706)
point(51,1,553,586); point(51,2,1210,660); point(51,3,533,950)
point(52,2,817,647)
point(53,1,733,252); point(53,2,530,514); point(53,3,1182,775)
masks(53,[[387,677,694,724],[387,1112,694,1155],[387,785,697,810],[387,914,697,942],[387,1025,697,1052],[883,931,1040,987]])
point(54,3,1265,817)
masks(55,[[422,1090,655,1113]])
crop(57,[0,95,288,520]); point(57,2,226,236,'Review each recent request status, such as Released or Issued.')
point(57,3,150,180,'The menu shows unread alerts and requests awaiting approval.')
masks(57,[[28,226,134,244],[28,290,134,310],[28,421,136,439]])
point(59,2,535,1003); point(59,3,521,1064); masks(59,[[410,991,686,1016]])
point(60,1,625,885); point(60,2,467,1131); point(60,3,711,1285)
masks(60,[[428,946,1368,973],[398,1057,1362,1084]])
crop(62,[1250,140,1418,298]); point(62,1,1341,190); point(62,2,1341,231); point(62,3,1341,270)

font=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',27)
def annotate(n):
    bounds,points,boxes=S[n]
    src=Image.open(RAW/manifest[n-1]['file']).convert('RGB')
    d=ImageDraw.Draw(src)
    for box in boxes: d.rectangle(box,fill='#E5E7EB')
    if n==45:
        a=src.crop((290,1430,1425,1890)); b=src.crop((290,2820,1425,3520))
        im=Image.new('RGB',(1135,1200),'white'); im.paste(a,(0,0)); im.paste(b,(0,500))
        targets=[(x-290,y-1430 if y<2000 else y-2820+500,t) for x,y,t in points]
    else:
        im=src.crop(bounds); targets=[(x-bounds[0],y-bounds[1],t) for x,y,t in points]
    d=ImageDraw.Draw(im)
    for i,(x,y,_) in enumerate(targets,1):
        assert 0<=x<im.width and 0<=y<im.height,(n,i,x,y,im.size)
        bx=max(24,min(im.width-24,x-83 if x>im.width/2 else x+83))
        by=max(24,min(im.height-24,y-45))
        # Put the theme badges to the left of their compact menu rows.
        if n==62: bx,by=24,y
        vx,vy=x-bx,y-by; l=math.hypot(vx,vy); ux,uy=vx/l,vy/l
        d.line([(bx+ux*22,by+uy*22),(x,y)],fill='white',width=8)
        d.line([(bx+ux*22,by+uy*22),(x,y)],fill='#C21829',width=4)
        d.polygon([(x,y),(x-ux*14-uy*7,y-uy*14+ux*7),(x-ux*14+uy*7,y-uy*14-ux*7)],fill='#C21829')
        d.ellipse((bx-22,by-22,bx+22,by+22),fill='#C21829',outline='white',width=3)
        bb=d.textbbox((0,0),str(i),font=font)
        d.text((bx-(bb[2]-bb[0])/2,by-(bb[3]-bb[1])/2-bb[1]),str(i),font=font,fill='white')
    im.save(ART/f'INV-{n:02d}.png',optimize=True)

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    for n in S: annotate(n)
    source=QA/'Inventory_Staff_Illustrated_Source.docx'
    backup=QA/'source_before_refinement.docx'
    if not backup.exists(): shutil.copy2(source,backup)
    doc=Document(backup); ps=doc.paragraphs
    for j,p in enumerate(ps):
        m=re.match(r'Figure INV-(\d\d)',p.text)
        if not m: continue
        n=int(m.group(1)); ip=ps[j+1]
        for r in list(ip._p): ip._p.remove(r)
        im=Image.open(ART/f'INV-{n:02d}.png')
        width=min(6.77,6.4*im.width/im.height)
        if im.width<500: width=min(width,3.5)
        ip.add_run().add_picture(str(ART/f'INV-{n:02d}.png'),width=Inches(width))
        ip.alignment=WD_ALIGN_PARAGRAPH.CENTER; ip.paragraph_format.keep_with_next=True
        for k,(_,_,text) in enumerate(S[n][1],1):
            lp=ps[j+1+k]; lp.clear(); lp.add_run(f'Pointer {k}: ').bold=True; lp.add_run(text)
            lp.paragraph_format.keep_with_next=True
    replacements={
      'Select Direct Stock Issuance to open the form, then use Record Issuance to save the completed voucher.':'Select Record Issuance.',
      'Open Approvals & Request Queue and expand':'Open Requisition Approval Workspace and expand',
      'Select the theme control in the sidebar user area and choose the preferred available theme.':'Select the theme control at the upper-right of Dashboard and choose Light, Dark or System.',
      'Select Submit Tag':'Select Simulate Scan',
      'Inventory Staff-only procedures and screenshot capture directions':'Inventory Staff procedures with live screenshots and numbered pointers',
      'Use demonstration records when capturing screenshots.':'Use demonstration records when rehearsing procedures.',
    }
    direct=False
    for p in doc.paragraphs:
        if p.text.startswith('8.2 Record a Direct Issuance'): direct=True
        elif p.style.name.startswith('Heading') and not p.text.startswith('8.2'): direct=False
        for a,b in replacements.items():
            for r in p.runs:
                if a in r.text: r.text=r.text.replace(a,b)
        if direct and p.text=='1. Select Record Issuance.': p.text='1. Select Direct Stock Issuance.'
    doc.save(source)
    assert len(doc.inline_shapes)==64, len(doc.inline_shapes)
    spec['specs']=S; spec['pointers']=sum(len(s[1]) for s in S.values())
    (QA/'refined_annotation_manifest.json').write_text(json.dumps(spec,indent=2),encoding='utf-8')
    # Contact sheets for visual inspection of every numbered figure.
    files=sorted(ART.glob('INV-*.png'))
    for i in range(0,len(files),6):
        canvas=Image.new('RGB',(1740,1350),'white'); d=ImageDraw.Draw(canvas)
        for j,f in enumerate(files[i:i+6]):
            im=Image.open(f); im.thumbnail((550,630)); x,y=(j%3)*580+15,(j//3)*675+30
            canvas.paste(im,(x,y)); d.text((x,y-18),f.stem,fill='black')
        canvas.save(ART/f'contact-{i//6+1:02d}.jpg')
    print('Refined 62 figures and 219 pointer legends')

if __name__=='__main__': main()
