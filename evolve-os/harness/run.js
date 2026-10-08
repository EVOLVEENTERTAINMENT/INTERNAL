const {chromium}=require('playwright');const http=require('http');const fs=require('fs');
const file=process.argv[2], out=process.argv[3];
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(8765);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 for(const w of [1440,390]){
 const p=await b.newPage({viewport:{width:w,height:1000}});
 const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript({path:__dirname+'/mock.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:8765/');await p.waitForTimeout(2500);
 const t=await p.evaluate(()=>document.body.innerText);
 fs.writeFileSync(out+'-'+w+'.txt',t);
 await p.screenshot({path:out+'-'+w+'.png',fullPage:false});
 console.log(w,'errors:',errs.slice(0,3));}
 await b.close();srv.close();})();
