const {chromium}=require('/tmp/claude-0/-home-user-INTERNAL/a7daf43b-4152-56e0-97d5-60762b5270c4/scratchpad/h/node_modules/playwright');const http=require('http');const fs=require('fs');
const file=process.argv[2];const port=8851;const HL='/tmp/claude-0/-home-user-INTERNAL/a7daf43b-4152-56e0-97d5-60762b5270c4/scratchpad/hl';
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(port);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await (await b.newContext({viewport:{width:390,height:844},timezoneId:'America/Chicago'})).newPage();const errs=[];
 p.on('pageerror',e=>errs.push("PAGEERROR "+String(e).slice(0,300)));
 await p.addInitScript({path:HL+'/mocklive.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(4000);
 const r=await p.evaluate(async()=>{const o={};
   S.mem={people:[{name:"Mary E",who:"his girlfriend",area:"personal",aliases:["Mary"]}],words:[{word:"Vue",means:"his apartment lease"}],rules:["Chores for Grace go on her list"]};
   const sent=[];
   sample=Object.assign(async()=>({text:"{}"}),{json:async(q,op)=>{sent.push({q:q,tools:(op.tools||[]).map(t=>t.name),op:Object.keys(op)});
     // simulate claude calling propose_event in past + stage dupe
     const T={};(op.tools||[]).forEach(t=>T[t.name]=t);
     o.cal=await T.read_calendar.execute({from:"2026-10-12",to:"2026-10-13"});
     o.pe=await T.propose_event.execute({title:"LOVC recap",start:"2026-10-13T14:00",end:"2026-10-13T14:30"});
     o.pe2=await T.propose_event.execute({title:"LOVC recap",start:"2026-10-13T14:00",end:"2026-10-13T14:30"});
     o.pendingN=S.pending.length;
     o.cn=await T.catch_note.execute({text:"test note from chat"});
     return {reply:"ok",proposals:[{title:"X",date:"2026-10-14",start:"10:00",end:"13:00",calendar:"EVOLVE"}],question:{text:"which?",options:[{label:"A"}]}};}});
   o.counts={scraps:S.scraps.length,waiting:S.waiting.length,proj:Object.keys(S.pstate).length,events:S.events.length,mustdo:Object.keys(S.mustdo).length,ideas:S.ideas.length,done:Object.keys(S.done).length,anchor:String(S.anchor)};
   const w0=window.__WRITES.length;
   S.lane="ask"; S.busy=false; const ta=document.getElementById("cmd"); ta.value="what should I do tonight"; fire(); await new Promise(r=>setTimeout(r,2500));
   o.writes=window.__WRITES.slice(w0).map(w=>w[1]);
   o.chatlog=(window.__WRITES.slice(w0).filter(w=>w[1]==="chat/log")[0]||[])[2];
   o.sent=sent.map(s=>({len:s.q.length,bytes:new Blob([s.q]).size,tools:s.tools,op:s.op}));
   o.prompt=sent[0]&&sent[0].q; const pb0=document.querySelector("#talk .plan button"); const pn=S.pending.length; pb0.click(); await new Promise(r=>setTimeout(r,300)); o.afterStage=S.pending.slice(pn).map(p=>[p.title,(p.toE-p.toS)/60000]); pb0.click(); o.afterStage2=S.pending.length-pn; o.chatTurns=S.chat.map(m=>Object.keys(m));
   o.scrapsInPrompt=S.scraps.slice(0,5).map(x=>[x.text&&x.text.slice(0,40),sent[0].q.indexOf((x.text||"").slice(0,30))>=0]);
   o.planBtn=!!document.querySelector('#talk .plan button');
   const talk=document.getElementById('talk'); if(talk){const rc=talk.getBoundingClientRect();o.talkRect=[rc.x,rc.y,rc.width,rc.height];}
   const pb=document.querySelector('#talk .plan button'); if(pb){const rc=pb.getBoundingClientRect();o.pbRect=[rc.x,rc.y,rc.width,rc.height];}
   const cmd=document.getElementById('cmd').getBoundingClientRect(); o.cmdRect=[cmd.x,cmd.y,cmd.width,cmd.height];
   return o;});
 fs.writeFileSync(__dirname+'/prompt1.txt',r.prompt||'');delete r.prompt;
 console.log(JSON.stringify({chatlog:r.chatlog,afterStage:r.afterStage,afterStage2:r.afterStage2,chatTurns:r.chatTurns,talkRect:r.talkRect},null,1));console.log(errs.join("\n"));
 await p.screenshot({path:__dirname+'/chat1.png'});
 await b.close();srv.close();})();
