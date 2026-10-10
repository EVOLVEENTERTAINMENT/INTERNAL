/* Money Engine plan REV2, B10 acceptance tests, run against the ME block. */
const ME=require(process.argv[2]||"./me.js");
let pass=0, fail=0;
const ok=(n,c,msg)=>{ if(c){pass++;console.log("PASS "+n);} else {fail++;console.log("FAIL "+n+"  "+(msg||""));} };
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const RULES=[{max:999.99,shares:[100]},{min:1000,max:5000,shares:[50,50]},{min:5000.01,shares:[50,25,25]},{kind:"wedding",shares:[30,40,30]}];
const F1=()=>({today:"2026-10-08",horizon_days:91,cash:{amount:1500,at:"2026-10-08"},
  settings:{floor:0,setaside_pct:0,deposit_rules:RULES},
  costs:[{id:"rent",name:"Rent",amount:1200,every:"month",day:1,kind:"personal"},
         {id:"sw",name:"Software",amount:300,every:"month",day:15,kind:"business"}],
  income:[],invoices:[],payplan:[],milestones:[],dates:[],pipeline:[],funnel_events:[],funnel_cfg:null});
const inv=(o)=>Object.assign({id:"i"+Math.random().toString(36).slice(2,6),state:"sent",client:"A"},o);
const balOn=(w,d)=>{ // replay the walk to a day
  let b=w.cash||0; for(let k=w.from;k<=d;k=ME.add(k,1)){(w.ins[k]||[]).forEach(x=>{b+=x.amt;});(w.outs[k]||[]).forEach(x=>{b-=x.amt;});} return b; };

// 1
{ const w=ME.walk(F1()); ok(1,w.short_on==="2026-11-15"&&w.low===-3000&&w.low_on==="2027-01-01"&&balOn(w,"2026-11-01")===0,JSON.stringify([w.short_on,w.low,w.low_on,balOn(w,"2026-11-01")])); }
// 2
{ const i=F1(); i.invoices=[inv({amount:2900,due:"2026-11-10"})]; const w=ME.walk(i);
  ok(2,w.short_on==="2027-01-01"&&w.low===-100,JSON.stringify([w.short_on,w.low])); }
// 3
{ const i=F1(); i.milestones=[{id:"m1",date:"2026-11-16"}];
  i.payplan=[{id:"p1",dir:"in",amount:1450,basis:"date",date:"2026-10-15",state:"scheduled",confirmed:true},
             {id:"p2",dir:"in",amount:1450,basis:"milestone",milestone:"m1",state:"scheduled",confirmed:true}];
  const w=ME.walk(i); const a=w.short_on==="2027-01-01"&&w.low===-100;
  i.milestones[0].date="2026-11-30"; const w2=ME.walk(i);
  let same=true; Object.keys(Object.assign({},w.ins,w2.ins)).forEach(d=>{ if(d==="2026-11-16"||d==="2026-11-30")return; if(!eq(w.ins[d],w2.ins[d]))same=false; });
  ok(3,a&&w2.ins["2026-11-30"]&&w2.ins["2026-11-30"][0].amt===1450&&!w2.ins["2026-11-16"]&&same,JSON.stringify([w.short_on,w.low])); }
// 4
{ const i=F1(); i.settings.setaside_pct=25; i.invoices=[inv({amount:2900,due:"2026-11-10"})]; const w=ME.walk(i);
  ok(4,w.short_on==="2027-01-01"&&w.low===-825&&w.set_aside_total===725,JSON.stringify([w.short_on,w.low,w.set_aside_total])); }
// 5
const F5=()=>{ const i=F1(); Object.assign(i.settings,{avg_price:2900,avg_direct_cost:0,dep_lag_days:3,turnaround_days:28,cycle_days:21}); return i; };
{ const i=F5(); const r=ME.winsNeeded(i);
  const W=r.wins||[];
  ok(5,W.length===2&&W[0].sign_by==="2026-11-12"&&W[0].start_by==="2026-10-22"&&W[1].sign_by==="2026-11-28"&&W[1].start_by==="2026-11-07"
    &&!r.after.short_on&&balOn(r.after,"2027-01-01")===2800,JSON.stringify(W)+" "+r.after.short_on+" "+balOn(r.after,"2027-01-01")); }
// 6
{ const i=F5(); i.today="2026-11-01"; i.cash={amount:0,at:"2026-11-01"}; const o=ME.run(i);
  ok(6,o.wins[0].late_for_cold===true&&eq(o.levers,[]),JSON.stringify([o.wins[0],o.levers])); }
// 7 and 8
const FUN=(m)=>({lanes:{"cold-web":{stages:[
  {k:"reached",rate_guess:0.25,lag_days_guess:3,mins_each:m?6:0},
  {k:"replied",rate_guess:0.4,lag_days_guess:3,mins_each:0},
  {k:"mock",rate_guess:0.5,lag_days_guess:5,mins_each:m?45:0},
  {k:"price",rate_guess:0.4,lag_days_guess:10,mins_each:0},
  {k:"won"}]}}});
{ const i=F5(); i.funnel_cfg=FUN(false); const o=ME.run(i);
  ok(7,o.funnel.R===0.02&&o.quota.reach_week===25&&o.flags.indexOf("guess_rates")>=0&&Array.isArray(o.funnel.range),JSON.stringify([o.funnel.R,o.quota,o.funnel.range])); }
{ const i=F5(); i.funnel_cfg=FUN(true); i.sales_block_mins_this_week=180; const o=ME.run(i);
  ok(8,o.quota.by_stage.mock===3&&o.quota.selling_mins===285&&o.quota.fits===false,JSON.stringify(o.quota)); }
// 9
{ const i=F1(); i.invoices=[inv({amount:999,due:"2026-11-10",state:"draft"}),inv({amount:999,due:"2026-11-10",state:"void"})];
  i.pipeline=[{id:"o1",value:5500,source:"warm"}];
  const a=ME.walk(F1()), b=ME.walk(i);
  ok(9,a.short_on===b.short_on&&a.low===b.low&&a.end===b.end&&eq(a.weeks,b.weeks)); }
// 10
{ const i=F1(); i.invoices=[inv({id:"old",amount:500,due:"2026-10-01"})]; const w=ME.walk(i), b=ME.walk(F1());
  ok(10,w.late.length===1&&w.late[0].amt===500&&w.end===b.end); }
// 11
{ const i=F1(); i.invoices=[inv({amount:1000,due:"2026-10-20",payments:[{amount:400,on:"2026-10-05"}]})]; const w=ME.walk(i);
  ok(11,w.ins["2026-10-20"]&&w.ins["2026-10-20"][0].amt===600); }
// 12
{ const i=F1(); i.payplan=[{id:"p",dir:"in",amount:700,basis:"milestone",milestone:"mx",state:"scheduled",confirmed:true}];
  i.milestones=[{id:"mx",date:""}]; const w=ME.walk(i), b=ME.walk(F1());
  ok(12,w.undated.length===1&&w.end===b.end); }
// 13
{ const i=F1(); i.invoices=[inv({id:"iv",amount:800,due:"2026-10-20"})];
  i.payplan=[{id:"p",dir:"in",amount:800,basis:"date",date:"2026-10-20",state:"invoiced",invoice:"iv",confirmed:true}];
  const w=ME.walk(i); ok(13,w.ins["2026-10-20"].length===1&&w.ins["2026-10-20"][0].amt===800); }
// 14
{ const i=F1(); i.payplan=[{id:"p",dir:"in",amount:800,basis:"date",date:"2026-10-20",state:"scheduled",confirmed:false}];
  const w=ME.walk(i); ok(14,!w.ins["2026-10-20"]); }
// 15
{ const i=F1(); i.cash={amount:1500,at:"2026-09-25"}; const w=ME.walk(i); ok(15,w.cash_stale===true&&w.flags.indexOf("cash_stale")>=0); }
// 16
{ const i=F1(); const p=(due,paid)=>inv({client:"C",amount:100,due:due,state:"paid",paidOn:paid});
  i.invoices=[p("2026-08-01","2026-08-10"),p("2026-08-05","2026-08-16"),p("2026-08-10","2026-09-09"),inv({id:"n",client:"C",amount:500,due:"2026-11-10"})];
  const a=ME.walk(i);
  const j=F1(); j.invoices=i.invoices.slice(1); const b=ME.walk(j);
  ok(16,!!(a.ins["2026-11-21"]&&a.ins["2026-11-21"][0].amt===500&&b.ins["2026-11-10"]&&b.ins["2026-11-10"][0].amt===500)); }
// 17 and 18
{ const i=F5(); i.funnel_cfg=FUN(false); i.funnel_cfg.lanes["cold-web"].stages[0].lag_days_guess=7;
  const ev=[]; for(let n=0;n<30;n++){ ev.push({lane:"cold-web",lead:"L"+n,to:"reached",at:"2026-09-20"}); if(n<9)ev.push({lane:"cold-web",lead:"L"+n,to:"replied",at:"2026-09-24"}); }
  i.funnel_events=ev; const f=ME.funnel(i,"cold-web");
  ok(17,f.stages[0].rate===0.3&&f.stages[0].rate_src==="measured"&&f.stages[0].n===30,JSON.stringify(f.stages[0])); }
{ const i=F5(); i.funnel_cfg=FUN(false);
  const ev=[]; for(let n=0;n<4;n++){ ev.push({lane:"cold-web",lead:"P"+n,to:"price",at:"2026-08-01"}); } ev.push({lane:"cold-web",lead:"P0",to:"won",at:"2026-08-20"});
  i.funnel_events=ev; const f=ME.funnel(i,"cold-web"); const s=f.stages[3];
  ok(18,s.rate_src==="guess"&&s.n===4&&s.rate===0.4,JSON.stringify(s)); }
// 21
{ const p=ME.promise({steps:[{k:"a",track:"evolve",elapsed_days:3},{k:"b",track:"client",elapsed_days:2},{k:"c",track:"dev",elapsed_days:5}]},"2026-10-12");
  ok(21,p.launch==="2026-10-26"&&p.set_by.k==="c"&&p.set_by.from==="2026-10-19"&&p.set_by.to==="2026-10-23",JSON.stringify(p)); }
// 22
{ const i=F5(); i.whatif={add_wins:[{price:5500,sign:"2026-10-20"}]}; const before=JSON.stringify(ME.walk(F5()).weeks);
  const o=ME.run(i); ok(22,o.whatif.extra.length===3&&o.whatif.extra.map(x=>x.amt).join()==="2750,1375,1375"&&JSON.stringify(o.weeks)===before); }

console.log(pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
