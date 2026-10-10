/*ME-BEGIN*/
/* The money engine. Pure: one plain input in, one plain output out. No S, no
   document, no clock. Today is an input, a YYYY-MM-DD string in Central. All
   date maths runs on date strings at local noon, clear of clock changes.
   Spec: Money Engine plan REV2, B5. */
const ME=(function(){
  const VERSION="me-1";
  /* dates */
  const toD=s=>{const p=String(s).split("-");return new Date(+p[0],+p[1]-1,+p[2],12);};
  const toS=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  const isDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||""));
  const add=(s,n)=>{const d=toD(s);d.setDate(d.getDate()+n);return toS(d);};
  const diff=(a,b)=>Math.round((toD(b)-toD(a))/86400000);       // b minus a, in days
  const dow=s=>toD(s).getDay();                                  // 0 Sunday
  const isWork=s=>{const w=dow(s);return w!==0&&w!==6;};
  const nextWork=s=>{let d=s;while(!isWork(d))d=add(d,1);return d;};
  const mondayOf=s=>add(s,-((dow(s)+6)%7));
  const r2=n=>Math.round(n*100)/100;
  const median=a=>{if(!a.length)return null;const b=a.slice().sort((x,y)=>x-y),m=b.length>>1;
    return b.length%2?b[m]:(b[m-1]+b[m])/2;};

  /* invoices, read the way the page reads them */
  const STATES=["draft","sent","due","paid","void"];
  function invStatus(r){
    if(!r)return "draft";
    const st=String(r.state||"").toLowerCase();
    if(STATES.indexOf(st)>=0)return st;
    if(r.paid)return "paid";
    if(r.sent)return "sent";
    return "draft";
  }
  function paidAmount(r){
    const ps=(r&&r.payments)||[];
    if(ps.length)return ps.reduce((t,x)=>t+(Number(x.amount)||0),0);
    return invStatus(r)==="paid"?(Number(r.amount)||0):0;
  }
  function paidOn(r){
    const ps=(r&&r.payments)||[];
    if(ps.length)return ps[ps.length-1].on||r.paidOn||"";
    return r.paidOn||"";
  }
  /* median days from due to paid, once a client has 3 or more paid with both dates */
  function clientLag(client,invoices){
    if(!client)return 0;
    const lags=[];
    (invoices||[]).forEach(r=>{
      if(!r||r.client!==client||invStatus(r)!=="paid")return;
      const p=paidOn(r); if(isDate(r.due)&&isDate(p))lags.push(diff(r.due,p));
    });
    return lags.length>=3?median(lags):0;
  }

  /* every day a cost or a steady income lands between two dates, inclusive */
  function hits(c,from,to){
    const out=[], a=Number(c&&c.amount)||0; if(!a)return out;
    for(let k=from;k<=to;k=add(k,1)){
      if(isDate(c.starts)&&k<c.starts)continue;
      if(isDate(c.ends)&&k>c.ends)continue;
      const d=toD(k), dom=d.getDate(), last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
      const day=Math.min(Math.max(1,parseInt(c.day,10)||1),31);
      let hit=false;
      if(c.every==="week")hit=((d.getDay()+6)%7)+1===Math.min(Math.max(1,parseInt(c.day,10)||1),7);
      else if(c.every==="year")hit=(d.getMonth()+1)===(parseInt(c.month,10)||1)&&dom===Math.min(day,last);
      else hit=dom===Math.min(day,last);
      if(hit)out.push({d:k,amt:a,c:c});
    }
    return out;
  }
  function monthly(c){
    const a=Number(c&&c.amount)||0;
    return c.every==="year"?a/12:c.every==="week"?a*52/12:a;
  }

  /* deposit shares from the rules handed in, never written here */
  function shares(price,rules,kind){
    const R=rules||[];
    if(kind){const k=R.filter(x=>x.kind&&x.kind===kind)[0]; if(k)return k.shares.slice();}
    const p=Number(price)||0;
    const hit=R.filter(x=>!x.kind&&(x.min===undefined||p>=x.min)&&(x.max===undefined||p<=x.max))[0];
    return hit?hit.shares.slice():null;
  }
  /* one job's payments in: first at sign plus lag, last at sign plus turnaround,
     the middle ones spread evenly between */
  function jobInflows(price,sh,sign,lag,turn){
    const n=sh.length, first=add(sign,lag), last=add(sign,turn), span=diff(first,last), out=[];
    sh.forEach((s,i)=>{
      const d=n===1?first:i===n-1?last:add(first,Math.round(span*i/(n-1)));
      out.push({d:d,amt:r2(price*s/100)});
    });
    return out;
  }

  /* B5.3 the walk */
  function walk(inp,extra){
    const today=inp.today, H=inp.horizon_days||91, end=add(today,H-1);
    const set=inp.settings||{}, flags=[];
    const floor=Number(set.floor)||0;
    if(set.floor===undefined||set.floor===null)flags.push("no_floor");
    const sa=Number(set.setaside_pct)||0;
    if(set.setaside_pct===undefined||set.setaside_pct===null)flags.push("no_setaside");
    const cash=inp.cash&&inp.cash.amount!==null&&inp.cash.amount!==undefined?inp.cash:null;
    if(!cash)flags.push("no_cash");
    const stale=!cash||!isDate(cash.at)||diff(cash.at,today)>7;
    if(stale&&cash)flags.push("cash_stale");
    if(!(inp.costs||[]).length)flags.push("no_costs");

    const ins={}, outs={}, late=[], undated=[];
    const put=(m,d,x)=>{(m[d]=m[d]||[]).push(x);};
    /* billed */
    (inp.invoices||[]).forEach(r=>{
      const st=invStatus(r); if(st!=="sent"&&st!=="due")return;
      const rest=Math.max(0,(Number(r.amount)||0)-paidAmount(r));
      if(!rest||!isDate(r.due))return;
      const d=add(r.due,clientLag(r.client,inp.invoices));
      if(d<today){late.push({id:r.id,client:r.client||"",amt:rest,d:d});return;}
      if(d<=end)put(ins,d,{amt:rest,kind:"billed",ref:r.id});
    });
    /* scheduled */
    const ms={}; (inp.milestones||[]).forEach(m=>{if(m&&m.id)ms[m.id]=m;});
    (inp.payplan||[]).forEach(p=>{
      if(!p||p.dir!=="in"||p.state!=="scheduled"||p.confirmed!==true)return;
      let d=null;
      if(p.basis==="milestone"){const m=ms[p.milestone]; if(m&&isDate(m.date))d=add(m.date,Number(p.offset_days)||0);}
      else if(isDate(p.date))d=p.date;
      if(!d){undated.push({id:p.id,label:p.label||"",amt:Number(p.amount)||0});return;}
      if(d<today){late.push({id:p.id,client:p.client||"",amt:Number(p.amount)||0,d:d});return;}
      if(d<=end)put(ins,d,{amt:Number(p.amount)||0,kind:"scheduled",ref:p.id});
    });
    /* steady */
    (inp.income||[]).forEach(c=>hits(c,today,end).forEach(h=>put(ins,h.d,{amt:h.amt,kind:"steady",ref:c.id})));
    /* hypothetical wins, for the wins needed loop and what if */
    (extra||[]).forEach(x=>{ if(x.d>=today&&x.d<=end)put(x.amt>=0?ins:outs,x.d,{amt:Math.abs(x.amt),kind:x.amt>=0?"win":"win_cost",ref:"win"}); });
    /* out */
    (inp.costs||[]).forEach(c=>hits(c,today,end).forEach(h=>put(outs,h.d,{amt:h.amt,kind:c.kind==="job"?"job":"run",ref:c.id})));
    (inp.payplan||[]).forEach(p=>{
      if(!p||p.dir!=="out"||p.state!=="scheduled"||p.confirmed!==true)return;
      let d=null;
      if(p.basis==="milestone"){const m=ms[p.milestone]; if(m&&isDate(m.date))d=add(m.date,Number(p.offset_days)||0);}
      else if(isDate(p.date))d=p.date;
      if(!d)return; if(d<today)d=today;
      if(d<=end)put(outs,d,{amt:Number(p.amount)||0,kind:"job",ref:p.id});
    });
    const costNames=(inp.costs||[]).map(c=>String(c.name||"").toLowerCase());
    (inp.dates||[]).forEach(x=>{
      if(!x||!(Number(x.amount)>0)||["bill","renewal","filing"].indexOf(x.kind)<0||!isDate(x.date))return;
      const nm=String(x.name||"").toLowerCase();
      const dup=(inp.costs||[]).some(c=>String(c.name||"").toLowerCase()===nm&&
        hits(c,add(x.date,-3),add(x.date,3)).length);
      if(dup)return;
      if(x.date>=today&&x.date<=end)put(outs,x.date,{amt:Number(x.amount),kind:"bill",ref:x.id});
    });

    /* track */
    let bal=cash?Number(cash.amount)||0:0, low=bal, low_on=today, short_on=null, saved=0;
    const wk=[]; let cur=null;
    for(let k=today;k<=end;k=add(k,1)){
      const ws=mondayOf(k);
      if(!cur||cur.week_start!==ws){
        if(wk.length<13){cur={week_start:ws,in_landed:0,in_billed:0,in_scheduled:0,in_steady:0,out_run:0,out_job:0,out_bills:0,net:0,end:0};wk.push(cur);}
        else cur={week_start:ws,_x:true};
      }
      (ins[k]||[]).forEach(x=>{
        const net=sa?r2(x.amt*(1-sa/100)):x.amt; saved=r2(saved+x.amt-net); bal=r2(bal+net);
        if(!cur._x){cur["in_"+(x.kind==="win"?"scheduled":x.kind)]+=net; cur.net+=net;}
      });
      (outs[k]||[]).forEach(x=>{
        bal=r2(bal-x.amt);
        if(!cur._x){const c=x.kind==="run"?"out_run":x.kind==="bill"?"out_bills":"out_job"; cur[c]+=x.amt; cur.net-=x.amt;}
      });
      if(!cur._x)cur.end=bal;
      if(bal<low){low=bal;low_on=k;}
      if(bal<floor&&!short_on)short_on=k;
    }
    wk.forEach(w=>{Object.keys(w).forEach(f=>{if(typeof w[f]==="number")w[f]=r2(w[f]);});});
    return {floor:floor,cash:cash?Number(cash.amount):null,cash_stale:stale,low:low,low_on:low_on,short_on:short_on,
      end:bal,late:late,undated:undated,weeks:wk,set_aside_total:saved,flags:flags,ins:ins,outs:outs,from:today,to:end};
  }

  /* B5.4 wins needed, with the three delays */
  function winsNeeded(inp,base){
    const set=inp.settings||{}, price=Number(set.avg_price)||0;
    if(!price)return {wins:null,flag:"need_avg"};
    const sh=shares(price,set.deposit_rules,null)||[100];
    const lag=Number(set.dep_lag_days)||0, turn=Number(set.turnaround_days)||0, cyc=Number(set.cycle_days)||0;
    const cost=Number(set.avg_direct_cost)||0;
    const extra=[], wins=[]; let w=base||walk(inp);
    for(let i=0;i<12&&w.short_on;i++){
      const sign=add(w.short_on,-lag);
      const fl=jobInflows(price,sh,sign,lag,turn);
      fl.forEach(x=>extra.push(x));
      if(cost)extra.push({d:add(sign,turn),amt:-cost});
      const start=add(sign,-cyc);
      wins.push({sign_by:sign,start_by:start,cash_first:fl[0].d,cash_last:fl[fl.length-1].d,late_for_cold:start<inp.today});
      w=walk(inp,extra);
    }
    return {wins:wins,after:w,extra:extra};
  }
  /* real records that could close a gap, never a made up one */
  function levers(inp,base){
    const out=[], t=inp.today, soon=add(t,14);
    const lateSum=base.late.reduce((a,x)=>a+x.amt,0);
    if(lateSum)out.push({k:"late",amt:r2(lateSum),d:t});
    (inp.invoices||[]).forEach(r=>{
      const st=invStatus(r); if(st!=="sent"&&st!=="due")return;
      const rest=Math.max(0,(Number(r.amount)||0)-paidAmount(r));
      if(rest&&isDate(r.due)&&r.due>=t&&r.due<=soon)out.push({k:"ask_early",amt:rest,d:r.due,ref:r.id});
    });
    const ms={}; (inp.milestones||[]).forEach(m=>{if(m&&m.id)ms[m.id]=m;});
    (inp.payplan||[]).forEach(p=>{
      if(!p||p.dir!=="in"||p.basis!=="milestone"||p.state!=="scheduled")return;
      const m=ms[p.milestone]; if(m&&isDate(m.date)&&m.date>=t&&m.date<=soon)out.push({k:"milestone",amt:Number(p.amount)||0,d:m.date,ref:p.id});
    });
    (inp.pipeline||[]).forEach(o=>{
      if(!o||/cold/i.test(String(o.source||""))||!(Number(o.value)>0)||o.won||o.lost)return;
      out.push({k:"warm_lead",amt:Number(o.value),d:t,ref:o.id});
    });
    return out;
  }
  /* the goal, apart from the floor */
  function goal(inp){
    const set=inp.settings||{}, g=set.goal||{}, sa=Number(set.setaside_pct)||0;
    const price=Number(set.avg_price)||0, dc=Number(set.avg_direct_cost)||0, margin=price-dc;
    let bus=0,per=0; (inp.costs||[]).forEach(c=>{ if(c.kind==="personal")per+=monthly(c); else bus+=monthly(c); });
    const months=[]; const t=toD(inp.today);
    for(let i=0;i<3;i++){
      const a=toS(new Date(t.getFullYear(),t.getMonth()+i,1,12)), b=toS(new Date(t.getFullYear(),t.getMonth()+i+1,0,12));
      const need=r2((bus+per+(Number(g.save_month)||0))/(1-sa/100));
      const w=walk(Object.assign({},inp,{today:a<inp.today?inp.today:a,horizon_days:diff(a<inp.today?inp.today:a,b)+1,cash:{amount:0,at:a},settings:Object.assign({},set,{setaside_pct:0})}));
      let have=0; Object.keys(w.ins).forEach(d=>w.ins[d].forEach(x=>{have+=x.amt;}));
      have=r2(have);
      months.push({month:a.slice(0,7),need:need,have:have,margin:margin||null,
        wins:margin>0?Math.max(0,Math.ceil((need-have)/margin)):null});
    }
    return {months:months};
  }

  /* B5.5 the funnel */
  function wilson(k,n,z){ if(!n)return [0,1]; const p=k/n, d=1+z*z/n, c=p+z*z/(2*n), s=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n)); return [Math.max(0,(c-s)/d),Math.min(1,(c+s)/d)]; }
  function funnel(inp,lane){
    const cfg=((inp.funnel_cfg||{}).lanes||{})[lane]; if(!cfg)return {flag:"no_funnel_cfg"};
    const st=cfg.stages, ev=(inp.funnel_events||[]).filter(e=>e.lane===lane&&e.src!=="backfill");
    const idx={}; st.forEach((s,i)=>{idx[s.k]=i;});
    const first={}; // lead -> stage index -> first date in
    ev.forEach(e=>{const i=idx[e.to]; if(i===undefined)return; const L=first[e.lead]=first[e.lead]||{};
      if(!L[i]||e.at<L[i])L[i]=e.at;});
    const out=[]; let R=1, lo=1, hi=1, guess=false;
    for(let i=0;i<st.length-1;i++){
      const a=st[i], lastStep=i===st.length-2, need=lastStep?5:20;
      const lagG=Number(a.lag_days_guess)||0;
      const lags=[]; Object.keys(first).forEach(l=>{const L=first[l]; if(L[i]&&L[i+1])lags.push(diff(L[i],L[i+1]));});
      const lag=lags.length>=5?median(lags):lagG, lagSrc=lags.length>=5?"measured":"guess";
      let n=0,k=0;
      Object.keys(first).forEach(l=>{const L=first[l]; if(!L[i]||diff(L[i],inp.today)<lag)return; n++;
        if(Object.keys(L).some(j=>+j>i))k++;});
      let rate, src;
      if(n>=need){rate=k/n;src="measured";const w=wilson(k,n,1.2816);lo*=w[0];hi*=w[1];}
      else{rate=Number(a.rate_guess)||0;src="guess";guess=true;lo*=rate*0.5;hi*=Math.min(1,rate*1.5);}
      R*=rate;
      out.push({k:a.k,to:st[i+1].k,rate:r2(rate*1e4)/1e4,rate_src:src,n:n,lag:lag,lag_src:lagSrc});
    }
    return {lane:lane,stages:out,R:Math.round(R*1e6)/1e6,range:guess||out.some(x=>x.rate_src==="measured")?[Math.round(lo*1e6)/1e6,Math.round(hi*1e6)/1e6]:null,guess:guess,cfg:st};
  }
  function quota(inp,f,wins){
    if(!f||f.flag||!f.R)return null;
    const ok=(wins||[]).filter(w=>!w.late_for_cold).sort((a,b)=>a.start_by<b.start_by?-1:1);
    let reach=0;
    ok.forEach((w,i)=>{const need=(i+1)/f.R, wks=Math.max(1,Math.ceil(diff(inp.today,w.start_by)/7)); reach=Math.max(reach,need/wks);});
    reach=Math.ceil(reach-1e-9);
    const by={}; let v=reach; by[f.cfg[0].k]=reach;
    f.stages.forEach(s=>{v=v*s.rate; by[s.to]=Math.ceil(v-1e-9);});
    let mins=0; f.cfg.forEach(s=>{mins+=(by[s.k]||0)*(Number(s.mins_each)||0);});
    const mon=mondayOf(inp.today), done={};
    (inp.funnel_events||[]).forEach(e=>{ if(e.lane===f.lane&&e.src!=="backfill"&&e.at>=mon)done[e.to]=(done[e.to]||0)+1; });
    const blk=Number(inp.sales_block_mins_this_week)||0;
    return {reach_week:reach,by_stage:by,done:done,selling_mins:mins,sales_block_mins:blk,fits:mins<=blk};
  }

  /* B5.6 promise date: the lane laid forward from the sign date */
  function promise(lane,sign){
    let at=sign, last=null;
    (lane.steps||[]).forEach(s=>{
      const n=Math.max(1,Number(s.elapsed_days)||1);
      let d=s.track==="client"?at:nextWork(at), cnt=0, endD=d;
      while(cnt<n){ if(s.track==="client"||isWork(d)){cnt++;endD=d;} if(cnt<n)d=add(d,1); }
      last={k:s.k,from:s.track==="client"?at:nextWork(at),to:endD};
      at=add(endD,1);
    });
    return {launch:nextWork(at),set_by:last};
  }

  /* everything, the shape written to plan/current */
  function run(inp){
    const base=walk(inp), w=winsNeeded(inp,base), flags=base.flags.slice();
    if(w.flag)flags.push(w.flag);
    if(w.wins&&w.wins.some(x=>x.late_for_cold))flags.push("late_for_cold");
    const lane=(inp.settings||{}).lane||"cold-web";
    const f=funnel(inp,lane); if(f.flag)flags.push(f.flag); else if(f.guess)flags.push("guess_rates");
    const q=f.flag?null:quota(inp,f,w.wins);
    if(q&&!q.fits)flags.push("over_selling_time");
    let wi=null;
    if(inp.whatif&&inp.whatif.add_wins&&inp.whatif.add_wins.length){
      const set=inp.settings||{}, ex=[];
      inp.whatif.add_wins.forEach(x=>{ const sh=shares(x.price,set.deposit_rules,x.kind)||[100];
        jobInflows(x.price,sh,x.sign,Number(set.dep_lag_days)||0,Number(set.turnaround_days)||0).forEach(y=>ex.push(y)); });
      const ww=walk(inp,ex); wi={extra:ex,short_on:ww.short_on,low:ww.low,end:ww.end};
    }
    return {engine_version:VERSION,floor:base.floor,cash:base.cash,cash_stale:base.cash_stale,low:base.low,low_on:base.low_on,
      short_on:base.short_on,end:base.end,late:base.late,undated:base.undated,weeks:base.weeks,set_aside_total:base.set_aside_total,
      wins:w.wins,levers:w.wins&&w.wins.some(x=>x.late_for_cold)?levers(inp,base):[],goal:goal(inp),
      funnel:f.flag?null:{lane:f.lane,stages:f.stages,R:f.R,range:f.range},quota:q,whatif:wi,flags:flags};
  }
  return {VERSION:VERSION,run:run,walk:walk,winsNeeded:winsNeeded,levers:levers,goal:goal,funnel:funnel,quota:quota,
    promise:promise,shares:shares,jobInflows:jobInflows,clientLag:clientLag,hits:hits,monthly:monthly,add:add,diff:diff};
})();
/*ME-END*/
if(typeof module!=="undefined")module.exports=ME;
