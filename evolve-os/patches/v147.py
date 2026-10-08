import sys
s=open(sys.argv[1]).read()
CORE=r'''/* ==========================================================================
   V147. Work Orders with the developer. Read off the Evolve x Logicnova
   Website Development Services Agreement of 6 Oct 2026: a fixed Project Fee
   per Work Order; 30% within 7 days of both accepting one of US$1,000 or
   more (2.12); 14 days for Evolve to review a delivery, then a reminder and
   5 more days before it is treated as accepted (4.8); fixes back within 7
   days with a 7 day review (4.9); the balance no later than 30 days after
   their invoice (2.9); warranty to 45 days after the earlier of Launch and
   60 days after acceptance (9.1). Only dates he enters drive anything.
   ========================================================================== */
const WO_PAY=[["start","30% at start, balance after acceptance"],["one","One payment after acceptance"]];
const WO_DEV="Logicnova";
function woAdd(d,n){ return ppIsDate(d)?ppAdd(d,n):""; }
function woStartAmt(w){ const f=Number(w.fee)||0; return w.pay!=="one"&&f>=1000?Math.round(f*0.3*100)/100:0; }
/* what Evolve owes on it, and the latest day each part is due */
function woOwed(w){
  const out=[], f=Number(w.fee)||0, st=woStartAmt(w);
  if(st&&ppIsDate(w.accepted_on)&&!ppIsDate(w.start_paid_on))out.push({d:woAdd(w.accepted_on,7),amt:st,part:"start"});
  if(ppIsDate(w.invoiced_on)&&!ppIsDate(w.balance_paid_on))out.push({d:woAdd(w.invoiced_on,30),amt:Math.max(0,f-st),part:"balance"});
  return out;
}
/* where it stands, as one line, and how hot */
function woNext(w){
  const today=ppToday();
  if(!ppIsDate(w.accepted_on))return {t:"Not accepted by both yet",hot:false};
  const st=woStartAmt(w);
  if(st&&!ppIsDate(w.start_paid_on))return {t:"Start payment "+USD(st)+" due by "+ppFmt(woAdd(w.accepted_on,7)),hot:woAdd(w.accepted_on,7)<=ppAdd(today,2)};
  if(ppIsDate(w.delivered_on)&&!ppIsDate(w.work_ok_on)){
    const by=woAdd(w.delivered_on,w.redelivery?7:14);
    return {t:"Your review is due by "+ppFmt(by),hot:by<=ppAdd(today,3),by:by};
  }
  if(!ppIsDate(w.build_on))return {t:"Build not started",hot:false};
  if(!ppIsDate(w.delivered_on))return {t:ppIsDate(w.final_due)?"Final delivery due "+ppFmt(w.final_due):"Building",hot:false};
  const owe=woOwed(w).filter(x=>x.part==="balance")[0];
  if(owe)return {t:"Balance "+USD(owe.amt)+" due by "+ppFmt(owe.d),hot:owe.d<=ppAdd(today,3)};
  if(!ppIsDate(w.launched_on))return {t:"Accepted, ready to launch",hot:false};
  const a=w.launched_on, b=woAdd(w.work_ok_on,60), from=ppIsDate(b)&&b<a?b:a;
  return {t:"Warranty to "+ppFmt(woAdd(from,45)),hot:false};
}
function woEdit(w){
  const isNew=!w, n=(S.wos||[]).length+1;
  const cur=w||{no:"WO-"+String(n).padStart(3,"0"),dev:WO_DEV,pay:"start"};
  const D=(k,l)=>({k:k,label:l+" (YYYY-MM-DD)",value:cur[k]||""});
  prompt2(isNew?"Add a Work Order":cur.no,[
    {k:"no",label:"Work Order number",value:cur.no||""},
    {k:"project",label:"Which project",value:cur.project||"",options:projOpts()},
    {k:"dev",label:"Developer",value:cur.dev||WO_DEV},
    {k:"fee",label:"Project Fee in dollars",value:cur.fee?String(cur.fee):""},
    {k:"pay",label:"Payment schedule",value:cur.pay||"start",options:WO_PAY},
    D("accepted_on","Accepted by both on"),
    D("start_paid_on","Start payment sent on"),
    D("build_on","Build started on"),
    D("final_due","Final delivery due"),
    D("delivered_on","Last delivered for review on"),
    {k:"redelivery",label:"Was that a redelivery after fixes",value:cur.redelivery?"yes":"no",options:[["no","No, a first delivery"],["yes","Yes, a redelivery"]]},
    D("work_ok_on","You accepted it on"),
    D("invoiced_on","Their invoice came on"),
    D("balance_paid_on","Balance paid on"),
    D("launched_on","Launched on")
  ],v=>{
    const fee=normValue(v.fee);
    if(!v.no||!fee){say("Nothing saved. It needs a number and a fee.");return;}
    const id=(w&&w.id)||newId("wo"), now=new Date().toISOString();
    const row={no:String(v.no).slice(0,30),project:v.project||"",dev:String(v.dev||WO_DEV).slice(0,60),
      fee:fee,pay:v.pay==="one"?"one":"start",redelivery:v.redelivery==="yes",
      created_at:(w&&w.created_at)||now,updated_at:now,schema_version:SCHEMA_VERSION};
    const bad=[];
    ["accepted_on","start_paid_on","build_on","final_due","delivered_on","work_ok_on","invoiced_on","balance_paid_on","launched_on"].forEach(k=>{
      const x=String(v[k]||"").trim(); if(x&&!ppIsDate(x))bad.push(k); row[k]=ppIsDate(x)?x:""; });
    const was=(S.wos||[]).slice();
    S.wos=(S.wos||[]).filter(x=>x.id!==id).concat([Object.assign({id:id},row)]);
    paint();
    dbSetCritical("workorders/"+id,row,()=>{S.wos=was;});
    if(bad.length)say("Saved. "+plur(bad.length,"date")+" did not read as YYYY-MM-DD and were left blank.",true);
  });
}
function woDelete(w){
  confirm2("Delete "+w.no+"?","It goes to the bin in Settings for "+BIN_DAYS+" days.",()=>{
    S.wos=(S.wos||[]).filter(x=>x.id!==w.id);
    binDel("workorders/"+w.id,w,w.no,"work order",null,()=>{S.wos=(S.wos||[]).concat([w]);}).then(binSaid);
  });
}
function woRows(list){
  const box=e("div",{class:"rows plrows worows"});
  if(!list.length){box.appendChild(e("div",{class:"void",text:"No Work Orders yet. Add one when "+WO_DEV+" takes on a build."}));return box;}
  const ps=coProjects(view());
  list.slice().sort((a,b)=>String(b.accepted_on||b.created_at).localeCompare(String(a.accepted_on||a.created_at))).forEach(w=>{
    const nx=woNext(w), p=ps.filter(x=>x.slug===w.project)[0];
    const rw=e("div",{class:"rw clk",tabindex:"0",role:"button",onclick:()=>woEdit(w),
      onkeydown:ev=>{if(ev.key==="Enter"){ev.preventDefault();woEdit(w);}}});
    rw.appendChild(e("div",{class:"g"},[e("div",{class:"nm",text:w.no+(p?"  ·  "+p.name:"")}),
      e("div",{class:"sb",text:(w.dev||WO_DEV)+"  ·  "+USD(Number(w.fee)||0)})]));
    rw.appendChild(e("span",{class:"when"+(nx.hot?" hot":""),text:nx.t}));
    rw.appendChild(e("button",{class:"b s",text:"Delete",onclick:ev=>{ev.stopPropagation();woDelete(w);}}));
    box.appendChild(rw);});
  return box;
}
function woPanel(){
  const pn=e("div",{class:"pan",style:"margin:0 0 18px"});
  pn.appendChild(e("div",{class:"ph"},[
    e("div",{class:"g"},[e("h3",{text:"With "+WO_DEV}),
      e("div",{class:"sub",text:"Work Orders, what is due from you and when"})]),
    e("div",{class:"rt"},[e("button",{class:"b s",text:"Add a Work Order",onclick:()=>woEdit(null)})])]));
  pn.appendChild(woRows(S.wos||[]));
  return pn;
}
'''
R=[
('function modeDeliver(){', CORE+'function modeDeliver(){'),
('''  box.appendChild(viewBar("deliverables"));''','''  box.appendChild(woPanel());
  box.appendChild(viewBar("deliverables"));'''),
# records
('''  db.collection("costs").onSnapshot(s=>{''','''  db.collection("workorders").onSnapshot(s=>{
    S.wos=s.docs.map(d=>Object.assign({id:d.id},d.data()));repaint();},e=>{feedErr("workorders",e);});
  db.collection("costs").onSnapshot(s=>{'''),
# the money out goes into the plan's walk
('''  (S.costs||[]).forEach(c=>costHits(c,t0,t1).forEach(h=>(outs[h.d]=outs[h.d]||[]).push(h)));
  let bal=cfg.cash===null?0:cfg.cash, low=bal, lowAt=today, under=null;''',
 '''  (S.costs||[]).forEach(c=>costHits(c,t0,t1).forEach(h=>(outs[h.d]=outs[h.d]||[]).push(h)));
  /* V147. what is owed to the developer, on the latest day the agreement allows,
     and anything already past that day lands today */
  (S.wos||[]).forEach(w=>woOwed(w).forEach(o=>{ const d=o.d<today?today:o.d;
    if(d<=end)(outs[d]=outs[d]||[]).push({d:d,amt:o.amt,c:{name:w.no+" "+(w.dev||WO_DEV),kind:"dev"},w:w}); }));
  let bal=cfg.cash===null?0:cfg.cash, low=bal, lowAt=today, under=null;'''),
# and onto the payment calendar
('''  (S.costs||[]).forEach(c=>costHits(c,m0,last).forEach(h=>(outs[h.d]=outs[h.d]||[]).push(h)));
  const grid=e("div",{class:"pcal"});''',
 '''  (S.costs||[]).forEach(c=>costHits(c,m0,last).forEach(h=>(outs[h.d]=outs[h.d]||[]).push(h)));
  (S.wos||[]).forEach(w=>woOwed(w).forEach(o=>{ const d=dparse(o.d);
    if(d&&d.getMonth()===m0.getMonth()&&d.getFullYear()===m0.getFullYear())(outs[o.d]=outs[o.d]||[]).push({d:o.d,amt:o.amt,c:{name:w.no+" "+(w.dev||WO_DEV),kind:"dev"},w:w}); }));
  const grid=e("div",{class:"pcal"});'''),
('''    (outs[k]||[]).forEach(x=>{tout+=x.amt; cell.appendChild(e("button",{class:"pout"+(x.c.kind==="personal"?" me":""),
      title:x.c.name+": "+USD(x.amt),onclick:()=>costEdit(x.c),text:"-"+amtShort(x.amt)}));});''',
 '''    (outs[k]||[]).forEach(x=>{tout+=x.amt; cell.appendChild(e("button",{class:"pout"+(x.c.kind==="personal"?" me":x.c.kind==="dev"?" dev":""),
      title:x.c.name+": "+USD(x.amt),onclick:()=>x.w?woEdit(x.w):costEdit(x.c),text:"-"+amtShort(x.amt)}));});'''),
('''e("i",{class:"pout"})," business  ",e("i",{class:"pout me"})," personal"])]));''',
 '''e("i",{class:"pout"})," business  ",e("i",{class:"pout me"})," personal  ",e("i",{class:"pout dev"})," "+WO_DEV])]));'''),
('''.pout.me{background:var(--acc-soft);color:var(--acc)}''','''.pout.me{background:var(--acc-soft);color:var(--acc)}
.pout.dev{background:color-mix(in srgb,var(--info) 22%,transparent);color:var(--info)}
.worows .rw .g{flex:1 1 160px;min-width:0}
@media (max-width:760px){ .worows .rw .when{flex-basis:calc(100% - 90px)} }'''),
# Needs You: a review window closing
('''  /* A fixed thing today that Evolve cannot place. Asked once for that''',
 '''  /* V147. a delivery from the developer waiting on his review. After the window
     and a reminder plus 5 days it counts as accepted (agreement 4.8). */
  (S.wos||[]).forEach(w=>{
    const nx=woNext(w); if(!nx.by)return;
    const left=daysTo(nx.by); if(left===null||left>5)return;
    push({id:"wo-"+w.id,rank:3.2,cat:"approval",slug:w.project||null,
      who:(w.dev||WO_DEV).toUpperCase(),
      cond:w.no+": your review is due by "+ppFmt(nx.by),
      conseq:"After that they can send a reminder, and 5 days later it counts as accepted.",
      age:null,verb:["Open it",()=>woEdit(w)]});
  });

  /* A fixed thing today that Evolve cannot place. Asked once for that'''),
('const BUILD="V146 2026-10-09T09:00Z";','const BUILD="V147 2026-10-09T11:00Z";'),
]
assert 'function woEdit' not in s
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
