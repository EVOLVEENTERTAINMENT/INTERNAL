import sys
s=open(sys.argv[1]).read()
ENGINE='''/* V143. The critical path. Dates here are fixed, not worked out from
   durations, so each open task's room is how many days it could finish later
   before it pushes back the last task date on the project, through the tasks
   that wait on it. A task that starts the day after another ends leaves it no
   room, so a back to back chain reads as one. Zero room or less is critical. Drawn only when the project has at least one link between open
   tasks, because without links there is no chain to show. */
function ppFloat(tasks){
  const open=tasks.filter(t=>pwOpen(t)&&ppSpan(t));
  const byId={}; open.forEach(t=>{byId[t.id]=t;});
  if(!open.some(t=>(t.depends||[]).some(id=>byId[id])))return null;
  let end=""; open.forEach(t=>{const e=ppSpan(t).e; if(e>end)end=e;});
  const succ={};
  open.forEach(t=>(t.depends||[]).forEach(id=>{ if(byId[id])(succ[id]=succ[id]||[]).push(t); }));
  const memo={}, busy={};
  const room=t=>{
    if(memo[t.id]!==undefined)return memo[t.id];
    if(busy[t.id])return 0;              // a loop in the links: no room, never hang
    busy[t.id]=1;
    const e=ppSpan(t).e;
    let r=ppDiff(e,end);
    (succ[t.id]||[]).forEach(x=>{ r=Math.min(r,ppDiff(e,ppSpan(x).s)-1+room(x)); });
    busy[t.id]=0;
    return (memo[t.id]=r);
  };
  const out={end:end,room:{},crit:{}};
  open.forEach(t=>{ const r=room(t); out.room[t.id]=r; if(r<=0)out.crit[t.id]=true; });
  return out;
}

'''
R=[
('/* Everything downstream of one task that it now runs into, with how far', ENGINE+'/* Everything downstream of one task that it now runs into, with how far'),
('''  const clash={}; ppClashes(c.tasks).forEach(x=>{clash[x.t.id]=x;});

  /* rows: phases in kit order''','''  const clash={}; ppClashes(c.tasks).forEach(x=>{clash[x.t.id]=x;});
  const cp=ppFloat(c.tasks);

  /* rows: phases in kit order'''),
('''      const cls="gb "+t.status+(late?" late":"")+(clash[t.id]?" clash":"");''',
 '''      const crit=!!(cp&&cp.crit[t.id]), rm=cp&&cp.room[t.id]!==undefined?cp.room[t.id]:null;
      const cls="gb "+t.status+(late?" late":"")+(clash[t.id]?" clash":"")+(crit?" crit":"");'''),
('''          +(late?"\\nCarried":"")+(clash[t.id]?"\\nStarts before "+clash[t.id].d.title+" ends":""),
        "aria-label":t.title+", "+ppFmtRange(sp.s,sp.e)},''',
 '''          +(late?"\\nCarried":"")+(clash[t.id]?"\\nStarts before "+clash[t.id].d.title+" ends":"")
          +(crit?"\\nSets the end date":rm!==null?"\\n"+plur(rm,"day")+" of room":""),
        "aria-label":t.title+", "+ppFmtRange(sp.s,sp.e)+(crit?", sets the end date":"")},'''),
('''      path.setAttribute("class",clash[t.id]&&clash[t.id].d.id===id?"hot":"");''',
 '''      const onCp=cp&&cp.crit[t.id]&&cp.crit[id]&&ppDiff(ppSpan(pwTaskById(id)).e,ppSpan(t).s)<=1;
      path.setAttribute("class",clash[t.id]&&clash[t.id].d.id===id?"hot":onCp?"crit":"");'''),
('''    e("span",{},[e("i",{class:"k dia"}),"milestone"]),e("span",{},[e("i",{class:"k sq"}),"deliverable due"]),
    e("span",{class:"sp"}),''',
 '''    e("span",{},[e("i",{class:"k dia"}),"milestone"]),e("span",{},[e("i",{class:"k sq"}),"deliverable due"]),
    cp?e("span",{},[e("i",{class:"k crit"}),"critical path"]):null,
    e("span",{class:"sp"}),'''),
('''.gb.clash{box-shadow:inset 0 0 0 1.5px var(--acc),0 0 0 2px var(--acc-soft)}''',
 '''.gb.clash{box-shadow:inset 0 0 0 1.5px var(--acc),0 0 0 2px var(--acc-soft)}
.gb.crit{background-image:linear-gradient(var(--fg2),var(--fg2));background-size:100% 3px;background-position:0 100%;background-repeat:no-repeat}
.gb.blocked.crit{background-image:linear-gradient(var(--fg2),var(--fg2)),repeating-linear-gradient(135deg,var(--acc-soft) 0 5px,transparent 5px 10px);background-size:100% 3px,auto;background-position:0 100%,0 0;background-repeat:no-repeat,repeat}'''),
('''.gdep path.hot{stroke:var(--acc);stroke-width:1.4}''',
 '''.gdep path.hot{stroke:var(--acc);stroke-width:1.4}
.gdep path.crit{stroke:var(--fg2);stroke-width:2}'''),
('''.gleg .k.late{box-shadow:inset 0 0 0 1.5px var(--acc)}''',
 '''.gleg .k.late{box-shadow:inset 0 0 0 1.5px var(--acc)}
.gleg .k.crit{background-image:linear-gradient(var(--fg2),var(--fg2));background-size:100% 3px;background-position:0 100%;background-repeat:no-repeat}'''),
('const BUILD="V142 2026-10-09T01:00Z";','const BUILD="V143 2026-10-09T03:00Z";'),
]
assert 'function ppFloat' not in s
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
