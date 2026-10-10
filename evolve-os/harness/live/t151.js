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
 const r1=await p.evaluate(async()=>{const o={};S.mode="board";paint();o.closeBtn=[...document.querySelectorAll("button")].some(b=>b.textContent==="Close the day");document.getElementById("m-board").click();await new Promise(r=>setTimeout(r,300));o.mode=S.mode;o.title=document.getElementById("ptitle").textContent;o.closing=S.closing;S.closing=null;S.closeRun=null;S.mode="co";paint();await new Promise(r=>setTimeout(r,300));openProject("laureloaks");await new Promise(r=>setTimeout(r,500));o.tabs=[...document.querySelectorAll(".pnav button span, .pwnav button span, nav button span")].map(x=>x.textContent).filter(Boolean).slice(0,30);o.cap=[document.getElementById("lane-dump").textContent,document.getElementById("cmdgo").textContent];return o;});console.log("R1",JSON.stringify(r1));
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
