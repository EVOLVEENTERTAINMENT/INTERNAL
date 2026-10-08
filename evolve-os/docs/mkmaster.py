import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
st=getSampleStyleSheet()
T=ParagraphStyle('t',parent=st['Title'],fontName='Helvetica-Bold',fontSize=19,alignment=0,spaceAfter=4)
H=ParagraphStyle('h',parent=st['Heading2'],fontName='Helvetica-Bold',fontSize=13.5,spaceBefore=14,spaceAfter=5)
B=ParagraphStyle('b',parent=st['BodyText'],fontName='Helvetica',fontSize=10,leading=14)
C=ParagraphStyle('c',parent=B,fontSize=9,leading=12)
CB=ParagraphStyle('cb',parent=C,fontName='Helvetica-Bold')
def tbl(head,rows,w):
    data=[[Paragraph(h,CB) for h in head]]+[[Paragraph(str(c),C) for c in r] for r in rows]
    t=Table(data,colWidths=w,repeatRows=1)
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#EDEBE6')),
      ('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,-1),0.4,colors.HexColor('#CFCBC2')),
      ('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    return t
exec(open(sys.argv[2]).read())
doc=SimpleDocTemplate(sys.argv[1],pagesize=letter,leftMargin=50,rightMargin=50,topMargin=48,bottomMargin=48,title="Evolve OS master list")
doc.build(S)
