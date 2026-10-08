import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
st=getSampleStyleSheet()
H=ParagraphStyle('h',parent=st['Heading2'],fontName='Helvetica-Bold',fontSize=13,spaceBefore=12,spaceAfter=4)
B=ParagraphStyle('b',parent=st['BodyText'],fontName='Helvetica',fontSize=10.5,leading=15)
T=ParagraphStyle('t',parent=st['Title'],fontName='Helvetica-Bold',fontSize=18,alignment=0)
def bl(items): return ListFlowable([ListItem(Paragraph(i,B),leftIndent=12) for i in items],bulletType='bullet',start='•',leftIndent=12)
s=[Paragraph("Evolve OS, V134 to V136",T),
 Paragraph("8 October 2026. Live now at claude.ai/artifact/KmwskLGeZxU6vG284njSfR",B),
 Paragraph("What changed",H),
 Paragraph("Anything on a project or deliverable whose date has passed now says carried. Nothing on those screens says late, over or past any more.",B),
 bl(["Full: <b>carried 9 days</b>","Short: <b>9d carried</b>","As a label or filter: <b>Carried</b>",
     "Home Owed row: the word carried shows once, then <b>9 days</b>"]),
 Paragraph("What stayed the same",H),
 bl(["Invoices still say late and past due, as you chose.",
     "The draft chase Claude writes to a client. That goes to them, not you.",
     "Lines that already say nothing is late, like \"Nothing is late, they just have not happened yet.\"",
     "No logic, no data and no connectors changed. Only wording."]),
 Paragraph("Five lines I had to word. COPY REQUIRED, your call",H),
 Paragraph("These go a little past the straight swap. Keep them or give me your wording.",B),
 bl(["Company summary: <b>Brand film cut, carried 9 days</b>, then <b>Acme is waiting. Move it or move the date.</b>",
     "Needs You, grouped: <b>3 things for Acme are carried</b>",
     "Needs You, add on: <b>One other thing on it is already carried behind this.</b>",
     "Workspace next move: <b>The next move, carried 3 days</b>",
     "Home Owed row: right side now just <b>9 days</b>"]),
 Paragraph("How it was checked",H),
 Paragraph("Every screen was opened on test data with carried work and a late invoice, at desktop and phone width. No errors. The only late wording left is on invoices. No dashes show anywhere.",B),
 Paragraph("If you want it back",H),
 Paragraph("Open the artifact's version history. V133 is version 134.",B)]
SimpleDocTemplate(sys.argv[1],pagesize=letter,leftMargin=60,rightMargin=60,topMargin=56,bottomMargin=56,title="Evolve OS V134 to V136").build(s)
