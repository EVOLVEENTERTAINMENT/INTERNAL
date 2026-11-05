import sys
s=open(sys.argv[1]).read()
R=[
('''async function downloadData(){
  const stamp=dk(new Date());
  const name="Evolve_OS_Data_"+stamp+".json";
  let text;
  try{ text=JSON.stringify(exportData(),null,2); }
  catch(x){ say("The data file could not be created.",true); return; }''',
'''/* V183. Download data now holds every collection, read straight from the
   database, not only what is open on screen. The Mac app brings this file in
   as it is. The older top level fields stay, so nothing that reads them
   changes. */
const EXPORT_COLS=("activity agenda assign audit bin brain brief briefs bus calmeta changelog chat clients code context "
  +"costs crew decisions detectors diag digests done duelist expenses goals ideas intent invoices kept leadops memory meta "
  +"milestones money mustdo notes nudge pastes pbrain people pipeline prefs projects prospects pw queue recover runs sales "
  +"scraps settings sweeps targets tasks teambrief templates time_active time_entries travel_memory views waiting weather workorders").split(" ");
async function exportAll(){
  const out=Object.assign(exportData(),{format:"evolve-os-export",version:1,build:BUILD,collections:{},unread:[]});
  if(!db)return out;
  for(const c of EXPORT_COLS){
    try{
      const s=await db.collection(c).get();
      if(!s||!s.docs||!s.docs.length)continue;
      const m={}; s.docs.forEach(d=>{ const v=d.data(); if(v)m[d.id]=v; });
      out.collections[c]=m;
    }catch(x){ out.unread.push(c); }
  }
  return out;
}
async function downloadData(){
  const stamp=dk(new Date());
  const name="Evolve_OS_Data_"+stamp+".json";
  let text;
  try{ text=JSON.stringify(await exportAll(),null,1); }
  catch(x){ say("The data file could not be created.",true); return; }'''),
('const BUILD="V181 2026-10-13T23:30Z";','const BUILD="V183 2026-11-05T23:50Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
