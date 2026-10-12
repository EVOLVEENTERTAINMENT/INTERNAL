import sys
s=open(sys.argv[1]).read()
R=[
('''function slot(a,b){''','''/* V172. What a staged change would land on, read off the calendar he has
   loaded. Ambient calendars and all day items do not count. */
function qClash(p){
  if(!p||!p.toS||!p.toE)return [];
  return view().filter(v=>!v.all&&!v.gh&&!v.gone&&!isGhost(v)&&v.id!==p.evId&&v.pid!==p.pid
    &&!(CALS.filter(c=>c.key===v.cal)[0]||{}).amb&&v.s<p.toE&&v.e>p.toS).slice(0,3);
}
const qPast=p=>!!(p&&p.toS&&p.type!=="delete"&&p.toS<Date.now()-60000);
function slot(a,b){'''),
('''    g.appendChild(df); r.appendChild(g);
    r.appendChild(e("div",{class:"rt"},[''','''    g.appendChild(df);
    if(qPast(p))g.appendChild(e("div",{class:"su",style:"color:var(--acc);font-weight:600;font-size:12px",
      text:"This time has already passed. Approve all leaves it for you."}));
    qClash(p).forEach(v=>g.appendChild(e("div",{class:"su",style:"color:var(--sig-lift);font-size:12px",
      text:"Overlaps "+(isBiz(v)?v.title:"a personal block")+", "+hm(v.s.getHours()*60+v.s.getMinutes())+" to "+hm(v.e.getHours()*60+v.e.getMinutes())})));
    r.appendChild(g);
    r.appendChild(e("div",{class:"rt"},['''),
('''    e("button",{class:"b",text:"Drop them all",onclick:()=>{S.pending.forEach(bdUnbin);S.pending=[];queueSave();S.queueOpen=false;paint();}}),
    e("button",{class:"b on",id:"qall",text:approveBusy()?"Writing":"Approve all",
      disabled:approveBusy()?true:null,
      onclick:()=>approve(S.pending.slice())})]));''','''    e("button",{class:"b",text:"Drop them all",onclick:()=>confirm2("Drop all "+S.pending.length+"?",
      "None of these go on the calendar. Anything from the brain dump goes back to your Inbox.",
      ()=>{S.pending.forEach(bdUnbin);S.pending=[];queueSave();S.queueOpen=false;paint();})}),
    e("button",{class:"b on",id:"qall",text:approveBusy()?"Writing":"Approve all",
      disabled:approveBusy()?true:null,
      onclick:()=>{ const ok=S.pending.filter(p=>!qPast(p)); if(ok.length)approve(ok);
        if(ok.length<S.pending.length)say((S.pending.length-ok.length)+" left in the list because the time has passed.",true); }})]));'''),
('''    if(c.toS<Date.now()-60000)say("Heads up, that slot is in the past.",true);''','''    /* V172. A past slot is marked on its own row in the list, not in a toast
       per item that stacks over the list. */'''),
('''  d.appendChild(e("h2",{},["Nothing has been written yet",''','''  d.appendChild(e("h2",{},["Waiting for your OK",'''),
('const BUILD="V171 2026-10-12T23:50Z";','const BUILD="V172 2026-10-13T00:20Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
