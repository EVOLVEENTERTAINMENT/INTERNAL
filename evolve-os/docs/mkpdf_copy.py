import sys,json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from xml.sax.saxutils import escape
st=getSampleStyleSheet()
H=ParagraphStyle('h',parent=st['Heading2'],fontName='Helvetica-Bold',fontSize=13,spaceBefore=10,spaceAfter=4)
B=ParagraphStyle('b',parent=st['BodyText'],fontName='Helvetica',fontSize=10.5,leading=15)
C=ParagraphStyle('c',parent=B,fontSize=9,leading=12)
N=ParagraphStyle('n',parent=C,textColor=colors.HexColor('#555555'))
T=ParagraphStyle('t',parent=st['Title'],fontName='Helvetica-Bold',fontSize=18,alignment=0)
a=json.load(open(sys.argv[2]))
s=[Paragraph("Copy sweep: board wording",T),
 Paragraph("12 October 2026. Every line of on-screen wording was read, 598 in all. %d sound off. Each one is below, as it reads now and as it would read. Nothing changes on the board until you say so."%len(a),B),
 Paragraph("The worst ones",H)]
worst=[7668,14712,16866,13193,23839,16108,15216,6285]
rows=[[Paragraph("<b>Now</b>",C),Paragraph("<b>Would read</b>",C)]]
for x in a:
    if x['line'] in worst: rows.append([Paragraph(escape(x['old']),C),Paragraph(escape(x['new']),C)])
def tbl(r):
    t=Table(r,colWidths=[245,245],repeatRows=1)
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,-1),0.3,colors.HexColor('#cccccc')),('BOTTOMPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),4)]))
    return t
s.append(tbl(rows))
s.append(Paragraph("All %d, in order down the board"%len(a),H))
rows=[[Paragraph("<b>Now</b>",C),Paragraph("<b>Would read</b>",C)]]
for x in a: rows.append([Paragraph(escape(x['old']),C),Paragraph(escape(x['new']),C)])
s.append(tbl(rows))
s.append(Paragraph("Kept the same on purpose",H))
s.append(Paragraph("Your approved words stay: Close the day, Catch up, carried, Needs you, Overview, People, Log, Inbox. Wording Claude writes for you each morning is not in here, it comes from the morning task. That task can get the same rules if you want.",B))
SimpleDocTemplate(sys.argv[1],pagesize=letter,leftMargin=56,rightMargin=56,topMargin=50,bottomMargin=50,title="Evolve OS copy sweep").build(s)
