# EVOLVE BUILD LEDGER

Kept here in the Project rather than as a local file so it is readable on any
device and across chats. Updated after every green phase.

## CURRENT

- Source: Evolve OS artifact, **V136**, published live at
  https://claude.ai/artifact/KmwskLGeZxU6vG284njSfR
- Last known-good: V136 (published 8 Oct 2026, build stamp
  `V136 2026-10-08T17:00Z`, artifact version 137, version id
  `1791459879-cf77`). Rollback is the artifact's own version history.
  V133 is artifact version 134, version id `1791457347-7091`.
- Phase: V134 to V136 = V133 with every project and deliverable date that has
  passed reading as carried. Copy only, no logic changed. V133 = V132 plus
  the capture line. Projects still has two levels:
  the split view command center (V131) and the full width portal (V132).
- **Ledger gap:** V119 through V130 were never written up here. Known from
  reading the V130 source: one-tap time shift, leave-by blocks, the guided
  tour with writes blocked, saved views, formula fields, templates with
  backward dates, the workload grid, the chase ladder on Pipeline, expenses
  and per-job margin, the timer popover and the fix run all shipped somewhere
  in V100 to V130. So most of Tier 1 and Tier 2 in the queue below is ALREADY
  BUILT. Read the live file before trusting that queue.

## THE CONSTRAINT THAT GOVERNS EVERY FUTURE BUILD

A published Claude Artifact **cannot reach the open internet**. `fetch()` to
any address silently fails in production. Only the connectors declared in
`capabilities.mcp.servers[]` get out. The weather on Home is a baked-in
`WX_SEED` snapshot for exactly this reason, and the live fetch sitting beside
it has never once succeeded in a published build.

Anything that needs the outside world has to be a connector. This cost one
rebuild in the V133 session: the capture line was first designed to call a
worker over HTTPS, which cannot work from this page, and had to be rebuilt as
an MCP server Jackson adds in his Claude settings.

## VERSION HISTORY

| Ver | What landed |
|---|---|
| V68 | Writer self test in Settings; MCP manifest trimmed to the 6 tools actually called |
| V69 | UI/motion steps 1-4: token layer, removals, state ladder, focus |
| V70 | Visual steps 5-8: tier 2/3 edges, pointer highlight, tier 4 sweep, chart policy; V-shaped rail notch |
| V71-V87 | Notch animation easing rebuilt and measured; gradient moved to objectBoundingBox so it follows the path instead of teleporting |
| V88 | Home redesigned so Today leads. Need You demoted below it. |
| V89-V96 | The 19 audit blocks: data loss, silent failures, calendar writer safety, dead code, delete and edit paths, board and recap, contradictions, inbox and capture, model and Gmail, people, lead handoff, cost model, links, invoice line items, settings, maintenance, client view, deliverables |
| V97 | Header regressions from the reel-off default |
| V98 | Video banner restored as a designed band; standfirst under the orange pill removed at the JS level so CSS cannot reinstate it; groundLine and its five dead CSS rules deleted |
| V99 | The week ahead on Home; the weekly brief rebuilt as a generated document; board strip renamed to Weather and load |
| V100-V116 | **Not documented here.** Known: V116 shipped the Projects page fix (STAGEMAP extended beyond film vocabulary). Also confirmed by reading the V118 source: a full `/`-or-Cmd+K search-and-command palette (`searchAll`, `cmdActions`/`CMDV`, wired to `#srch`) shipped somewhere in this range, covering calendar blocks, scraps, waiting/owed, projects, leads, clients, notes and help articles, plus typed commands (`new lead`, `new invoice`, `new project`, `log`, `go`, `week`, `today`, `brief`). |
| V117 | Calendar loading-state fix, 8 anchored replacements, plus a permanent self-test lock against regressing it. See below. |
| V118 | Search/palette gap fix: invoices, deliverables and crew added to `searchAll()`, each jumping straight to its real editor (`invEdit`, `delEdit`, `crewEdit`) rather than just switching modes. Pipeline confirmed empty by direct database check the same session, not a bug, just no leads entered yet. |
| V119-V130 | **Not documented here.** See the ledger gap note under CURRENT for what the V130 source shows. V130 itself shipped the Pipeline chase ladder. |
| V131 | Projects page rebuilt as a split view with a full project workspace on the right. New collections `tasks` and `pw`. See below. |
| V132 | Full project portal: Open project from the split view, compact header, grouped side rail, Home cockpit, Plan (timeline, calendar, milestones), reworked Work and Deliverables. New collection `milestones`. See below. |
| V133 | The capture line: text a number or hold a button and talk, it lands on the board. New connector `Capture Line`, new collection `prefs/capline`, three new proposing tools. See below. |
| V134 | The V68 late bug: Today row, Needs You and the badges now say carried. 6 anchored replacements. |
| V135 | Carried everywhere a project or deliverable date has passed: slate, company callout, Needs You, weekly brief, recap, fix list, delivery rows, workspace. Invoices untouched by choice. 24 anchored replacements. |
| V136 | The spots V135 missed, found by rendering every screen: Deliverables count, project pulse, owner rows, timeline tooltips, milestone rows, task groups, one help line. 10 anchored replacements. |

## V134 TO V136: CARRIED, NOT LATE

**Why.** His rule is "Nothing is overdue, things are carried." The board still
said late, over, past the date and past its date in about thirty places. He
picked the fix and the wording in this session: "carried 9 days" in full,
"9d carried" short, "Carried" as a label. Invoices keep late and past due, on
his call.

**How.** Every change is an anchored string swap, each one asserted unique
before writing. No logic changed. Internal keys stay as they were (`late`
filter id, `k late` class, `n.late` counts), only what he reads changed.

**Left alone on purpose.**
- Invoice wording everywhere (money is a fact, he chose to keep it).
- The draft chase prompt Claude writes for a client ("days past when it was
  due"). That text goes to the client, not to him.
- Reassurance lines that already say "Nothing is late" and soften it, for
  example "Nothing is late, they just have not happened yet."
- The parser that reads "running 20 late" from what he types.
- The slate line picks invoices or work by date. An invoice still reads
  "12d over", work reads "4d carried".

**Copy Claude had to word, awaiting his ruling.** Beyond the straight
swap, these are new phrasing:
- Company callout headline "Brand film cut, carried 9 days", with the days
  dropped from the line under it ("Acme is waiting. Move it or move the date.").
- Needs You grouped: "3 things for Acme are carried".
- Needs You add on: "One other thing on it is already carried behind this."
- Workspace next move: "The next move, carried 3 days".
- Home Owed row: right column now just "9 days", since the left column
  already says carried.

**Verified.** Both script blocks pass `node --check`. A probe rendered all 8
modes plus slate, Needs You, company callout, weekly brief, recap, fix list,
delivery rows and the project workspace on seeded data (three carried
deliverables, a carried task, milestone, next move, and a late invoice), at
1440 and 390 wide. Zero page errors. After V136 the only late, over or past
wording left in any render is on invoices. No visible em or en dash anywhere;
the only ones in the file are the filters that strip them from model output.

## V133: THE CAPTURE LINE

**What it is.** Jackson texts a Twilio number, or holds one button on his
phone and talks. Within a minute the board has it and has sorted it. A note
becomes a scrap. Somebody who now owes him something becomes a waiting row. A
calendar change becomes one tap in the approval queue he already uses.

**The shape, and why.**

```
Twilio number -> worker POST /sms   (HMAC signature + owner number checked) -> KV
iOS Shortcut  -> worker POST /note  (Authorization: Bearer BOARD_KEY)       -> KV
the board     -> worker POST /mcp/<BOARD_KEY>, declared as a custom
                 connector named exactly "Capture Line"
                 tools: get_pending, mark_filed
```

The worker is the only part outside the page, and it exists only because of
the sandbox constraint above. It speaks MCP over streamable HTTP (JSON-RPC
2.0: `initialize`, `notifications/initialized`, `ping`, `tools/list`,
`tools/call`, `resources/list`, `prompts/list`).

**The credential.** `BOARD_KEY` is an unguessable path segment. It lives in
Jackson's Claude settings, never in the page, so sharing the board never
shares the line. A wrong key gets a 404, not a 401, so the endpoint cannot be
probed. `mark_filed` can only delete keys beginning `p:`, so it can never be
turned on anything else in the store.

**In the board.**
- `const CAP="Capture Line";` beside GC, GM and IM.
- `S.capline` plus `prefs/capline` in the store, so the switch and the
  counters follow him between devices.
- `capStart()` runs a one minute timer from boot and does nothing until the
  line answers, so a board opened before the connector exists picks it up on
  its own.
- `capPull()` reads `get_pending`, hands each item to the model with
  `CAP_RULES`, then `mark_filed` to clear them. Two failures on one item and
  it is caught verbatim in the Inbox instead, which is worse than sorted and
  far better than lost. An answer in a shape it cannot read is reported, not
  treated as an empty line.
- `capRows()` defends against the several shapes a tool result can arrive in
  rather than guessing one.
- Three new model tools, `propose_event`, `propose_move`, `propose_cancel`,
  all of which call `stage()` and **never** touch Google. `read_calendar` now
  returns `event_id` so a move can name its target.
- A Settings section, "The capture line", with state, last check, how many
  have been handled, and Switch it on / Check now / Look again.
- The stale "Messages is built but not switched on" note in Settings was
  rewritten; the grant exists now.

**The tour gate interaction.** V132 wraps `mcp.callTool` and refuses any tool
whose name does not match `^(get|list|search|read|fetch|show|find|describe|resolve|check|suggest)[_-]`
while the tour is on. `get_pending` passes, `mark_filed` does not. That is
correct, and `capPull` swallows the rejection, so items simply come round
again after the tour. Worth knowing before anyone "fixes" it.

**Files.** `worker.js` (200 lines) and `wrangler.toml`. Cloudflare Worker, KV
binding `CAPTURES`, vars `OWNER` / `PUBLIC_SMS_URL` / `ACK_TEXT`, secrets
`TWILIO_AUTH_TOKEN` / `BOARD_KEY`. Setup steps for Jackson are in
`LifeOS_CaptureLine_SPEC_26-10-08_FINAL.pdf`.

**How it was checked.** `applycap.py` applies 9 anchored edits to the live
V132 source on disk, with every `assert s.count(old)==1` running before the
single write, so a failed anchor leaves the file untouched. Node `--check` on
both script blocks. The full board suite, 206 of 206 green against the merged
file: t1 11, t2 21, t2b 8, t3 24, wbtest 11, cadtest 16, captest 12, auto 9,
p0 9, p1 11, p2 9, p3 10, p5 13, p6 11, p78 15, pb 16. Worker suite 13 of 13,
including Twilio's own published signature vector. The new Settings section
was screenshotted at 1440 and 390 and the images read, not the code.

**Not verified.** The `Capture Line` connector does not exist until Jackson
creates it, so no real call to it was possible before publishing. It is
declared against an unobserved interface. The first live call is his.

## V132: THE FULL PROJECT PORTAL (PASS A)

Built to Jackson's "Full Individual Project Portal" spec. Pass A only. Nothing
was written to his data during the build.

**Two levels.** The split view stays as the fast command center and gains an
"Open project" button. That sets `S.pw.full` and `pwPage()` returns
`ppPortal()` instead of the split. "Projects" (top left of the portal, or the
Projects button in the app rail) steps back out with the project, area and
data intact. The project name in the portal header is a switcher. The choice
is remembered in `localStorage` (`evolve:pw`).

**Shell.** Compact header: back, name, kind and client, then Phase, Health,
Contract (only if the project record carries a value) and the next milestone.
Ask, Start timer and a "..." menu. A side rail in three groups: Home, Plan,
Work, Deliverables / the operations page, Client, Files / Scope, Money,
People, Project log. The operations page is the V131 Playbook, renamed by
kind: Production (Film, Documentary), Build (Web), Shoot (Photo).

**Home.** Next move, a phase rail (click a phase to see its work), Needs
attention counters that are filters (Late, Waiting on others, Approvals out,
Blocked, Next 7 days), the next 7 days, deliverable progress, project health
and recent movement. Every number is counted from records. Deliverable
progress is done tasks over linked tasks, and shows no percent when no tasks
are linked.

**Plan.** Timeline, Calendar and Milestones are three views of the same
`tasks`, `milestones` and `duelist` rows.
- Timeline: phases in kit order, collapsible, task bars, milestone diamonds,
  deliverable due marks, a today line, dependency connectors, Week, Month
  and Quarter zoom. Drag a bar to move it, pull an end to change its length.
  Click opens the drawer over the timeline.
- Dependencies: `tasks.depends[]`. `ppClashes()` finds a task that starts
  before something it waits for has ended. After any date change
  `ppMoveTask()` reports what the move ran into and offers to shift the
  downstream chain (`ppCascade()`). It never moves them without being asked.
  This is not a critical path engine.
- Milestones: `milestones/<id>` with project, title, date, end, phase,
  deliverable, done. Shown on the timeline, the calendar, Home, the header
  and the deliverable they point at.

**Work.** List (phase, then workstream, with done counts, collapsible), Board,
By person, My work. Filters: All, Due soon, Late, Blocked, Waiting, Mine. The
old "Timeline" list view in Work is gone, replaced by Plan.

**Task record gains** `start`, `milestone`, `subs[]`, `collab[]`. Workstream
is the existing `item` field, which points at a kit checklist line.

**Deliverables.** Overview rows show state, progress, current version, client
status, revisions against the allowance, due date and linked milestones. The
drawer tabs are Overview, Tasks, Versions, Feedback, Files, Approval.
Deliverables gain `feedback[]`. The Tasks tab lists the same task records as
Work.

**Templates.** Not built as a feature. A kit in `PW_KITS` already carries
phases and task groups, and `PP_KIT_MILES` adds default milestones (Film
only, taken from the spec's timeline example, offered as a suggestion with
no dates). Creating a project from a template would fill `tasks`,
`milestones` and `duelist` from a kit.

**Pass B, not built.** Files (says so on the page). Scope shows the
deliverables list and rounds past the allowance, and says change requests
are not built. Client, Money, People and Project log are still the thin
V131 views over existing records. No approval, client request, meeting,
budget item or file version records exist yet.

**Honest limits.**
- Laurel Oaks still has no kind, phase, tasks, dates, milestones or
  deliverables stored. The timeline is empty until he makes the nightly
  lines into tasks and gives them dates.
- Health in the header reads Blocked whenever the nightly read wrote a
  `blocked_by`, which is most projects today.
- Timeline drag was tested with a mouse in headless Chromium, not on a touch
  screen.
- The artifact is shared as "Anyone with the link".

**Files and checks.** `pp.js` and `pp.css` sit beside `pw.js` and `pw.css`
and are joined by `apply.py` (19 anchored edits against the V130 body).
Checked with Node `--check` and Playwright against the stub store seeded
from the live `projects` and `waiting` dump: the spec's twelve workflows on
Laurel Oaks and CR Photography, drag move, edge resize, cascade, milestone
and deliverable drag, zoom, collapse, every rail area, all four Work views,
tour write blocking, the older V131 suites, light theme, and 400px width with
no sideways scroll. After publish, `milestones` was read through the live
database and is reachable and empty. The harness is in a session scratchpad
and does not persist.

## V131: THE PROJECT WORKSPACE

Built to Jackson's "Project Workspace Architecture Pass" spec. Scope of this
pass was deliberately partial: shell and navigation, Command, Work,
Deliverables, one task drawer, one deliverable drawer, and where the other
modules will live. Nothing was written to his data during the build.

**What it is.** Projects opens on a new Workspace lens (`S.pv==="split"`,
now the default): compact project list on the left, the selected project on
the right. By client, By stage and Archived lenses are unchanged.
`openProject(slug,tab)` now selects the project in the split view, and old
tab names map across (`PW_OLDTAB`), so every existing caller still works.
`roomProject` and `PTABS` are deleted.

**The shell.** Header with name, client, kind picker, an adaptive phase
track, and a compact status line. Sticky nav: Command, Work, Deliverables,
Playbook, then quieter Files, Client, Money, Team, Activity.

**Adaptive kits (`PW_KITS`).** Film, Documentary, Web, Photo, Design, Mixed.
Each has its own phases and checklist items, and each phase maps onto the
existing five-stage spine so the rest of the app keeps working. Film,
Documentary, Web and Photo phase names come from Jackson's spec. Design and
Mixed phase names are Claude's suggestion and are not confirmed.

**Data model.**
- `pw/<slug>`: workspace state (kind, phase, checklist states, extra items,
  `tasks_adopted_at`). Kept out of `projects/` on purpose, because the
  nightly agent rewrites `projects/`.
- `tasks/<id>`: project, title, status (todo, doing, waiting, blocked, done),
  owner, due, priority, phase, item, waiting_on, deliverable, depends[],
  notes, source, order.
- Deliverables (`duelist/`) gain `spec` and `brief`. Activity refs now
  include `task:` and `del:`.
- The phase is only shown as fact when Jackson confirmed it (`pw.phase`) or
  the nightly `stage` is a short word. The nightly agent writes `stage` as a
  paragraph, so otherwise it reads "Phase not set".
- The nightly `whats_left` prose shows as unadopted lines in Work until he
  presses "Make them tasks". Nothing is adopted automatically.

**Honest gaps.**
- Files is not built. It says so on the page.
- Client, Money, Team and Activity are thin views over existing records, not
  redesigned modules.
- (Superseded in V132: Plan now has a drawn timeline with dependencies.)
- The nightly agent should eventually write `tasks/` instead of `whats_left`
  prose. Not done.
- No project has a kind or a phase set yet. Laurel Oaks needs one click for
  kind (Film is suggested) and one for "Make them tasks".
- Earlier claim that 16 projects were stored twice was wrong: `slugKey` folds
  "laurel-oaks" and "laureloaks" into one project. Only the empty `lovc` doc
  is a real stray.

**How it was built and checked.** `pw.js` and `pw.css` are inserted into the
V130 body by `apply.py` (18 anchored edits). Checked with Node `--check` and
a Playwright harness against a stub store seeded from a dump of the live
`projects` and `waiting` collections: full workflow (kind, phase, checklist,
adopt 11 lines, task edits, dependency, deliverables, both drawers), all nine
modes, all four Projects lenses, inspector hand-off, search, help, tour write
blocking, light theme, and 400px width with no sideways scroll. After
publish, `tasks` and `pw` were read through the live database and both are
reachable and empty. The harness lives in a session scratchpad and is gone
when that session ends; `smoke.js` and the older suite were not re-run.

## V118: THE PALETTE WAS ALREADY THERE, THREE OBJECT TYPES WEREN'T IN IT

Jackson asked what would make the app easier to navigate. The stale tier-1
queue below (unedited since V99) still listed "command palette, Cmd+K" as the
single highest-leverage unbuilt item, so that was recommended first. It was
wrong: reading the live V117 source turned up `searchAll()` and a `CMDV`
command table already wired to `/` and Cmd+K, doing almost exactly what the
queue described. It must have shipped somewhere in the undocumented V100-116
range.

What it did NOT cover: an open invoice, a deliverable, or a crew member could
not be found by typing their name, only calendar blocks, scraps, waiting/owed,
projects, leads, clients, notes and help articles could. `searchAll()` now
also scans `S.inv` (hit on client or the what-it's-for text), `S.dels` (hit on
name or client) and `crewList()` (hit on name or role), each row opening the
real editor (`invEdit`, `delEdit`, `crewEdit`) directly rather than just
switching modes, matching how a Project hit already worked. Nothing in
`CMDV` (the typed-command side) was touched, since that already works and
touching write-path commands without a full retest was not worth the risk
for a read-side gap.

Verified: Node `--check` on the extracted script, and a direct read of the
diff before publish. Not re-run through the Playwright harness (`smoke.js`
etc.) this session; worth a pass before trusting the palette further.

## V117: THE CALENDAR LOADING-STATE FIX AND WHY IT WAS HELD BACK

**What was wrong.** The connector was never broken. The page has no loading
state: between opening the page and the first calendar payload arriving,
`calState()` returned `"unreachable"` because `CALSEEN===null`, and the header
chip, Today's subtitle, Today's empty-state line, and the week-ahead line all
asserted the day was empty while the calendar was still waiting to hear back
from Google. Every "the calendar isn't showing up" report traced to this, not
to the connector. Worse: `canWriteCalendar()` was `calState().k!=="unreachable"`,
so once a fourth state existed, a write could be authorised against a view
that had not actually loaded yet.

**The fix.** A fourth calendar state, `"loading"`, sits ahead of
`"unreachable"`: `calLoading()` is true only while a watch is active, nothing
has landed, there's no error, and less than 25 seconds (`LOAD_CEILING`) have
passed since the watch started (`CALWAIT`). `calState()`, `calChipText()`, the
header chip, Today's subtitle, Today's empty-state text, and the week-ahead
line all read this before falling through to the real unreachable/empty
copy. `canWriteCalendar()` now explicitly allow-lists `"live"` and `"stale"`
rather than merely excluding `"unreachable"`, so a write can never be
authorised while the view is loading or in any future state nobody has
thought of yet. `watch()` stamps `CALWAIT` the moment a subscription opens
with nothing yet in hand, and schedules one repaint just past the ceiling so
a page that truly cannot reach Google still resolves to a real
"unreachable" instead of hanging in "loading" forever.

**Why this took multiple sessions to publish.** The fix was designed, applied
to a working copy, and fully verified (Node syntax check plus Playwright
functional tests across all four states) in an earlier session. Publishing
was held because the Artifact tool requires a full line-by-line read of the
entire live file before it will let a republish go out, an unavoidable
one-time cost per session.

## THE LOCK-IN: A PERMANENT REGRESSION GUARD, NOT JUST A FIX

Jackson's instruction was explicit: publish it, and make sure a future edit
to this file can never silently reintroduce this bug. The mechanism is inside
`writerSelfTest()` (Settings, "Run the writer self test"), which already ran
a real create/read/move/delete cycle against Google Calendar on demand. It now
also runs a second, synchronous, in-memory check first:

- It swaps out `CALSEEN`, `CALWAIT`, `CALERR` and `CONNST`, drives `calState()`
  and `canWriteCalendar()` through all four scripted scenarios (fresh watch
  with nothing yet, must read `loading`; past the load ceiling with still
  nothing, must read `unreachable`; a payload has landed, must read `live`;
  still loading, `canWriteCalendar()` must stay `false`), then restores the
  real values exactly before anything is reported or repainted.
- It never touches the screen, the real calendar, or any network call.
- It runs only after "Connector reachable" already passed, so a disconnected
  page can't read as a failed test here.
- Any future edit that breaks `calState()`, `calLoading()`, or
  `canWriteCalendar()` turns one or more of these four rows red the next time
  the self test runs, with the specific behavioural contract that broke
  spelled out in the row's own text.

## VERIFICATION HARNESS

Runs in real headless Chromium against the built file. The harness lives in a
session scratchpad and does **not** persist. Every session that touches this
build rewrites it. Chromium is at
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; a tiny static server
(`srv.js`) serves the built file over http, because Chromium partitions
localStorage unpredictably on `file://`.

| Test | What it proves |
|---|---|
| `smoke.js` | All 9 modes, all project areas, 24 prompts open with zero page errors. Catches a function referenced but never defined, which a parse check cannot. |
| `hovertest.js` | 20 interactive surfaces change on hover and press, 0 no-ops. No banned property in any computed transition. |
| `lit2.js` | At most one lit surface per screen, stable over 30 repaints. |
| `a11y.js` | No nameless buttons, no unlabeled inputs, no tiny tap targets, heading order sane. |
| `sweep.js` | Node counts and accessibility per mode. |
| `caltest.js` | Both calendar-writer paths. |
| V133 suite | t1, t2, t2b, t3, wbtest, cadtest, captest, auto, p0, p1, p2, p3, p5, p6, p78, pb. 206 assertions. Rebuilt from scratch that session. |
| `wtest.mjs` | The worker, 13 assertions, including Twilio's published signature vector. |
| `probe.js` + `mock2.js` | V136. Seeds a project with carried work and a late invoice, renders every mode and the project workspace, dumps the text for a wording grep. Kept in the repo under `harness/`. |

## STILL OPEN FROM THE 129-FINDING AUDIT

- G4 invoice line items, tax, deposit split, terms. Model requested, not shown.
- E10 / M2 / J4 links and assets. Kinds proposed, awaiting correction.
- K1, K2, K3, K5, K7 settings block.
- M5 project templates.
- M7 client-facing view.
- M6 gear and resource booking.
- M10 offline capture.
- ~~M8 search across money, clients, leads, deliverables.~~ Done as of V118.
- N2 39 remaining orphan CSS classes.
- N4 four collections grow forever with no pruning.
- O2 `prompt2` labels not programmatically associated.
- O4 pages start at h3.
- B7 board calendar chip does not persist `on`.
- B8 invalidate swallowed in undo, ripple and recover.
- ~~E12 the four per-kind Make-tab surfaces.~~ Superseded by the V131 Playbook and kits.
- Running-timer contamination of the cost model. Partly addressed: every path
  that ends in a dollar figure now goes through `timeEntryBillMins()`, which
  caps an unclosed entry at `billCapMins()`. Not reverified end to end.

## OPEN, CARRIED FORWARD FROM V130 AND V133

These are Jackson's to act on, not build items.

- 68 raw captures unsorted since 21 September.
- The 2 October audit findings, untouched.
- Last week's unclosed days.
- Visible copy awaiting his ruling. He is the copywriter, not Claude. From
  V130: Chase list, "N leads are past a follow up", Nudge, "short, while it is
  still warm", Try another way, "not a second email, pick the phone up", Back
  to the problem, Ask if it is a no, Draft it, "I already did it", "Stop
  chasing this one", "N chases due", Chase. From V133: "The capture line",
  "text the number or hold the button on your phone, it lands here", "The
  line", "Answering as Capture Line", "Add it in your Claude settings as a
  custom connector, named exactly Capture Line", "Checking the line every
  minute while the board is open", "Handled so far", "Switch it on", "Check
  now", "Look again", "The line answered in a shape this page does not know
  how to read." From V134 to V136: see the copy list in that section.

## THE NEXT BUILD QUEUE, FROM JACKSON'S NOTES

Ordered by value divided by build cost. Treat every "not built" claim here as
a hypothesis to check against the live file, not a fact.

### Tier 1

1. ~~One-tap time shift.~~ Shipped somewhere in V119-V130.
2. ~~Leave-by buffers.~~ Shipped (`runwayOf`, leave-by blocks, travel memory).
3. ~~Timer with voice capture.~~ Timer shipped in Pass 6; voice capture now
   also exists through the capture line.
4. ~~Command palette, Cmd+K.~~ Already built, closed out in V118.
5. ~~Guided tour that touches nothing.~~ Shipped, with writes gated at the
   connector itself.

### Tier 2

6. **Cash flow coach.** Runs off invoices, payments and booked pipeline. Needs
   a visibility gate first, see the open question below.
7. ~~Saved views as stored JSON queries.~~ Shipped (`VIEW_SOURCES`, `viewRows`,
   `SEED_VIEWS`).
8. ~~Formula fields.~~ Shipped (`FORMULAS`, `formulaVal`, `fmtFormula`).
9. ~~Templates with backward date remapping.~~ Shipped (`TPL_SEED`,
   `workBack`, `tplApply`).
10. ~~Workload and capacity grid.~~ Shipped (`workloadGrid`, `dailyCap`).
11. **Smart calendar routing on capture.** `p8ClassifyCal` already covers
    health, personal and work. Largely done; confirm against the live file.

### Tier 3

12. Scheduled overnight lead scrub, timed to when tokens are otherwise idle.
13. Monthly token budget tracker that spends the remainder before it expires.
14. Scheduled email triage and cleanup.
15. Rollups across typed relationships: client totals, project totals.
16. Expiring read-only client links, replacing the status email.
17. Synced content blocks for usage rights, delivery specs, retouch notes.
18. Dependency cascade with critical path. Cascade shipped in V132; critical
    path did not.

### Deliberately not building

Whiteboards (Figma wins), in-app chat (iMessage and Slack win), full two-way
email (real infrastructure; a `mailto:` composer plus logged threads gets most
of it), multi-agent tool-using AI (the whole studio fits in one context
window, so one scheduled prompt with the workspace JSON gets most of it).

## OPEN QUESTIONS FOR JACKSON

1. **Cash flow visibility.** The team shares one Claude account, and a
   published artifact has no per-person identity unless the `user` capability
   is declared. Options: (a) declare `user` and gate the money surfaces to two
   account ids; (b) a passphrase gate, which is theatre against anyone who
   opens the page source; (c) leave money out of this build and put it in the
   standalone platform. Recommendation is (a) now and (c) later.
2. **QuickBooks, Bank of America, Relay.** None of these have a claude.ai
   connector today. Either money stays hand-entered here, or the standalone
   platform is where the real bank feed lives. The capture line proves the
   pattern for closing a gap like this: a small worker speaking MCP, added as
   a custom connector.
3. **The prismatic edge contradiction, still open from V70.** Section 5.3 of
   the handoff prescribes oklch hues 255 and 60, a 165 degree spread.
   Criterion 11 requires 60 degrees or less. Currently shipping the prescribed
   stops, so criterion 11 fails as literally written.

## MOTION AND UI DIRECTION

Research pass done. The governing finding: the look Jackson is after is about
**one light source and one clock**. Most implementations fail not because they
are ugly but because every card animates independently, so the page reads as
twenty toys rather than one surface under one light.

Highest value, in order:

1. Static specular bevel: 1px inset top highlight, bottom occlusion, soft cast
   shadow. Animates nothing and is most of the high-craft dark read.
2. **One fixed composited light sheet** over the card layer. One element, one
   transform, compositor only, physically coherent by construction.
3. Masked 1px conic edge ring using `mask-composite: exclude`, rotated by
   `transform` rather than by an animated custom property. Reserve the lit arc
   for the focused panel so it means something.
4. `pathLength="1"` plus `stroke-dashoffset` draw-on for charts. Runs once.
5. Catmull-Rom to cubic bezier path generation at smoothing 0.2.
6. rAF point-array lerp for chart redraw.

**On the clicking animations Jackson dislikes:** zero overshoot anywhere in
chrome. Springs are for motion that inherits velocity from a finger. Ambient
loops must be `linear`.

**Costs to respect:** animating a CSS custom property never runs on the
compositor. `backdrop-filter` is the most expensive thing available, so one or
two per page maximum, never per card.

## CONNECTOR / API VERIFICATION

- Google Calendar: create, get_event, update, delete verified live. All 7 CALS
  ids match. `list_events` field shapes confirmed against a live payload.
- Gmail `search_threads`: verified live; thread and message shapes match.
  `get_thread` verified 5 Oct 2026; field names come back camelCase, not the
  snake_case the docs use, so both spellings are read.
- No etag and no precondition argument on the Calendar connector, confirmed
  against a live payload. The approved fresh-reread fallback is what the
  ripple writer uses.
- iMessages: a local server on Jackson's Mac. It is declared
  (`host:Read_and_Send_iMessages`) and answers only when the board is open in
  the Claude app on that Mac. Settings says whether it answered.
- Capture Line: **unobserved.** It cannot exist until Jackson creates it.

## STANDING RULES IN FORCE

- **A published artifact cannot reach the open internet.** Connectors only.
  See the section near the top. This is the rule most likely to waste a
  session if forgotten.
- Line numbers are hints. Locate by function name or unique search string. If
  a line number and a function name disagree, the function name wins.
- Do not restructure, rename or reformat anything not asked about.
- No build step, framework, bundler or external dependency. One file.
- Two calendar writers. The ripple writer re-reads before it writes and rolls
  back on failure; that one is correct and does not change. The approval queue
  writer is the unsafe one.
- Every write that matters goes through `dbSet` and `dbDel`, which honour a
  not-saved contract. Never a raw db write with an empty catch.
- Any store-backed state must be seeded through its save path, never by
  assigning to `S.*`. The snapshot handler overwrites direct assignments
  mid-run. This has bitten three separate sessions.
- `.g` inside a `flex-wrap:wrap` row needs `flex:1 1 0`, not `1 1 auto`, or it
  jumps to its own line. `width:100%` plus `margin-left` overflows; use
  `padding-left` with border-box. Hit four times now.
- Anywhere a list of people is needed, read the real crew record. Never
  hardcode a name.
- Never trust a remembered test vector. Twilio's real one is
  `https://example.com/myapp.php?foo=1&bar=2` giving `L/OH5YylLD5NRKLltdqwSvS0BnU=`.
- Before recommending a build, check the live source for it, not just this
  ledger.
