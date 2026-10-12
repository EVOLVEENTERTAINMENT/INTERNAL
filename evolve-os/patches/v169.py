import sys
s=open(sys.argv[1]).read()
R=[
# strip stacked list marks like "- [ ] "
('''function bdLines(v){
  return String(v||"").split(/\\n+/).map(x=>x.trim())
    .map(x=>x.replace(/^(?:[-*\u2022\u25E6\u2023\u2043\u2219]|\\d{1,3}[.)]|\\[[ xX]?\\])\\s+/,"").trim())''','''function bdStrip(x){
  let t=String(x||"").trim(), k=0;
  while(k++<4){ const n=t.replace(/^(?:[-*\u2022\u25E6\u2023\u2043\u2219]|\\d{1,3}[.)]|\\[[ xX]?\\])\\s*/,"").trim(); if(n===t)break; t=n; }
  return t;
}
function bdLines(v){
  return String(v||"").split(/\\n+/).map(x=>x.trim())
    .map(bdStrip)'''),
# busy times for the next 10 days, so Claude can place blocks in real gaps
('''function bdPrompt(lines){''','''/* V166. When he is already booked, the next 10 days, hours only. Personal
   titles never travel. Ambient calendars are left out. */
function bdBusy(){
  const all=view(), out=[], t0=bday(new Date());
  for(let i=0;i<10;i++){
    const d=plus(t0,i);
    const bl=onDay(d,all).filter(x=>!x.gh&&!x.all).filter(x=>{const c=CALS.filter(k=>k.key===x.cal)[0];return !(c&&c.amb);})
      .map(x=>p2(x.s.getHours())+":"+p2(x.s.getMinutes())+"-"+p2(x.e.getHours())+":"+p2(x.e.getMinutes()));
    out.push({date:dk(d),weekday:wd(d,"long"),busy:bl});
  }
  return out;
}
function bdPrompt(lines){'''),
('''    +"\\n\\nToday is "+wk+" "+today+", America/Chicago."''','''    +"\\n\\nToday is "+wk+" "+today+", America/Chicago. It is now "+p2(now.getHours())+":"+p2(now.getMinutes())+"."
    +"\\n\\nWhen he is already booked over the next 10 days (start-end, 24 hour):\\n"+JSON.stringify(bdBusy())
    +"\\nHis calendars: EVOLVE (business work), PERSONAL (errands, shopping, family, friends), HEALTH, FALL (fall events and parties)."'''),
('''    +"\\nwhy: under 12 words, plain."''','''    +"\\nmins: how long it takes, from his own words like \\"10 mins\\" or \\"7am -12pm\\" (that is 300). 0 when he gave no length."
    +"\\nowner: who does it. \\"Jackson\\" unless the line names a team member as the doer, like \\"GAVIN- ...\\". Helping someone or meeting someone does not make them the owner."
    +"\\nstart: HH:MM 24 hour. If his line gives a time, use exactly that and set start_from \\"his\\". Otherwise, only when there is a date and mins, pick a free time on that date that does not overlap anything in the booked list, between 09:00 and 23:30, and set start_from \\"picked\\". \\"tonight\\" means today after now and before 23:30. Otherwise empty."
    +"\\nFor a window like \\"this week\\", \\"this week early\\" or \\"by next Thursday\\": set when_said to his words, and if he gave a length, set date to a free day inside that window and pick a start as above. Never pick a date outside his window."
    +"\\ncal: EVOLVE for business work, PERSONAL for errands, shopping, family and friends, HEALTH for health, FALL for fall events. Only these."
    +"\\nA heading line like \\"TONIGHT:\\" or \\"Monday:\\" is kind drop, and its day applies to every line under it that names no day or window of its own: set when_said to the heading word for those lines."
    +"\\nA weekday name means the next one on or after today."
    +"\\nAn item he only needs to remember with no length and no time stays without a start."
    +"\\nwhy: under 12 words, plain."'''),
('''{"items":[{"id":"L1","kind":"task","title":"","project":"","person":"","when_said":"","date":"","dup_of":"","sure":true,"why":""}]''','''{"items":[{"id":"L1","kind":"task","title":"","project":"","person":"","owner":"Jackson","when_said":"","date":"","mins":0,"start":"","start_from":"","cal":"EVOLVE","dup_of":"","sure":true,"why":""}]'''),
# carry the new fields through cleaning
('''    if(!it)return {id:l.id,orig:l.text,kind:"task",title:l.text,project:"",person:"",when:"",date:"",dup:"",sure:false,why:"Not sorted, kept as written"};''','''    if(!it)return {id:l.id,src:l.src||"",orig:l.text,kind:"task",title:l.text,project:"",person:"",owner:"",when:"",date:"",mins:0,start:"",from:"",cal:"EVOLVE",dup:"",sure:false,why:"Not sorted, kept as written"};'''),
('''    let dup=raw[it.dup_of]?it.dup_of:"";''','''    let dup=(raw[it.dup_of]&&!bdSrcIds()[it.dup_of])?it.dup_of:"";'''),
('''    const date=when&&/^\\d{4}-\\d{2}-\\d{2}$/.test(String(it.date||""))?it.date:"";''','''    const date=when&&/^\\d{4}-\\d{2}-\\d{2}$/.test(String(it.date||""))?it.date:"";
    const mins=Math.max(0,Math.min(720,parseInt(it.mins,10)||0));
    const start=date&&/^\\d{1,2}:\\d{2}$/.test(String(it.start||""))?String(it.start).padStart(5,"0"):"";
    const from=start?(it.start_from==="his"?"his":"picked"):"";
    const crew=crewNames().map(k=>(S.crew[k]&&S.crew[k].name)||k);
    const ow=nd(it.owner); const owner=crew.filter(c=>c&&ow&&c.toLowerCase().split(" ")[0]===ow.toLowerCase().split(" ")[0])[0]||"";'''),
('''    return {id:l.id,orig:l.text,kind:kind,title:nd(it.title)||l.text,project:pj,person:nd(it.person),
      when:when,date:date,dup:dup,sure:it.sure===true,why:nd(it.why)};''','''    return {id:l.id,src:l.src||"",orig:l.text,kind:kind,title:nd(it.title)||l.text,project:pj,person:nd(it.person),owner:owner,
      when:when,date:date,mins:mins,start:start,from:from,cal:matchCal(it.cal),dup:dup,sure:it.sure===true,why:nd(it.why)};'''),
('''function bdRun(reply){''','''function bdSrcIds(){ const o={}; ((S.bd&&S.bd.lines)||[]).forEach(l=>{if(l.src)o[l.src]=1;}); return o; }
async function bdRunUnused(){}
async function bdRun(reply){'''),
('''      const prev=JSON.stringify({items:B.items.map(x=>({id:x.id,kind:x.kind,title:x.title,project:x.project,person:x.person,when_said:x.when,date:x.date,dup_of:x.dup,sure:x.sure,why:x.why}))});''','''      const prev=JSON.stringify({items:B.items.map(x=>({id:x.id,kind:x.kind,title:x.title,project:x.project,person:x.person,owner:x.owner||"Jackson",when_said:x.when,date:x.date,mins:x.mins,start:x.start,start_from:x.from,cal:x.cal,dup_of:x.dup,sure:x.sure,why:x.why}))});'''),
# where it goes
('''function bdDest(x){
  if(x.kind==="idea")return "someday";''','''function bdDest(x){
  if(x.kind==="idea")return "someday";
  if(x.date&&x.start&&x.mins&&(!x.owner||x.owner===ownerName()||/^jackson/i.test(x.owner)))return "calendar";
  if(x.owner&&!/^jackson/i.test(x.owner))return "crew";'''),
('''  const made=[], waits=[], tasks=[], cnt={task:0,waiting:0,someday:0,inbox:0};''','''  const made=[], waits=[], tasks=[], cnt={task:0,waiting:0,someday:0,inbox:0,calendar:0,crew:0}, srcs=[], staged=[];'''),
('''    const dest=bdDest(x); cnt[dest]++;''','''    const dest=bdDest(x); cnt[dest]++;
    const done=()=>{ if(x.src){ const sc=S.scraps.filter(y=>y.id===x.src)[0]; if(sc){srcs.push(Object.assign({},sc)); setScrap(x.src,{state:"binned",binned_why:"Filed by the brain dump"});} } };
    if(dest==="calendar"){
      const st=when(x.date,x.start);
      if(st){
        const c={type:"create",cal:x.cal||"EVOLVE",title:x.title.slice(0,80),
          desc:(x.orig||x.title)+(x.project?"\\n\\n"+x.project:""),toS:+st,toE:+st+x.mins*60000,note:"From the brain dump"};
        const n0=S.pending.length; stage(c);
        if(S.pending.length>n0){staged.push(S.pending[S.pending.length-1].pid); done(); return;}
      }
      cnt.calendar--; cnt.inbox++;
    }
    if(dest==="crew"){
      const due=x.date||"";
      if(x.project&&bdProjKey(x.project)){
        const k=bdProjKey(x.project);
        const t=pwTaskNew({slug:k,st:S.pstate[k]},x.title,{owner:x.owner,due:due,notes:"From a brain dump: "+(x.orig||x.title)});
        if(t){tasks.push(t.id); done(); return;}
      }else{
        const w=askCreate(x.owner,x.title,due,x.project?{project:x.project}:null);
        if(w&&w.id){waits.push(w.id); done(); return;}
      }
      cnt.crew--; cnt.inbox++;
    }'''),
('''      if(t){tasks.push(t.id);return;}
      cnt.task--; cnt.inbox++;''','''      if(t){tasks.push(t.id); done(); return;}
      cnt.task--; cnt.inbox++;'''),
('''      if(w&&w.id){waits.push(w.id);return;}
      cnt.waiting--; cnt.inbox++;''','''      if(w&&w.id){waits.push(w.id); done(); return;}
      cnt.waiting--; cnt.inbox++;'''),
# a line that came from an Inbox item stays that item, updated, instead of a copy
('''    if(x.project)row.project=x.project;
    S.scraps.push(row); dbSet("scraps/"+id,row); made.push(id);''','''    if(x.project)row.project=x.project;
    if(x.src&&S.scraps.some(y=>y.id===x.src)){
      const sc=S.scraps.filter(y=>y.id===x.src)[0]; srcs.push(Object.assign({},sc));
      setScrap(x.src,{text:row.text,orig:row.orig,state:row.state,sort:row.sort,ai_set:true,ai_reason:row.ai_reason,project:row.project||sc.project||""});
      return;
    }
    S.scraps.push(row); dbSet("scraps/"+id,row); made.push(id);'''),
('''  const n=made.length+tasks.length+waits.length;
  const parts=[];''','''  const n=made.length+tasks.length+waits.length+staged.length+srcs.length;
  const parts=[];
  if(cnt.calendar)parts.push(cnt.calendar+" to the calendar approval list");
  if(cnt.crew)parts.push(cnt.crew+" handed to the team");'''),
('''  S.bd=null; S.bdText="";
  paint();
  say(n?"Filed "+parts.join(", ")+".":"Nothing added.",false,n?{label:"Undo",run:()=>{''','''  S.bd=null; S.bdText="";
  if(staged.length)S.queueOpen=true;
  paint();
  say(n?"Filed "+parts.join(", ")+".":"Nothing added.",false,n?{label:"Undo",run:()=>{
    S.pending=S.pending.filter(p=>staged.indexOf(p.pid)<0); queueSave();
    srcs.forEach(sc=>{ const cur=S.scraps.filter(y=>y.id===sc.id)[0];
      if(cur)Object.keys(cur).forEach(k=>delete cur[k]);
      if(cur)Object.assign(cur,sc); else S.scraps.push(sc);
      dbSet("scraps/"+sc.id,Object.assign({},sc)); });'''),
# show the plan on each line
('''      if(x.date)m.appendChild(e("span",{class:"chip",text:bdFmtDate(x.date)+" (you said "+x.when+")"}));''','''      if(x.date&&x.start&&x.mins)m.appendChild(e("span",{class:"chip",text:bdFmtDate(x.date)+", "+hm(+x.start.slice(0,2)*60+ +x.start.slice(3))+" to "+hm(+x.start.slice(0,2)*60+ +x.start.slice(3)+x.mins)+(x.from==="picked"?" (open time)":"")}));
      else if(x.date)m.appendChild(e("span",{class:"chip",text:bdFmtDate(x.date)+" (you said "+x.when+")"}));
      if(x.mins&&!(x.date&&x.start))m.appendChild(e("span",{class:"chip",text:dur(x.mins)}));
      if(x.owner&&!/^jackson/i.test(x.owner))m.appendChild(e("span",{class:"chip",text:"For "+x.owner}));'''),
('''        m.appendChild(e("span",{class:"chip go",text:d==="task"?"Goes to the project":d==="waiting"?"Goes to Waiting on":d==="someday"?"Goes to Someday":"Goes to Inbox"})); }''','''        m.appendChild(e("span",{class:"chip go",text:d==="calendar"?"Goes to the calendar":d==="crew"?"Goes to "+x.owner:d==="task"?"Goes to the project":d==="waiting"?"Goes to Waiting on":d==="someday"?"Goes to Someday":"Goes to Inbox"})); }'''),
# Inbox items can be run through the brain dump
('''function bdStart(){''','''function bdFromInbox(){
  const raw=(S.scraps||[]).filter(x=>x.state==="raw").slice(0,120);
  if(!raw.length)return;
  const lines=raw.map((x,i)=>({id:"L"+(i+1),text:bdStrip(x.text||"").slice(0,400),src:x.id})).filter(l=>l.text);
  S.bdText=""; S.bd={lines:lines,items:null,questions:[],learned:[],keep:{},busy:false};
  bdRun();
}
function bdStart(){'''),
('''      text:S.busy?"Reading":(!sample?"Claude is off":"Sort these"),
      onclick:sortScraps}));''','''      text:S.busy?"Reading":(!sample?"Claude is off":"Sort these"),
      onclick:()=>{bdFromInbox();try{document.getElementById("scroll").scrollTop=0;}catch(x){}}}));'''),
# the capture bar sends a pasted list to the brain dump
('''    let parts=v.split(/\\n{2,}/).map(x=>x.trim()).filter(Boolean);''','''    if(sample&&v.split(/\\n+/).map(x=>x.trim()).filter(Boolean).length>=3){
      S.room=null; S.mode="dump"; S.bdText=v; paint(); bdStart();
      try{document.getElementById("scroll").scrollTop=0;}catch(x){}
      return;
    }
    let parts=v.split(/\\n{2,}/).map(x=>x.trim()).filter(Boolean);'''),
('''  const cnt={}; B.items.forEach(x=>{cnt[x.kind]=(cnt[x.kind]||0)+1;});
  const parts=BD_KINDS.filter(k=>cnt[k[0]]).map(k=>cnt[k[0]]+" "+k[1].toLowerCase());''','''  /* V166. Grouped by where each line goes, not by what kind of thing it is. */
  const gk=x=>x.kind==="dup"?"dup":x.kind==="drop"?"drop":bdDest(x);
  const cnt={}; B.items.forEach(x=>{const g=gk(x);cnt[g]=(cnt[g]||0)+1;});
  const parts=BD_GROUPS.filter(k=>cnt[k[0]]).map(k=>cnt[k[0]]+" "+k[2]);'''),
('''  BD_KINDS.forEach(k=>{
    const its=B.items.filter(x=>x.kind===k[0]); if(!its.length)return;''','''  BD_GROUPS.forEach(k=>{
    const its=B.items.filter(x=>gk(x)===k[0]); if(!its.length)return;'''),
('''      if(on&&k[0]!=="dup"&&k[0]!=="drop"){ const d=bdDest(x);''','''      if(false){ const d=bdDest(x);'''),
('''function bdStrip(x){''','''const BD_GROUPS=[["calendar","On the calendar","on the calendar"],["crew","For the team","for the team"],
  ["task","Onto projects","onto projects"],["waiting","Waiting on someone","waiting on someone"],
  ["inbox","To your Inbox","to your Inbox"],["someday","Someday","for someday"],
  ["dup","Already on your list","already on your list"],["drop","Drop","to drop"]];
function bdStrip(x){'''),
('const BUILD="V168 2026-10-12T21:55Z";','const BUILD="V169 2026-10-12T22:30Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
