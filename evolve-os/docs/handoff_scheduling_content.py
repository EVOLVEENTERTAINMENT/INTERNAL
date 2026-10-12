import json,glob,os
L='/tmp/claude-0/-home-user-INTERNAL/a7daf43b-4152-56e0-97d5-60762b5270c4/scratchpad/live5/'
S=[]
P=lambda t:S.append(Paragraph(t,B))
H2=lambda t:S.append(Paragraph(t,H))
def esc(x): return str(x or "").replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
S.append(Paragraph("Jackson Cole and Evolve: everything a scheduling assistant needs",T))
P("Handoff from the Evolve OS build chat, 12 October 2026, read from the live board, the live calendars and the live scheduled tasks that morning. Facts are marked with where they came from. Anything marked a guess or a suggestion is not a fact. Anything not here is not known.")

H2("0. How to use this")
P("You are building a weekly schedule Jackson can live by. This document is context, not instructions to change anything. The live board is https://claude.ai/artifact/KmwskLGeZxU6vG284njSfR and its database can be read with the ArtifactData tool. Read it fresh before relying on anything dated here, because six scheduled tasks rewrite parts of it every day.")

H2("1. Who and what")
S.append(tbl(["",""],[
 ["Jackson","R. Jackson Cole, founder of Evolve Entertainment Studios, a full agency in Auburn, Alabama: video, photography, web and design. Time zone America/Chicago. Phone (334) 414-3215, prefers text, misses calls. Office 516 E Glenn Ave, Suite 136, Auburn, AL 36830."],
 ["Gavin Fox","Shooter and second pair of hands. Works Monday, Tuesday and Thursday only (board crew record and every scheduled task agree)."],
 ["Grace","Copy and studio days. On site Monday and Wednesday 2:00 to 5:00, Tuesday and Thursday 10:00 to 2:00, Friday 1:00 to 4:00. About 17 hours a week. Her list was cut to 14 priority tasks on 21 Sep."],
 ["Logicnova","Web developer in Mumbai (Rohan, rohan@logicnova.in, and Mahesh, mahesh@logicnova.in). India is 10 hours 30 minutes ahead of Central now, 11 hours 30 after the US clocks change on Sun 1 Nov. Work handed over by early evening Central lands at the start of their day. Agreement of 6 Oct: 30% within 7 days of accepting a work order of $1,000 or more, 14 days for Evolve to review a delivery, balance within 30 days of their invoice."],
 ["Mom (Shawn Cole)","Runs Hill Hill Carter, a law firm. Evolve does paid legal document work for it, plus an unbilled poster as a favor. Also part of Threads of Change."],
],[90,422]))

H2("2. Jackson's standing rules for any assistant")
for r in [
 "Do not create, move or delete a calendar event without telling him first. Never send an email or a message on his behalf: drafts only. Never write to ClickUp (it holds sample data and signs in as Gavin).",
 "Never invent a fact, a date, a price or a status. Undecided stays undecided and comes back to him. Label a suggestion as a suggestion.",
 "Never make him feel behind. Nothing is overdue, things are carried.",
 "Plain everyday language. Short. No jargon. No em dashes or en dashes, ever.",
 "One question at a time, multiple choice, each option with a one line description of what it does. Never stack questions. Note: option previews do not show on his screen, so put everything he needs in the option text or a PDF.",
 "Fix what you can fix directly. Only bring him what genuinely needs him.",
 "He cannot open .md files. Give him PDF or DOCX.",
 "Outbound wording he sends: open with Good morning, Good afternoon or Good evening, never Hi. On a first contact, My name is Jackson Cole comes first. Short.",
 "Every event he hosts gets a planning meeting about six weeks ahead, on the same calendar as the event. Big events get two: concept at six weeks, logistics at two weeks (Sunday planning task rule).",
 "Blocks over 90 minutes on a business calendar are flagged by his audits. Anything needing Gavin off Mon, Tue, Thu, or Grace outside her windows, is flagged."]:
  P("&bull; "+esc(r))

H2("3. The calendars")
S.append(tbl(["Calendar","Counts as","What lives there"],[
 ["EVOLVE","work","Client and growth blocks: Claude Academy, Evolve website build blocks, Threads of Change, one off client meetings and planning blocks."],
 ["WORK WEEK FLOW","work, routine","The standing week: Sales block, Ops Sync, Evolve Session, Invoicing / AR, Weekly Wrap, Feed the week, Check the plan. Calendar id c_e52569f797ffdb1bdeb01bc77d2ba8149ffe85d2d1ae63a0203a0019b45fb52e@group.calendar.google.com."],
 ["ASSISTANT HOURS","work, presence only","Grace's on site windows. Presence, not commitments: never count as overlaps."],
 ["FALL","personal","The fall season plans."],
 ["PERSONAL, HEALTH","personal","Personal and health appointments."],
 ["WAKE & SLEEP","personal, presence only","Sleep and wake windows. Ignore for overlaps."],
],[95,85,332]))

H2("4. The standing week, as it is on the calendar now")
P("Read from Google Calendar for Mon 12 to Sun 18 Oct and Mon 19 to Fri 23 Oct. These repeat weekly.")
S.append(tbl(["Day","Time (Central)","Block","Calendar, and what the block's own description says"],[
 ["Mon to Fri","9:30 to 10:15","Sales block · 45 min","WORK WEEK FLOW. Anchor, daily minimum: outreach, follow ups, proposals, the one money item named at 9:00. May slide later when a surprise hits, never skipped two days running. The Night Lead Engine retitles it with the calls ready. Series id glephrippil1u84baqki6mfvjo."],
 ["Mon","2:00 to 2:45","TEAM · Weekly Ops Sync · Jackson, Gavin, Grace","WORK WEEK FLOW. Win and learn, project health, pipeline, decisions, close with 3 owned actions and due dates. Every item leaves with an owner."],
 ["Mon","3:00 to 4:00","Claude Academy · learn something new (1 of 3)","EVOLVE. Three and a half hours a week, Mon, Thu, Fri."],
 ["Tue","2:00 to 3:00","Evolve website · build block (1 of 3)","EVOLVE. Three hours a week on evolveentertain.com."],
 ["Tue","4:00 to 5:00","Threads of Change (1 of 2)","EVOLVE."],
 ["Wed","2:00 to 3:00","TEAM · Evolve Session (learning seminar)","WORK WEEK FLOW. 40 min teach, 15 min apply, 5 min takeaway. Four week rotation: AI for production, cinematography, business and positioning, post and systems."],
 ["Wed","3:00 to 5:00","Threads of Change · long block (2 of 2)","EVOLVE."],
 ["Thu","2:00 to 2:30","Invoicing / AR","WORK WEEK FLOW. Cross check Stripe, chase outstanding, send progress invoices."],
 ["Thu","3:00 to 4:00","Evolve website · build block (2 of 3)","EVOLVE. Its description says it sits clear of the 10:15 to 1:00 client deep work."],
 ["Thu","8:30 to 10:00 PM","Claude Academy (2 of 3, the long one)","EVOLVE."],
 ["Fri","1:00 to 2:00","Claude Academy (3 of 3)","EVOLVE."],
 ["Fri","3:00 to 4:00","Evolve website · build block (3 of 3)","EVOLVE."],
 ["Fri","4:30 to 4:45","TEAM · Weekly Wrap","WORK WEEK FLOW. What shipped, what slipped, what rolls forward. Feeds Sunday planning."],
 ["Sun","7:00 to 7:30 PM","Feed the week · 30 min","WORK WEEK FLOW. Confirm or change each line of the Sunday prep. Rule: whoever is waiting on him soonest goes first. Backend work only if no client date inside 3 days."],
],[52,72,140,248]))
P("Also seen on WORK WEEK FLOW in the week of 5 Oct: Check the plan · 5 min. Not seen in the week of 12 Oct.")
P("The board's own note on how the week is split (context/core weekShape, written by a task): split by project, not by day. Laurel Oaks owns Mon, Wed and Fri. CR Photography owns Tue and Thu. Growth and learning blocks were pulled for one week only and come back the next. Treat this as last known, not fixed.")
P("One off on EVOLVE this week: Mon 12 Oct 10:15 to 11:45, PLAN · College commercial outreach, marked by Jackson as a placeholder date. Its description lists what the plan must answer: the buyer, what is sold, the price, the one page leave behind, and the weekly send target.")

H2("5. This week's one thing per day (board, mustdo)")
rows=[]
for f in sorted(glob.glob(L+'mustdo/2026-10-1*.json')):
  d=json.load(open(f)); rows.append([os.path.basename(f)[:-5],esc(d.get('title')),esc(d.get('small'))])
S.append(tbl(["Date","The one thing","The 20 minute version"],rows,[70,250,192]))

H2("6. Live projects (20)")
P("From the board's projects records, written by the Morning project state task on 11 Oct. From 12 Oct that task also writes a stage word, the owner of the next move and plain dates. WEC documentary is finished and archived and is not listed.")
rows=[]
for f in sorted(glob.glob(L+'projects/*-*.json')):
  d=json.load(open(f))
  if d.get('archived'): continue
  rows.append([esc(d.get('name')),esc(d.get('next_action')),esc(d.get('next_date')),esc(d.get('blocked_by'))])
S.append(tbl(["Project","Next action","Next date, as written","Held up by"],rows,[90,200,112,110]))
P("Groups (suggested names in Jackson's projects PDF of 10 Oct, not yet ruled on): client work is Laurel Oaks, CR Photography, Harold Lloyd Entertainment, Webb build, Hill Hill Carter legal work, Threads of Change. Sales not yet won: Bill Abell, Inline Lighting, FUSE THE DENIM, BOOS and BREWS, College outreach. Evolve itself: website, compliance and tax, design student hire, Evolve OS. Personal: community service, GV70 car, game weekend rental, fall dinner party, HHC poster for Mom.")

H2("7. People he is waiting on (open)")
rows=[]
for f in sorted(glob.glob(L+'waiting/*.json')):
  d=json.load(open(f))
  if d.get('state')=='replied': continue
  rows.append([esc(d.get('who')),esc(d.get('what')),esc(d.get('since')),esc(d.get('dies'))])
S.append(tbl(["Who","What","Since","What it holds up"],rows,[110,190,58,154]))

core=json.load(open(L+'context/core.json'))
H2("8. The carried list (board, context/core)")
P("Written by the Friday board audit and the money watch. These are things that did not land and are still open. Read them as carried, never as late.")
for c in core.get('carried',[]): P("&bull; "+esc(c))
H2("9. Dated items (board, context/core deadlines)")
for c in core.get('deadlines',[]): P("&bull; "+esc(c))

H2("10. Money, as far as anyone knows")
P("<b>Settled, on Jackson's word 12 Oct:</b> the WEC invoices, $650 and $400, paid. The Harold Lloyd software money, $1,086, settled. Never report these as owed.")
P("<b>Invoices Evolve sent that may still be open</b> (Gmail search 12 Oct, read only): CR Photography remaining 50% deposit, sent 6 Oct, payment asked within 7 business days, amount only in the PDF. Charlie Roberts first deposit, 24 Aug, amount only in the PDF, probably paid. Pi Kappa Alpha PKAU-2608-S, 29 Aug, amount only in the PDF. Auburn NVA final invoice, 29 Jun, approved and submitted for payment by Auburn. HHC-2609-01 for $202.50, sent 3 Sep, a $205 Venmo from Shawn Cole arrived the same day so it may be paid. Medical Leverage MDLV-2608-D and MDLV-2608-B, $750 each, approved, payment promised 21 Aug, no paid notice found. A Harold Lloyd deposit invoice is still to be drafted from the quote PDF.")
P("<b>The money watch's own summary</b> (context/core money, as written by the task):")
P("In: "+esc((core.get('money') or {}).get('in')))
P("Out: "+esc((core.get('money') or {}).get('out')))
P("<b>Not known:</b> his costs (Gavin has been asked on the board to enter the overhead he mapped), cash on hand, the floor he wants to keep, and how often a reach out turns into a job. The money engine (below) waits on these.")

H2("11. Scheduled tasks that already run (all Central time)")
S.append(tbl(["When","Task","What it does, briefly"],[
 ["Daily 1:13 AM","Night Lead Engine","Re checks leads, builds the next 5 calls and, per lead, copy, a concept PDF and a pitch brief. Retitles the Sales block when calendar writes are on. Currently OFF, with one trial run by hand on 11 Oct evening."],
 ["Daily 5:15 AM","Read what Jackson texted back","Reads only his texts to himself. Closes days from numbers like 1 and 3 landed, names a one thing, logs who owes him. Needs his Mac awake."],
 ["Daily 5:30 AM","Morning project state","Rewrites every project's state and today's brief, clears the agents' message bus."],
 ["Daily 5:47 AM","Evolve OS morning refresh","Weather, quiet clients, and a money check that skips what is settled."],
 ["Daily 8:00 AM, 6:00 PM","Inbox sweep","Quotes, replies, new dates from Gmail. Drafts only. Updates the waiting list."],
 ["Daily 8:45 AM","Morning text sweep","iMessages needing him, with suggested replies in the report. Needs his Mac awake."],
 ["Daily 7:40 PM","Car goal agent","Owns everything about the GV70 car: shop replies, drafts, the quote tracker."],
 ["Daily 11:00 PM","Close the day nudge","Lists today's blocks with numbers so he can text which landed. It needs Automatically approve turned on in its settings, which only Jackson can do; without it the run stalls."],
 ["Mon 8:30 AM","Monday team brief","Builds the week's brief for the 2:00 Ops Sync: who owns what, decisions, dates. Writes teambrief on the board and a Gmail draft. The board shows it on People as This week, by person."],
 ["Thu 9:00 AM","Money watch","Reads three weeks of invoice and payment mail into context/core money."],
 ["Fri 5:00 PM","Friday board audit","How the week went from the done marks, rewrites the carried list."],
 ["Sun 8:00 AM","Sunday Walmart restock list","A list only, never the cart."],
 ["Sun 6:30 PM","Sunday planning pass","Names each weekday's one thing and its 20 minute version, audits the next two weeks, sends one message."],
 ["2 Mar, Jun, Sep, Dec, 9 AM","Change Waterdrop filter","One line reminder."],
],[88,120,304]))
P("A scheduler you build should read what these write rather than repeat them, and should never write to the same fields they own: mustdo is owned by the Sunday planning pass and the 5:15 text reader; done by the board and the 5:15 reader; projects and brief by the 5:30 task; waiting by the sweeps; teambrief by Monday's task.")

H2("12. The board, in short")
P("Home: today, the one thing, Needs You. Board: the calendar, Close the day. Projects: the 20, each with Overview, Work, Deliverables, Playbook, Money, People, Log. Pipeline: Calls (the lead engine's list with tap to call and outcome buttons) and leads. Money: invoices, costs, the plan and payment calendar. People: This week, by person (the Monday brief) and who owes him. Inbox: captured notes waiting to be sorted. Settings.")

H2("13. Sales and the lead engine")
P("The offer it pitches, approved 8 Oct, rate card v26-07-10: Starter Site, $2,900. Three to five weeks. 50 percent to start, 50 percent on delivery. Two rounds of revisions. Growth Site, $5,500, when it is bigger.")
P("Pool on 8 Oct: 85 leads pass every check, 26 need a phone number, 25 parked (mostly committee buyers), 130 still in the pool. Calls happen in the daily 9:30 Sales block. 5 calls a sheet. During the first 100 calls, owner operators who can pay only.")
P("Prep per lead, overnight, on his word 12 Oct: research their site, write their homepage copy in their trade's voice from their own facts only, a watermarked concept PDF of the top of their homepage, and a one page pitch brief. He looks at the site, the concept and the brief before calling.")
P("Still his: switch the engine on for nights, remove Spotify, ClickUp, Canva, higgsfield, Zoom and Tally from the engine's task, confirm the 33 committee flags, his weekly usage reset day.")

H2("14. How long a web build takes (suggestion, not confirmed)")
P("Steps from the Money Engine plan. Times are suggested guesses that fit the rate card's three to five weeks. Jackson has not ruled on them and handed this question to you.")
S.append(tbl(["#","Step","Who","Suggested time"],[
 ["1","Kickoff call, work order to Logicnova","Jackson","1 day"],
 ["2","Hosting and site set up, alongside step 3","Logicnova","3 days"],
 ["3","Sitemap and page list, then the client's OK","Jackson, then client","1 day, then 2 days waiting"],
 ["4","Homepage design, then the client's review","Jackson, then client","2 days, then 2 days waiting"],
 ["5","Inner pages design and review, while Logicnova builds the homepage","Jackson, then client","2 days, then 2 days waiting"],
 ["6","Build of the approved pages, while Jackson gathers copy and photos","Logicnova","4 days"],
 ["7","Phone and browser checks, then fixes","Jackson, then Logicnova","1 day, then 2 days"],
 ["8","Client's final look, launch, final invoice","Client, then Jackson","2 days waiting, then 1 day"],
],[18,240,120,134]))
P("About 22 working days, roughly four and a half weeks, with about 7 days of Jackson's own hands on time. A faster version with 1 day client waits is about 3 weeks. Hand offs to Logicnova belong in his afternoon so they are worked on overnight.")

H2("15. The money engine (built, not on the board yet)")
P("A tested calculation, 20 of 20 tests passing, kept in the repo as engine/me.js. It plays the bank balance forward day by day for 13 weeks from cash on hand, money coming in (sent invoices, agreed deposits, steady income) and money going out (costs, Logicnova, bills), finds the first day under his floor, and works backward to how many jobs he must sign by when, when to start reaching out, and how many reach outs a week that takes, and whether that fits his Sales block time. It needs his costs, cash on hand, floor, average job price and a guess at how often a reach out becomes a job.")

H2("16. Open questions that are his")
for q in ["Whether to back up and delete 17 leftover duplicate project records (the board ignores them).",
 "Whether to use the suggested project names.",
 "Turn on Automatically approve on the Close the day nudge task.",
 "Switch the lead engine on for nights, after reading the trial run.",
 "His costs, cash on hand and floor, for the money plan.",
 "Who can open the board: right now anyone with the link sees personal money and personal projects.",
 "Whether the $5K by August 31 target is still real. The daily planner skill still enforces it and his business facts file marks it stale.",
 "The step times for a web build (section 14)."]:
  P("&bull; "+esc(q))
P("End of handoff. Built from the live board, calendars and task list on 12 Oct 2026. Ask the board for anything newer.")
