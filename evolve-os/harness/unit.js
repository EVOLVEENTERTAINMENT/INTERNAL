const {chromium}=require('playwright');const http=require('http');const fs=require('fs');
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(process.argv[2]));}).listen(8790);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript({path:__dirname+'/mock2.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:8790/');await p.waitForTimeout(2000);
 const R=await p.evaluate(async()=>{const o={};
  o.latest1=gmLatest({messages:[{subject:"a",internalDate:"100"},{subject:"b",internalDate:"300"},{subject:"c",internalDate:"200"}]}).subject;
  o.latest2=gmLatest({messages:[{subject:"a"},{subject:"z"}]}).subject;
  o.latest3=JSON.stringify(gmLatest({}));
  // queueGate on a reassign style row: Google moved it after staging
  const s0=Date.UTC(2026,9,8,15),e0=s0+3600e3;
  mcp={callTool:async()=>({payload:{id:"x",status:"confirmed",updated:"u2",start:{dateTime:new Date(s0+1800e3).toISOString()},end:{dateTime:new Date(e0+1800e3).toISOString()}}}),invalidate:async()=>{}};
  o.gateMoved=await queueGate({type:"edit",evId:"x",calId:"c",fromS:s0,fromE:e0,wasU:"u1",toS:s0,toE:e0});
  o.gateOld=await queueGate({type:"edit",evId:"x",calId:"c",toS:s0,toE:e0});
  o.headings=[...document.querySelectorAll('[role=heading][aria-level="1"]')].length;
  return o;});
 console.log(JSON.stringify(R),errs);await b.close();srv.close();})();
