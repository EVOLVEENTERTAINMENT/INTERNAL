import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
st=getSampleStyleSheet()
H=ParagraphStyle('h',parent=st['Heading2'],fontName='Helvetica-Bold',fontSize=13,spaceBefore=12,spaceAfter=4)
B=ParagraphStyle('b',parent=st['BodyText'],fontName='Helvetica',fontSize=10.5,leading=15)
T=ParagraphStyle('t',parent=st['Title'],fontName='Helvetica-Bold',fontSize=18,alignment=0)
def bl(items): return ListFlowable([ListItem(Paragraph(i,B),leftIndent=12) for i in items],bulletType='bullet',start='•',leftIndent=12)
s=[Paragraph("Evolve OS audit, 8 October 2026",T),
 Paragraph("Live now as V137 at claude.ai/artifact/KmwskLGeZxU6vG284njSfR",B),
 Paragraph("What was checked",H),
 bl(["Every button on 19 screens, pressed one by one, on a desktop and a phone size. About 1,150 presses each. No errors, nothing off the edge of the screen.",
     "Every calendar, email and message call, checked against the real Google tools.",
     "Your rules: nothing writes your calendar without your tap, nothing sends email or texts, nothing touches ClickUp. All held."]),
 Paragraph("Fixed in V137",H),
 bl(["<b>Reassign could undo a move you made in Google.</b> If you moved a block in Google after staging a reassign, Approve dragged it back. Now it holds the change and tells you why.",
     "<b>Meet links were never picked up.</b> Google names that field differently than the page expected. Fixed.",
     "<b>Email triage read the oldest message in a thread</b>, often your own sent mail, not the reply. It now reads the newest.",
     "<b>The calendar chips on the board forgot their on and off</b> after a reload. They remember now.",
     "<b>After an undo the board could show the old view</b> for a few minutes. It now refreshes.",
     "Screen readers now find a proper title on every page. Nothing you see changed."]),
 Paragraph("Needs your call, one at a time",H),
 bl(["<b>Deletes cannot be undone.</b> Deleting a project, client, lead, invoice, deliverable, task or milestone is gone for good. A recycle bin would fix it.",
     "<b>Approve still writes if Google does not answer the safety check.</b> Holding it back needs one line of wording from you.",
     "<b>+15, +30 and +1h move the rest of the day on one tap</b>, up to 12 blocks, with no preview.",
     "<b>Words that bend your rule</b>, COPY REQUIRED: \"Nothing is overdue. It was all carried.\", the Settings heading \"Nothing is overdue\", \"Slipped, and what carries\", help text \"done, moved or missed\", \"The things that get missed because no block exists\", and \"Carried, not failed.\""]),
 Paragraph("Smaller things written down for later",H),
 Paragraph("Unused styles, records that only ever grow, a time zone detail on calendar moves, and email searches that stop at 25 results. All in the build ledger. None of them is hurting anything today.",B),
 Paragraph("If you want it back",H),
 Paragraph("Open the artifact's version history. V136 is version 137.",B)]
SimpleDocTemplate(sys.argv[1],pagesize=letter,leftMargin=60,rightMargin=60,topMargin=56,bottomMargin=56,title="Evolve OS audit").build(s)
