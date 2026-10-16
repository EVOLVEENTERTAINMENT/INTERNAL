const {chromium}=require('../h/node_modules/playwright');const http=require('http');const fs=require('fs');
const file=process.argv[2];const port=8996;
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(port);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'America/Chicago'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript({path:__dirname+'/mocklive.js'});await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(3500);
 const r=await p.evaluate(async()=>{const o={};const sl=ms=>new Promise(r=>setTimeout(r,ms));
   const calls=[];const real=mcp.callTool.bind(mcp);
   mcp.callTool=async(sv,t,a)=>{ if(sv==="Claude Code Remote"){calls.push([sv,t,a]);return {payload:{ccr:{id:"session_01TESTabcdefgh"}}};} return real(sv,t,a); };
   const toasts=()=>[...document.querySelectorAll('#toast .tst')].map(t=>t.textContent.slice(0,120));
   o.urls=["r-and-m.biz","https://www.foo.com/x?y=1","hello world","call bob","foo.com","www.smith-roofing.co"].map(u=>[u,pasteUrlOf(u)]);
   o.dupe=await pasteSite("http://www.r-and-m.biz/home.html"); o.t1=toasts();
   const w0=(window.__WRITES||[]).length;
   o.newp=await pasteSite("smithroofing-test.com"); await sl(300);
   o.writes=(window.__WRITES||[]).slice(w0).map(x=>JSON.stringify(x).slice(0,220));
   o.calls=calls.map(c=>[c[0],c[1],Object.keys(c[2]).join(","),c[2].prompt]);
   o.t2=toasts();
   o.again=await pasteSite("smithroofing-test.com"); o.t3=toasts().slice(-1);
   // bottom bar path
   S.lane="dump"; const ta=document.getElementById("cmd"); ta.value="https://oldsite-example.net"; fire(); await sl(300);
   o.fire=calls.length;
   // fake states
   const now=new Date().toISOString(), old=new Date(Date.now()-30*60000).toISOString();
   S.pastes=Object.assign(S.pastes||{},{
     pa:{url:"https://a.com",host:"a.com",at:now,state:"checking"},
     pb:{url:"https://b.com",host:"b.com",at:now,state:"done",added:true,name:"Barber Marina",score:97,tier:"A: call this month",city:"Elberta",opening_fact:"No tap to call link on the homepage",prospect_id:"barbermarina.com"},
     pc:{url:"https://c.com",host:"c.com",at:now,state:"done",added:false,name:"R & M Machine Shop",score:43,tier:"C: only if time",why:"An industrial machine shop that sells to other businesses, which is not a fit."},
     pd:{url:"https://d.com",host:"d.com",at:now,state:"failed",reason:"The site did not answer."},
     pe:{url:"https://e.com",host:"e.com",at:old,started_at:old,state:"checking"}});
   if(S.prospects["barbermarina.com"])S.prospects["barbermarina.com"].found_by="you";
   S.mode="leads";S.room=null;S.lqSet="all";paint();await sl(300);
   const sec=[...document.querySelectorAll('.dsec,section,div')].find(n=>/All leads/.test((n.querySelector('h2,h3')||{}).textContent||''));
   o.rows=[...document.querySelectorAll('.rows .rw.prw')].slice(0,6).map(x=>x.innerText.replace(/\n/g," | ").slice(0,160));
   o.found=[...document.querySelectorAll('.lrow .sub')].filter(t=>/You found it/.test(t.textContent)).length; o.nleads=prList().length;
   return o;});
 await p.evaluate(()=>{const n=[...document.querySelectorAll('input[placeholder="Paste a website link"]')][0];if(n)n.scrollIntoView({block:"start"});});await p.waitForTimeout(300);
 await p.screenshot({path:__dirname+'/../v182_paste_390.png'});
 console.log(JSON.stringify(r,null,1));console.log(errs.join("\n"));await b.close();srv.close();})();
