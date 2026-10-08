const {chromium}=require('playwright');const http=require('http');const fs=require('fs');
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(process.argv[2]));}).listen(8791);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript({path:__dirname+'/mock3.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:8791/');await p.waitForTimeout(2000);
 const R=await p.evaluate(async()=>{
  const sl=ms=>new Promise(r=>setTimeout(r,ms)); const A=[]; const ok=(n,c)=>A.push((c?"PASS ":"FAIL ")+n);
  const ST=window.__ST; let cap=null;
  window.confirm2=(t,body,go)=>{cap={t,body,go};};
  ok("old bin entry swept on load", !ST.bin.bold);
  const clickDelete=()=>{const bs=[...document.querySelectorAll('button')].filter(x=>x.textContent.trim()==="Delete");
     if(bs.length)bs[bs.length-1].click(); return bs.length;};
  const cases=[
    ["projects","acmebrand",()=>projEdit(coProjects(view()).filter(x=>x.slug==="acmebrand")[0])],
    ["clients","c1",()=>clientEdit(S.clients.c1)],
    ["pipeline","l1",()=>pipeEdit(S.pipe.l1)],
    ["invoices","i1",()=>invEdit(S.inv.filter(x=>x.id==="i1")[0])],
    ["duelist","d1",()=>delEdit(S.dels.filter(x=>x.id==="d1")[0])],
    ["expenses","e1",()=>expEdit(S.exp.filter(x=>x.id==="e1")[0])],
    ["decisions","x1",()=>decEdit(S.decs.filter(x=>x.id==="x1")[0])],
    ["milestones","m1",()=>ppMileDelete(S.miles.filter(x=>x.id==="m1")[0]),"direct"],
    ["tasks","t1",()=>pwTaskDelete(S.tasks.filter(x=>x.id==="t1")[0]),"direct"]];
  for(const [c,id,open,direct] of cases){
    const before=JSON.stringify(ST[c][id]); cap=null;
    try{open();}catch(e){ok(c+" editor opened: "+e.message,false);continue;}
    await sl(50); if(!direct){const n=clickDelete(); if(!n){ok(c+" has a Delete button",false);continue;}}
    if(!cap){ok(c+" confirm shown",false);continue;}
    if(!direct)ok(c+" warning no longer says cannot be undone",!/cannot be undone/.test(cap.body));
    cap.go(); await sl(120);
    const bin=Object.entries(ST.bin||{}).filter(([k,v])=>v.path===c+"/"+id)[0];
    ok(c+" deleted",!ST[c][id]); ok(c+" copied to bin",!!bin);
    if(c==="tasks")ok("task dependents unhooked",(ST.tasks.t2.depends||[]).indexOf("t1")<0);
    if(c==="milestones")ok("milestone unhooked from its task",!ST.tasks.t1.milestone);
    // put it back, from the Settings list
    S.room=null;S.mode="settings";paint();await sl(50);
    const put=[...document.querySelectorAll('.dsec button')].filter(x=>x.textContent.trim()==="Put it back");
    ok(c+" shows in the bin list",put.length===1);
    if(put.length)put[0].click(); await sl(150);
    const B=JSON.parse(before),Aft=ST[c][id]||{};const diff=Object.keys(B).filter(k=>JSON.stringify(B[k])!==JSON.stringify(Aft[k])).map(k=>k+":"+JSON.stringify(B[k])+"->"+JSON.stringify(Aft[k]));
    if(diff.length)A.push("   diff "+diff.join(" ; ").slice(0,300));
    ok(c+" restored identical",JSON.stringify(ST[c][id])===JSON.stringify(Object.assign({},JSON.parse(before),(c==="milestones"||c==="tasks")?{}:{})) || (ST[c][id]&&before.length>0&&Object.keys(JSON.parse(before)).every(k=>JSON.stringify(ST[c][id][k])===JSON.stringify(JSON.parse(before)[k]))));
    ok(c+" bin emptied",!Object.values(ST.bin||{}).some(v=>v.path===c+"/"+id));
    if(c==="milestones")ok("milestone relinked to its task",ST.tasks.t1.milestone==="m1");
    if(c==="tasks")ok("task dependents relinked",(ST.tasks.t2.depends||[]).indexOf("t1")>=0);
  }
  // a failed bin copy deletes nothing
  window.__fail.bin=true; cap=null; clientEdit(S.clients.c1); await sl(50); clickDelete(); cap&&cap.go(); await sl(120);
  ok("failed bin copy leaves the record",!!ST.clients.c1); ok("and it is back on screen",!!S.clients.c1);
  window.__fail.bin=false;
  // the toast offers Put it back
  cap=null; pipeEdit(S.pipe.l1); await sl(50); clickDelete(); cap.go(); await sl(120);
  const t=[...document.querySelectorAll('.tst button')].filter(x=>x.textContent==="Put it back");
  ok("toast carries Put it back",t.length>0); if(t.length)t[t.length-1].click(); await sl(150);
  ok("toast restore works",!!ST.pipeline.l1);
  return A;});
 console.log(R.join("\n"));console.log("page errors",errs);await b.close();srv.close();})();
