# Evolve OS handoff, November 6, 2026

For the next session picking up Evolve OS for Jackson Cole (Evolve Entertainment Studios, Auburn, AL). Read this first, then `evolve-os/docs/EVOLVE_BUILD_LEDGER.md` for the full history.

## 1. Rules Jackson set. Follow them exactly.

- Do not create, move or delete a calendar event without telling him. Never send an email or a message on his behalf, draft only. Never write to ClickUp.
- Never invent a fact, a date, a price or a status. Undecided stays undecided and comes back to him.
- Never make him feel behind. Nothing is overdue, things are carried.
- Plain everyday language. Short. No jargon. No em dashes or en dashes, ever.
- One question at a time, multiple choice, each option with a one line preview.
- No new visible wording on the board or the app without his approval. Show a screenshot first.
- He cannot open .md files. Give him PDF, DOCX or images.
- Deleting data needs his OK.
- Never put a model identifier in commits, PRs or anything pushed.
- Outbound messages open with "Good morning/afternoon/evening"; on first contact, "My name is Jackson Cole".
- Never ask him to paste a secret into chat. Use the secure credential form (request_credential). Never put keys in environment variables or setup scripts. The Supabase URL and publishable key are public and fine anywhere.
- Laurel Oaks / LOVC: no outbound.
- He is frustrated by guesswork. Make a plan, check things the way his Mac will, and only hand him something once it is verified.

## 2. Where everything is

| Thing | Where |
|---|---|
| The claude.ai board (Evolve OS) | https://claude.ai/artifact/KmwskLGeZxU6vG284njSfR, live V185, artifact version 190 |
| Board source and patches | `EVOLVEENTERTAINMENT/INTERNAL`, `evolve-os/` (`src/EvolveOS_V185.html`, `patches/vNNN.py`) |
| Mac app | same repo, `evolve-desktop/` |
| Working branch | `claude/kind-cerf-4hh0hw` (the only dev branch; also the default) |
| Installer branch | `mac-builds` (newest installers only, Git LFS, force pushed by CI) |
| Installer link for Jackson | https://github.com/EVOLVEENTERTAINMENT/INTERNAL/raw/mac-builds/Evolve-OS-Apple-chip.dmg (Intel: `Evolve-OS-Intel.dmg`) |
| Phone site (parked) | `gh-pages` branch, https://evolveentertainment.github.io/INTERNAL/ |
| Lead engine | `EVOLVEENTERTAINMENT/evolve-lead-engine` (private, pushed to `main`) |
| Database | Supabase project EVOLVE OPS, ref `agjtcdbxlqomlgqgoutd`, https://agjtcdbxlqomlgqgoutd.supabase.co, org Evolve Entertainment Studios (free), us-east-1 |
| Cloud environment | "Evolve OS" (personal). Allowed hosts: api.supabase.com, agjtcdbxlqomlgqgoutd.supabase.co. Network secret: Supabase access token (sbp_) for api.supabase.com |
| Build history | `evolve-os/docs/EVOLVE_BUILD_LEDGER.md` (append to it every session) |
| Plan he approved | `evolve-os/docs/EvolveOS_MacAppPlan_v3_26-11-06.pdf` |

The INTERNAL repo is public. Never commit his data or any key. Board code and the publishable key are fine.

## 3. The plan and where it stands

Mac first. The iPhone app waits until he says the Mac is done.

1. **Prove it on a real Mac. Done.** Every build opens the packaged app on GitHub's Apple chip Mac with a made up board (`test/make-sample-board.js`), clicks all 11 tabs and Settings, and prints small screenshots into the log (`TOUR_JPG` lines). Errors so far: none.
2. **Installer. Done.** `Evolve-OS-Apple-chip.dmg` and `Evolve-OS-Intel.dmg`, ad hoc signed, checked like a download before they are pushed. First open needs System Settings, Privacy & Security, Open Anyway (no Apple approval yet).
3. **Automatic updates. Board part done.** The app pulls new board versions from Supabase Storage by itself. App updates that replace the app itself need Apple approval, which he will set up later.
4. **First run on his Mac. Waiting on him.** He has the installer and has opened it. Next: Download data on the claude.ai board, then bring it in or sign in.
5. **Everything working.** Feature by feature checklist against the claude.ai board on his Mac. Not started.
6. **iPhone app.** Later. Same board, TestFlight first. Needs the Apple Developer account ($99 a year, covers Mac and iPhone).

He asked whether to keep building before switching. Answer given: yes. Every board change goes to both the artifact and the app. Hold the data move until he is ready to switch for good, so records do not split.

## 4. How the Mac app works

Electron 33.2.1. The board is the same HTML as the artifact. The app serves it from `evolve://app/` and injects `app/shim/claude-shim.js`, which answers the board's `window.claude.use()` calls over IPC.

| File | Job |
|---|---|
| `app/main.js` | windows, menu, the evolve:// protocol, IPC, settings channels, test hooks (EVOLVE_DATA_DIR, EVOLVE_SNAPSHOT, EVOLVE_SHOT, EVOLVE_EVAL, EVOLVE_TOUR, EVOLVE_SETTINGS_SHOT) |
| `app/store.js` | LocalStore, a JSON store with the artifact db rules (nested paths, deep merge update, `__delete__`, where/orderBy/limit, versions) |
| `app/supabase-store.js` | same methods on Supabase: sendLink/finishLink sign in, live changes, count, importRows, saveKey |
| `app/link-catch.js` | sign in by emailed link. The link opens http://127.0.0.1:45813/signed-in and the app trades the code (PKCE) |
| `app/automove.js` | first sign in to an empty Supabase: copies the newest `Evolve_OS_Data_*.json` from Downloads plus local records. Never runs once Supabase has records |
| `app/board-updates.js` | board self update: manifest at `/storage/v1/object/public/board/manifest.json`, sha256 per file, switches after 60 s idle, falls back if a version does not start |
| `app/ai.js` | Claude on his own Anthropic key, three tiers (quick, default, complex) |
| `app/google.js` | Google sign in (loopback, PKCE), Calendar and Gmail in the connector result shapes. Gmail read only. Needs his Google Cloud desktop OAuth client |
| `app/imessage.js` | Messages read only from chat.db, needs Full Disk Access |
| `app/capture.js` | the board's "Capture Line" (get_pending, mark_filed) served from the captures collection |
| `app/config.js` | settings plus secrets encrypted with the Mac keychain (safeStorage) |
| `app/settings.html` | Settings window (Cmd + comma): Claude key, Google, Messages, Supabase sign in |
| `tools/publish-board.js` | puts a board version up for installed apps |
| `tools/evoldb.py` | ArtifactData style CLI on Supabase, for the nightly tasks after the switch |
| `routines/PREAMBLE.txt` | what to add to each nightly task on switch day |

Supabase side (`supabase/`): `schema.sql` (one `docs` table, owner row level security, `doc_set`/`doc_update` with deep merge and version checks, owner trigger, `app_secrets` with no read policy, `save_app_secret`), functions `claude` (phone Claude, owner only, key from `app_secrets` or `ANTHROPIC_API_KEY`) and `capture` (voice notes and texts into `captures`). Function secrets set: OWNER_EMAIL, CAPTURE_KEY, OWNER_PHONE. Not set: ANTHROPIC_API_KEY (comes from the app instead), TWILIO_AUTH_TOKEN (no number yet).

Auth: one user, jackson@evolveentertain.com, no password, sign ups off. Supabase's built in email sends the sign in link (free plan cannot change the template). The real email has never been tried; his first sign in is the test.

## 5. How to do the common jobs

**Change the board**
1. Read the live artifact first (Artifact read), compare with `evolve-os/src/` latest.
2. Write `evolve-os/patches/vNNN.py`: anchored replacements, each anchor asserted to occur once, bump `const BUILD`.
3. Screenshot any new wording and get his OK.
4. Publish with the Artifact tool to the artifact URL. Omit `capabilities` so they carry forward. Never declare `capabilities.permissions`.
5. Copy the same file to `evolve-desktop/app/board/index.html`, run `tools/publish-board.js` (below), commit.

**Supabase admin.** Management API through the proxy: `https://api.supabase.com/v1/projects/agjtcdbxlqomlgqgoutd/...` (database/query, functions/deploy, secrets, config/auth, api-keys). When the service key is needed (publish-board, admin calls), fetch it from `api-keys?reveal=true` into a scratch file with umask 077, use it, delete it. Never print it, never store it.

**Build the app.** Push to the working branch. `.github/workflows/mac-app.yml` runs the tests on Linux with Postgres, then on macos-latest: build, sign, tour, installers, check like a download, push to `mac-builds`.

**Read CI logs.** `get_job_logs` with `return_content` saves big logs to a file; grep that file. The log blob host is blocked from the sandbox.

**Run tests here.** Local Postgres 16 at `/var/tmp/pgtest/data`, port 5499. If it is down: remove the stale pid and socket, then `pg_ctl -D /var/tmp/pgtest/data -o '-p 5499 -k /var/tmp/pgtest -c listen_addresses=127.0.0.1' start` as postgres. Then `EVOLVE_TEST_PG=postgresql://postgres@127.0.0.1:5499/postgres npm test` in `evolve-desktop`. The app itself runs under `xvfb-run -a npx electron --no-sandbox .`. Sample board: `node test/make-sample-board.js <dir>`, then `EVOLVE_SNAPSHOT=<dir>`. His Oct 12 data copy is at `/home/user/evolve-data/dev-snapshot` in this container only, never in the repo.

## 6. Things that bit us. Do not repeat them.

- **His board's data cannot be copied out by Claude.** ArtifactData refuses `out_dir` for this artifact and cuts big results at a size cap. The only exact copy is the board's own Download data button (Settings, Backup). V185 made it show "Gathering your data..." and then "Saved N records to your Downloads." or "Not saved. Click Download data to try again."
- **"Damaged" on his Mac** came from a broken ad hoc signature. The fix: build unsigned, `codesign --force --deep --sign -`, `codesign --verify --deep --strict`, make the dmg from that app (`--prepackaged`), then mount it, add a quarantine flag and verify again. spctl saying "rejected" is normal without Apple approval.
- **GitHub releases return 403** for the workflow token. Pushing branches works. Installers over 100 MB go through Git LFS.
- **Big files do not come through the chat.** Give him a download link instead.
- **supabase-js from esm.sh failed inside an edge function.** Call `/auth/v1/user` with fetch instead.
- **The claude.ai publish classifier blocked V182** (the paste feature) because it adds the Claude Code Remote capability. V182 is still unpublished.
- **Do not hand him something you have not checked the way his machine will.** He lost trust when the installer said damaged.

## 7. Open items

**Waiting on Jackson**
- First run: click Download data on the board and tell us the record count. Then either File > Bring in board data (look around, Mac only) or sign in (real switch).
- Anthropic key (console.anthropic.com, needs credit), pasted in the app Settings. The app also saves it for the phone.
- Google Cloud desktop OAuth client (ID and secret) for Calendar and Gmail in the app.
- Apple Developer account, later, once the software is further along.
- Optional: a Twilio number for texting the Capture Line (same Twilio account as Boos & Brews).

**Ours to do**
- Step 5 checklist of every board feature, then check each on his Mac.
- Switch day: put a fresh export in, swap any local test copy, move the 9 nightly tasks to Supabase with `routines/PREAMBLE.txt` and `tools/evoldb.py` (the service key will need to be a network secret for that environment).
- iPhone Shortcut for voice capture: needs a small Settings section that fetches `/functions/v1/capture/key`. New wording, needs his OK.
- Lead engine: the nightly hand-off has never worked (GitHub secrets PLACES_KEY, GDRIVE_SA_KEY and GDRIVE_FOLDER_ID are not set; the Drive sweeps folder is empty). After the switch, write leads straight to Supabase instead.
- Decide what to do with the parked phone site (`gh-pages`) once the iPhone app exists.
- Suggest making the INTERNAL repo private (his call; the installer link and phone site would then need another home).

**Other context**
- Boos & Brews II (his party app) lives on his Mac at `/Users/rjacksoncole/Projects/boos-brews-ii` and cannot be changed from the cloud. Texts go out through a Netlify scheduler and Twilio, 8 AM to 8 PM CT. My recommendation was to keep guys at $20.
