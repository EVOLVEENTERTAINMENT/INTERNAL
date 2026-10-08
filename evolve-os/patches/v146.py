import sys
s=open(sys.argv[1]).read()
CORE=r'''/* ==========================================================================
   V146. What it costs to run, what is coming in, and when the next project
   has to land. Costs are his own records (costs/<id>), business or personal,
   each on its own day. Coming in is open invoices by due date, less what is
   already paid. Nothing is guessed: a draft is not coming in, a late invoice
   is shown but not counted, and with no cash on hand entered the walk starts
   from zero and says so.
   ========================================================================== */
const COST_EVERY=[["month","Every month"],["year","Every year"],["week","Every week"]];
const COST_KIND=[["business","Business"],["personal","Personal"]];
function costMonthly(c){
  const a=Number(c&&c.amount)||0;
  return c.every==="year"?a/12:c.every==="week"?a*52/12:a;
}
/* every day a cost goes out between two dates, inclusive */
function costHits(c,from,to){
  const out=[], a=Number(c&&c.amount)||0; if(!a)return out;
  for(let d=new Date(from);d<=to;d=plus(d,1)){
    const dom=d.getDate(), last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
    const day=Math.min(Math.max(1,parseInt(c.day,10)||1),31);
    let hit=false;
    if(c.every==="week")hit=((d.getDay()+6)%7)+1===Math.min(Math.max(1,parseInt(c.day,10)||1),7);
    else if(c.every==="year")hit=(d.getMonth()+1)===(parseInt(c.month,10)||1)&&dom===Math.min(day,last);
    else hit=dom===Math.min(day,last);
    if(hit)out.push({d:dk(d),amt:a,c:c});
  }
  return out;
}
/* what is still to come in on an invoice, and on which day */
function inflowOf(r){
  if(!r||!isOut(r)||isPaid(r))return null;
  const rest=Math.max(0,(Number(r.amount)||0)-paidAmount(r));
  if(!rest||!ppIsDate(r.due))return null;
  return {d:r.due,amt:rest,r:r};
}
function planCfg(){ const p=prefs(); return {avg:Number(p.plan_avg)||0,win:Number(p.plan_win)||0,
  cash:p.plan_cash===undefined||p.plan_cash===""||p.plan_cash===null?null:Number(p.plan_cash),cash_at:p.plan_cash_at||""}; }
/* the real cold win rate once five cold leads have closed, else his guess */
function coldRate(){
  let won=0,lost=0;
  Object.keys(S.pipe||{}).forEach(k=>{const o=S.pipe[k]||{};
    if(!/cold/i.test(String(o.source||"")))return;
    if(isWon(o))won++; else if(stageKey(o.stage)==="lost")lost++;});
  if(won+lost>=5)return {pct:won/(won+lost)*100,real:true,n:won+lost};
  const g=planCfg().win; return g>0?{pct:g,real:false,n:won+lost}:null;
}
/* day by day for 90 days from today: the lowest point, and the first day under */
function planWalk(days){
  const cfg=planCfg(), t0=mid(new Date()), t1=plus(t0,(days||90)-1), today=dk(t0), end=dk(t1);
  const ins={}, outs={};
  (S.inv||[]).forEach(r=>{const f=inflowOf(r); if(f&&f.d>=today&&f.d<=end)(ins[f.d]=ins[f.d]||[]).push(f);});
  (S.costs||[]).forEach(c=>costHits(c,t0,t1).forEach(h=>(outs[h.d]=outs[h.d]||[]).push(h)));
  let bal=cfg.cash===null?0:cfg.cash, low=bal, lowAt=today, under=null;
  for(let d=new Date(t0);d<=t1;d=plus(d,1)){
    const k=dk(d);
    (ins[k]||[]).forEach(x=>{bal+=x.amt;});
    (outs[k]||[]).forEach(x=>{bal-=x.amt;});
    if(bal<low){low=bal;lowAt=k;}
    if(bal<0&&!under)under=k;
  }
  let late=0; (S.inv||[]).forEach(r=>{const f=inflowOf(r); if(f&&f.d<today)late+=f.amt;});
  return {ins:ins,outs:outs,under:under,low:low,lowAt:lowAt,end:bal,late:late,cashSet:cfg.cash!==null,from:today,to:end};
}
function planNeed(){
  const w=planWalk(90), cfg=planCfg(), rate=coldRate();
  const gap=w.low<0?-w.low:0;
  const proj=gap&&cfg.avg?Math.ceil(gap/cfg.avg):null;
  let weeks=null,winsWk=null,reachWk=null;
  if(proj&&w.under){
    weeks=Math.max(1,Math.ceil((dparse(w.under)-mid(new Date()))/(7*86400000)));
    winsWk=proj/weeks;
    if(rate&&rate.pct>0)reachWk=Math.ceil(winsWk/(rate.pct/100));
  }
  let bus=0,per=0; (S.costs||[]).forEach(c=>{ if(c.kind==="personal")per+=costMonthly(c); else bus+=costMonthly(c); });
  return {walk:w,cfg:cfg,rate:rate,gap:gap,proj:proj,weeks:weeks,winsWk:winsWk,reachWk:reachWk,bus:bus,per:per};
}
function costEdit(c){
  const isNew=!c, cur=c||{name:"",amount:"",kind:"business",every:"month",day:"1",month:"1"};
  prompt2(isNew?"Add a cost":cur.name,[
    {k:"name",label:"What it is",value:cur.name||"",placeholder:"Rent"},
    {k:"amount",label:"Amount in dollars",value:cur.amount?String(cur.amount):"",placeholder:"1200"},
    {k:"kind",label:"Business or personal",value:cur.kind||"business",options:COST_KIND},
    {k:"every",label:"How often",value:cur.every||"month",options:COST_EVERY},
    {k:"day",label:"Which day it goes out (1 to 31, or 1 to 7 for Monday to Sunday)",value:String(cur.day||"1")},
    {k:"month",label:"Which month, for a yearly one (1 to 12)",value:String(cur.month||"1")}
  ],v=>{
    const amt=normValue(v.amount);
    if(!v.name||!amt){say("Nothing saved. It needs a name and an amount.");return;}
    const id=(c&&c.id)||newId("cost"), now=new Date().toISOString();
    const row={name:String(v.name).slice(0,80),amount:amt,
      kind:v.kind==="personal"?"personal":"business",
      every:["month","year","week"].indexOf(v.every)>=0?v.every:"month",
      day:String(parseInt(v.day,10)||1),month:String(parseInt(v.month,10)||1),
      created_at:(c&&c.created_at)||now,updated_at:now,schema_version:SCHEMA_VERSION};
    const was=(S.costs||[]).slice();
    S.costs=(S.costs||[]).filter(x=>x.id!==id).concat([Object.assign({id:id},row)]);
    paint();
    dbSetCritical("costs/"+id,row,()=>{S.costs=was;});
  });
}
function costDelete(c){
  confirm2("Delete "+c.name+"?","It goes to the bin in Settings for "+BIN_DAYS+" days.",()=>{
    S.costs=(S.costs||[]).filter(x=>x.id!==c.id);
    binDel("costs/"+c.id,c,c.name,"cost",null,()=>{S.costs=(S.costs||[]).concat([c]);}).then(binSaid);
  });
}
function planEdit(){
  const cfg=planCfg();
  prompt2("The numbers the plan runs on",[
    {k:"avg",label:"Your average project, in dollars",value:cfg.avg?String(cfg.avg):"",placeholder:"2900"},
    {k:"win",label:"Out of 100 businesses you reach cold, how many say yes (your guess)",value:cfg.win?String(cfg.win):"",placeholder:"5"},
    {k:"cash",label:"Cash on hand today, blank to start from zero",value:cfg.cash===null?"":String(cfg.cash)}
  ],v=>{
    const cash=String(v.cash||"").trim()===""?"":normValue(v.cash);
    prefsSave({plan_avg:normValue(v.avg)||0,plan_win:Math.max(0,Math.min(100,parseFloat(v.win)||0)),
      plan_cash:cash===null?"":cash,plan_cash_at:cash===""?"":dk(new Date())});
  });
}
/* $2,400 as $2.4k, so a day on a phone still shows the amount */
function amtShort(n){ n=Math.round(Number(n)||0);
  return n>=1000?"$"+(n%1000?(n/1000).toFixed(1):String(n/1000))+"k":"$"+n; }
/* the payment calendar: one month, money in and money out on their days */
function payCal(off){
  const base=new Date(); const m0=new Date(base.getFullYear(),base.getMonth()+(off||0),1);
  const last=new Date(m0.getFullYear(),m0.getMonth()+1,0);
  const ins={}, outs={};
  (S.inv||[]).forEach(r=>{const f=inflowOf(r); if(f){const d=dparse(f.d); if(d&&d>=m0&&d<=plus(last,0)&&d.getMonth()===m0.getMonth())(ins[f.d]=ins[f.d]||[]).push(f);}});
  (S.inv||[]).forEach(r=>{ if(isVoid(r))return; (r.payments||[]).forEach(p=>{const d=dparse(String(p.on||"").slice(0,10));
    if(d&&d.getMonth()===m0.getMonth()&&d.getFullYear()===m0.getFullYear()){const k=dk(d);(ins[k]=ins[k]||[]).push({d:k,amt:Number(p.amount)||0,r:r,got:true});}});});
  (S.costs||[]).forEach(c=>costHits(c,m0,last).forEach(h=>(outs[h.d]=outs[h.d]||[]).push(h)));
  const grid=e("div",{class:"pcal"});
  ["M","T","W","T","F","S","S"].forEach(x=>grid.appendChild(e("span",{class:"pcd h",text:x})));
  const lead=(m0.getDay()+6)%7; for(let i=0;i<lead;i++)grid.appendChild(e("span",{class:"pcd x"}));
  const today=dk(new Date()); let tin=0,tout=0;
  for(let d=new Date(m0);d<=last;d=plus(d,1)){
    const k=dk(d), cell=e("div",{class:"pcd"+(k===today?" on":"")+(k<today?" past":"")});
    cell.appendChild(e("b",{text:String(d.getDate())}));
    (ins[k]||[]).forEach(x=>{tin+=x.amt; cell.appendChild(e("button",{class:"pin"+(x.got?" got":""),
      title:(x.got?"Paid":"Due")+": "+USD(x.amt)+" from "+(x.r.client||"a client"),
      onclick:()=>invEdit(x.r),text:"+"+amtShort(x.amt)}));});
    (outs[k]||[]).forEach(x=>{tout+=x.amt; cell.appendChild(e("button",{class:"pout"+(x.c.kind==="personal"?" me":""),
      title:x.c.name+": "+USD(x.amt),onclick:()=>costEdit(x.c),text:"-"+amtShort(x.amt)}));});
    grid.appendChild(cell);
  }
  return {grid:grid,tin:tin,tout:tout,title:new Intl.DateTimeFormat("en-US",{month:"long",year:"numeric"}).format(m0)};
}
function planPanel(){
  const P=planNeed(), w=P.walk, cfg=P.cfg;
  const pn=e("div",{class:"pan",style:"margin:18px 0"});
  pn.appendChild(e("div",{class:"ph"},[
    e("div",{class:"g"},[e("h3",{text:"When the next project has to land"}),
      e("div",{class:"sub",text:"the next 90 days, from your costs and open invoices"})]),
    e("div",{class:"rt"},[e("button",{class:"b s",text:"Set the numbers",onclick:planEdit})])]));
  const rows=e("div",{class:"rows plrows"});
  const line=(k,v,hot)=>{const rw=e("div",{class:"rw"});
    rw.appendChild(e("div",{class:"g"},[e("div",{class:"nm",text:k})]));
    rw.appendChild(e("span",{class:"when"+(hot?" hot":""),text:v})); rows.appendChild(rw);};
  if(!(S.costs||[]).length){
    rows.appendChild(e("div",{class:"void",text:"Add what it costs to run, business and personal, and this works out when the next project has to land."}));
  }else{
    line("It costs to run",USD(Math.round(P.bus+P.per))+" a month"+(P.per?"  ·  "+USD(Math.round(P.bus))+" business, "+USD(Math.round(P.per))+" personal":""));
    if(!w.under)line("Covered",w.cashSet?"for the next 90 days":"for the next 90 days, counting from zero cash");
    else{
      line("Short from",ppFmt(w.under)+", by "+USD(Math.round(P.gap))+" at the lowest",true);
      line("Land",P.proj?plur(P.proj,"project")+" by "+ppFmt(w.under):"set your average project to see how many",!!P.proj);
      if(P.winsWk!==null)line("That is",plur(P.proj,"win")+" in the next "+plur(P.weeks,"week")
        +(P.reachWk?", about "+P.reachWk+" businesses reached a week":""));
      if(P.proj&&!P.rate)line("Reach outs","set your cold win rate guess to see how many");
    }
    if(P.rate)line("Cold win rate",Math.round(P.rate.pct*10)/10+"%  ·  "+(P.rate.real?"from "+P.rate.n+" cold leads closed":"your guess, until 5 cold leads have closed"));
    if(w.late)line("Not counted",USD(w.late)+" on late invoices");
    if(!w.cashSet)line("Cash on hand","not entered, so this starts from zero");
  }
  pn.appendChild(rows);

  // the calendar, this month and the next two
  const S2=S.payOff||0;
  const cal=payCal(S2);
  const cw=e("div",{class:"pcalw"});
  cw.appendChild(e("div",{class:"pcalh"},[
    e("button",{class:"b s",text:"◀","aria-label":"Previous month",disabled:S2<=-1?"":null,onclick:()=>{S.payOff=Math.max(-1,S2-1);paint();}}),
    e("b",{text:cal.title}),
    e("button",{class:"b s",text:"▶","aria-label":"Next month",disabled:S2>=5?"":null,onclick:()=>{S.payOff=Math.min(5,S2+1);paint();}}),
    e("span",{class:"sp"}),
    e("span",{class:"pk"},[e("i",{class:"pin"})," coming in  ",e("i",{class:"pout"})," business  ",e("i",{class:"pout me"})," personal"])]));
  cw.appendChild(cal.grid);
  cw.appendChild(e("div",{class:"note",text:USD(Math.round(cal.tin))+" in, "+USD(Math.round(cal.tout))+" out this month."}));
  pn.appendChild(cw);

  // the costs themselves, their own panel
  const cp=e("div",{class:"pan",style:"margin:0 0 18px"});
  cp.appendChild(e("div",{class:"ph"},[e("div",{class:"g"},[e("h3",{text:"What it costs to run"}),
    e("div",{class:"sub",text:"business and personal, each on its day"})]),
    e("div",{class:"rt"},[e("button",{class:"b s",text:"Add a cost",onclick:()=>costEdit(null)})])]));
  const cl=e("div",{class:"rows"});
  if(!(S.costs||[]).length)cl.appendChild(e("div",{class:"void",text:"Nothing added yet."}));
  (S.costs||[]).slice().sort((a,b)=>(a.kind===b.kind?0:a.kind==="business"?-1:1)||costMonthly(b)-costMonthly(a)).forEach(c=>{
    const rw=e("div",{class:"rw"});
    rw.appendChild(e("div",{class:"g"},[e("div",{class:"nm",text:c.name}),
      e("div",{class:"sb",text:(c.kind==="personal"?"Personal":"Business")+"  ·  "
        +(c.every==="year"?"every year":c.every==="week"?"every week":"every month, day "+c.day)})]));
    rw.appendChild(e("span",{class:"when",text:USD(Number(c.amount)||0)}));
    rw.appendChild(e("button",{class:"b s",text:"Edit",onclick:()=>costEdit(c)}));
    rw.appendChild(e("button",{class:"b s",text:"Delete",onclick:()=>costDelete(c)}));
    cl.appendChild(rw);});
  cp.appendChild(cl);
  return e("div",{},[pn,cp]);
}
'''
R=[
('function modeMoney(){', CORE+'function modeMoney(){'),
('''  box.appendChild(k);
  box.appendChild(viewBar("invoices"));''','''  box.appendChild(k);
  box.appendChild(planPanel());
  box.appendChild(viewBar("invoices"));'''),
('''  db.collection("bin").onSnapshot(s=>{''','''  db.collection("costs").onSnapshot(s=>{
    S.costs=s.docs.map(d=>Object.assign({id:d.id},d.data()));repaint();},e=>{feedErr("costs",e);});
  db.collection("bin").onSnapshot(s=>{'''),
('''.ccard .crows{display:flex;flex-direction:column}''','''.ccard .crows{display:flex;flex-direction:column}
.pcalw{margin-top:14px}
.pcalh{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.pcalh b{font-family:var(--disp);font-size:13px;font-weight:650;color:var(--fg)}
.pcalh .sp{flex:1 1 auto}
.pk{font-size:10.5px;color:var(--fg3);display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap}
.pk i{display:inline-block;width:10px;height:6px;border-radius:2px;padding:0}
.pcal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}
.pcd{min-height:58px;border-radius:6px;background:var(--s2);padding:4px;display:flex;flex-direction:column;gap:2px;min-width:0;overflow:hidden}
.pcd.h{min-height:0;background:none;font-size:9.5px;font-weight:700;color:var(--fg4);text-align:center;padding:0}
.pcd.x{background:none}
.pcd.past{opacity:.55}
.pcd.on{box-shadow:inset 0 0 0 1.5px var(--acc)}
.pcd b{font-size:10px;font-weight:600;color:var(--fg3)}
.pin,.pout{display:block;border:0;border-radius:3px;font:600 9.5px/1.5 var(--mono,inherit);padding:0 3px;text-align:left;cursor:pointer;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.pin{background:color-mix(in srgb,var(--ok) 22%,transparent);color:var(--ok)}
.pin.got{opacity:.6}
.pout{background:var(--s4);color:var(--fg2)}
.pout.me{background:var(--acc-soft);color:var(--acc)}
.rows .when.hot{color:var(--acc)}
.plrows .rw{flex-wrap:wrap;gap:2px 12px}
.plrows .rw .g{flex:0 0 auto}
.plrows .rw .when{white-space:normal;flex:1 1 220px;text-align:right}
@media (max-width:760px){ .plrows .rw .when{text-align:left;flex-basis:100%} }'''),
# Home: the plan in one strip, which opens Money
('''  box.appendChild(hd);
  const now=new Date(), key=dk(today);''',
 '''  box.appendChild(hd);
  { const ps=planStrip(); if(ps)box.appendChild(ps); }
  const now=new Date(), key=dk(today);'''),
('''function planPanel(){''','''/* Home's one line: this week's pace, and the next money due in */
function planStrip(){
  if(!(S.costs||[]).length)return null;
  const P=planNeed(), w=P.walk, bits=[];
  if(!w.under)bits.push(["Covered","for the next 90 days"]);
  else{
    bits.push(["This week",P.reachWk?"reach "+P.reachWk+" businesses":P.proj?"land "+plur(P.proj,"project")+" by "+ppFmt(w.under):"short from "+ppFmt(w.under)]);
    if(P.proj&&P.reachWk)bits.push(["Land",plur(P.proj,"project")+" by "+ppFmt(w.under)]);
  }
  const days=Object.keys(w.ins).sort(); const nx=days.length?w.ins[days[0]][0]:null;
  if(nx)bits.push(["Next in",USD(Math.round(nx.amt))+(nx.r.client?" from "+nx.r.client:"")+", "+ppFmt(nx.d)]);
  return e("button",{class:"planstrip"+(w.under?" hot":""),type:"button",title:"Open the plan on Money",
    onclick:()=>{S.room=null;S.mode="money";paint();}},
    bits.map(b=>e("span",{},[e("b",{text:b[0]})," "+b[1]])));
}
function planPanel(){'''),
('''.plrows .rw{flex-wrap:wrap;gap:2px 12px}''','''.planstrip{display:flex;flex-wrap:wrap;gap:4px 18px;width:100%;margin:12px 0 4px;padding:11px 14px;
  border:1px solid var(--hair);border-radius:var(--rs,10px);background:var(--s1);color:var(--fg2);font:inherit;font-size:12.5px;text-align:left;cursor:pointer}
.planstrip b{font-weight:650;color:var(--fg)}
.planstrip.hot{border-color:var(--acc-line,var(--acc))}
.planstrip:hover{background:var(--s2)}
.planstrip:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.plrows .rw{flex-wrap:wrap;gap:2px 12px}'''),
('const BUILD="V145 2026-10-09T07:00Z";','const BUILD="V146 2026-10-09T09:00Z";'),
]
assert 'function planPanel' not in s
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
