const {chromium}=require('../h/node_modules/playwright');const http=require('http');const fs=require('fs');
const [file,W]=[process.argv[2],+(process.argv[3]||390)];const port=8850+(W%7);const OUT=__dirname+'/out/';
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(port);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await (await b.newContext({viewport:{width:W,height:900},timezoneId:'America/Chicago'})).newPage();const errs=[];
 p.on('pageerror',e=>errs.push("PAGEERROR "+String(e).slice(0,300)));
 await p.addInitScript({path:__dirname+'/mocklive.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(3500);
 const r=await p.evaluate(async()=>{const o={}; const sent=[];
   sample=Object.assign(async()=>({text:""}),{json:async(input,op)=>{sent.push({turns:Array.isArray(input)?input.length:1,len:JSON.stringify(input).length,tier:op.modelTier,cache:op.cache});
     if(sent.length===1)return {items:[
       {id:"L1",kind:"task",title:"Call Sue about the cut",project:"HLE website",person:"Sue",when_said:"",date:"2026-10-20",sure:true,why:"Sue is the HLE client"},
       {id:"L2",kind:"event",title:"Pay the Vue rent",project:"Made Up Project",person:"",when_said:"friday",date:"2026-10-16",sure:true,why:"Rent is due friday"},
       {id:"L3",kind:"task",title:"Text Mary E",project:"",person:"Mary E",when_said:"",date:"",sure:false,why:"Mary E is not in memory"},
       {id:"L4",kind:"waiting",title:"Gavin owes the dog budget number",project:"Laurel Oaks",person:"Gavin",when_said:"",date:"",sure:true,why:"Gavin owes a number"},
       {id:"L5",kind:"drop",title:"test",sure:true,why:"A test line"}],
       questions:[{text:"Who is Mary E?",options:["Girlfriend","Family","Client","Someone else"]}],learned:[]};
     return {items:[{id:"L3",kind:"task",title:"Text Mary E",person:"Mary E",sure:true,why:"Mary E is his girlfriend"}],questions:[],learned:[{type:"person",name:"Mary E",value:"his girlfriend"}]};}});
   S.room=null;S.mode="dump";paint();
   o.box=!!document.getElementById("bdta");
   document.getElementById("bdta").value="- call sue about the cut\n2. pay the vue rent friday\ntext mary e\ngavin owes me the dog budget\ntest\nbuy gaff tape";
   bdStart(); await new Promise(r=>setTimeout(r,300));
   const B=S.bd; o.n=B.items.length; o.kinds=B.items.map(x=>x.kind+":"+x.sure); o.l2=B.items[1]; o.l1date=B.items[0].date; o.l6=B.items[5];
   o.keep=B.keep; o.sum=document.querySelector('.bdsum').textContent; o.q=document.querySelectorAll('.bdq button').length;
   o.add=[...document.querySelectorAll('.bd button')].map(x=>x.textContent).filter(t=>/^Add/.test(t))[0];
   return o;});
 console.log(JSON.stringify(r,null,1));
 await p.screenshot({path:OUT+'v162-dump-'+W+'.png',fullPage:false});
 const sec=await p.$('.bd'); if(sec){const h=await sec.evaluateHandle(n=>n.closest('.dsec'));await h.asElement().screenshot({path:OUT+'v162-review-'+W+'.png'});}
 const r2=await p.evaluate(async()=>{const o={};
   [...document.querySelectorAll('.bdq button')][0].click(); await new Promise(r=>setTimeout(r,300));
   o.after=S.bd.items[2]; o.learned=S.bd.learned; o.sentTurns=null;
   const w0=window.__WRITES.length;
   [...document.querySelectorAll('.bdl button')][0].click(); await new Promise(r=>setTimeout(r,200));
   o.memWrite=window.__WRITES.slice(w0).map(w=>w[0]+" "+w[1]); o.mem=S.mem.people.map(p=>p.name+"="+p.who);
   const w1=window.__WRITES.length;
   const add=[...document.querySelectorAll('.bd button')].filter(x=>/^Add/.test(x.textContent))[0]; o.addLabel=add.textContent; add.click();
   await new Promise(r=>setTimeout(r,300));
   o.commit=window.__WRITES.slice(w1).map(w=>w[0]+" "+w[1]);
   o.newScraps=S.scraps.filter(x=>x.via==="dump").map(x=>[x.text,x.state,x.project||"",x.sort.type,x.sort.day]);
   o.toast=[...document.querySelectorAll('#toast .tst')].map(t=>t.textContent).slice(-1)[0];
   const ub=[...document.querySelectorAll('#toast button')].filter(x=>x.textContent==="Undo")[0]; const w2=window.__WRITES.length; ub.click();
   await new Promise(r=>setTimeout(r,300));
   o.undo=window.__WRITES.slice(w2).map(w=>w[0]+" "+w[1]); o.left=S.scraps.filter(x=>x.via==="dump").length;
   o.projs=Object.values(bdProjects()).slice(0,30);o.ow=document.documentElement.scrollWidth>innerWidth;
   return o;});
 console.log(JSON.stringify(r2,null,1));console.log(errs.join("\n"));
 await b.close();srv.close();})();
