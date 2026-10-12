const {chromium}=require('../h/node_modules/playwright');const http=require('http');const fs=require('fs');
const file=process.argv[2];const port=8841;
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(port);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await (await b.newContext({viewport:{width:1440,height:900},timezoneId:'America/Chicago'})).newPage();const errs=[];
 p.on('pageerror',e=>errs.push("PAGEERROR "+String(e).slice(0,300)));
 await p.addInitScript({path:__dirname+'/mocklive.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(3500);
 const r=await p.evaluate(async()=>{const o={};
   S.mem={people:[{name:"Mary E",who:"his girlfriend",area:"personal",aliases:["Mary"]}],words:[{word:"Vue",means:"his apartment lease"}],rules:["Chores for Grace go on her list"]};
   const d=memDigest(); o.dlen=d.length; o.dhas=["Mary E","Vue means","Chores for Grace","Laurel","Gavin Fox","LOVC is"].map(x=>d.indexOf(x)>=0);
   o.wec=d.indexOf("WEC")>=0; o.dash=/[–—]/.test(d);
   o.digest=d.slice(0,1500);
   // capture prompts sent to Claude
   const sent=[]; window.sample=null;
   sample=Object.assign(async()=>({text:"{}"}),{json:async(q,op)=>{sent.push({len:q.length,mem:q.indexOf("WHAT THE BOARD KNOWS")>=0,tools:!!(op&&op.tools)});return {reply:"ok",items:[]};}});
   // split test
   const n0=S.scraps.length, w0=window.__WRITES.length;
   S.lane="dump"; const ta=document.getElementById("cmd"); ta.value="- call Sue about the cut\n2. pay the Vue rent\n• text Mary E\n[ ] order gaff tape"; fire();
   await new Promise(r=>setTimeout(r,300));
   o.scrapWrites=window.__WRITES.slice(w0).filter(w=>w[1].indexOf("scraps/")===0).length;
   o.scrapTexts=S.scraps.slice(-6).map(x=>x.text);
   // single line stays one, prose paragraph stays one
   const w1=window.__WRITES.length; ta.value="one thing only"; fire(); await new Promise(r=>setTimeout(r,200));
   o.single=window.__WRITES.slice(w1).filter(w=>w[1].indexOf("scraps/")===0).length;
   // chat saves after success
   S.lane="ask"; S.busy=false; const w2=window.__WRITES.length; ta.value="who is mary e"; fire(); await new Promise(r=>setTimeout(r,1500));
   o.chatSaved=window.__WRITES.slice(w2).some(w=>w[1]==="chat/log");
   o.sent=sent;
   return o;});
 console.log(JSON.stringify(r,null,1));console.log(errs.join("\n"));
 await b.close();srv.close();})();
