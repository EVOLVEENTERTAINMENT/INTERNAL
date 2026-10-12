import sys
s=open(sys.argv[1]).read()
R=[
('''  let ok=0; const bad=[], left=[];
  for(let i=0;i<h.items.length;i++){
    try{
      const r=await undoOne(h.items[i]);
      if(r&&r.left)left.push({title:h.items[i].title,why:r.left});
      else ok++;
    }
    catch(err){bad.push((err&&err.code)||"upstream_error");}
  }''','''  let ok=0; const bad=[], left=[], failed=[];
  for(let i=0;i<h.items.length;i++){
    try{
      const r=await undoOne(h.items[i]);
      if(r&&r.left)left.push({title:h.items[i].title,why:r.left});
      else ok++;
    }
    catch(err){bad.push((err&&err.code)||"upstream_error"); failed.push(h.items[i]);}
  }
  /* V176. The ones that did not go back stay as an open change, so Put it
     back is still there for them. Marking the whole batch undone stranded
     them on the calendar with no way back from here. */
  if(failed.length){
    h.items=failed; h.undone=false;
    const u1=S.hist.filter(x=>x.id===h.id)[0]; if(u1){u1.items=failed;u1.undone=false;}
    dbSet("changelog/"+h.id,h);
    if(mcp){try{await mcp.invalidate(GC,"list_events");}catch(x){try{watch(true);}catch(y){}}}
    if(ok)logAct("Put back part of "+(h.label||"a change")+" on the calendar","");
    say((ok?ok+" put back. ":"")+failed.length+" could not be reversed. "+(function(t){t=String(t||"").trim();return /[.!?]$/.test(t)?t:t+".";})(fix(bad[0]))+" Press Put it back again to try "+(failed.length===1?"it":"them")+".",true);
    paint(); return;
  }'''),
('const BUILD="V175 2026-10-13T02:00Z";','const BUILD="V176 2026-10-13T02:20Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
