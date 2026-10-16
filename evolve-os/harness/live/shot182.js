const {chromium}=require('../h/node_modules/playwright');const http=require('http');const fs=require('fs');
const file=process.argv[2];const port=8997;
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(port);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/Chicago'})).newPage();
 await p.addInitScript({path:__dirname+'/mocklive.js'});await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(3500);
 await p.evaluate(()=>{const now=new Date().toISOString(), old=new Date(Date.now()-30*60000).toISOString(), m2=new Date(Date.now()-2*60000).toISOString();
   S.pastes={
     pa:{url:"https://smithroofingauburn.com",host:"smithroofingauburn.com",at:m2,state:"checking"},
     pb:{url:"https://barbermarina.com",host:"barbermarina.com",at:now,state:"done",added:true,name:"Barber Marina",score:97,tier:"A: call this month",city:"Elberta",opening_fact:"No tap to call link on the homepage",prospect_id:"barbermarina.com",finished_at:now},
     pc:{url:"https://r-and-m.biz",host:"r-and-m.biz",at:now,state:"done",added:false,name:"R & M Machine Shop",score:43,tier:"Drop",why:"A job shop that makes parts for other businesses, which the rubric rules out as a prospect.",finished_at:now},
     pe:{url:"https://oldbakery.net",host:"oldbakery.net",at:old,started_at:old,state:"checking"},
     pd:{url:"https://bluebird-salon.com",host:"bluebird-salon.com",at:old,state:"failed",reason:"The check could not be started."}};
   if(S.prospects["barbermarina.com"])S.prospects["barbermarina.com"].found_by="you";
   S.mode="leads";S.room=null;S.lqSet="all";paint();
   const n=document.querySelector('input[placeholder="Paste a website link"]'); n.closest('.wide').scrollTop=n.getBoundingClientRect().top-130;});
 await p.waitForTimeout(400);
 await p.screenshot({path:__dirname+'/../v182_wording.png'});
 await b.close();srv.close();})();
