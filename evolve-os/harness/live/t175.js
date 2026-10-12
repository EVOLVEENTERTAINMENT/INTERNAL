const {chromium}=require('../h/node_modules/playwright');const http=require('http');const fs=require('fs');
const file=process.argv[2];const port=8981;
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(port);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await (await b.newContext({viewport:{width:390,height:844},timezoneId:'America/Chicago'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript({path:__dirname+'/mocklive.js'});await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(3500);
 const r=await p.evaluate(async()=>{const o={};
   sample=Object.assign(async()=>({}),{json:async(q,op)=>{
     const T=n=>op.tools.filter(t=>t.name===n)[0];
     const s0=S.scraps.length, m0=(S.modelStaged||[]).length;
     await T("catch_note").execute({text:"plain note before reading mail"});
     o.before={scraps:S.scraps.length-s0,staged:(S.modelStaged||[]).length-m0};
     o.hasSearch=!!T("search_email");
     try{ if(T("search_email"))await T("search_email").execute({query:"x"}); }catch(x){}
     const s1=S.scraps.length, m1=(S.modelStaged||[]).length;
     await T("catch_note").execute({text:"note after reading mail"});
     o.after={scraps:S.scraps.length-s1,staged:(S.modelStaged||[]).length-m1};
     o.signal=!!op.signal;
     return {reply:"ok"};}});
   S.servers.gmail=true;
   S.lane="ask"; const ta=document.getElementById("cmd"); ta.value="check my email for anything from Sue"; fire();
   await new Promise(r=>setTimeout(r,1500)); return o;});
 console.log(JSON.stringify(r,null,1));console.log(errs.join("\n"));await b.close();srv.close();})();
