import sys
s=open(sys.argv[1]).read()
PANEL=r'''
/* ==========================================================================
   V155. CALLS. The Night Lead Engine keeps prospects/ and puts tonight's five
   on_sheet. The board shows them, or while the engine is off the next ones
   in its own call order, and logs what happened on each call back onto the
   prospect, in the schema's own outcome words (leadops/schema). Moving one to
   Pipeline writes the schema's promotion row. Nothing here dials, sends or
   touches the calendar.
   ========================================================================== */
const PR_TALKED=[["wants_a_concept","They want a concept"],["call_back_on_a_date","Call back on a date"],["not_now","Not now"]];
function prList(){ return Object.keys(S.prospects||{}).map(k=>S.prospects[k]); }
function prSheet(){
  const all=prList(), n=Number((S.leadset||{}).calls_per_sheet)||5;
  const on=all.filter(p=>p.status==="on_sheet").sort((a,b)=>(a.queue_pos||999)-(b.queue_pos||999));
  if(on.length)return {rows:on,live:true};
  return {rows:all.filter(p=>p.status==="queued"&&p.phone).sort((a,b)=>(a.queue_pos||999)-(b.queue_pos||999)).slice(0,n),live:false};
}
function prSave(p,patch,undoMsg){
  const was={status:p.status,last_outcome:p.last_outcome||"",outcomes:(p.outcomes||[]).slice(),callback_on:p.callback_on||"",status_reason:p.status_reason||""};
  const row=Object.assign({},patch,{updated_at:dk(new Date())});
  S.prospects[p.prospect_id||p.id]=Object.assign({},p,row);
  dbMerge("prospects/"+(p.prospect_id||p.id),row);
  logAct((p.name||"A lead")+": "+undoMsg,"acc");
  say(undoMsg+".",false,{label:"Undo",run:()=>{
    S.prospects[p.prospect_id||p.id]=Object.assign({},p,was);
    dbMerge("prospects/"+(p.prospect_id||p.id),Object.assign({},was,{updated_at:dk(new Date())}));
    paint(); say("Put back.");}});
  paint();
}
function prOutcome(p,outcome,note,extra){
  const o=(p.outcomes||[]).concat([{on:dk(new Date()),outcome:outcome,note:note||""}]);
  return Object.assign({outcomes:o,last_outcome:outcome+(note?": "+note:"")},extra||{});
}
function prNoAnswer(p){ prSave(p,prOutcome(p,"no_answer","",{status:"called"}),"No answer, logged"); }
function prDead(p){ prSave(p,prOutcome(p,"dead","",{status:"dead",status_reason:"Not a fit, from the call"}),"Not a fit, logged"); }
function prTalked(p){
  prompt2("How did it go with "+(p.name||"them")+"?",[
    {k:"how",label:"What came of it",options:PR_TALKED,value:"wants_a_concept"},
    {k:"on",label:"Call back on (YYYY-MM-DD), if that is what came of it",value:p.callback_on||""},
    {k:"note",label:"A note, if any",placeholder:"Who you spoke to, what they said"}
  ],v=>{
    const how=PR_TALKED.some(x=>x[0]===v.how)?v.how:"not_now";
    const on=/^\d{4}-\d{2}-\d{2}$/.test(v.on||"")?v.on:"";
    const ex={status:"talking"}; if(on)ex.callback_on=on;
    if(how==="wants_a_concept")ex.concept=Object.assign({},p.concept||{},{state:(p.concept&&p.concept.state&&p.concept.state!=="none")?p.concept.state:"queued"});
    prSave(p,prOutcome(p,"talked",[how].concat(v.note?[v.note]:[]).join(", "),ex),"Talked, logged");
  });
}
function prPromote(p){
  const id=slugKey(p.name||p.prospect_id)+"-"+Date.now().toString(36).slice(-4);
  const today=dk(new Date());
  const row={name:p.name||p.prospect_id,stage:"New lead",stage_key:stageKey("New lead"),stage_at:today,
    opportunity_id:newId("opp"),kind:"",value:"",value_num:0,decide:"",nextMove:"",
    touched:today,next_touch:p.callback_on||"",temperature:"warm",source:"Night Lead Engine",
    owner:ownerName(),schema_version:SCHEMA_VERSION,lane:p.lane||"",prospect_id:p.prospect_id||p.id};
  S.pipe[id]=Object.assign({id:id},row); dbSet("pipeline/"+id,row);
  prSave(p,{status:"promoted",promoted_opportunity_id:row.opportunity_id},"Moved to Pipeline");
}
function prRow(p,talking){
  const r=e("div",{class:"rw prw",style:"align-items:flex-start;flex-wrap:wrap;gap:8px"});
  const g=e("div",{class:"g",style:"flex:1 1 260px;min-width:0"});
  g.appendChild(e("div",{class:"nm",style:"white-space:normal",text:p.name||p.prospect_id}));
  g.appendChild(e("div",{class:"sb",text:[p.category,p.city_state].filter(Boolean).join("  ·  ")}));
  const why=(p.enriched&&p.enriched.one_problem)||(p.why_dated||[])[0]||p.pitch_angle_v7||"";
  if(why)g.appendChild(e("div",{class:"sb",style:"white-space:normal",text:why}));
  if(talking&&p.last_outcome)g.appendChild(e("div",{class:"sb",style:"white-space:normal",
    text:p.last_outcome.replace(/_/g," ")+(p.callback_on?"  ·  call back "+shortDay(p.callback_on):"")}));
  /* the prep the engine does overnight: a concept of their homepage and a pitch brief */
  const cs=(p.concept&&p.concept.state)||"none", b=p.brief||null;
  const prep=e("div",{style:"display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;align-items:center"});
  if(cs==="built"&&p.concept.pdf_url)prep.appendChild(e("a",{class:"b s",href:p.concept.pdf_url,target:"_blank",rel:"noopener",text:"Open the concept"}));
  else prep.appendChild(e("span",{class:"sb",style:"color:var(--fg3);margin-right:8px",text:cs==="needs_human"?"Concept needs you":"Concept not made yet"}));
  if(b)prep.appendChild(e("button",{class:"b s"+(S.prOpen===(p.prospect_id||p.id)?" on":""),text:S.prOpen===(p.prospect_id||p.id)?"Hide the brief":"Read the brief",
    onclick:()=>{S.prOpen=S.prOpen===(p.prospect_id||p.id)?null:(p.prospect_id||p.id);paint();}}));
  else prep.appendChild(e("span",{class:"sb",style:"color:var(--fg3)",text:"Brief not made yet"}));
  g.appendChild(prep);
  if(b&&S.prOpen===(p.prospect_id||p.id)){
    const bx=e("div",{style:"margin-top:10px;padding:10px 12px;border-radius:var(--r);background:var(--s1)"});
    const line=(k,v)=>{ if(!v)return; bx.appendChild(e("div",{style:"margin:0 0 8px"},[
      e("div",{class:"cap",text:k}),e("div",{class:"sb",style:"white-space:normal;color:var(--fg)",text:String(v)})])); };
    line("Who",b.who); line("Their site now",b.their_site_now); line("Their one problem",b.one_problem);
    line("Open with",b.open_with); line("Show them",b.show_them); line("The offer",b.the_offer);
    (b.if_they_say||[]).forEach(x=>line("If they say "+String(x.they||""),x.you));
    line("Ask for",b.ask_for);
    if((b.unknowns||[]).length)line("Not known",b.unknowns.join(", "));
    g.appendChild(bx);
  }
  r.appendChild(g);
  const a=e("div",{style:"display:flex;flex-wrap:wrap;gap:6px;flex:0 1 auto;min-width:0;max-width:100%"});
  if(p.phone)a.appendChild(e("a",{class:"b s on",href:"tel:"+String(p.phone).replace(/[^0-9+]/g,""),text:"Call "+p.phone}));
  if(p.website)a.appendChild(e("a",{class:"b s",href:p.website,target:"_blank",rel:"noopener",text:"Site"}));
  if(talking){
    a.appendChild(e("button",{class:"b s",text:"Talked again",onclick:()=>prTalked(p)}));
    a.appendChild(e("button",{class:"b s",text:"Move to Pipeline",onclick:()=>prPromote(p)}));
    a.appendChild(e("button",{class:"b s",text:"Not a fit",onclick:()=>prDead(p)}));
  }else{
    a.appendChild(e("button",{class:"b s",text:"No answer",onclick:()=>prNoAnswer(p)}));
    a.appendChild(e("button",{class:"b s",text:"Talked",onclick:()=>prTalked(p)}));
    a.appendChild(e("button",{class:"b s",text:"Not a fit",onclick:()=>prDead(p)}));
  }
  r.appendChild(a);
  return r;
}
function callsPanel(){
  const all=prList(); if(!all.length)return null;
  const sh=prSheet(), box=e("div",{});
  const cnt=k=>all.filter(p=>p.status===k).length;
  box.appendChild(e("div",{class:"note",style:"margin:0 0 10px",
    text:[cnt("queued")+" ready to call",cnt("needs_phone")+" need a phone",cnt("parked")+" parked"].join("  ·  ")}));
  const list=e("div",{class:"rows"});
  if(!sh.rows.length)list.appendChild(e("div",{class:"void",text:"Nobody is ready to call."}));
  sh.rows.forEach(p=>list.appendChild(prRow(p,false)));
  box.appendChild(list);
  const tk=all.filter(p=>p.status==="talking").sort((a,b)=>String(a.callback_on||"9").localeCompare(String(b.callback_on||"9")));
  if(tk.length){
    box.appendChild(e("div",{class:"cap",style:"margin:16px 0 6px",text:"Talking to"}));
    const l2=e("div",{class:"rows"}); tk.forEach(p=>l2.appendChild(prRow(p,true))); box.appendChild(l2);
  }
  const sec=dsec("Calls",sh.live?"tonight's sheet from the lead engine":"next in the call order, the lead engine is off",box);
  sec.classList.add("bfinds"); return sec;
}
'''
R=[
('function modePipeline(){\n',PANEL+'function modePipeline(){\n'),
('''    e("button",{class:"b on",text:"Add a lead",onclick:()=>pipeAdd()})]));
  box.appendChild(hero);
''','''    e("button",{class:"b on",text:"Add a lead",onclick:()=>pipeAdd()})]));
  box.appendChild(hero);
  { const cp=callsPanel(); if(cp)box.appendChild(cp); }
'''),
('''  db.collection("teambrief").onSnapshot(s=>{S.tbriefs={};''','''  /* V155. The lead engine's prospects and its settings, for Calls on Pipeline */
  db.collection("prospects").onSnapshot(s=>{S.prospects={};
    s.docs.forEach(d=>{S.prospects[d.id]=Object.assign({prospect_id:d.id},d.data()||{});});repaint();},e=>{feedErr("prospects",e);});
  db.doc("leadops/settings").onSnapshot(d=>{S.leadset=(d&&d.exists&&d.data())||{};repaint();},()=>{});
  db.collection("teambrief").onSnapshot(s=>{S.tbriefs={};'''),
('''    if(!/cold/i.test(String(o.source||"")))return;
    if(isWon(o))won++;''','''    if(!/cold|night lead engine/i.test(String(o.source||"")))return;
    if(isWon(o))won++;'''),
('.mini .r.td .lt.past{','.prw a.b{text-decoration:none}\n.mini .r.td .lt.past{'),
('const BUILD="V154 2026-10-12T02:00Z";','const BUILD="V155 2026-10-12T03:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
