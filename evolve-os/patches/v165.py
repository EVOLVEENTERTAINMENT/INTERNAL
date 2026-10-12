import sys
s=open(sys.argv[1]).read()
R=[
# know which project record a name belongs to
('''function bdProject(v,ps){''','''/* V165. The record key a project name lives under, for filing a task on it. */
function bdProjKey(name){
  const k=slugKey(String(name||"")); if(!k)return null;
  return Object.keys(S.pstate||{}).filter(x=>{const p=S.pstate[x]; return p&&!p.archived&&slugKey(p.name||x)===k;})[0]||null;
}
/* Where a line goes when he presses Add. Sure to-dos with a real project
   become tasks on it; sure waiting lines with a person go straight to
   Waiting on; ideas go to Someday; everything else lands in Inbox. */
function bdDest(x){
  if(x.kind==="idea")return "someday";
  if(x.sure&&x.kind==="task"&&x.project&&bdProjKey(x.project))return "task";
  if(x.sure&&x.kind==="waiting"&&x.person)return "waiting";
  return "inbox";
}
function bdProject(v,ps){'''),
# commit: file sure items
('''  const made=[], waits=[];
  B.items.forEach(x=>{
    if(!B.keep[x.id]||x.kind==="drop"||x.kind==="dup")return;
    const id=''','''  const made=[], waits=[], tasks=[], cnt={task:0,waiting:0,someday:0,inbox:0};
  B.items.forEach(x=>{
    if(!B.keep[x.id]||x.kind==="drop"||x.kind==="dup")return;
    const dest=bdDest(x); cnt[dest]++;
    if(dest==="task"){
      const k=bdProjKey(x.project);
      const t=pwTaskNew({slug:k,st:S.pstate[k]},x.title,{due:x.date||"",notes:x.orig&&x.orig!==x.title?"From a brain dump: "+x.orig:"From a brain dump"});
      if(t){tasks.push(t.id);return;}
      cnt.task--; cnt.inbox++;
    }
    if(dest==="waiting"){
      const w=waitingSave({who:x.person,what:x.title,project:x.project||""});
      if(w&&w.id){waits.push(w.id);return;}
      cnt.waiting--; cnt.inbox++;
    }
    const id='''),
('''    S.scraps.push(row); dbSet("scraps/"+id,row); made.push(id);
    if(x.kind==="waiting"&&x.person){
      const w=waitingSave({who:x.person,what:x.title,project:x.project||""});
      if(w&&w.id)waits.push(w.id);
    }
  });
  logAct("Brain dump: "+plur(made.length,"thing")+" added to Inbox","acc");
  const n=made.length;
  S.bd=null; S.bdText="";
  paint();
  say(n?plur(n,"thing")+" added to your Inbox.":"Nothing added.",false,n?{label:"Undo",run:()=>{
    S.scraps=S.scraps.filter(x=>made.indexOf(x.id)<0);
    made.forEach(id=>dbDel("scraps/"+id));''','''    S.scraps.push(row); dbSet("scraps/"+id,row); made.push(id);
  });
  const n=made.length+tasks.length+waits.length;
  const parts=[];
  if(cnt.task)parts.push(cnt.task+" to projects");
  if(cnt.waiting)parts.push(cnt.waiting+" to Waiting on");
  if(cnt.someday)parts.push(cnt.someday+" to Someday");
  if(cnt.inbox)parts.push(cnt.inbox+" to your Inbox");
  logAct("Brain dump: "+(parts.join(", ")||"nothing added"),"acc");
  S.bd=null; S.bdText="";
  paint();
  say(n?"Filed "+parts.join(", ")+".":"Nothing added.",false,n?{label:"Undo",run:()=>{
    S.scraps=S.scraps.filter(x=>made.indexOf(x.id)<0);
    made.forEach(id=>dbDel("scraps/"+id));
    S.tasks=(S.tasks||[]).filter(x=>tasks.indexOf(x.id)<0);
    tasks.forEach(id=>dbDel("tasks/"+id));'''),
# show where each line goes
('''      if(!x.sure&&k[0]!=="dup"&&k[0]!=="drop")m.appendChild(e("span",{class:"chip chk",text:"Check"}));''','''      if(!x.sure&&k[0]!=="dup"&&k[0]!=="drop")m.appendChild(e("span",{class:"chip chk",text:"Check"}));
      if(on&&k[0]!=="dup"&&k[0]!=="drop"){ const d=bdDest(x);
        m.appendChild(e("span",{class:"chip go",text:d==="task"?"Goes to the project":d==="waiting"?"Goes to Waiting on":d==="someday"?"Goes to Someday":"Goes to Inbox"})); }'''),
('''.bd .chip.chk{background:var(--sig-dim);color:var(--sig-lift)}''','''.bd .chip.chk{background:var(--sig-dim);color:var(--sig-lift)}
.bd .chip.go{background:var(--acc-soft);color:var(--acc-t)}'''),
('''    e("button",{class:"b on",disabled:nk?null:true,text:"Add "+nk+" to Inbox",onclick:bdCommit})]));''','''    e("button",{class:"b on",disabled:nk?null:true,text:"File "+nk,onclick:bdCommit})]));'''),
('''  return dsec("Brain dump","Check it, then add",box);''','''  return dsec("Brain dump","Check it, then file",box);'''),
('const BUILD="V164 2026-10-12T22:30Z";','const BUILD="V165 2026-10-12T23:30Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
