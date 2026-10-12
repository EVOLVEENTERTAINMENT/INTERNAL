const {chromium}=require('/tmp/claude-0/-home-user-INTERNAL/a7daf43b-4152-56e0-97d5-60762b5270c4/scratchpad/h/node_modules/playwright');const http=require('http');const fs=require('fs');
const [file,W,tag]=[process.argv[2],+(process.argv[3]||1440),process.argv[4]||"x"];
const OUT='/tmp/claude-0/-home-user-INTERNAL/a7daf43b-4152-56e0-97d5-60762b5270c4/scratchpad/hl/out/';
const port=8810+(W%9);
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(port);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext({viewport:{width:W,height:900},timezoneId:'America/Chicago'});
 const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push("PAGEERROR "+String(e).slice(0,300)));
 p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.type()+" "+m.text().slice(0,200));});
 await p.addInitScript({path:'/tmp/claude-0/-home-user-INTERNAL/a7daf43b-4152-56e0-97d5-60762b5270c4/scratchpad/hl/mocklive.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(3500);
 const screens=[["home","dash"],["board","board"],["now","now"],["projects","co"],["pipeline","pipe"],["money","money"],["people","people"],["deliver","deliver"],["inbox","dump"],["settings","settings"],["review","review"]];
 const r5=await p.evaluate(async()=>{const o={};S.mode="pipe";paint();await new Promise(r=>setTimeout(r,400));
const t=document.body.innerText; o.has=t.indexOf("next in the call order")>=0; o.first=(t.split("next in the call order, the lead engine is off")[1]||"").slice(0,420);
const n0=window.__WRITES.length;
const btn=[...document.querySelectorAll("button")].filter(b=>b.textContent==="No answer")[0]; btn.click(); await new Promise(r=>setTimeout(r,200));
o.afterNoAnswer=window.__WRITES.slice(n0);
const id=Object.keys(S.prospects).filter(k=>S.prospects[k].status==="called")[0]; o.called=id; o.outc=S.prospects[id].outcomes;
const tb=[...document.querySelectorAll("button")].filter(b=>b.textContent==="Talked")[0]; tb.click(); await new Promise(r=>setTimeout(r,200));
const ins=document.querySelectorAll(".veil input"); ins[0].value="2026-10-20"; ins[1].value="Spoke to the owner";
const sel=document.querySelector(".veil select"); sel.value="call_back_on_a_date";
[...document.querySelectorAll(".veil button")].filter(b=>b.textContent==="Save")[0].click(); await new Promise(r=>setTimeout(r,300));
const tk=Object.keys(S.prospects).filter(k=>S.prospects[k].status==="talking"); o.talking=tk.map(k=>[k,S.prospects[k].last_outcome,S.prospects[k].callback_on]);
const mv=[...document.querySelectorAll("button")].filter(b=>b.textContent==="Move to Pipeline")[0]; mv.click(); await new Promise(r=>setTimeout(r,300));
o.pipe=Object.keys(S.pipe).map(k=>[S.pipe[k].name,S.pipe[k].source,S.pipe[k].prospect_id]); o.promoted=Object.keys(S.prospects).filter(k=>S.prospects[k].status==="promoted");
o.writes=window.__WRITES.slice(n0).map(w=>w.join(" "));
return o;});console.log("R5",JSON.stringify(r5,null,1));

 for(const [k,m] of screens){
   await p.evaluate(m=>{S.room=null;S.pdr=null;S.mode=m;paint();},m); await p.waitForTimeout(500);
   const t=await p.evaluate(()=>document.body.innerText);
   fs.writeFileSync(OUT+tag+'-'+k+'-'+W+'.txt',t);
   await p.screenshot({path:OUT+tag+'-'+k+'-'+W+'.png',fullPage:true});
 }
 // the project portal on the busiest project
 await p.evaluate(()=>{S.room=null;S.mode="co";S.pv="split";const w=pwState();w.id="laureloaks";w.full=true;w.area="home";paint();});await p.waitForTimeout(500);
 await p.screenshot({path:OUT+tag+'-portal-'+W+'.png',fullPage:true});
 fs.writeFileSync(OUT+tag+'-portal-'+W+'.txt',await p.evaluate(()=>document.body.innerText));
 const meta=await p.evaluate(()=>({build:BUILD,projects:coProjects(view()).length,events:(S.events||[]).length,writes:window.__WRITES.filter(w=>w[1].indexOf("diag/")!==0).slice(0,30),calls:window.__CALLS.length}));
 console.log(JSON.stringify(meta));console.log(errs.slice(0,30).join("\n"));
 await b.close();srv.close();})();
