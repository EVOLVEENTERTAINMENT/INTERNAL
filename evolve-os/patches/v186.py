import sys
s=open(sys.argv[1]).read()
R=[
# 1. Download data: four more collections, so the export carries them when they hold records.
('''const EXPORT_COLS=("activity agenda assign audit bin brain brief briefs bus calmeta changelog chat clients code context "
  +"costs crew decisions detectors diag digests done duelist expenses goals ideas intent invoices kept leadops memory meta "
  +"milestones money mustdo notes nudge pastes pbrain people pipeline prefs projects prospects pw queue recover runs sales "
  +"scraps settings sweeps targets tasks teambrief templates time_active time_entries travel_memory views waiting weather workorders").split(" ");''',
'''/* V186. Four more names (arrivals, daily_brief, daysig, ledger) so the file
   carries them when they hold records. Empty ones are skipped as before. */
const EXPORT_COLS=("activity agenda arrivals assign audit bin brain brief briefs bus calmeta changelog chat clients code context "
  +"costs crew daily_brief daysig decisions detectors diag digests done duelist expenses goals ideas intent invoices kept "
  +"leadops ledger memory meta milestones money mustdo notes nudge pastes pbrain people pipeline prefs projects prospects pw queue "
  +"recover runs sales scraps settings sweeps targets tasks teambrief templates time_active time_entries travel_memory views waiting weather workorders").split(" ");'''),
# 2. The run record a sweep writes from the page: taskId beside sweepId, so one key reads everywhere.
('''  const row={id:id,sweepId:s.id,at:new Date().toISOString(),found:found,changed:changed};''',
'''  /* V186. taskId beside sweepId, the same value, so one key reads everywhere. */
  const row={id:id,sweepId:s.id,taskId:s.id,at:new Date().toISOString(),found:found,changed:changed};'''),
# 3. Settings Connections: Google rows read the per server flags once the servers have been listed.
('''  const conns=[
    ["Google Calendar","where your time actually is",!!mcp],
    ["Gmail","read only, drafts only, nothing sends",!!mcp],''',
'''  /* V186. Once the servers have been listed, the Google rows read the per
     server flags that detectServers sets. Inside the Mac app mcp can be live
     with only Messages or the Capture Line behind it, and !!mcp alone said
     Google was there. Before the list answers, it reads as it always did. */
  const listed=!!(S.diag&&S.diag.listed);
  const conns=[
    ["Google Calendar","where your time actually is",listed?!!(S.servers&&S.servers.gcal):!!mcp],
    ["Gmail","read only, drafts only, nothing sends",listed?!!(S.servers&&S.servers.gmail):!!mcp],'''),
# 4. Build stamp.
('const BUILD="V185 2026-11-06T04:30Z";','const BUILD="V186 2026-11-06T06:30Z";'),
]
# every anchor is checked before anything is replaced
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80])
for a,b in R:
    s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
