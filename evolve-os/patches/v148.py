import sys
s=open(sys.argv[1]).read()
CANON=r'''/* V148. Most projects live under two document names, laurel-oaks and
   laureloaks: the nightly writes the hyphenated one, the V39 migration minted
   the run together one. Every project write and delete goes through here so
   the board touches the hyphenated copy, the one the nightly keeps current,
   and a delete takes every copy so nothing comes back. */
const PDOCS={};
function pCanon(path){
  const m=/^projects\/(.+)$/.exec(String(path||"")); if(!m)return path;
  const ids=PDOCS[slugKey(m[1])]; if(!ids||!ids.length)return path;
  const hy=ids.filter(x=>x.indexOf("-")>=0).sort()[0];
  return "projects/"+(hy||(ids.indexOf(m[1])>=0?m[1]:ids.slice().sort()[0]));
}
/* held up by someone else, not by a line saying nobody or him */
function heldBy(st){
  const b=String((st&&st.blocked_by)||"").trim();
  return b&&!/^(nobody|him\b|jackson\b)/i.test(b)?b:"";
}
function dbSet(path,data){
  path=pCanon(path);
'''
R=[
('function dbSet(path,data){\n',CANON),
('function dbMergeCritical(path,data,rollback){\n','function dbMergeCritical(path,data,rollback){\n  path=pCanon(path);\n'),
('function dbSetCritical(path,data,rollback){\n','function dbSetCritical(path,data,rollback){\n  path=pCanon(path);\n'),
('function dbMerge(path,patch){\n','function dbMerge(path,patch){\n  path=pCanon(path);\n'),
('''  return db.doc(path).delete().then(()=>true)
    .catch(()=>{say("That did not delete on the server.",true);return false;});''',
'''  const pm=/^projects\\/(.+)$/.exec(String(path||"")), tw=pm&&PDOCS[slugKey(pm[1])];
  const all=tw&&tw.length?tw.map(x=>"projects/"+x):[path];
  return Promise.all(all.map(p=>db.doc(p).delete())).then(()=>true)
    .catch(()=>{say("That did not delete on the server.",true);return false;});'''),
('''  const row=Object.assign({},rec||{});
  const id="b"+Date.now()''','''  path=pCanon(path);
  const row=Object.assign({},rec||{});
  const id="b"+Date.now()'''),
('''    s.docs.forEach(d=>{S.pstate[slugKey(d.id)]=foldIn(d,false);});
    firstIn("projects");''','''    Object.keys(PDOCS).forEach(k=>{delete PDOCS[k];});
    s.docs.forEach(d=>{const k=slugKey(d.id);(PDOCS[k]=PDOCS[k]||[]).push(d.id);});
    /* twins fold the same way every time: the run together copy first, the
       hyphenated one last, so it shows and the minted id carries across */
    s.docs.slice().sort((a,b)=>(a.id.indexOf("-")>=0)-(b.id.indexOf("-")>=0)||a.id.localeCompare(b.id))
      .forEach(d=>{S.pstate[slugKey(d.id)]=foldIn(d,false);});
    firstIn("projects");'''),
('const PALIAS={"LAUREL OAKS":"LOVC"};','const PALIAS={"LAUREL OAKS":"LAUREL OAKS VETERINARY CENTER","LOVC":"LAUREL OAKS VETERINARY CENTER"};'),
('''  Object.keys(S.pstate).forEach(k=>{
    const st=S.pstate[k];
    const byName=slugKey(st.name||k);''','''  Object.keys(S.pstate).forEach(k=>{
    const st=S.pstate[k];
    /* V148. A record that is only another name for a project, like LOVC,
       folds into that project rather than standing beside it. */
    const al=PALIAS[String(st.name||"").toUpperCase()];
    if(al&&slugKey(al)!==k){ const tg=stateFor(al); if(tg&&tg!==st)return; }
    const byName=slugKey(st.name||k);'''),
('''    by[k].st=st; by[k].name=st.name||by[k].name||k;
  });''','''    by[k].st=st; by[k].name=st.name||by[k].name||k;
  });
  /* V148. A name that only ever comes from a repeating block or the routine
     calendar, with no record behind it, is a routine, not a project. */
  Object.keys(by).forEach(k=>{ const p=by[k];
    if(!p.st&&p.blocks.length&&p.blocks.every(b=>b.ev.recId||isSoft(b.ev))&&!stateFor(p.name))delete by[k]; });'''),
('''  const o=calMeta(v.id).mode_override;
  if(o==="virtual"||o==="inperson")return o;''','''  const o=calMeta(v.id).mode_override||(v.recId?calMeta(v.recId).mode_override:"");
  if(o==="virtual"||o==="inperson")return o;'''),
('''      .filter(x=>anchorOf(x)==="FIXED"&&modeOf(x)==="unknown")
      .forEach(x=>{''','''      .filter(x=>anchorOf(x)==="FIXED"&&modeOf(x)==="unknown")
      /* V148. Only where someone else is on it. A block of his own has no
         run up to plan, and asking about every one buried the list. */
      .filter(x=>x.others>0||(x.orgSelf===false&&x.orgName)||/\\b(meeting|with)\\b/i.test(x.title||""))
      .forEach(x=>{
        const mset=m=>{calMetaSet(x.id,{mode_override:m}); if(x.recId)calMetaSet(x.recId,{mode_override:m});};'''),
('''          verb:["In person",()=>{calMetaSet(x.id,{mode_override:"inperson"});''','''          verb:["In person",()=>{mset("inperson");'''),
('''          acts:[["On a call",()=>{calMetaSet(x.id,{mode_override:"virtual"});''','''          acts:[["On a call",()=>{mset("virtual");'''),
('const stuck=coProjects(all).filter(p=>p.st&&p.st.blocked_by).length;','const stuck=coProjects(all).filter(p=>heldBy(p.st)).length;'),
('''    const st=p.st||{};
    if(!st.blocked_by)return;
    const r=push({id:"blk-"+p.slug''','''    const st=p.st||{};
    if(!heldBy(st))return;
    const r=push({id:"blk-"+p.slug'''),
('''    if(pr&&pr.blocked_by)rows.push({side:"you",who:pr.name,''','''    if(pr&&heldBy(pr))rows.push({side:"you",who:pr.name,'''),
('const BUILD="V147 2026-10-09T11:00Z";','const BUILD="V148 2026-10-09T15:00Z";'),
]
assert 'function pCanon' not in s
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
