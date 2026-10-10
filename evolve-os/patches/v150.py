import sys
s=open(sys.argv[1]).read()
HPILL='''    pill.appendChild(e("span",{class:"dot"}));
    pill.appendChild(e("span",{text:rows.length
      ?rows.length+(rows.length===1?" thing needs you today":" things need you today")
      :"Nothing needs you today"}));
    hg.appendChild(pill);'''
assert s.count(HPILL)==2
s=s.replace(HPILL,'''    pill.appendChild(e("span",{class:"dot"}));
    pill.appendChild(e("span",{text:rows.length
      ?rows.length+(rows.length===1?" thing needs you today":" things need you today")
      :"Nothing needs you today"}));
    /* V150. Said once, on the top pill and the Needs You header. */
    if(!rows.length)hg.appendChild(pill);''')
R=[
# 1. Inbox opens on sorting, then the page, then where to pull from
('''  /* What is done and what is not, first, because that is the question this
     page gets asked in the middle of the day. */
  box.appendChild(dayList(view(),key));
''','''  /* V150. Inbox opens on what needs sorting. Today's blocks live on Home
     and Board, so they are not repeated here. */
'''),
('  box.appendChild(pad);\n','\n'),
('  box.appendChild(src);\n','\n'),
('''  hd.appendChild(body);
  box.appendChild(hd);''','''  hd.appendChild(body);
  box.appendChild(hd);
  box.appendChild(pad);
  box.appendChild(src);'''),
('    text:"Nothing waiting. Write on the page above, then pull the lines out."}));','    text:"Nothing waiting. Write on the page below, then pull the lines out."}));'),
# 2. top pill counts today only
('''    pill.appendChild(e("b",{text:c.live?"NOW":String(c.total||0)}));
    pill.appendChild(e("span",{text:c.live?"on a block":c.total?"to tick":"clear"}));
    pill.className="nowpill"+(c.live?" live":c.total?"":" zero");''','''    pill.appendChild(e("b",{text:c.live?"NOW":String(c.gone||0)}));
    pill.appendChild(e("span",{text:c.live?"on a block":c.gone?"past, not ticked":"clear"}));
    pill.className="nowpill"+(c.live?" live":c.gone?"":" zero");'''),
# 3. Board badge
('''    :oc?String(oc)+" to close"''','''    :oc?String(oc)+(oc===1?" day":" days")+" to close"'''),
# 4. checks fold to one line
('''  const rows=(S.runs||[]).filter(r=>r.at&&r.found&&r.found!=="nothing"
    &&+new Date(r.at)>cut)
    .sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,6);
  if(!rows.length)return null;
  const body=e("div",{class:"rows"});''','''  const ran=(S.runs||[]).filter(r=>r.at&&+new Date(r.at)>cut).length;
  const hits=(S.runs||[]).filter(r=>r.at&&r.found&&r.found!=="nothing"
    &&+new Date(r.at)>cut)
    .sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  const rows=hits.slice(0,6);
  if(!rows.length)return null;
  /* V150. One line until asked, so the day sits at the top of Board. */
  const outer=e("div",{});
  const line=plur(ran,"check")+" in the last two days, "+hits.length+" found something";
  if(!S.findsOpen)return dsec("What the checks turned up",line,outer,e("div",{style:"display:flex;gap:6px"},[
    e("button",{class:"b s",text:"Show them",onclick:()=>{S.findsOpen=true;paint();}}),
    e("button",{class:"b s",text:"All of them",onclick:goAuto})]));
  const body=e("div",{class:"rows"});
  outer.appendChild(body);'''),
('''  return dsec("What the checks turned up","last two days",body,
    e("button",{class:"b s",text:"All of them",onclick:goAuto}));''','''  return dsec("What the checks turned up",line,outer,e("div",{style:"display:flex;gap:6px"},[
    e("button",{class:"b s",text:"Hide them",onclick:()=>{S.findsOpen=false;paint();}}),
    e("button",{class:"b s",text:"All of them",onclick:goAuto})]));'''),
# 5. Catch up band
('    label:"Days with nothing ticked off",go:startCloseRun});','    label:"Days not closed yet",go:startCloseRun});'),
('  w.appendChild(e("div",{class:"k",text:"Carried"}));\n  const b=e("div",{class:"rows",style:"margin-top:8px"});','  w.appendChild(e("div",{class:"k",text:"Catch up"}));\n  const b=e("div",{class:"rows",style:"margin-top:8px"});'),
# 6. Today subtitle no longer repeats it
('  if(rows.length)headBits.push(rows.length+(rows.length===1?" thing needs you":" things need you"));\n',''),
# 7. key hint
('<span><b>space</b> jump here</span>','<span><b>space</b> capture</span>'),
# 8. plain header and theme button
('      e("span",{text:"EVOLVE OS  ·  STUDIO REEL"})]));','      e("span",{text:"EVOLVE OS"})]));'),
('  if(b){b.textContent=t==="light"?"Go dark":"Go light";','  if(b){b.textContent=t==="light"?"Dark mode":"Light mode";'),
# 9. calendar buttons by name
('        c.on=!c.on;saveBiz();watch();reload();}},[e("span",{class:"sw"}),c.mg])));','        c.on=!c.on;saveBiz();watch();reload();}},[e("span",{class:"sw"}),c.key])));'),
# 10. past in grey
('if(gone)row.appendChild(e("span",{class:"lt",text:"time has gone"}));','if(gone)row.appendChild(e("span",{class:"lt past",text:"past"}));'),
('live?"on now":(x.e<now&&!cur?"time has gone":"")','live?"on now":(x.e<now&&!cur?"past":"")'),
('.mini .r.td .lt{','.mini .r.td .lt.past{color:var(--fg3)}\n.calset .cal{white-space:nowrap}\n.mini .r.td .lt{'),
# 11. Settings jump buttons
('''  box.appendChild(dsec("Backup",null,bk));

  wrap.appendChild(box); return wrap;''','''  box.appendChild(dsec("Backup",null,bk));

  /* V150. A row of jump buttons, one per section, in the section's own words */
  const secs=[].slice.call(box.children).filter(x=>x.classList&&x.classList.contains("dsec"));
  const jump=e("div",{style:"display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px"});
  secs.forEach(sx=>{ const h=sx.querySelector(".hd h3"); if(!h)return;
    jump.appendChild(e("button",{class:"b s",text:h.textContent,
      onclick:()=>sx.scrollIntoView({behavior:lessMotion()?"auto":"smooth",block:"start"})})); });
  if(hero.nextSibling)box.insertBefore(jump,hero.nextSibling); else box.appendChild(jump);

  wrap.appendChild(box); return wrap;'''),
('  const fnd=sweepFinds();\n','  const fnd=sweepFinds(); if(fnd)fnd.classList.add("bfinds");\n'),
('.mini .r.td .lt.past{','@media (max-width:700px){.bfinds{padding:0 14px}}\n.mini .r.td .lt.past{'),
('const BUILD="V149 2026-10-09T18:00Z";','const BUILD="V150 2026-10-10T12:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R)+1)
