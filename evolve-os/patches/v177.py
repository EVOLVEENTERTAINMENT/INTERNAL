import sys
s=open(sys.argv[1]).read()
R=[
# 1. waitProject: a wait on "Cheryl Bullard / Mr. Abell, Abell & Associates" links to the Bill Abell project
('''  const k3=wk.length>=5?Object.keys(ps).filter(x=>slugKey(heldBy(ps[x])).indexOf(wk)===0)[0]:null;
  return k3?{slug:k3,st:ps[k3]}:null;
}''','''  const k3=wk.length>=5?Object.keys(ps).filter(x=>slugKey(heldBy(ps[x])).indexOf(wk)===0)[0]:null;
  if(k3)return {slug:k3,st:ps[k3]};
  /* V177. Any one of the people or the firm named on the wait, when exactly
     one project carries that name in its title or its blocker. "Cheryl
     Bullard / Mr. Abell, Abell & Associates" is the Bill Abell project. */
  const COMMON=/^(associates|company|office|group|services|studio|studios|entertainment|center|centre|mister|their|someone)$/;
  const words=String(w.who||"").toLowerCase().split(/[^a-z]+/).filter(t=>t.length>=5&&!COMMON.test(t));
  const hits={};
  words.forEach(t=>Object.keys(ps).forEach(x=>{const st=ps[x]||{};
    if(st.archived)return;
    if(slugKey(st.name||x).indexOf(t)>=0||slugKey(heldBy(st)).indexOf(t)>=0)hits[slugKey(st.name||x)]=hits[slugKey(st.name||x)]||x;}));
  const hk=Object.keys(hits);
  return hk.length===1?{slug:hits[hk[0]],st:ps[hits[hk[0]]]}:null;
}'''),
# 2. one set of blocks that need a tick: dayRoll leaves out the soft rhythm blocks and free or declined ones, same as Home and unclosedDays
('''  const work=evs.filter(x=>intentOf(x)!=="off");
  const now=new Date(), past=x=>x.e<now;''','''  /* V177. The blocks that ask for a tick are the same set everywhere: the
     Now pill, Home, Close the day and the open day count all read this. */
  const work=evs.filter(x=>intentOf(x)!=="off"&&!isSoft(x)&&!isGhost(x));
  const now=new Date(), past=x=>x.e<now;'''),
('''    if(all===null)all=view();
    const n=onDay(d,all).filter(x=>!x.all&&!x.gh&&!x.gone&&!isGhost(x)&&!isAmb(x)&&!isSoft(x)).length;
    if(n)out.push(key);''','''    if(all===null)all=view();
    const n=dayRoll(key,all).work.length;
    if(n)out.push(key);'''),
('''  const dayAll=forRole(onDay(today,all)
    .filter(x=>!x.all&&!x.gh&&!x.gone&&!isGhost(x)&&ambFor(x)&&!isSoft(x)))
    .sort((a,b)=>a.s-b.s);''','''  const dayAll=forRole(onDay(today,all)
    .filter(x=>!x.all&&!x.gh&&!x.gone&&!isGhost(x)&&ambFor(x)&&!isSoft(x)&&intentOf(x)!=="off"))
    .sort((a,b)=>a.s-b.s);'''),
# 3. Home counts live projects the way Projects does
('''  if(ps.length)side.push(ps.length+" live project"+(ps.length===1?"":"s"));''',
 '''  { const nl=ps.filter(isLive).length;
    if(nl)side.push(nl+" live project"+(nl===1?"":"s")); }'''),
# 4. Home To do from one shared list, which the Board also draws
('''  { const me=ownerName(), tk=dk(today);
    const tasks=(S.tasks||[]).filter(t=>t&&t.status!=="done"&&t.due&&ppIsDate(t.due)&&t.due<=tk
      &&(!t.owner||t.owner===me||/^jackson/i.test(t.owner)))
      .sort((a,b)=>String(a.due).localeCompare(String(b.due)));
    const notes=(S.scraps||[]).filter(x=>x&&x.state==="raw"&&x.sort&&x.sort.day&&x.sort.day<=tk);
    if(tasks.length||notes.length){
      grp("To do",tasks.length+notes.length);
      tasks.forEach(t=>{
        const dt=daysTo(t.due);
        const pj=(S.pstate||{})[t.project]; const pn=(pj&&pj.name)||"";
        const row=e("div",{class:"r td"});
        row.appendChild(e("button",{class:"tick","aria-label":"Mark as done: "+t.title,
          onclick:ev=>{ev.stopPropagation();pwTaskPatch(t,{status:"done"},true);say("Done.");}}));
        row.appendChild(e("span",{class:"w"+(dt<0?" on":""),text:dt<0?"carried":"today"}));
        row.appendChild(e("span",{class:"t",tabindex:"0",role:"button",
          onclick:()=>openProject(t.project),
          onkeydown:ev=>{if(ev.key==="Enter"){ev.preventDefault();openProject(t.project);}},
          text:t.title}));
        if(pn)row.appendChild(e("span",{class:"d",text:pn.length>22?pn.slice(0,21)+"…":pn}));
        tl.appendChild(row);});
      notes.forEach(x=>{
        const dt=daysTo(x.sort.day);
        const row=e("div",{class:"r td"});
        row.appendChild(e("div",{class:"tickpad"}));
        row.appendChild(e("span",{class:"w"+(dt<0?" on":""),text:dt<0?"carried":"today"}));
        row.appendChild(e("span",{class:"t",tabindex:"0",role:"button",
          onclick:()=>{S.room=null;S.mode="dump";paint();},
          onkeydown:ev=>{if(ev.key==="Enter"){ev.preventDefault();S.room=null;S.mode="dump";paint();}},
          text:x.text}));
        row.appendChild(e("span",{class:"d",text:"Inbox"}));
        tl.appendChild(row);});
    }
  }''','''  { const td=myTodos(dk(today));
    if(td.tasks.length||td.notes.length){
      grp("To do",td.tasks.length+td.notes.length);
      todoRows(tl,td,dk(today));
    }
  }'''),
('''function modeBoard(){
  const wrap=e("div",{class:"board-wrap"});''','''/* V177. His own to-dos for a day: project tasks he owns with that date, and
   Inbox items the brain dump dated. Today also takes the ones whose date has
   gone, so they carry rather than vanish. Home and the Board both read this. */
function myTodos(key){
  const me=ownerName(), tk=dk(bday(new Date()));
  if(key<tk)return {tasks:[],notes:[]};
  const on=d=>key===tk?d<=tk:d===key;
  const tasks=(S.tasks||[]).filter(t=>t&&t.status!=="done"&&t.due&&ppIsDate(t.due)&&on(String(t.due).slice(0,10))
    &&(!t.owner||t.owner===me||/^jackson/i.test(t.owner)))
    .sort((a,b)=>String(a.due).localeCompare(String(b.due)));
  const notes=(S.scraps||[]).filter(x=>x&&x.state==="raw"&&x.sort&&x.sort.day&&on(x.sort.day));
  return {tasks:tasks,notes:notes};
}
function todoRows(tl,td,key){
  const tk=dk(bday(new Date())), lab=d=>key!==tk?"due":d<0?"carried":"today";
  td.tasks.forEach(t=>{
    const dt=daysTo(t.due);
    const pj=(S.pstate||{})[t.project]; const pn=(pj&&pj.name)||"";
    const row=e("div",{class:"r td"});
    row.appendChild(e("button",{class:"tick","aria-label":"Mark as done: "+t.title,
      onclick:ev=>{ev.stopPropagation();pwTaskPatch(t,{status:"done"},true);say("Done.");}}));
    row.appendChild(e("span",{class:"w"+(dt<0?" on":""),text:lab(dt)}));
    row.appendChild(e("span",{class:"t",tabindex:"0",role:"button",
      onclick:()=>openProject(t.project),
      onkeydown:ev=>{if(ev.key==="Enter"){ev.preventDefault();openProject(t.project);}},
      text:t.title}));
    if(pn)row.appendChild(e("span",{class:"d",text:pn.length>22?pn.slice(0,21)+"…":pn}));
    tl.appendChild(row);});
  td.notes.forEach(x=>{
    const dt=daysTo(x.sort.day);
    const row=e("div",{class:"r td"});
    row.appendChild(e("div",{class:"tickpad"}));
    row.appendChild(e("span",{class:"w"+(dt<0?" on":""),text:lab(dt)}));
    row.appendChild(e("span",{class:"t",tabindex:"0",role:"button",
      onclick:()=>{S.room=null;S.mode="dump";paint();},
      onkeydown:ev=>{if(ev.key==="Enter"){ev.preventDefault();S.room=null;S.mode="dump";paint();}},
      text:x.text}));
    row.appendChild(e("span",{class:"d",text:"Inbox"}));
    tl.appendChild(row);});
}
function modeBoard(){
  const wrap=e("div",{class:"board-wrap"});'''),
('''  nav.appendChild(e("button",{class:"b s",text:"Add",onclick:addBlock}));
  main.appendChild(tl);
''','''  nav.appendChild(e("button",{class:"b s",text:"Add",onclick:addBlock}));
  main.appendChild(tl);
  /* V177. The day's to-dos, above the hours they have to fit into. */
  if(S.view==="day"){
    const td=myTodos(key);
    if(td.tasks.length||td.notes.length){
      const bx=e("div",{class:"pan btodo"}), ml=e("div",{class:"mini"});
      ml.appendChild(e("div",{class:"lgrp"},[e("span",{text:"To do"}),
        e("span",{class:"n",text:String(td.tasks.length+td.notes.length)})]));
      todoRows(ml,td,key);
      bx.appendChild(ml); main.appendChild(bx);
    }
  }
'''),
('''@media (max-width:700px){.bfinds{padding:0 14px}}''','''@media (max-width:700px){.bfinds{padding:0 14px}}
.btodo{margin:0 0 12px;padding:10px 16px 8px}
@media (max-width:700px){.btodo{margin:0 14px 12px;padding:8px 12px 6px}}'''),
# 5. Projects reads the same needs-you rows as Home, so a blocker or a quiet wait shows on its project and in the count
('''function pwCtx(p,ps){
  const st=p.st||{}, ws=pwWs(p);''','''function pwCtx(p,ps,ny){
  const st=p.st||{}, ws=pwWs(p);'''),
('''    waits:(S.waiting||[]).filter(w=>w.state!=="replied"&&pwWaitHits(w,p))};
  c.att=pwAttention(c);''','''    waits:(S.waiting||[]).filter(w=>w.state!=="replied"&&pwWaitHits(w,p))};
  /* V177. The Home rows that belong to this project, so both screens count
     the same things. */
  try{ c.ny=(ny||needYou(view())).filter(r=>r.slug===p.slug&&/^(blk|wait|wexp|cand)-/.test(String(r.id))); }catch(x){ c.ny=[]; }
  c.att=pwAttention(c);'''),
('''  c.waits.forEach(w=>{
    const d=waitDays(w);
    if(d!==null&&d>=7)add(3,isAsk(w)?"Out "+d+"d":"Waiting "+d+"d",d>=14,String(w.what||""),
      String(w.who||""),()=>{S.mode="people";paint();});
  });''','''  const nyIds={};
  (c.ny||[]).forEach(r=>{ const id=String(r.id), wid=id.replace(/^(wait|wexp|cand)-/,"");
    if(id!==wid)nyIds[wid]=1;
    add(1,r.age!=null&&!/^blk-/.test(id)?"Waiting "+r.age+"d":"Waiting",true,r.cond,r.conseq||"",r.verb?r.verb[1]:null); });
  c.waits.forEach(w=>{
    if(nyIds[w.id])return;
    const d=waitDays(w);
    if(d!==null&&d>=7)add(3,isAsk(w)?"Out "+d+"d":"Waiting "+d+"d",d>=14,String(w.what||""),
      String(w.who||""),()=>{S.mode="people";paint();});
  });'''),
('''  const ctxs={}; live.forEach(p=>{ctxs[p.slug]=pwCtx(p,ps);});
  const cctx=cur?(ctxs[cur.slug]||pwCtx(cur,ps)):null;''','''  let ny=null; try{ny=needYou(all);}catch(x){ny=[];}
  const ctxs={}; live.forEach(p=>{ctxs[p.slug]=pwCtx(p,ps,ny);});
  const cctx=cur?(ctxs[cur.slug]||pwCtx(cur,ps,ny)):null;'''),
# 6. a wait that belongs to a live project reads like that project's blocker row, under the project's name
('''      grp:lp?null:"wait", gkey:slugKey(w.who||"someone"),
      who:(w.who||"Someone").toUpperCase(),
      cond:clause(w.what||"Something",80)+", quiet "+d+" days",
      conseq:w.dies||(lp?lp.name+" cannot move until it comes back."
        :"Nothing is moving on it while it sits."),''','''      grp:lp?null:"wait", gkey:slugKey(w.who||"someone"),
      who:(lp?((lp.st&&lp.st.client)||lp.name):(w.who||"Someone")).toUpperCase(),
      cond:lp?"Waiting on "+String(w.who||"them").split(",")[0].trim().slice(0,60)+", quiet "+d+" days"
        :clause(w.what||"Something",80)+", quiet "+d+" days",
      conseq:lp&&lp.st&&lp.st.next_action?"Your move: "+clause(lp.st.next_action,110)
        :w.dies||(lp?lp.name+" cannot move until it comes back."
        :"Nothing is moving on it while it sits."),'''),
('const BUILD="V176 2026-10-13T02:20Z";','const BUILD="V177 2026-10-13T03:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
