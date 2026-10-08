const {chromium}=require('playwright');const http=require('http');const fs=require('fs');
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(process.argv[2]));}).listen(8797);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript({path:__dirname+'/mock6.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:8797/');await p.waitForTimeout(2000);
 const R=await p.evaluate(async()=>{const A=[];const ok=(n,c)=>A.push((c?"PASS ":"FAIL ")+n);
  const cl=clientsOf(view()).filter(c=>c.key==="acme")[0];
  ok("client booked 7000, not counting the name-only lead ("+cl.tot.booked+")",cl.tot.booked===7000);
  ok("project social booked 2000",wonFor(o=>o.project_slug==="acmesocial")===2000);
  ok("invoice totals unchanged (owed "+cl.tot.owed+")",cl.tot.owed===3900&&cl.tot.invoiced===5200);
  S.room=null;S.mode="co";S.pv="client";paint();await new Promise(r=>setTimeout(r,300));
  const ct=document.querySelector('.ccard .ctot'); ok("client line starts with booked: "+(ct&&ct.textContent),!!ct&&/^\$7,000 booked/.test(ct.textContent));
  const pts=[...document.querySelectorAll('.ccard .ptot')].map(n=>n.textContent);
  ok("social row has booked: "+pts.join(" | "),pts.some(t=>/^\$2,000 booked/.test(t))&&pts.some(t=>!/booked/.test(t)));
  // the lead editor offers the client and saves it
  let cap=null; const real=prompt2; window.prompt2=(t,fields,cb)=>{cap={fields,cb};};
  pipeEdit(S.pipe.L3);
  const f=cap.fields.filter(x=>x.k==="client")[0];
  ok("editor has a Client select listing Acme",!!f&&f.options.some(o=>o[0]==="Acme")&&f.options[0][1]==="No client yet");
  const v={}; cap.fields.forEach(x=>{v[x.k]=x.value;}); v.client="Acme"; cap.cb(v);
  ok("saved on the lead",S.pipe.L3.client==="Acme");
  const cl2=clientsOf(view()).filter(c=>c.key==="acme")[0];
  ok("now it counts: booked 16000 ("+cl2.tot.booked+")",cl2.tot.booked===16000);
  // a client typed before this build stays in the list
  pipeEdit(Object.assign({},S.pipe.L4,{client:"Old Name Co"}));
  ok("unknown client kept as an option",cap.fields.filter(x=>x.k==="client")[0].options.some(o=>o[0]==="Old Name Co"));
  // Won sheet keeps the client on the lead
  wonSheet(Object.assign({id:"L4"},S.pipe.L4));
  const wv={}; cap.fields.forEach(x=>{wv[x.k]=x.value;}); wv.project=""; wv.amount="";
  ok("won sheet starts from the lead's client ("+wv.client+")",wv.client==="Acme");
  cap.cb(wv); ok("won sheet saved client on the lead",S.pipe.L4.client==="Acme"&&isWon(S.pipe.L4));
  window.prompt2=real; return A;});
 console.log(R.join("\n"),"\nerrors",errs);await b.close();srv.close();})();
