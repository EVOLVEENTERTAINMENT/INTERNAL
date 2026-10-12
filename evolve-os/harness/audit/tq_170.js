const {chromium}=require('../h/node_modules/playwright');const http=require('http');const fs=require('fs');
const file=process.argv[2];const port=8894;const D=__dirname+'/../';
const OUTJ=JSON.parse(fs.readFileSync(D+'eval/out_j2.json','utf8').match(/\{[\s\S]*\}/)[0]);
const TXT=fs.readFileSync(D+'eval/jackson.txt','utf8');
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(port);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,timezoneId:'America/Chicago'});
 const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push("PAGEERROR "+String(e).slice(0,300)));
 await p.addInitScript({path:D+'hl/mocklive.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(3500);
 const r=await p.evaluate(async([out,txt])=>{const o={};
   sample=Object.assign(async()=>({}),{json:async()=>JSON.parse(JSON.stringify(out))});
   S.room=null;S.mode="board";paint();
   S.lane="dump"; const ta=document.getElementById("cmd"); ta.value=txt; fire();
   await new Promise(r=>setTimeout(r,400));
   const btn=[...document.querySelectorAll('.bd button')].filter(x=>/^File/.test(x.textContent))[0]; btn.click();
   await new Promise(r=>setTimeout(r,400));
   o.toasts=[...document.querySelectorAll('#toast .tst')].map(t=>t.textContent);
   o.queueOpen=S.queueOpen; o.n=S.pending.length;
   const now=Date.now();
   o.items=S.pending.map(c=>{const ov=S.events.filter(v=>!v.all&&+v.s<c.toE&&+v.e>c.toS).map(v=>v.cal+":"+v.title.slice(0,25));
     return c.cal+" | "+new Date(c.toS).toString().slice(0,21)+" "+Math.round((c.toE-c.toS)/60000)+"m | "+c.title.slice(0,40)+(c.toS<now?" PAST":"")+(ov.length?" OVERLAPS "+ov.join("; "):"");});
   const q=document.getElementById('queue');
   o.queueRect=q&&JSON.stringify(q.getBoundingClientRect());
   o.lsScroll=q&&q.querySelector('.ls').scrollHeight+"/"+q.querySelector('.ls').clientHeight;
   o.rows=q&&q.querySelectorAll('.li').length;
   o.qbtn=document.getElementById('qbtn').textContent+" hidden="+document.getElementById('qbtn').hidden;
   o.qbtnRect=JSON.stringify(document.getElementById('qbtn').getBoundingClientRect());
   o.pendDom=document.querySelectorAll('.pend').length;
   o.view=S.view; o.anchor=String(S.anchor);
   return o;},[OUTJ,TXT]);
 console.log(JSON.stringify(r,null,1));
 await p.screenshot({path:__dirname+'/q_open.png'});
 // board without queue
 await p.evaluate(()=>{S.queueOpen=false;paint();}); await p.waitForTimeout(200);
 await p.screenshot({path:__dirname+'/board.png',fullPage:false});
 const r1=await p.evaluate(()=>({pendDom:document.querySelectorAll('.pend').length, mode:S.mode,
   pendTitles:[...document.querySelectorAll('.pend')].map(x=>x.textContent.slice(0,40)).slice(0,20)}));
 console.log(JSON.stringify(r1,null,1));
 // home
 const r1b=await p.evaluate(async()=>{const o={};try{S.mode="home";paint();}catch(e){o.err=String(e)}await new Promise(r=>setTimeout(r,200));
   o.mode=S.mode;o.pend=document.querySelectorAll('.pend').length;o.txt=(document.getElementById('app')||document.body).innerText.slice(0,1500);S.mode="board";paint();return o;});
 console.log(JSON.stringify(r1b,null,1));
 // reload: localStorage persists
 const snapPend=await p.evaluate(()=>S.pending.length);
 await p.reload();await p.waitForTimeout(3500);
 const r2=await p.evaluate(()=>({after:S.pending.length,qopen:S.queueOpen,chip:document.getElementById('qbtn').textContent}));
 console.log("before reload",snapPend,JSON.stringify(r2));
 // approve with patched connector: 3rd create fails, double click
 const r3=await p.evaluate(async()=>{const o={};const calls=[];let n=0;
   const orig=mcp.callTool;
   mcp.callTool=async(sv,t,a)=>{ if(t==="create_event"){n++;calls.push([t,a.calendarId.slice(0,12),a.summary.slice(0,30),a.startTime,a.timeZone]);
       await new Promise(r=>setTimeout(r,50)); if(n===3)throw {code:"upstream_error"}; return {payload:{id:"newev"+n}};}
     if(t==="delete_event"){calls.push([t,a.eventId]);return {};}
     return orig(sv,t,a);};
   o.canWrite=canWriteCalendar(); o.chip=calChipText();
   S.queueOpen=true;paint();
   document.getElementById('qall').click(); await new Promise(r=>setTimeout(r,20));
   const b2=document.getElementById('qall'); o.btn2=b2&&(b2.textContent+" dis="+b2.disabled);
   if(b2)b2.click();
   const rowBtn=[...document.querySelectorAll('#queue .li button')].find(x=>/Write/.test(x.textContent)); if(rowBtn)rowBtn.click();
   await new Promise(r=>setTimeout(r,2500));
   o.calls=calls; o.left=S.pending.map(x=>x.title.slice(0,30));
   o.toasts=[...document.querySelectorAll('#toast .tst')].map(t=>t.textContent);
   o.hist=S.hist.slice(0,2).map(h=>h.label+" items="+h.items.length+" ids="+h.items.map(i=>i.evId).join(","));
   // board after approve: written events not in S.events (mock list doesnt add) 
   o.eventsHasNew=S.events.filter(x=>/^newev/.test(x.id)).length;
   window.__calls=calls; return o;});
 console.log(JSON.stringify(r3,null,1));
 // retry the failed one
 const r4=await p.evaluate(async()=>{S.queueOpen=true;paint();const o={};const before=window.__calls.length;
   document.getElementById('qall')&&document.getElementById('qall').click();await new Promise(r=>setTimeout(r,800));
   o.newCalls=window.__calls.slice(before);o.left=S.pending.length;
   o.toasts=[...document.querySelectorAll('#toast .tst')].map(t=>t.textContent).slice(-3);return o;});
 console.log(JSON.stringify(r4,null,1));
 // log/history UI: where can he undo one?
 const r5=await p.evaluate(()=>{const o={};o.histUI=[...document.querySelectorAll('button')].filter(b=>/undo|put back/i.test(b.textContent)).map(b=>b.textContent).slice(0,10);return o;});
 console.log(JSON.stringify(r5));
 console.log(errs.join("\n"));
 await b.close();srv.close();})();
