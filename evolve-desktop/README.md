# Evolve OS for Mac

The Evolve OS board as its own Mac app, running without claude.ai.
Plan: `../evolve-os/docs/EvolveOS_MacAppPlan_26-11-05.pdf`.

## How it works
The board (`app/board/index.html`, the same file published to claude.ai) talks
to the outside world only through `window.claude.use(name)`. The app supplies
that doorway itself (`app/shim/claude-shim.js`), so the board is not changed.

| Capability | Step 1 (now) | Later |
|---|---|---|
| db | Local store, one JSON file per collection (`app/store.js`) | Supabase (step 2) |
| downloads | Save dialog | same |
| sample (Claude) | not yet, features hide themselves | Anthropic API key (step 3) |
| mcp (Calendar, Gmail, texts, capture line) | not yet | Google sign in, Messages on the Mac (steps 4, 5) |

## Run it
    npm install
    npm start
Data lives in the app's own folder (`~/Library/Application Support/Evolve OS/board-data`).
File > Bring in board data... copies in an export folder (`<collection>/<doc>.json`).

## Build the Mac app
GitHub builds it on a Mac: Actions, "Build the Evolve OS Mac app". The .dmg is on
the run page. It is not signed yet, so the first time: right click the app, Open.

## Tests
    npm test
