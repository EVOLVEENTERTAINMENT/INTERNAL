import sys
s=open(sys.argv[1]).read()
JS=r'''/* ==========================================================================
   V182. PASTED SITES. A website he runs across while browsing goes in as a
   bare link, from the bottom bar, the capture sheet, a text to the capture
   line, or the box on the leaderboard. The board cannot open other websites,
   so it opens a short Claude session on the lead engine repository, which
   starts the GitHub audit for that one site (the same read, score and phone
   check as the nightly sweep), judges it with the same rubric, and writes
   the lead in exactly the nightly shape. pastes/<id> is the receipt the
   board shows while that happens. Nothing here calls, emails or texts anybody.
   ========================================================================== */
const PASTE_ENV="env_01TBDcNGGZNJfaVvr8FGC1Sg", PASTE_REPO="https://github.com/EVOLVEENTERTAINMENT/evolve-lead-engine", CCR="Claude Code Remote";
function pasteUrlOf(t){
  const v=String(t||"").trim();
  if(!v||v.length>500||/\s/.test(v))return "";
  if(!/^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?([\/?#][^\s]*)?$/i.test(v))return "";
  return /^https?:\/\//i.test(v)?v:"https://"+v;
}
function pasteHost(u){
  try{ return new URL(/^https?:\/\//i.test(u||"")?u:"http://"+u).hostname.toLowerCase().replace(/^www\./,""); }catch(x){ return ""; }
}
function pasteKnown(h){
  if(!h)return null;
  return prList().filter(p=>[p.prospect_id,p.final_domain,pasteHost(p.website||"")]
    .some(x=>x&&String(x).toLowerCase().replace(/^www\./,"")===h))[0]||null;
}
function pasteList(){
  return Object.keys(S.pastes||{}).map(k=>Object.assign({id:k},S.pastes[k]))
    .sort((a,b)=>String(b.at||"").localeCompare(String(a.at||"")));
}
function pasteStuck(p){
  return /^(queued|checking)$/.test(p.state||"")&&p.at&&(Date.now()-new Date(p.started_at||p.at))>20*60000;
}
function pasteSid(r){
  try{ const m=JSON.stringify(r).match(/session_[A-Za-z0-9]{8,}/); return m?m[0]:""; }catch(x){ return ""; }
}
function pasteShow(id){ S.room=null; S.mode="leads"; S.lqSet="all"; S.lqOpen=id; paint(); }
async function pasteSite(raw){
  const url=pasteUrlOf(raw);
  if(!url){ say("That does not look like a website link.",true); return false; }
  const h=pasteHost(url), known=pasteKnown(h);
  if(known){
    say((known.name||h)+" is already on the board.",false,
      {label:"Show it",run:()=>pasteShow(known.prospect_id||known.id)});
    return false;
  }
  if(pasteList().some(p=>p.host===h&&/^(queued|checking)$/.test(p.state||"")&&!pasteStuck(p))){
    say("Already checking "+h+"."); return false;
  }
  const id="p"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const rec={url:url,host:h,at:new Date().toISOString(),state:"queued",by:"you"};
  S.pastes=S.pastes||{}; S.pastes[id]=rec; paint();
  if((await dbSet("pastes/"+id,rec))===false)return false;
  return pasteStart(id);
}
async function pasteStart(id){
  const rec=(S.pastes||{})[id]; if(!rec)return false;
  if(tourBlocked()){ tourHush(); return false; }
  if(!mcp){
    dbMerge("pastes/"+id,{state:"failed",reason:"Claude is not switched on for this page."});
    say("Saved, but it could not be checked from here.",true); return false;
  }
  try{
    const r=await mcp.callTool(CCR,"create_session",{environment_id:PASTE_ENV,source_url:PASTE_REPO,
      model:"claude-sonnet-5-5",title:"Paste: "+rec.host,tags:["evolve-paste"],
      prompt:"PASTE_URL: "+rec.url+"\nPASTE_ID: "+id+"\n\nRead engine/paste_task.md in this repository and follow it exactly. It is the whole task."});
    /* The session sets its own state as it goes, so only the receipt is
       written here, never the state. */
    dbMerge("pastes/"+id,{started_at:new Date().toISOString(),session_id:pasteSid(r)});
    say("Checking "+rec.host+". It lands on the leaderboard in about 5 minutes.");
    return true;
  }catch(err){
    const c=(err&&err.code)||"tool_error";
    dbMerge("pastes/"+id,{state:"failed",reason:c==="server_not_connected"
      ?"Claude Code is not connected to this page.":"The check could not be started."});
    say("The check could not be started.",true); return false;
  }
}
function pasteAgain(p){
  if(S.pastes&&S.pastes[p.id])S.pastes[p.id].state="queued";
  dbMerge("pastes/"+p.id,{state:"queued",at:new Date().toISOString(),reason:""}).then(()=>pasteStart(p.id));
  paint();
}
function pasteRow(p){
  const r=e("div",{class:"rw prw",style:"align-items:flex-start;flex-wrap:wrap;gap:8px"});
  const g=e("div",{class:"g",style:"flex:1 1 220px;min-width:0"});
  const st=pasteStuck(p)?"stuck":p.state;
  const tag={queued:"Checking",checking:"Checking",stuck:"Taking longer than usual",done:p.added?"Added":"Not added",
    already:"Already on the board",failed:"Could not check it"}[st]||"Checking";
  g.appendChild(e("div",{class:"nm",style:"white-space:normal"},[
    e("span",{text:p.name||p.host||p.url}),e("span",{class:"tag",style:"margin-left:8px",text:tag})]));
  const sub=[], t=String(p.tier||"").charAt(0);
  if(st==="done"&&p.score!=null)sub.push("Score "+p.score);
  if(st==="done"&&p.added)sub.push(t==="A"?"A, call this month":t==="B"?"B, second wave":"");
  if(p.city)sub.push(p.city);
  if(st==="queued"||st==="checking")sub.push("pasted "+ago(p.at));
  g.appendChild(e("div",{class:"sb",text:sub.filter(Boolean).join("  ·  ")}));
  const line=st==="failed"?p.reason:st==="done"&&!p.added?p.why:st==="done"?p.opening_fact:"";
  if(line)g.appendChild(e("div",{class:"sb",style:"white-space:normal",text:String(line).slice(0,200)}));
  r.appendChild(g);
  const a=e("div",{style:"display:flex;flex-wrap:wrap;gap:6px;flex:0 1 auto"});
  if((st==="done"&&p.added)||st==="already"){
    const pid=p.prospect_id;
    if(pid&&(S.prospects||{})[pid])a.appendChild(e("button",{class:"b s",text:"Show it",onclick:()=>pasteShow(pid)}));
  }
  if(st==="failed"||st==="stuck")a.appendChild(e("button",{class:"b s",text:"Try again",onclick:()=>pasteAgain(p)}));
  r.appendChild(a);
  return r;
}
function pasteBox(){
  const wrap=e("div",{style:"margin:0 0 14px"});
  const row=e("div",{style:"display:flex;gap:8px;flex-wrap:wrap"});
  const inp=e("input",{type:"url",inputmode:"url",autocapitalize:"off",autocorrect:"off",spellcheck:"false",
    "aria-label":"Paste a website link",placeholder:"Paste a website link",
    style:"flex:1 1 220px;min-width:0;box-sizing:border-box;padding:9px 12px;border-radius:10px;border:1px solid var(--hair2);background:var(--s4);color:var(--fg);font:inherit"});
  const go=()=>{ const v=inp.value.trim(); if(!v)return; pasteSite(v).then(ok=>{ if(ok!==false||!pasteUrlOf(v))inp.value=""; }); };
  inp.addEventListener("keydown",ev=>{ if(ev.key==="Enter"){ ev.preventDefault(); go(); } });
  row.appendChild(inp);
  row.appendChild(e("button",{class:"b on",text:"Check it",onclick:go}));
  wrap.appendChild(row);
  const ps=pasteList().filter(p=>p.state!=="done"||(Date.now()-new Date(p.finished_at||p.at))<7*86400000).slice(0,6);
  if(ps.length){ const l=e("div",{class:"rows",style:"margin-top:10px"}); ps.forEach(p=>l.appendChild(pasteRow(p))); wrap.appendChild(l); }
  return wrap;
}
function ldRow(p){'''
R=[
('function ldRow(p){', JS),
('    text:[p.category,ldTown(p),ldOldRun(p)?"July run":"",st!=="none"?LD_STN[st]:""]',
 '    text:[p.category,ldTown(p),p.found_by==="you"?"You found it":"",ldOldRun(p)?"July run":"",st!=="none"?LD_STN[st]:""]'),
('  box.appendChild(strip);\n', '  box.appendChild(strip);\n  box.appendChild(pasteBox());   /* V182 */\n'),
('  db.doc("leadops/settings").onSnapshot(', r'''  /* V182. Pasted sites. The leads are read once, not watched, so a paste that
     has just been added asks for one reread. */
  db.collection("pastes").onSnapshot(s=>{S.pastes={}; let fresh=false;
    s.docs.forEach(d=>{const x=d.data()||{}; S.pastes[d.id]=x;
      if(x.added&&x.prospect_id&&!(S.prospects||{})[x.prospect_id])fresh=true;});
    if(fresh&&typeof prFetch==="function")prFetch();
    repaint();},e=>{feedErr("pastes",e);});
  db.doc("leadops/settings").onSnapshot('''),
('  ta.value=""; ta.style.height="auto";\n  if(S.lane==="dump"){\n',
 '  ta.value=""; ta.style.height="auto";\n  if(S.lane==="dump"){\n    if(pasteUrlOf(v)){ pasteSite(v); return; }\n'),
('    const v2=ta.value.trim(); if(!v2){v.remove();restoreFocus();return;}\n',
 '    const v2=ta.value.trim(); if(!v2){v.remove();restoreFocus();return;}\n    if(pasteUrlOf(v2)){ v.remove(); pasteSite(v2); return; }\n'),
('async function capHandle(it){\n', r'''async function capHandle(it){
  /* V182. A bare link texted in from the phone is a site to check. */
  if(pasteUrlOf(it.text)){
    const ok=await pasteSite(it.text);
    return {did:ok?"Started a check of "+pasteHost(pasteUrlOf(it.text))+".":"Looked at the link: "+pasteHost(pasteUrlOf(it.text))+".",kind:"note"};
  }
'''),
('@media (max-width:1059px){ body.nobar .ppn{padding-bottom:8px} }', '''@media (max-width:1059px){ body.nobar .ppn{padding-bottom:8px} }
/* V182. Seven tabs now that Leads has one, so they sit closer together on a phone. */
@media (max-width:440px){ .side .modes button{padding-left:4px;padding-right:4px} }
@media (max-width:660px){ .colmain .bar{height:auto;min-height:54px;padding-top:7px;padding-bottom:7px} }
/* V182. The timeline's .grow row line was also landing on the header's spacer, which is a .grow too, and drew a rule through the pills. */
.bar .grow{position:static;height:auto;border:0;background:none}'''),
('const BUILD="V181 2026-10-13T23:30Z";','const BUILD="V182 2026-10-16T16:40Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
