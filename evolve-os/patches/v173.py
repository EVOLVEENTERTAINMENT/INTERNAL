import sys
s=open(sys.argv[1]).read()
R=[
# stage says whether it queued
('''function stage(c){
  if(tourBlocked()){tourHush();return;}
  const no=stageGuard(c);
  if(no){say("Not staged, "+no+".",true);return;}''','''function stage(c){
  if(tourBlocked()){tourHush();return false;}
  const no=stageGuard(c);
  if(no){say("Not staged, "+no+".",true);return false;}'''),
('''    if(dupe){say("That one is already in the queue.");return;}''','''    if(dupe){say("That one is already in the queue.");return false;}'''),
('''  c.pid="p"+(seq++);c.at=c.at||new Date().toISOString();S.pending.push(c);
  queueSave();paint();
}''','''  c.pid="p"+(seq++);c.at=c.at||new Date().toISOString();S.pending.push(c);
  queueSave();paint();
  return true;
}
/* V173. One place that saves a fact to the memory bank, for the brain dump
   and the chat alike. */
function memRemember(x){
  const m=Object.assign({people:[],words:[],rules:[]},S.mem||{});
  const nm=String(x.name||"").trim(), val=String(x.value||"").trim();
  if(!nm||!val)return false;
  if(x.type==="person"){
    const old=(m.people||[]).filter(p=>slugKey(p.name||"")===slugKey(nm))[0]||{};
    m.people=(m.people||[]).filter(p=>slugKey(p.name||"")!==slugKey(nm)).concat([Object.assign({},old,{name:nm,who:val,learned_on:dk(new Date())})]);
    S.mem=m; dbMerge("memory/core",{people:m.people});
  }else if(x.type==="word"){
    m.words=(m.words||[]).filter(p=>slugKey(p.word||"")!==slugKey(nm)).concat([{word:nm,means:val,learned_on:dk(new Date())}]);
    S.mem=m; dbMerge("memory/core",{words:m.words});
  }else{
    m.rules=(m.rules||[]).concat([{text:nm+": "+val,learned_on:dk(new Date())}]);
    S.mem=m; dbMerge("memory/core",{rules:m.rules});
  }
  return true;
}'''),
# propose tools report the truth
('''      stage({type:"create",cal:calOf(i.calendar||"EVOLVE").key,title:t.slice(0,160),
        desc:String(i.note||"").slice(0,400),toS:+a,toE:+b,
        note:"Came in off the capture line"});
      return {queued:true,waiting_on:"your tap"};}''','''      const ok=stage({type:"create",cal:calOf(i.calendar||"EVOLVE").key,title:t.slice(0,160),
        desc:String(i.note||"").slice(0,400),toS:+a,toE:+b,
        note:"Came in off the capture line"});
      return ok?{queued:true,waiting_on:"your tap"}:{queued:false,reason:"already in the list, or not allowed"};}'''),
('''      if(i.title){c.toTitle=String(i.title).slice(0,160);c.fromTitle=ev.title;}
      stage(c);
      return {queued:true,waiting_on:"your tap"};}''','''      if(i.title){c.toTitle=String(i.title).slice(0,160);c.fromTitle=ev.title;}
      const ok=stage(c);
      return ok?{queued:true,waiting_on:"your tap"}:{queued:false,reason:"already in the list, or not allowed"};}'''),
('''      stage({type:"delete",evId:ev.id,calId:ev.calId,cal:ev.cal,title:ev.title,
        fromS:+ev.s,fromE:+ev.e,note:"Came in off the capture line"});
      return {queued:true,waiting_on:"your tap"};}
  }];''','''      const ok=stage({type:"delete",evId:ev.id,calId:ev.calId,cal:ev.cal,title:ev.title,
        fromS:+ev.s,fromE:+ev.e,note:"Came in off the capture line"});
      return ok?{queued:true,waiting_on:"your tap"}:{queued:false,reason:"already in the list, or not allowed"};}
  },{
    /* V173. The chat can close what he says is finished, and remember what he
       tells it to. Both are his own words in this conversation. */
    name:"mark_done",
    description:"Mark one of his project tasks or Inbox items done, by the id shown in the lists you were given, when he says it is finished.",
    inputSchema:{type:"object",properties:{kind:{type:"string",enum:["task","inbox"]},id:{type:"string"}},required:["kind","id"]},
    execute:async i=>{
      const id=String(i.id||"");
      if(i.kind==="task"){ const t=(S.tasks||[]).filter(x=>x.id===id)[0];
        if(!t)return {done:false,reason:"no task has that id"};
        pwTaskPatch(t,{status:"done"},true); return {done:true,title:t.title}; }
      const sc=(S.scraps||[]).filter(x=>x.id===id)[0];
      if(!sc)return {done:false,reason:"no Inbox item has that id"};
      setScrap(id,{state:"binned",binned_why:"Done, from the chat"}); return {done:true,text:sc.text};}
  },{
    name:"remember",
    description:"Save a fact he just told you to his memory bank: who a person is (type person), what a word or short form means (type word), or where a kind of thing goes (type rule). Only what he said, never a guess.",
    inputSchema:{type:"object",properties:{type:{type:"string",enum:["person","word","rule"]},name:{type:"string"},value:{type:"string"}},required:["type","name","value"]},
    execute:async i=>{ const ok=memRemember({type:i.type,name:i.name,value:i.value});
      if(ok)say("Remembered: "+String(i.name)+".");
      return {saved:ok}; }
  }];'''),
# the chat sees the time, his lists and every project's next step
('''  const q=brain()+"\\n\\nHis live week as JSON:\\n"+JSON.stringify(weekJSON())
    +"\\n\\nThe conversation so far:\\n"+script
    +"\\n\\nYou have real tools. catch_note puts something on his board inbox, add_waiting logs someone who owes him, read_calendar checks what is already booked"''','''  const nw=new Date(), tk=dk(bday(nw));
  const lists={
    now:wd(nw,"long")+" "+dk(nw)+" "+p2(nw.getHours())+":"+p2(nw.getMinutes()),
    open_tasks:(S.tasks||[]).filter(t=>t&&t.status!=="done").slice(0,40).map(t=>({id:t.id,title:String(t.title||"").slice(0,120),
      project:((S.pstate||{})[t.project]||{}).name||t.project||"",owner:t.owner||"",due:t.due||""})),
    inbox:(S.scraps||[]).filter(x=>x&&x.state==="raw").slice(-30).map(x=>({id:x.id,text:String(x.text||"").slice(0,140),day:(x.sort&&x.sort.day)||""})),
    next_steps:Object.keys(S.pstate||{}).map(k=>S.pstate[k]).filter(p=>p&&!p.archived&&p.name)
      .slice(0,30).map(p=>({project:p.name,next:String(p.next_action||"").slice(0,140),blocked_by:String(p.blocked_by||"").slice(0,80)}))
  };
  const q=brain()+"\\n\\nIt is now "+lists.now+", America/Chicago. \\"Tonight\\" means today after now."
    +"\\n\\nHis live week as JSON:\\n"+JSON.stringify(weekJSON())
    +"\\n\\nHis open tasks, Inbox and each project's next step, with ids:\\n"+JSON.stringify(lists).slice(0,14000)
    +"\\n\\nThe conversation so far:\\n"+script
    +"\\n\\nTo change his calendar: read_calendar to find the event_id, then propose_move to move or rename it, propose_cancel to take it off, propose_event for something new. All of these only put it in his approval list. Never propose a new block when he asked to move one. When he says something is finished, call mark_done with its id. When he tells you who someone is or what something means, call remember. If a tool says queued false, tell him it did not go in."
    +"\\n\\nYou have real tools. catch_note puts something on his board inbox, add_waiting logs someone who owes him, read_calendar checks what is already booked"'''),
('''  c.pid="p"+(seq++);c.at=c.at||new Date().toISOString();S.pending.push(c);
  queueSave();paint();
  return true;''','''  if(c.type!=="create"&&c.evId&&S.pending.some(p=>p.evId===c.evId&&p.type===c.type&&p.toS===c.toS&&p.toE===c.toE)){
    say("That one is already in the queue.");return false;}
  c.pid="p"+(seq++);c.at=c.at||new Date().toISOString();S.pending.push(c);
  queueSave();paint();
  return true;'''),
('const BUILD="V172 2026-10-13T00:20Z";','const BUILD="V173 2026-10-13T01:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
