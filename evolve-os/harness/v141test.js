const {chromium}=require('playwright');const http=require('http');const fs=require('fs');
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(process.argv[2]));}).listen(8794);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript({path:__dirname+'/mock2.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:8794/');await p.waitForTimeout(2000);
 const R=await p.evaluate(async()=>{const o={};const calls=[];
  mcp={callTool:async(sv,t,a)=>{calls.push([t,a.pageToken||""]);
     if(t==="search_threads"){const pg=a.pageToken?+a.pageToken:0;
       return {payload:{threads:Array.from({length:25},(_,i)=>({id:"t"+pg+"_"+i,messageCount:i===0?9:1,messages:[{sender:"a",subject:"s",snippet:"x",internalDate:"1"}]})),nextPageToken:pg<5?String(pg+1):""}};}
     return {payload:{}};},invalidate:async()=>{},listTools:async()=>[]};
  // the sweep body is long; find the search_email tool and the sweep runner
  const tools=(typeof claudeTools==="function"?claudeTools():null);
  o.hasRun=typeof runSweep;
  try{ if(typeof runSweep==="function"){ await runSweep(SWEEPS.filter(x=>x.id==="s-inbox")[0]); } }catch(e){o.runErr=e.message;}
  o.pages=calls.filter(c=>c[0]==="search_threads").map(c=>c[1]);
  // tour: capPull returns without calling the line
  calls.length=0; S.tour=true; await capPull(true); o.tourCalls=calls.length; S.tour=false;
  return o;});
 console.log(JSON.stringify(R),errs);await b.close();srv.close();})();
