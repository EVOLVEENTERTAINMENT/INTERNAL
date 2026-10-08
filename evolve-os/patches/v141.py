import sys
s=open(sys.argv[1]).read()
R=[
# 1. inbox and money sweeps read past the first page, up to 75 threads
('''        const r=await mcp.callTool(GM,"search_threads",{query:query,pageSize:25,view:"THREAD_VIEW_MINIMAL"});
        const pl=(r&&r.payload)||{};
        const th=((pl.threads)||[]).map(t=>{''',
 '''        /* V141. One page of 25 missed mail on a busy day (a live search on
           8 Oct 2026 estimated 201 threads in one day). Follow nextPageToken
           up to 75 threads. */
        let threads=[], tok="";
        for(let pg=0;pg<3;pg++){
          const args={query:query,pageSize:25,view:"THREAD_VIEW_MINIMAL"};
          if(tok)args.pageToken=tok;
          const r=await mcp.callTool(GM,"search_threads",args);
          const pl=(r&&r.payload)||{};
          threads=threads.concat(pl.threads||[]);
          tok=pl.nextPageToken||"";
          if(!tok)break;
        }
        const th=threads.map(t=>{'''),
# 2. the capture line does not pull during the tour, where mark_filed is refused
('''async function capPull(quiet){
  if(CAP_BUSY)return;''',
 '''async function capPull(quiet){
  if(CAP_BUSY)return;
  /* V141. mark_filed is a write and the tour refuses it, so a pull here
     would sort items it could never mark, and they would come back. */
  if(tourBlocked()){ if(!quiet)tourHush(); return; }'''),
# 3. activity loads the newest 160, not every row ever written
('''  db.collection("activity").onSnapshot(s=>{''',
 '''  /* V141. every row ever written used to load on each open, then all but
     120 were thrown away. logRef keeps 160, so that is the window. */
  db.collection("activity").orderBy("at","desc").limit(160).onSnapshot(s=>{'''),
# 4. tell the model when a thread has newer messages the preview left out
('''            snippet:String(m0.snippet||"").slice(0,240)};});''',
 '''            snippet:String(m0.snippet||"").slice(0,240),
            more_after_this:(Number(t.messageCount)||0)>((t.messages||[]).length)};});'''),
('''          snippet:String(m0.snippet||"").slice(0,220)};});}''',
 '''          snippet:String(m0.snippet||"").slice(0,220),
          more_after_this:(Number(t.messageCount)||0)>((t.messages||[]).length)};});}'''),
('''description:"Search Jackson's Gmail with Gmail query syntax, for example 'newer_than:3d in:inbox' or 'from:jennifer invoice'.",''',
 '''description:"Search Jackson's Gmail with Gmail query syntax, for example 'newer_than:3d in:inbox' or 'from:jennifer invoice'. Each result shows only the oldest few messages; when more_after_this is true, call read_email_thread before saying anything about the latest reply.",'''),
('const BUILD="V140 2026-10-08T23:00Z";','const BUILD="V141 2026-10-09T00:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:70]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
