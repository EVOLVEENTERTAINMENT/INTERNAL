import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
st=getSampleStyleSheet()
H=ParagraphStyle('h',parent=st['Heading2'],fontName='Helvetica-Bold',fontSize=13,spaceBefore=12,spaceAfter=4)
H3=ParagraphStyle('h3',parent=st['Heading3'],fontName='Helvetica-Bold',fontSize=11,spaceBefore=8,spaceAfter=2)
B=ParagraphStyle('b',parent=st['BodyText'],fontName='Helvetica',fontSize=10.5,leading=15)
T=ParagraphStyle('t',parent=st['Title'],fontName='Helvetica-Bold',fontSize=18,alignment=0)
def bl(items): return ListFlowable([ListItem(Paragraph(i,B),leftIndent=12) for i in items],bulletType='bullet',start='•',leftIndent=12)
def nl(items): return ListFlowable([ListItem(Paragraph(i,B),leftIndent=12) for i in items],bulletType='1',leftIndent=12)

s=[Paragraph("Evolve OS build plan",T),
 Paragraph("6 November 2026. For Jackson. The Mac app first, the iPhone after.",B),

 Paragraph("Where things stand",H),
 bl(["The Mac app opens your board (now V187) on its own, with the data on Supabase (EVOLVE OPS). The installer is on GitHub and you have opened it.",
     "Every build opens the app on a real Mac at GitHub and clicks all 11 tabs. Until today that could not fail: it only checked that a file was written.",
     "The board on claude.ai is still where your data lives. The move waits until you are ready to switch for good.",
     "I read your two spec documents (CORE and LIBRARY, 16 October). Most of what they ask for needs either your words on screen or a decision from you. The list of those is below. Everything that needs neither is being built now."]),

 Paragraph("Built today (nothing new to read on screen)",H),
 Paragraph("1. The app checks itself",H3),
 bl(["A check run that starts the real app on a made up board and works every screen through it: Home, Board, Inbox, Projects, Pipeline, Money, People, Deliverables, Leads, Brain and Settings. It writes records, bins and restores, stages a calendar change against a stand in calendar, runs the brain dump against a stand in Claude, downloads the data file and reads it back.",
     "It runs on every build, on Linux and on the Mac at GitHub, and the build fails when any check fails. The tab tour now fails on an error too."]),
 Paragraph("2. Fixes found while reading the app",H3),
 bl(["A person or record whose name has a space was refused by the app and the board said Not saved. Fixed.",
     "Once on Supabase, a record deleted on one device did not disappear on another until a reload. Fixed.",
     "When the board gave up on a slow Claude answer after 75 seconds, the call kept running in the background and kept costing. Now it stops.",
     "Bringing in board data a second time broke the version checks that protect later writes. Fixed.",
     "Long lists (ideas, activity) were downloaded whole from Supabase and cut afterwards. Now the server cuts them.",
     "A bad record id in a data file no longer stops the whole Bring in; it is skipped and logged.",
     "The app now keeps a daily count of Claude tokens used, per tier, in the data. Nothing shows yet; the figure waits for your wording and your ceiling."]),
 Paragraph("3. Switch day pieces",H3),
 bl(["Each nightly task will sign its writes with its own id, check the off switch first, and run on Auburn time. The script they use can no longer take a key from an environment variable.",
     "A voice note sent twice by a flaky phone connection is filed once, once the iPhone shortcut sends its own id with each note.",
     "The money engine's own tests now run with the app's tests so it stays good until it is wired to the page."]),
 Paragraph("4. Board V186 and V187",H3),
 bl(["Download data now includes four more collections (daily_brief, ledger, daysig, arrivals). The board reads daily_brief; the other three are named in your spec, so they are carried in case they hold anything.",
     "Inside the app, the Connections rows for Google Calendar and Gmail say off when Google is not connected, instead of live.",
     "The banner film on Home was rebuilt from scratch every time the page redrew, so it started over and over as your data loaded (37 times in one open). It is now built once. Found because the GitHub Mac could not finish reloading the board after Bring in; it does now.",
     "No wording changed. A word check now runs on the board file and lists any visible line that uses one of the four words on your never list, and any dash."]),

 Paragraph("Waiting on your words (I do not write what you read)",H),
 bl(["Quick capture section in Settings: inside the app the line is served by the app once you sign in, so the text about adding a connector in Claude settings is wrong there. Needs one or two lines from you, with a screenshot.",
     "The iPhone voice shortcut: a small Settings piece that shows the key and address for the shortcut.",
     "A health strip on Home: last good run of each nightly task, last calendar read, last Gmail read, texts not checked since a time.",
     "Claude use and a monthly ceiling on the Money page.",
     "One old line the word check found on a project workspace page, under the counters, uses one of those four words in the sense of position. Your call whether to reword it.",
     "The carried list with its three exits, and the yes line with a numbered list, both from the spec."]),

 Paragraph("Waiting on your decision, one at a time",H),
 Paragraph("I will ask these one by one. The first is the only one I need right now.",B),
 nl(["First run. Click Download data on the claude.ai board (Settings, Backup) and tell me the number of records it saved.",
     "Duplicate project records. Your spec says the board holds more than one record for some projects. Before the move: back them up and delete the extras, or leave them and let the app fold them on screen as it does now.",
     "Who sees money. Only you and Gavin, locked for real. Or Gavin and Grace see everything. Or something else. The app has one login today, yours, so nobody else sees anything yet.",
     "Messages. The spec from October says a message may go out after you say yes to it by number. Your rule to me is draft only, never send. Which stands.",
     "Your own solo calendar blocks. The spec says the assistant may move them and tell you after, with undo. Your rule to me is tell you before any calendar change. Which stands.",
     "Who keeps the board current. You plan your calendar and Grace keeps the board, or Grace keeps both and you approve.",
     "Where the money bar numbers come from. Typed in by you, QuickBooks, or the bank accounts.",
     "Texts. The app reads Messages only while its Mac is awake. Keep it that way, or set up a Mac that stays on.",
     "Look. Matte as it is, or liquid glass."]),
 Paragraph("Also needed from you, when you get to them: the Anthropic key in the app Settings (needs credit), the Google Cloud desktop client for Calendar and Gmail, and later the Apple Developer account.",B),

 Paragraph("What comes next",H),
 bl(["Your first run: Download data, then Bring in board data to look around, or sign in to switch for good.",
     "The check run grows with every feature we touch, and runs against your real data copy once you have switched.",
     "Then, in the order you choose from the list above: the health strip, the money engine on the page, crew sheets and timers, the iPhone app."]),

 Paragraph("How today's work was checked",H),
 bl(["All app tests pass on Linux against a real Postgres loaded with the schema file, and the app tours and checks every screen under a virtual display here, and the Mac at GitHub ran the same checks on the built app and passed, installers included.",
     "The board file was syntax checked, clicked through at desktop and phone width with zero errors, and scanned for the four words and for dashes.",
     "A reviewer pass read every change against your rules and the spec before anything was pushed."]),
]
SimpleDocTemplate(sys.argv[1],pagesize=letter,leftMargin=54,rightMargin=54,topMargin=54,bottomMargin=54).build(s)
