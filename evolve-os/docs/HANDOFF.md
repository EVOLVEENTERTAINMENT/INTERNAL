# EVOLVE OS, HANDOFF PACKET
### State as of 8 October 2026, build V143

Paste this whole file into a new session as the first message. Everything a
fresh Claude needs is in here or named in here.

---

## 1. THE ONE PARAGRAPH

Evolve OS is R. Jackson Cole's private founder dashboard. It is a single
self-contained HTML page published as a Claude Artifact at
**https://claude.ai/artifact/KmwskLGeZxU6vG284njSfR**. It reads his Google
Calendar and Gmail through claude.ai connectors, keeps its own records in the
artifact database, and never writes a calendar or sends a message without his
tap. The live build is **V143**, published 9 Oct 2026, artifact version 143,
version id `1791480016-7207`. V143 added the critical path to project timelines; V142 removed unused styles and made the inbox sweeps read past one page; V140 trimmed the last overdue and failed wording; V139 made Approve hold a change Google cannot confirm; V138 added the 30 day bin; V137 is the 8 October audit fixes. Before it, the carried wording
sweep (V134 to V136): every project and deliverable date that has passed now
reads as carried. Invoices keep late and past due. The capture line was V133.

---

## 2. READ THESE FIRST, IN THIS ORDER

All four live in the **EVOLVE OS** Claude Project, not on disk. Use
`project_read`, do not go looking in the filesystem.

| Doc | What it is |
|---|---|
| `claude/EVOLVE_BUILD_LEDGER.md` | **The authority.** Current version, full version history, data model, verification harness, open audit findings, the build queue, standing rules. Updated through V133. |
| `claude/evolve-os-capture-line.md` | The capture line in detail: architecture, where the worker lives, what is still open. |
| `claude/EVOLVE_AGENT_BUILD_PLAN.md` | The agent build plan. |
| `claude/EVOLVE_LEAD_ENGINE_PLAN.md` | The lead engine plan. |

Then read the live artifact source before changing anything. The ledger has a
known gap (V100 to V130 is thinly documented) and has been wrong about what
was already built at least once.

---

## 3. HIS RULES. THESE ARE NOT PREFERENCES.

Quoted from him, not paraphrased. Breaking one of these is a failed build.

- "Do not create, move or delete a calendar event without telling me. Never
  send an email or a message on my behalf, draft only. Never write to ClickUp."
- "Never invent a fact, a date, a price or a status. Undecided stays undecided
  and comes back to me. Label a suggestion as a suggestion."
- "Usable day is about 9:00 AM to 1:30 AM. Night blocks are normal."
- "ADHD. No work block over 90 minutes. Real gaps between blocks."
- "Exactly one must-do per day, named."
- "Never make me feel behind. Nothing is overdue, things are carried."
- "Plain everyday language. Short. No jargon. No em dashes or en dashes, ever."
- "One question at a time, multiple choice, each option with a one line
  preview of what it does. Never stack questions. Never hand me a wall of text
  to read before I can answer."
- "Fix what you can fix directly. Only surface what genuinely needs me."
- "REMEMBER THIS IS FOR INTERNAL USE. GOAL OF THE BUILD IS TO HELP ME RUN THE
  COMPANY SMOOTHLY AND EFFICIENTLY."

Two more, from his standing preferences:

- **He cannot open .md files on his computer.** Anything he is meant to READ
  goes to him as PDF or DOCX. A .md is only acceptable when it gets pasted
  into something rather than read, which is exactly what this file is.
- **COPY RULE.** You are not the product copywriter. Do not invent or polish
  visible product copy. If an implementation needs new visible copy that has
  not been supplied, mark it `COPY REQUIRED, DO NOT AUTHOR` and bring it back
  to him. There is a list of strings already waiting on his ruling in the
  ledger.

Also: Evolve is a **full agency**, not a video production company. Video,
photography, web and design.

---

## 4. THE CONSTRAINT THAT WILL WASTE YOUR SESSION IF YOU FORGET IT

**A published Claude Artifact cannot reach the open internet.** `fetch()` to
any address silently fails in production. Only the connectors declared in
`capabilities.mcp.servers[]` get out.

The weather on Home is a baked-in `WX_SEED` snapshot for this reason, and the
live fetch sitting next to it has never once succeeded in a published build.

This cost one full rebuild in the V133 session. Anything that needs the
outside world has to be a connector.

---

## 5. WHAT V133 SHIPPED, AND WHAT IS LEFT TO MAKE IT RUN

### Built, published, tested

```
Twilio number -> worker POST /sms   (HMAC signature + owner number) -> KV
iOS Shortcut  -> worker POST /note  (Authorization: Bearer KEY)     -> KV
the board     -> worker POST /mcp/<BOARD_KEY>, a custom connector
                 named exactly "Capture Line"
                 tools: get_pending, mark_filed
```

In the board: `S.capline` and `prefs/capline`, a one minute poll, a Settings
section, and three new model tools `propose_event` / `propose_move` /
`propose_cancel` that call `stage()` and never touch Google. `read_calendar`
now returns `event_id`.

Checks that passed: 206 of 206 board assertions against the merged file, 13 of
13 worker assertions including Twilio's published signature vector, Node
`--check` on both script blocks, and the new Settings section screenshotted at
1440 and 390 with the images actually read.

### Not done. This is the handoff.

The worker is written but **not deployed**. Until it is, the capture line is
dark and the board's Settings will say not answering. Seven steps remain, all
of them on Jackson's own accounts:

1. Buy a Twilio number, copy the Auth Token.
2. `npx wrangler login`, then `npx wrangler kv namespace create CAPTURES`,
   paste the id into `wrangler.toml`.
3. `npx wrangler secret put TWILIO_AUTH_TOKEN` and
   `npx wrangler secret put BOARD_KEY`.
4. `npx wrangler deploy`. Put the printed address plus `/sms` into
   `PUBLIC_SMS_URL` in `wrangler.toml`, deploy again.
5. Point the Twilio number's "A message comes in" webhook at
   `https://<worker>/sms`, HTTP POST.
6. claude.ai, Settings, Connectors, Add custom connector:
   `https://<worker>/mcp/<BOARD_KEY>`, named **exactly** `Capture Line`.
7. Build the iPhone shortcut: Dictate Text, then Get Contents of URL, POST to
   `https://<worker>/note`, header `Authorization: Bearer <BOARD_KEY>`, JSON
   body field `text` set to the Dictated Text variable.

Full step-by-step with the exact field values is in
`LifeOS_CaptureLine_SPEC_26-10-08_FINAL.pdf`.

---

## 6. WHERE TO RUN THIS. THE ACTUAL RECOMMENDATION.

**Run the deploy in Claude Code on his Mac, not in a cloud session.**

A cloud session cannot log into his Cloudflare account, cannot open the Twilio
console, and cannot touch his iPhone. It would spend the whole session reading
commands out to him. A local Claude Code session can run `wrangler` for real,
see the errors, fix the toml and redeploy, which is most of the twenty
minutes.

Split it like this:

| Where | What it is good for |
|---|---|
| **Claude Code on the Mac** | Deploying the worker. Steps 1 to 5 above. It has a real shell and his logins. |
| **His phone** | Step 7, the shortcut. Nobody can do that for him. |
| **A Claude session with the Artifact tool** | Step 6 and everything after: changing the board itself, since only a session with the Artifact tool can republish the artifact. |

The board and the worker are independent. The worker can be deployed and
tested on its own (`curl https://<worker>/health`) before the board ever sees
it.

---

## 7. IF YOU ARE GOING TO CHANGE THE BOARD, READ THIS

- **The publish gate.** The Artifact tool refuses to republish until the live
  version's saved source has been read in full, line by line, with the Read
  tool. There is no way around it and it is a real cost: the file is roughly
  24,700 lines. Budget for it at the start, not the end.
- **Merge by patching the live bytes.** Another session rebuilt Projects while
  V133 was being built. The right move was to patch their published source on
  disk with anchored string replacements, never to rebuild from memory. Use a
  script where every `assert s.count(old)==1` runs before the single write, so
  a failed anchor leaves the file untouched.
- **Seed store-backed state through its save path**, never by assigning to
  `S.*`. The snapshot handler overwrites direct assignments mid-run. Three
  separate sessions have been bitten by this.
- **`.g` inside `flex-wrap:wrap` needs `flex:1 1 0`**, not `1 1 auto`, or it
  jumps to its own line. `width:100%` plus `margin-left` overflows; use
  `padding-left` with border-box. Hit four times now.
- **Never declare `capabilities.permissions`.** It is built in and declaring
  it is a 422.
- **The capabilities manifest (unchanged since V133)**, which must be resent in full on any
  republish that changes it:

```json
{"db": {}, "sample": {}, "downloads": true,
 "mcp": {"servers": [
   {"server": "Google Calendar",
    "tools": ["list_events","get_event","create_event","update_event","delete_event"]},
   {"server": "Gmail", "tools": ["search_threads","get_thread"]},
   {"server": "host:Read_and_Send_iMessages",
    "tools": ["get_unread_imessages","read_imessages"]},
   {"server": "Capture Line", "tools": ["get_pending","mark_filed"]}]}}
```

- **The test harness does not persist.** It lives in a session scratchpad and
  dies with the session. Every session that touches this build rebuilds it.
  Chromium is at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Serve
  the built file over http with a tiny static server, because Chromium
  partitions localStorage unpredictably on `file://`.
- **The tour gate.** V132 wraps `mcp.callTool` and refuses any tool whose name
  does not match `^(get|list|search|read|fetch|show|find|describe|resolve|check|suggest)[_-]`
  while the tour is on. `get_pending` passes, `mark_filed` does not. That is
  correct. Do not "fix" it.

---

## 8. OPEN, AND WHO OWNS IT

**Jackson's, not a build item:**
- 68 raw captures unsorted since 21 September.
- The 2 October audit findings, untouched.
- Last week's unclosed days.
- The visible copy strings waiting on his ruling. Listed in the ledger.

**Fixed in V134 to V136:**
- The V68 late bug, and every other late, over or past wording on projects
  and deliverables. Five lines Claude had to word are in the ledger, waiting
  on his ruling.

**Unverified:**
- The `Capture Line` connector is declared against an unobserved interface.
  It cannot exist until he creates it, so no real call was possible before
  publishing. The first live call is his.

---

## 9. FILES IN THIS PACKET

| File | What to do with it |
|---|---|
| `HANDOFF.md` | This. Paste it into a new session. |
| `EVOLVE_BUILD_LEDGER.md` | Same content as the Project doc, for offline reading. The Project copy is the live one. |
| `worker.js` | The Cloudflare worker. Deploy it. |
| `wrangler.toml` | Its config. Two placeholders to fill in. |
| `LifeOS_CaptureLine_SPEC_26-10-08_FINAL.pdf` | The setup steps, written for Jackson to read. |
| `v133.html` | A snapshot of exactly what is published. The artifact itself is the live copy; this is for diffing. |

---

## 10. THE FIRST THING TO SAY TO HIM

Do not open with a plan or a status report. He will not read it. One short
multiple choice question, each option with a one line preview of what it does.
Then start.
