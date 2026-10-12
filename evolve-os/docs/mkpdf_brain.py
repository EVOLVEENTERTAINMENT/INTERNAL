import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
st=getSampleStyleSheet()
H=ParagraphStyle('h',parent=st['Heading2'],fontName='Helvetica-Bold',fontSize=13,spaceBefore=12,spaceAfter=4)
B=ParagraphStyle('b',parent=st['BodyText'],fontName='Helvetica',fontSize=10.5,leading=15)
T=ParagraphStyle('t',parent=st['Title'],fontName='Helvetica-Bold',fontSize=18,alignment=0)
def bl(items): return ListFlowable([ListItem(Paragraph(i,B),leftIndent=12) for i in items],bulletType='bullet',start='•',leftIndent=12)
s=[Paragraph("A board that thinks: the plan",T),
 Paragraph("12 October 2026. Built from four research passes: your board's code, what the board's built in Claude can do, what your data already knows, and how the best apps do this.",B),

 Paragraph("The short answer",H),
 Paragraph("Yes, it can be built inside the board. The board can already ask Claude. Today it asks with almost no memory, and it treats a pasted list as one note. The fix is a memory the board keeps and a dump chat that uses it.",B),

 Paragraph("Why it feels dumb today",H),
 bl(["Paste 50 lines and you get <b>one</b> note, not 50. It only splits on blank lines.",
     "When Claude sorts, it is not given your projects, your clients or your people. So it cannot know that \"the Lloyd thing\" is the HLE website.",
     "The board knows only 4 people in writing (Gavin, Grace, Sue, Christie) and 4 short forms (LOVC, CR Photography, BOOS and BREWS, HHC). Mary E, your sister, the dog trainers: none of them are written down anywhere.",
     "It never remembers a correction. If you fix where something went, nothing learns from it.",
     "The chat does not save your conversation after a good answer. Only after an error. That is a bug.",
     "Sorting can say task, deadline, decision or note, but some of those have nowhere to go."]),

 Paragraph("What it would do",H),
 Paragraph("<b>1. Dump.</b> Paste or speak the whole list into one box. Nothing is decided while you type.",B),
 Paragraph("<b>2. It thinks.</b> One Claude call reads every line with your memory in front of it: your projects, people, short forms and the rules you have taught it. Every line comes back accounted for, for example \"50 in. 41 tasks, 4 waiting on someone, 3 merged with ones you already had, 2 notes\". Nothing silently disappears.",B),
 Paragraph("<b>3. It asks only what it cannot know.</b> At most a few questions, as buttons. \"Who is Mary E?\" Girlfriend, family, client, someone else. You can also just type back like a normal chat: \"no, that goes to Grace\".",B),
 Paragraph("<b>4. You check, fast.</b> Items are grouped by where they will go. The sure ones take one tap: Accept 31. Only the unsure ones get a card each. Each item shows your original line under it. One undo takes back the whole batch.",B),
 Paragraph("<b>5. It remembers.</b> When you answer a question or fix something, it offers to remember it: \"Mary E is your girlfriend. Remember?\" Only a yes saves it. Next dump it already knows.",B),

 Paragraph("The memory bank",H),
 bl(["<b>People.</b> Name, who they are to you (team, client, family, friend, vendor), which project or part of life they belong to, nicknames, phone and email so a text from a number gets a name.",
     "<b>Words.</b> Your short forms and what they mean: Vue, the party, the poster, the car.",
     "<b>Rules.</b> Where things go, in your words: \"anything for Grace that is a chore goes on her list\".",
     "<b>Past calls.</b> Where things actually went, so it copies your habits.",
     "A <b>Memory page</b> where you can see every one of these, where it came from, and change or delete it.",
     "It starts filled with what the board already knows: your projects, the 4 people, the 4 short forms, Gavin's and Grace's days. It learns the rest from your dumps."]),

 Paragraph("What it will not do",H),
 bl(["File anything without you seeing it first, except what you accept.",
     "Make up a date. If your line says \"Friday\", it shows the date it worked out next to the word you used. No word, no date.",
     "Make up a project. It picks from your real ones, or puts it in Unsorted.",
     "Remember anything you did not say yes to.",
     "Send, schedule or write to ClickUp. Calendar moves still go to the approval list."]),

 Paragraph("What it costs",H),
 Paragraph("It uses your own Claude plan from inside the board, the same as the Ask chat today. About one longer call per dump and one short call per answer you give it. No new service, no new bill. If you hit your limit it says so and keeps your list.",B),

 Paragraph("Build order, suggested",H),
 bl(["<b>Step 1.</b> Fix the chat saving bug. Make a long paste split into separate lines. Give the sorter your real projects, clients and people. Start the memory bank from what the board already knows. You will notice sorting gets smarter with no new screen.",
     "<b>Step 2.</b> The dump chat: one box, the thinking, the questions as buttons, the grouped check with Accept and Undo.",
     "<b>Step 3.</b> The Memory page and \"Remember this?\" after each correction.",
     "Each step gets your wording before it goes live, the same as always."]),

 Paragraph("One thing I need from you",H),
 Paragraph("Which step to start with. I would start with Step 1, because Steps 2 and 3 need the memory bank it builds.",B)]
SimpleDocTemplate(sys.argv[1],pagesize=letter,leftMargin=60,rightMargin=60,topMargin=56,bottomMargin=56,title="Evolve OS brain plan").build(s)
