# Switch day: moving the nightly tasks to Supabase

For us, not for Jackson. Built from HANDOFF_26-11-06.md (sections 1 to 7), routines/README.md, routines/PREAMBLE.txt, evolve-os/routines and the build ledger. Nothing here is done until Jackson says he is switching for good (handoff section 3: hold the data move so records do not split).

## The order on the day

1. Jackson clicks Download data on the claude.ai board (Settings, Backup) and tells us the record count. That file is the only exact copy of his data (handoff section 6).
2. If Supabase holds a local test copy or a sample board, clear it first. The first sign in moves the board by itself only into an empty Supabase and never runs again once records exist (app/automove.js, handoff section 4). Deleting data needs his OK (handoff section 1).
3. Jackson signs in to the Mac app with the emailed link. automove copies the newest Evolve_OS_Data_*.json from Downloads plus his local records.
4. Check the record count in Supabase against the count from step 1. Stop here on any mismatch.
5. Save the service key as a network secret for the tasks' cloud environment: host agjtcdbxlqomlgqgoutd.supabase.co, header apikey, through the secure credential form. Never pasted in chat, never in an environment variable, never in a setup script (handoff section 1). tools/evoldb.py carries no key and has no environment variable for one.
6. Create brain/settings with {"on": true} through evoldb.py, so the kill switch in the preamble has a document to read. A task treats a missing document as on; only on: false stops it.
7. For each task that moves: save the current prompt as evolve-os/routines/<trigger id>.rollback.txt if there is none yet. Build the new prompt as PREAMBLE.txt with __PROJECT_URL__ and __TASK_ID__ filled in, then the existing prompt unchanged, then the line THE DATABASE SCRIPT, then the whole of tools/evoldb.py. Update the scheduled task's prompt. Convert the schedule's fields to Chicago time and prefix CRON_TZ=America/Chicago, so the fire time does not move. Save the new prompt as <trigger id>.current.txt.
8. Move the tasks one at a time, 5:30 first (it clears the bus and the others read what it writes), then the rest. The README does not say whether to move them together. One at a time is safer and costs nothing.
9. After the first night: list runs through evoldb.py and check each task's run document is there and carries updated_by with that task's id. Check the 5:30 run document names nothing as stopped.
10. Add a ledger entry in evolve-os/docs/EVOLVE_BUILD_LEDGER.md with the date, the trigger ids moved and the rollback file names.

Rollback: put the .rollback.txt (or the .current.txt from before the switch) back as the task's prompt. The claude.ai board still holds the data as of switch day; nothing deletes it. Locking the artifact read only would be new visible wording, so it waits for Jackson.

## The 9 task ids against what the repo holds

The 5:30 prompt (evolve-os/routines/trig_01G7SsTFGkFAmWok1uMNTS1t.current.txt line 24) names the live task ids: s-state, s-inbox, s-money, s-plan, s-audit, s-team, s-car, s-text and s-leads. The handoff (section 7) says 9 nightly tasks move. The scheduling handoff (evolve-os/docs/handoff_scheduling_content.py, section 11) lists 14 running tasks. Which task is which id is only written down where a prompt file in the repo says so.

| Task id | What the repo ties it to | Trigger id in the repo | Prompt files in evolve-os/routines |
|---|---|---|---|
| s-state | Morning project state, daily 5:30 AM. Writes runs/r-state-YYYYMMDD with taskId s-state (its own prompt, line 73). | trig_01G7SsTFGkFAmWok1uMNTS1t | current.txt and rollback.txt |
| s-leads | Night Lead Engine, daily 1:13 AM. Writes runs/r-leads-YYYYMMDD with taskId s-leads (its own prompt, line 15). | trig_012vpVdF8GNkPyLhW74aEHNG | current.txt and rollback.txt |
| s-money | The rollback file for the 5:47 morning refresh calls its Check B "money watch (sweepId s-money)". There is also a Thursday 9:00 AM Money watch task. Which of the two carries the id, or both: unknown. | trig_017J1KJTdgmVKneDFHkqp5sh (the 5:47 refresh) | rollback.txt only, and only the changed section |
| s-team | Monday team brief, Mon 8:30 AM, writes teambrief (ledger line 955). The id is a guess from the name: no prompt file in the repo. | trig_01BsZ1N9etsPF2UFPUvWKBSL (ledger line 955) | none |
| s-inbox | Inbox sweep, 8:00 AM and 6:00 PM, by name only. No prompt file, no trigger id in the repo. | unknown | none |
| s-plan | Sunday planning pass, Sun 6:30 PM, by name only. No prompt file, no trigger id in the repo. | unknown | none |
| s-audit | Friday board audit, Fri 5:00 PM, by name only. No prompt file, no trigger id in the repo. | unknown | none |
| s-car | Car goal agent, daily 7:40 PM, by name only. No prompt file, no trigger id in the repo. | unknown | none |
| s-text | The text tasks. Two tasks need the Mac (below); whether both share this id or only one has it: unknown. No prompt file, no trigger id in the repo. | unknown | none |

Only s-state and s-leads are confirmed by their own prompts. Every other row needs the live scheduled task list (list_triggers in the Evolve OS environment) before switch day. Do not fill the __TASK_ID__ placeholder from a guess.

## Which prompts have rollback files

- trig_012vpVdF8GNkPyLhW74aEHNG (Night Lead Engine): rollback.txt is the whole prompt from before 12 Oct; current.txt is the live one.
- trig_01G7SsTFGkFAmWok1uMNTS1t (Morning project state): rollback.txt is the whole prompt from before 12 Oct; current.txt is the live one.
- trig_017J1KJTdgmVKneDFHkqp5sh (Evolve OS morning refresh): rollback.txt holds only Check B, the one section changed on 12 Oct. The rest of the prompt is not in the repo.
- The other tasks have no rollback file. Step 7 above saves one before anything changes.
- Four prompts (Morning project state, Inbox sweep, Sunday planning pass, Monday team brief) also got a MEMORY FIRST first paragraph on 12 Oct (ledger line 1035); the rollback for that is to delete the paragraph.

## Which tasks stay on claude.ai because they need the Mac

- Read what Jackson texted back, daily 5:15 AM. Reads his iMessages through the Claude app's host connector; needs his Mac awake. Trigger id not in the repo.
- Morning text sweep, daily 8:45 AM. Same connector, same need. Trigger id not in the repo.

The Mac app reads Messages only for the board (app/imessage.js) and gives a cloud task no way in, so these two keep using ArtifactData on the claude.ai board until texts reach Supabase another way. The handoff (section 4, the Supabase side) says the capture function takes texts, but there is no number yet. While they do, anything they write (done marks, mustdo, who owes him) lands on the retired copy and not in the app. Say so to Jackson before the switch, with the two options: wait for the texts collection, or accept that those two tasks pause.

Tasks with no id in the 5:30 list (Close the day nudge, Sunday Walmart restock list, Change Waterdrop filter): whether they read or write the board at all is not in the repo. Check their prompts on the day; a task that never touches the board needs no preamble.

## Open questions

1. The real id to task mapping for s-inbox, s-money, s-plan, s-audit, s-team, s-car and s-text (above).
2. Whether the Thursday Money watch and the 5:47 Check B both write as s-money, and if so whether they can collide on context/core.
3. The cloud environment for the tasks: the handoff names "Evolve OS" (personal) with the project host already allowed. Confirm the network secret goes there and that no task runs in another environment.
4. brain/settings is new on the board side. The board does not read it (nothing in app/board/index.html names it). Creating it is a data write with no wording, so it needs no approval, but say it in the ledger.
5. The 5:30 task deletes runs documents older than 30 days (its prompt, line 74). With updated_by now on every run document, decide whether that stays. Nothing in the repo settles it.
