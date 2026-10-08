const {chromium}=require('playwright');const http=require('http');const fs=require('fs');
const file=process.argv[2], out=process.argv[3];
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(8766);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage({viewport:{width:1440,height:1000}});
 const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.addInitScript({path:__dirname+'/mock2.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:8766/');await p.waitForTimeout(2500);
 const R=await p.evaluate(async()=>{
  const o={}; const T=n=>n?(n.innerText!==undefined&&n.isConnected?n.innerText:n.textContent):String(n);
  const tryit=(k,f)=>{try{o[k]=f();}catch(e){o[k]="ERR "+e.message;}};
  for(const m of ["board","co","dash","deliver","money","people","pipe","review"]){
    S.room=null;S.mode=m;try{paint();}catch(e){o["mode:"+m]="ERR "+e.message;continue;}
    await new Promise(r=>setTimeout(r,300)); o["mode:"+m]=document.body.innerText;}
  const all=view(), ps=coProjects(all);
  tryit("slate",()=>JSON.stringify(slateFacts(ps.filter(x=>x.slug==="acmebrand")[0],all)));
  tryit("needYou",()=>JSON.stringify(needYou(all).map(x=>[x.cond,x.conseq])));
  tryit("callout",()=>T(coCallout(all)));
  tryit("brief",()=>T(weekBriefSheet(weekBriefData())));
  tryit("recap",()=>T(recapView(all)));
  tryit("fix",()=>JSON.stringify(fixFindings().map(x=>[x.what,x.sub])));
  tryit("delRows",()=>T(delRows(S.dels,"none")));
  tryit("pw",()=>{const c=pwCtx(ps.filter(x=>x.slug==="acmebrand")[0],ps);
     return JSON.stringify({att:c.att.map(a=>[a.lab,a.text,a.sub]),health:ppHealthWord(c),due:pwDueLabel(c.tasks[0].due)});});
  return o;});
 fs.writeFileSync(out,Object.entries(R).map(([k,v])=>"##### "+k+"\n"+v).join("\n"));
 console.log('errors:',errs);await b.close();srv.close();})();
