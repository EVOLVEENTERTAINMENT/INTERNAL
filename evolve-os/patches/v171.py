import sys
s=open(sys.argv[1]).read()
R=[
# rule 7: a name off the calendar with no record is not asked about
('''  live.filter(isEngaged).forEach(p=>{
    if(naOf(p))return;''','''  live.filter(isEngaged).forEach(p=>{
    if(naOf(p))return;
    /* V171. A calendar tag with no project record behind it is not a
       project he forgot to name a move for. */
    if(!p.st||!p.st.project_id)return;'''),
# rule 5: say how old the blocker words are
('''      cond:p.name+" is blocked on "+st.blocked_by,''','''      cond:p.name+" is blocked on "+st.blocked_by+(function(){
        const a=st.updated_at?ageDays(st.updated_at):null;
        return a!==null&&a>=2?" (written "+new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(new Date(st.updated_at))+")":"";})(),'''),
# Home: his own to-dos with today's date on them
('''  /* The detectors, in the same list rather than in a panel of their own.''','''  /* V171. His own to-dos with a date of today or earlier: project tasks he
     owns, and Inbox items the brain dump dated. Added anywhere, they show
     here, where he looks. */
  { const me=ownerName(), tk=dk(today);
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
  }

  /* The detectors, in the same list rather than in a panel of their own.'''),
('const BUILD="V170 2026-10-12T23:10Z";','const BUILD="V171 2026-10-12T23:50Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
