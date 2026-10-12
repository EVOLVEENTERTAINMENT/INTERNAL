const {chromium}=require('../h/node_modules/playwright');const http=require('http');const fs=require('fs');
const file=__dirname+'/../v170.html';const port=8911;
const TXT=fs.readFileSync(__dirname+'/../eval/jackson.txt','utf8');
const W=+process.argv[2]||390;
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(port);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext({viewport:{width:W,height:900},timezoneId:'America/Chicago'});
 const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push("PAGEERROR "+String(e).slice(0,300)));
 await p.addInitScript({path:__dirname+'/../hl/mocklive.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(3500);
 const r=await p.evaluate(async(txt)=>{const o={};const wait=ms=>new Promise(r=>setTimeout(r,ms));
   window.__CALLS=[];
   sample=Object.assign(async(...a)=>{__CALLS.push(a);return {};},{json:async(...a)=>{__CALLS.push(a);return {};}});
   o.cmdbarHidden=document.getElementById('cmdbar').hidden;
   const lastScraps=n=>S.scraps.slice(-n).map(x=>x.text.slice(0,70));
   const pend0=S.pending.length;
   // 1 captureSheet with list
   const run=async(text,brk)=>{captureSheet();await wait(50);const ta=document.querySelector('.capta');ta.value=text;ta.dispatchEvent(new Event('input'));await wait(300);
     const chips=document.querySelector('.capta').parentNode.innerText.slice(0,900);
     if(brk){const bb=[...document.querySelectorAll('.veil button')].find(x=>x.textContent==='Break this down'); if(bb){bb.click();await wait(100);}}
     const chips2=document.querySelector('.capta').parentNode.innerText;
     const n0=S.scraps.length, c0=__CALLS.length, p0=S.pending.length;
     [...document.querySelectorAll('.veil button')].find(x=>x.textContent==='Catch it').click(); await wait(400);
     const veil=[...document.querySelectorAll('.veil')].map(v=>v.innerText.slice(0,600));
     return {chips:chips.slice(0,400),chips2:chips2.slice(0,1500),added:S.scraps.length-n0,calls:__CALLS.length-c0,pend:S.pending.length-p0,last:lastScraps(Math.min(3,S.scraps.length-n0)),veil,toast:(document.querySelector('.toast,#toast')||{}).textContent};};
   o.sheetList=await run(txt,false); closeVeils&&closeVeils();
   o.sheetBreak=await run(txt,true); document.querySelectorAll('.veil').forEach(v=>v.remove());
   o.sheetDentist=await run("dentist tuesday 3pm",false); document.querySelectorAll('.veil').forEach(v=>v.remove());
   o.sheetDentistAt=await run("dentist tuesday at 3pm",false); document.querySelectorAll('.veil').forEach(v=>v.remove());
   o.sheetGavin=await run("GAVIN- Get all financials connected to EVOLVE OS - 30 mins",false); document.querySelectorAll('.veil').forEach(v=>v.remove());
   o.sheet4=await run("Order jeans - tonight 10 mins\nOrder boots - tonight - 10 mins\ndentist tuesday 3pm\nGAVIN- send selects friday",false); document.querySelectorAll('.veil').forEach(v=>v.remove());
   // cmd bar Note lane single / two lines
   const bar=async(text,lane)=>{S.lane=lane||"dump";const ta=document.getElementById('cmd');ta.value=text;const n0=S.scraps.length,c0=__CALLS.length,p0=S.pending.length;fire();await wait(400);
     return {added:S.scraps.length-n0,calls:__CALLS.length-c0,pend:S.pending.length-p0,mode:S.mode,last:lastScraps(S.scraps.length-n0),veil:[...document.querySelectorAll('.veil')].map(v=>v.innerText.slice(0,300))};};
   o.barDentist=await bar("dentist tuesday 3pm"); document.querySelectorAll('.veil').forEach(v=>v.remove());
   o.barTwo=await bar("Order jeans - tonight 10 mins\nGAVIN- send selects friday"); document.querySelectorAll('.veil').forEach(v=>v.remove());
   o.barTimer=await bar("Order jeans 10 mins"); document.querySelectorAll('.veil').forEach(v=>v.remove());
   // pad
   S.mode="dump";S.room=null;paint();await wait(100);
   const key=dk(S.anchor); const n0=S.scraps.length,c0=__CALLS.length;
   padSave(key,txt); pullPad(key); await wait(300);
   o.pad={added:S.scraps.length-n0,calls:__CALLS.length-c0,first:S.scraps.slice(n0,n0+2).map(x=>x.text)};
   // inbox buttons
   paint();await wait(100);
   o.inboxBtns=[...document.querySelectorAll('.srcrow button, .dsec .hd button')].map(x=>x.textContent+(x.disabled?"(disabled)":""));
   o.SRc=!!SRc;
   o.errs=0;
   return o;},TXT);
 console.log(JSON.stringify(r,null,1));console.log(errs.join("\n"));
 await b.close();srv.close();})();
