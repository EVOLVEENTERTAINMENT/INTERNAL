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
 const r2=await p.evaluate(()=>{const o={};const x={cal:"ASSISTANT HOURS",title:"Assistant",desc:""};o.ownerLens=isOwnerLens();o.ownerAmb=ambFor(x);setRole("grace");o.graceAmb=ambFor(x);o.graceKeeps=forRole([x]).length;setRole("gavin");o.gavinAmb=ambFor(x);setRole(rolesList()[0][0]);o.hhc=!!stateFor("HHC");o.laurel=(stateFor("Laurel Oaks")||{}).name;o.who=document.getElementById("whon").textContent;o.wo=woNext({accepted_on:"2026-06-01",start_paid_on:"2026-06-02",build_on:"2026-06-03",delivered_on:"2026-07-01",work_ok_on:"2026-07-05",invoiced_on:"2026-07-05",balance_paid_on:"2026-07-06",fee:2000}).t;o.wo2=woNext({accepted_on:"2026-09-01",start_paid_on:"2026-09-02",build_on:"2026-09-03",delivered_on:"2026-10-01",work_ok_on:"2026-10-05",invoiced_on:"2026-10-05",balance_paid_on:"2026-10-06",fee:2000}).t;return o;});console.log("R2",JSON.stringify(r2));
 for(const [k,m] of []){
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
