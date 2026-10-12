import sys
s=open(sys.argv[1]).read()
R=[
# a failed update only becomes a full write when the record is not there
('''function dbSet(path,data){
  path=pCanon(path);''','''/* V157. update fails, then set: right for a record that does not exist yet,
   wrong for one that does, where set would replace every other field with
   the few in the patch. When the store can say the record exists, a failed
   update is reported as not saved instead. When it cannot say, this behaves
   as before. */
function setIfAbsent(path,data){
  let d=null; try{d=db.doc(path);}catch(x){}
  if(!d||typeof d.get!=="function")return db.doc(path).set(data);
  return Promise.resolve(d.get()).then(snap=>{
    const ex=snap&&(typeof snap.exists==="function"?snap.exists():snap.exists);
    if(ex)throw new Error("exists");
    return db.doc(path).set(data);
  });
}
function dbSet(path,data){
  path=pCanon(path);'''),
('''  return db.doc(path).update(data).then(()=>true)
    .catch(()=>db.doc(path).set(data).then(()=>true).catch(fail));''','''  return db.doc(path).update(data).then(()=>true)
    .catch(()=>setIfAbsent(path,data).then(()=>true).catch(fail));'''),
('''  return db.doc(path).update(patch).then(()=>true).catch(()=>
    db.doc(path).set(patch).then(()=>true).catch(()=>{''','''  return db.doc(path).update(patch).then(()=>true).catch(()=>
    setIfAbsent(path,patch).then(()=>true).catch(()=>{'''),
# what Logicnova is owed on a work order counts as project cost once accepted
('''  const ex=expForProj(k);
  return {labour:labour, mins:mins, unratedMins:unrated, cappedCount:capped,
    expenses:expSum(ex), expCount:ex.length,
    total:labour+expSum(ex)};''','''  const ex=expForProj(k);
  /* V157. A work order's fee is a cost of the project once both sides accept it */
  const nm=slugKey(((S.pstate||{})[k]||{}).name||"");
  let dev=0; (S.wos||[]).forEach(w=>{ if(!w||!ppIsDate(w.accepted_on))return;
    const wk=slugKey(w.project||""); if(wk&&(wk===k||wk===nm))dev+=Number(w.fee)||0; });
  return {labour:labour, mins:mins, unratedMins:unrated, cappedCount:capped,
    expenses:expSum(ex)+dev, expCount:ex.length, dev:dev,
    total:labour+expSum(ex)+dev};'''),
('const BUILD="V156 2026-10-12T04:00Z";','const BUILD="V157 2026-10-12T05:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
