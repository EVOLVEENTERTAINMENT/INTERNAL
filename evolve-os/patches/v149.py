import sys,os
s=open(sys.argv[1]).read()
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'v149_blk_pairs.py')).read())
R=list(BLK)+[
# stageOf: a sentence is not a stage. Exact keys and short labels only.
('''  if(STAGEMAP[k])return STAGEMAP[k];
  let hit=null;''','''  if(STAGEMAP[k])return STAGEMAP[k];
  /* V149. The nightly writes where a project stands as a sentence. Reading a
     stage out of one guessed Delivery from "live" and "marked done", and
     those projects dropped off every live count. Short labels only. */
  if(k.split(/\\s+/).length>3)return "Concept";
  let hit=null;'''),
('if(st&&/wait|approv|review|sign/i.test(st.stage||""))return "wait";','if(st&&/wait|approv|review|\\bsign/i.test(st.stage||""))return "wait";'),
# waiting rows link to the project whose blocker names them
('''  const k2=Object.keys(ps).filter(x=>slugKey(ps[x].name||x)===slugKey(name))[0];
  return k2?{slug:k2,st:ps[k2]}:null;''','''  const k2=Object.keys(ps).filter(x=>slugKey(ps[x].name||x)===slugKey(name))[0];
  if(k2)return {slug:k2,st:ps[k2]};
  /* V149. Or the project whose blocker starts with who it is waiting on, the
     way the nightly writes it: "Auburn Public Works, quiet since Sep 1". */
  const wk=slugKey(String(w.who||"").split(/[,(/]/)[0]);
  const k3=wk.length>=5?Object.keys(ps).filter(x=>slugKey(heldBy(ps[x])).indexOf(wk)===0)[0]:null;
  return k3?{slug:k3,st:ps[k3]}:null;'''),
# Heard back keeps an edited answer
('  if(note&&!w.reply)v.reply=note;','  if(note&&note!==w.reply){ if(w.reply)v.reply_prev=w.reply; v.reply=note; }'),
# a project doc that has gone stops showing
('''    Object.keys(PDOCS).forEach(k=>{delete PDOCS[k];});''','''    const wasK=Object.keys(PDOCS);
    Object.keys(PDOCS).forEach(k=>{delete PDOCS[k];});'''),
('''      .forEach(d=>{S.pstate[slugKey(d.id)]=foldIn(d,false);});
    firstIn("projects");''','''      .forEach(d=>{S.pstate[slugKey(d.id)]=foldIn(d,false);});
    wasK.forEach(k=>{ if(!PDOCS[k])delete S.pstate[k]; });
    firstIn("projects");'''),
# Close the day lists what the counts count
('''  const evs=onDay(day,all).filter(x=>!x.all&&!x.gh&&!x.gone).sort((a,b)=>a.s-b.s);
  const marks=(S.done[key]&&S.done[key].marks)||{};
  const wrap=e("div",{});''','''  const evs=onDay(day,all).filter(x=>!x.all&&!x.gh&&!x.gone&&!isGhost(x)&&!isAmb(x)&&!isSoft(x)).sort((a,b)=>a.s-b.s);
  const marks=(S.done[key]&&S.done[key].marks)||{};
  const wrap=e("div",{});'''),
# no verdict on Home before cash on hand is set
('''  if(!(S.costs||[]).length)return null;
  const P=planNeed(), w=P.walk, bits=[];''','''  if(!(S.costs||[]).length)return null;
  const P=planNeed(), w=P.walk, bits=[];
  if(!w.cashSet)return null;          // V149. Short from zero cash is not a fact'''),
# adding never wipes a record that already has the name
('''    const row={name:v.name,client:v.client||"",stage:v.stage||"Concept",
      project_id:newId("prj"),''','''    let row={name:v.name,client:v.client||"",stage:v.stage||"Concept",
      project_id:newId("prj"),'''),
('''      updated_at:new Date().toISOString()};
    S.pstate[slug]=row; dbSet("projects/"+slug,row);
    if(v.client)ensureClient(v.client);''','''      updated_at:new Date().toISOString()};
    /* V149. Same name as a project already here: fill its gaps, keep its history */
    if(S.pstate[slug])row=Object.assign({},row,S.pstate[slug],{updated_at:row.updated_at});
    S.pstate[slug]=row; dbSet("projects/"+slug,row);
    if(v.client)ensureClient(v.client);'''),
('''      const row={name:v.project,client:v.client||"",stage:v.stage||"Concept",
        project_id:newId("prj"),schema_version:SCHEMA_VERSION,''','''      let row={name:v.project,client:v.client||"",stage:v.stage||"Concept",
        project_id:newId("prj"),schema_version:SCHEMA_VERSION,'''),
('''        updated_at:new Date().toISOString()};
      S.pstate[slug]=row; dbSet("projects/"+slug,row);
      made.push("the project");''','''        updated_at:new Date().toISOString()};
      if(S.pstate[slug])row=Object.assign({},row,S.pstate[slug],{updated_at:row.updated_at});
      S.pstate[slug]=row; dbSet("projects/"+slug,row);
      made.push("the project");'''),
('''    const d=waitDays(w);
    if(d===null||d<7)return;
    const r=push({id:"wait-"+w.id,''','''    const d=waitDays(w);
    if(d===null||d<7)return;
    dropBlk(lp,slug);
    const r=push({id:"wait-"+w.id,'''),
('''    const dueIn=w.expected?daysTo(w.expected):null;
    if(dueIn!==null&&dueIn<0){
      push({id:"wexp-"+w.id,''','''    const dueIn=w.expected?daysTo(w.expected):null;
    if(dueIn!==null&&dueIn<0){
      dropBlk(lp,slug);
      push({id:"wexp-"+w.id,'''),
('''  (S.waiting||[]).filter(w=>w.state!=="replied").forEach(w=>{
    const pr=waitProject(w);''','''  /* V149. The project's blocker and the wait are the same fact. The wait
     carries the person and the days, so it is the one that stays. */
  const dropBlk=(lp,slug)=>{ const b=lp&&rootFor[slug];
    if(b&&String(b.id).indexOf("blk-")===0){ const i=out.indexOf(b); if(i>=0)out.splice(i,1); delete rootFor[slug]; } };
  (S.waiting||[]).filter(w=>w.state!=="replied").forEach(w=>{
    const pr=waitProject(w);'''),
('const BUILD="V148 2026-10-09T15:00Z";','const BUILD="V149 2026-10-09T18:00Z";'),
]
assert 'V149. The nightly' not in s
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
