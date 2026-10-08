import sys
s=open(sys.argv[1]).read()
INV_OLD='if(mcp){try{await mcp.invalidate(GC,"list_events");}catch(x){}}'
INV_NEW='if(mcp){try{await mcp.invalidate(GC,"list_events");}catch(x){try{watch(true);}catch(y){}}}'
R=[
# 1. reassign edit carries what it was staged against, so queueGate can hold it if Google moved it, and undo has times to go back to
('''toS:+ev.s,toE:+ev.e,toTitle:v.who.toUpperCase()+" · "+stripped,''',
 '''fromS:+ev.s,fromE:+ev.e,wasU:ev.updated||"",
      toS:+ev.s,toE:+ev.e,toTitle:v.who.toUpperCase()+" · "+stripped,fromTitle:ev.title,'''),
# 2. Meet link: live list_events (8 Oct 2026) carries conferenceUrl and conferenceData.videoEntryPoint.uri, never hangoutLink
('''      const link=ev.hangoutLink
        ||(ev.conferenceData&&ev.conferenceData.entryPoints''',
 '''      /* 8 Oct 2026, a live payload: the Meet link comes back as conferenceUrl
         and conferenceData.videoEntryPoint.uri. The older names stay as a
         fallback. */
      const link=ev.conferenceUrl||ev.hangoutLink
        ||(ev.conferenceData&&ev.conferenceData.videoEntryPoint&&ev.conferenceData.videoEntryPoint.uri)
        ||(ev.conferenceData&&ev.conferenceData.entryPoints'''),
# 3. Gmail: the newest message in the thread, not the first
('''        const th=((pl.threads)||[]).map(t=>{
          const m0=((t.messages)||[])[0]||{};''',
 '''        const th=((pl.threads)||[]).map(t=>{
          const m0=gmLatest(t);'''),
('''      return ((pl.threads)||[]).map(t=>{const m0=((t.messages)||[])[0]||{};''',
 '''      return ((pl.threads)||[]).map(t=>{const m0=gmLatest(t);'''),
('''/* B1. The ripple writer's gate two, applied to the queue.''',
 '''/* A thread's messages come back oldest first, so [0] is often his own sent
   mail and not the reply. Newest by internalDate, else the last one. */
function gmLatest(t){
  const ms=(t&&t.messages)||[];
  if(!ms.length)return {};
  let best=ms[ms.length-1];
  ms.forEach(m=>{ if(m&&Number(m.internalDate)>Number(best&&best.internalDate||0))best=m; });
  return best||{};
}

/* B1. The ripple writer's gate two, applied to the queue.'''),
# 4. B7: the board chip saves its on/off, same as the Settings toggle
('''c.on=!c.on;watch();reload();}},[e("span",{class:"sw"}),c.mg])));''',
 '''c.on=!c.on;saveBiz();watch();reload();}},[e("span",{class:"sw"}),c.mg])));'''),
# 5. B8: undo and recover force a fresh read when the cache drop fails (ripple writer untouched)
('''catch(err){bad.push((err&&err.code)||"upstream_error");}\n  }\n  '''+INV_OLD,
 '''catch(err){bad.push((err&&err.code)||"upstream_error");}\n  }\n  '''+INV_NEW),
('''left.push(Object.assign({},it,{why:fix((err&&err.code)||"upstream_error")})); }\n  }\n  '''+INV_OLD,
 '''left.push(Object.assign({},it,{why:fix((err&&err.code)||"upstream_error")})); }\n  }\n  '''+INV_NEW),
# 6. O4: each page title is a level 1 heading to a screen reader. Nothing visible changes.
('g.appendChild(e("div",{class:"hi",text:cl.length','g.appendChild(e("div",{class:"hi",role:"heading","aria-level":"1",text:cl.length'),
('ht.appendChild(e("div",{class:"hi",text:live.length','ht.appendChild(e("div",{class:"hi",role:"heading","aria-level":"1",text:live.length'),
('{class:"hi",text:"How this thing is wired"}','{class:"hi",role:"heading","aria-level":"1",text:"How this thing is wired"}'),
('{class:"hi",text:"What is owed and what has landed"}','{class:"hi",role:"heading","aria-level":"1",text:"What is owed and what has landed"}'),
('{class:"hi",text:"What you owe people, and when"}','{class:"hi",role:"heading","aria-level":"1",text:"What you owe people, and when"}'),
('{class:"hi",text:"Who is around, what is out with them"}','{class:"hi",role:"heading","aria-level":"1",text:"Who is around, what is out with them"}'),
('g.appendChild(e("div",{class:"hi",\n    text:new Intl','g.appendChild(e("div",{class:"hi",role:"heading","aria-level":"1",\n    text:new Intl'),
('ht.appendChild(e("div",{class:"h",style:"font-size:clamp(23px,3.2vw,31px);margin-top:3px",',
 'ht.appendChild(e("div",{class:"h",role:"heading","aria-level":"1",style:"font-size:clamp(23px,3.2vw,31px);margin-top:3px",'),
('const BUILD="V136 2026-10-08T17:00Z";','const BUILD="V137 2026-10-08T19:00Z";'),
]
# Home greeting appears twice with different tails
for tail in ['\n    const pill=','\n    /* the same control']:
    R.append(('hg.appendChild(e("div",{class:"hi",text:hello()+", "+ownerName()}));'+tail,
              'hg.appendChild(e("div",{class:"hi",role:"heading","aria-level":"1",text:hello()+", "+ownerName()}));'+tail))
assert 'function gmLatest' not in s
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90])
    s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
