const {chromium}=require('../h/node_modules/playwright');const http=require('http');const fs=require('fs');
const file=process.argv[2];const port=8994;const W=+(process.argv[3]||390);
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(port);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await (await b.newContext({viewport:{width:W,height:844},timezoneId:'America/Chicago'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript({path:__dirname+'/mocklive.js'});await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(3500);
 const r=await p.evaluate(async()=>{const o={};const tk=dk(bday(new Date())), tm=dk(plus(bday(new Date()),1)), yd=dk(plus(bday(new Date()),-2));
   S.tasks=(S.tasks||[]).concat([{id:"tx1",title:"GAVIN financials review",project:"billabell",due:tk,status:"open",owner:""},
     {id:"tx2",title:"Post summer dump",project:"billabell",due:yd,status:"open",owner:"Jackson"},
     {id:"tx3",title:"Tomorrow thing",project:"billabell",due:tm,status:"open",owner:""},
     {id:"tx4",title:"Grace job",project:"billabell",due:tk,status:"open",owner:"Grace"}]);
   S.mode="board";S.view="day";S.anchor=bday(new Date());paint();
   o.today=[...document.querySelectorAll('.btodo .r')].map(x=>x.innerText.replace(/\n/g," | "));
   S.anchor=plus(bday(new Date()),1);paint();
   o.tomorrow=[...document.querySelectorAll('.btodo .r')].map(x=>x.innerText.replace(/\n/g," | "));
   S.anchor=plus(bday(new Date()),-1);paint(); o.yday=document.querySelectorAll('.btodo').length;
   S.mode="dash";paint(); o.home=[...document.querySelectorAll('.homelist .r')].filter(x=>/financials|summer|Tomorrow|Grace job/.test(x.innerText)).map(x=>x.innerText.replace(/\n/g," | "));
   S.mode="co";paint(); o.co=document.querySelector('.pwtop').innerText.replace(/\n/g," ");
   return o;});
 await p.evaluate(()=>{S.mode="board";S.anchor=bday(new Date());paint();window.scrollTo(0,0);});await p.waitForTimeout(300);
 await p.screenshot({path:__dirname+'/../v177_board_'+W+'.png'});
 await p.evaluate(()=>{S.mode="co";paint();const w=pwState();w.id="billabell";w.full=true;paint();});await p.waitForTimeout(300);
 r.portal=await p.evaluate(()=>document.body.innerText.split("\n").filter(s=>/ATTENTION|Waiting|need|Nothing blocked|WAITING|Nothing is out/i.test(s)).slice(0,12));
 console.log(JSON.stringify(r,null,1));console.log(errs.join("\n"));await b.close();srv.close();})();
