import sys
s=open(sys.argv[1]).read()
BIN_CORE='''/* V138. The bin. Every delete copies the record to bin/<id> first and only
   deletes once that copy is saved, so a failed copy deletes nothing. Put it
   back writes the copy to the same path and mends the links the delete cut.
   Anything older than BIN_DAYS is cleared when the bin first loads. */
const BIN_DAYS=30;
let BIN_SWEPT=false;
async function binDel(path,rec,label,kind,extra,rollback){
  if(tourBlocked()){tourHush();if(rollback){rollback();paint();}return null;}
  const row=Object.assign({},rec||{});
  const id="b"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const b={path:path,kind:kind,label:String(label||"").slice(0,120),data:row,
    extra:extra||null,at:new Date().toISOString()};
  const ok=await dbSetCritical("bin/"+id,b,rollback);
  if(ok===false)return null;
  const gone=await dbDel(path);
  if(gone===false){ dbDel("bin/"+id); if(rollback){rollback();paint();} return null; }
  return Object.assign({id:id},b);
}
async function binRestore(b){
  if(tourBlocked()){tourHush();return;}
  if(!b||!b.path)return;
  const ok=await dbSetCritical(b.path,b.data||{});
  if(ok===false)return;
  const x=b.extra||{};
  (x.dependents||[]).forEach(tid=>{
    const t=(S.tasks||[]).filter(y=>y.id===tid)[0];
    const me=b.path.split("/")[1];
    if(t&&(t.depends||[]).indexOf(me)<0){
      t.depends=(t.depends||[]).concat([me]); dbSet("tasks/"+t.id,Object.assign({},t)); }});
  (x.tasks||[]).forEach(tid=>{
    const t=(S.tasks||[]).filter(y=>y.id===tid)[0];
    if(t&&!t.milestone){ t.milestone=b.path.split("/")[1]; dbSet("tasks/"+t.id,Object.assign({},t)); }});
  await dbDel("bin/"+b.id);
  S.bin=(S.bin||[]).filter(y=>y.id!==b.id);
  logAct("Put back "+b.label,"acc");
  say(b.label+" is back."); paint();
}
/* the toast after a delete, with the way back on it */
function binSaid(b){
  if(!b){paint();return;}
  say("Deleted.",false,{label:"Put it back",run:()=>binRestore(b)}); paint();
}
'''
R=[
# core helpers, right before confirmDelete
('function confirmDelete(kind,name,key,go){', BIN_CORE+'function confirmDelete(kind,name,key,go){'),
# the warning is no longer true
('    : "This cannot be undone. Nothing else in the app points at it.";',
 '    : "It goes to the bin in Settings for "+BIN_DAYS+" days. Nothing else in the app points at it.";'),
# project
('''      delete S.pstate[p.slug]; dbDel("projects/"+p.slug);
      logAct("Deleted the project "+p.name,"");
      say(p.name+" deleted."); paint();''',
 '''      const rec=S.pstate[p.slug];
      delete S.pstate[p.slug];
      binDel("projects/"+p.slug,rec,p.name,"project",null,()=>{S.pstate[p.slug]=rec;}).then(b=>{
        if(b)logAct("Deleted the project "+p.name,""); binSaid(b);});'''),
# client
('''      delete S.clients[c.id]; dbDel("clients/"+c.id);
      logAct("Deleted the client "+c.name,"");
      say(c.name+" deleted."); paint();''',
 '''      const rec=S.clients[c.id];
      delete S.clients[c.id];
      binDel("clients/"+c.id,rec,c.name,"client",null,()=>{S.clients[c.id]=rec;}).then(b=>{
        if(b)logAct("Deleted the client "+c.name,""); binSaid(b);});'''),
# lead
('''      delete S.pipe[r.id]; dbDel("pipeline/"+r.id);
      logAct("Deleted the lead "+r.name,"");
      say(r.name+" deleted."); paint();''',
 '''      const rec=S.pipe[r.id];
      delete S.pipe[r.id];
      binDel("pipeline/"+r.id,rec,r.name,"lead",null,()=>{S.pipe[r.id]=rec;}).then(b=>{
        if(b)logAct("Deleted the lead "+r.name,""); binSaid(b);});'''),
# invoice
('''      S.inv=(S.inv||[]).filter(x=>x.id!==r.id); dbDel("invoices/"+r.id);
      logAct("Deleted an invoice for "+r.client,"");
      say("Deleted."); paint();''',
 '''      S.inv=(S.inv||[]).filter(x=>x.id!==r.id);
      binDel("invoices/"+r.id,r,USD(r.amount)+" for "+r.client,"invoice",null,()=>{S.inv=(S.inv||[]).concat([r]);}).then(b=>{
        if(b)logAct("Deleted an invoice for "+r.client,""); binSaid(b);});'''),
# deliverable
('''      S.dels=(S.dels||[]).filter(x=>x.id!==r.id); dbDel("duelist/"+r.id);
      logAct("Deleted the deliverable "+r.name,"");
      say("Deleted."); paint();''',
 '''      S.dels=(S.dels||[]).filter(x=>x.id!==r.id);
      binDel("duelist/"+r.id,r,r.name,"deliverable",null,()=>{S.dels=(S.dels||[]).concat([r]);}).then(b=>{
        if(b)logAct("Deleted the deliverable "+r.name,""); binSaid(b);});'''),
# expense
('''      S.exp=(S.exp||[]).filter(x=>x.id!==r.id); dbDel("expenses/"+r.id);
      logAct("Deleted an expense",""); say("Deleted."); paint();''',
 '''      S.exp=(S.exp||[]).filter(x=>x.id!==r.id);
      binDel("expenses/"+r.id,r,USD(r.amount)+" "+(r.category||""),"expense",null,()=>{S.exp=(S.exp||[]).concat([r]);}).then(b=>{
        if(b)logAct("Deleted an expense",""); binSaid(b);});'''),
# decision
('''      S.decs=(S.decs||[]).filter(x=>x.id!==d.id); dbDel("decisions/"+d.id);
      logAct("Deleted a decision",""); say("Deleted."); paint();''',
 '''      S.decs=(S.decs||[]).filter(x=>x.id!==d.id);
      binDel("decisions/"+d.id,d,(d.what||"this decision").slice(0,50),"decision",null,()=>{S.decs=(S.decs||[]).concat([d]);}).then(b=>{
        if(b)logAct("Deleted a decision",""); binSaid(b);});'''),
# task: remember who waited on it
('''  confirm2("Delete this task?",t.title,()=>{
    S.tasks=(S.tasks||[]).filter(x=>x.id!==t.id);
    (S.tasks||[]).forEach(x=>{ if((x.depends||[]).indexOf(t.id)>=0){
      x.depends=x.depends.filter(d=>d!==t.id); dbSet("tasks/"+x.id,Object.assign({},x)); }});
    dbDel("tasks/"+t.id); S.pdr=null; say("Deleted."); paint();''',
 '''  confirm2("Delete this task?",t.title,()=>{
    const deps=(S.tasks||[]).filter(x=>x.id!==t.id&&(x.depends||[]).indexOf(t.id)>=0).map(x=>x.id);
    S.tasks=(S.tasks||[]).filter(x=>x.id!==t.id); S.pdr=null;
    binDel("tasks/"+t.id,t,t.title,"task",{dependents:deps},()=>{S.tasks=(S.tasks||[]).concat([t]);}).then(b=>{
      if(b)(S.tasks||[]).forEach(x=>{ if((x.depends||[]).indexOf(t.id)>=0){
        x.depends=x.depends.filter(d=>d!==t.id); dbSet("tasks/"+x.id,Object.assign({},x)); }});
      binSaid(b);});'''),
# milestone: remember which tasks hung off it
('''  confirm2("Delete this milestone?",m.title,()=>{
    S.miles=(S.miles||[]).filter(x=>x.id!==m.id);
    (S.tasks||[]).forEach(t=>{ if(t.milestone===m.id){t.milestone="";dbSet("tasks/"+t.id,Object.assign({},t));} });
    dbDel("milestones/"+m.id); S.pdr=null; say("Deleted."); paint();''',
 '''  confirm2("Delete this milestone?",m.title,()=>{
    const hung=(S.tasks||[]).filter(t=>t.milestone===m.id).map(t=>t.id);
    S.miles=(S.miles||[]).filter(x=>x.id!==m.id); S.pdr=null;
    binDel("milestones/"+m.id,m,m.title,"milestone",{tasks:hung},()=>{S.miles=(S.miles||[]).concat([m]);}).then(b=>{
      if(b)(S.tasks||[]).forEach(t=>{ if(t.milestone===m.id){t.milestone="";dbSet("tasks/"+t.id,Object.assign({},t));} });
      binSaid(b);});'''),
# subscribe to the bin, and clear what is past its time once per load
('''    S.exp=s.docs.map(d=>Object.assign({id:d.id},d.data())).filter(r=>!r.deleted_at);''',
 '''    S.exp=s.docs.map(d=>Object.assign({id:d.id},d.data())).filter(r=>!r.deleted_at);'''),
# Settings section
('''  /* The writer, proved rather than argued. */''',
 '''  /* ---- V138. the bin ---- */
  (function(){
    const bl=e("div",{class:"rows"});
    const rows=(S.bin||[]).slice().sort((a,b)=>String(b.at||"").localeCompare(String(a.at||"")));
    if(!rows.length)bl.appendChild(e("div",{class:"void",text:"Nothing in the bin."}));
    rows.forEach(b=>{
      const r=e("div",{class:"rw"}), g=e("div",{class:"g"});
      g.appendChild(e("div",{class:"nm",text:b.label||"Something"}));
      const d=b.at?Math.max(0,Math.floor((Date.now()-new Date(b.at))/86400000)):null;
      g.appendChild(e("div",{class:"sb",text:(b.kind||"")+(d===null?"":"  ·  deleted "+(d===0?"today":plur(d,"day")+" ago"))}));
      r.appendChild(g);
      r.appendChild(e("button",{class:"b s",text:"Put it back",onclick:()=>binRestore(b)}));
      bl.appendChild(r);});
    box.appendChild(dsec("The bin","deleted things stay here for "+BIN_DAYS+" days",bl));
  })();

  /* The writer, proved rather than argued. */'''),
('const BUILD="V137 2026-10-08T19:00Z";','const BUILD="V138 2026-10-08T21:00Z";'),
]
# the bin snapshot goes right after the expenses one closes
EXP_CLOSE='''    repaint();},e=>{feedErr("expenses",e);});'''
R.append((EXP_CLOSE, EXP_CLOSE+'''
  db.collection("bin").onSnapshot(s=>{
    S.bin=s.docs.map(d=>Object.assign({id:d.id},d.data()));
    if(!BIN_SWEPT){ BIN_SWEPT=true;
      const cut=Date.now()-BIN_DAYS*86400000;
      S.bin.filter(b=>b.at&&+new Date(b.at)<cut).forEach(b=>dbDel("bin/"+b.id)); }
    repaint();},e=>{feedErr("bin",e);});'''))
R=[x for x in R if x[0]!=x[1]]
assert 'function binDel' not in s
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90])
    s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
