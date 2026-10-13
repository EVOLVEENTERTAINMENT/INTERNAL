const {chromium}=require('../h/node_modules/playwright');const http=require('http');const fs=require('fs');
const file=process.argv[2];const W=+(process.argv[3]||390);const OUT=process.argv[4]||'mob';const port=8900+(W%50);
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(port);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await (await b.newContext({viewport:{width:W,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true,timezoneId:'America/Chicago'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript({path:__dirname+'/mocklive.js'});await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(3500);
 const S0=`S.room=null;S.pdr=null;S.queueOpen=false;S.nowOpen=false;S.talkOpen=false;`;
 const screens=[
  ["dash",`S.mode="dash"`],["board",`S.mode="board";S.view="day";S.anchor=bday(new Date())`],["week",`S.mode="board";S.view="week";S.wk="list"`],
  ["weekgrid",`S.mode="board";S.view="week";S.wk="grid"`],["co",`S.mode="co";S.pv="split";pwState().full=false`],
  ["coclient",`S.mode="co";S.pv="client"`],["costage",`S.mode="co";S.pv="stage"`],
  ["deliver",`S.mode="deliver"`],["money",`S.mode="money"`],["people",`S.mode="people"`],["pipe",`S.mode="pipe"`],
  ["review",`S.mode="review"`],["recap",`S.mode="review";S.recap=true`],["dump",`S.mode="dump";S.recap=false`],["settings",`S.mode="settings"`],["sweeps",`S.mode="sweeps"`],["now",`S.mode="now"`],
  ["nowpanel",`S.mode="dash";S.nowOpen=true`],["queue",`S.mode="board";S.queueOpen=true`],["talk",`S.mode="dash";S.talkOpen=true`],
 ];
 for(const a of ["home","plan","work","dels","money","log","book","client","team","files"])screens.push(["pw-"+a,`S.mode="co";S.pv="split";const w=pwState();w.id="billabell";w.full=true;w.area="${a}";w.ask=false;w.menu=false`]);
 const res={};
 for(const [k,js] of screens){
  try{await p.evaluate(S0+js+";paint();window.scrollTo(0,0);");}catch(e){res[k]={err:String(e).slice(0,200)};continue;}
  await p.waitForTimeout(350);
  res[k]=await p.evaluate((W)=>{
   const vis=n=>{const r=n.getBoundingClientRect();const cs=getComputedStyle(n);return r.width>0&&r.height>0&&cs.visibility!=="hidden"&&cs.display!=="none"&&cs.opacity!=="0";};
   const lab=n=>(n.tagName+"."+String(n.className||"").split(" ")[0]+" '"+(n.getAttribute("aria-label")||n.innerText||"").trim().slice(0,28)+"'").replace(/\n/g," ");
   const small=[...document.querySelectorAll('button,[role=button],a,input,select,textarea')].filter(vis).filter(n=>{const r=n.getBoundingClientRect();return (r.height<36||r.width<36);})
     .map(n=>{const r=n.getBoundingClientRect();return lab(n)+" "+Math.round(r.width)+"x"+Math.round(r.height);});
   const tiny={};[...document.querySelectorAll('body *')].forEach(n=>{if(!vis(n))return;const t=[...n.childNodes].filter(c=>c.nodeType===3&&c.textContent.trim()).length;if(!t)return;const fs=parseFloat(getComputedStyle(n).fontSize);if(fs<11){const kk=n.tagName+"."+String(n.className||"").split(" ")[0]+" "+fs;tiny[kk]=(tiny[kk]||0)+1;}});
   const clip=[...document.querySelectorAll('body *')].filter(vis).filter(n=>{const cs=getComputedStyle(n);return n.scrollWidth>n.clientWidth+2&&!/auto|scroll/.test(cs.overflowX)&&cs.overflow!=="visible"&&cs.textOverflow!=="ellipsis"&&n.clientWidth>0&&!["INPUT","TEXTAREA","SELECT"].includes(n.tagName);}).slice(0,12).map(n=>lab(n)+" sw"+n.scrollWidth+">cw"+n.clientWidth);
   const hscroll=[...document.querySelectorAll('body *')].filter(vis).filter(n=>{const cs=getComputedStyle(n);return /auto|scroll/.test(cs.overflowX)&&n.scrollWidth>n.clientWidth+2;}).map(n=>lab(n)+" sw"+n.scrollWidth+">cw"+n.clientWidth).slice(0,8);
   const offR=[...document.querySelectorAll('body *')].filter(vis).filter(n=>{const r=n.getBoundingClientRect();return r.right>W+1&&getComputedStyle(n).position!=="fixed";}).slice(0,6).map(n=>lab(n)+" r"+Math.round(n.getBoundingClientRect().right));
   const gut=[...document.querySelectorAll('.pan,.card,section,.dashwrap > *,main > *')].filter(vis).filter(n=>{const r=n.getBoundingClientRect();return r.width>200&&(r.left<8||W-r.right<8)&&r.width<W;}).slice(0,6).map(n=>lab(n)+" L"+Math.round(n.getBoundingClientRect().left)+" R"+Math.round(W-n.getBoundingClientRect().right));
   return {h:document.documentElement.scrollHeight,sw:document.documentElement.scrollWidth,small:small.slice(0,40),nsmall:small.length,tiny,clip,hscroll,offR,gut};
  },W);
  const extra=await p.evaluate(()=>{let m=0;[...document.querySelectorAll('*')].forEach(n=>{if(/auto|scroll/.test(getComputedStyle(n).overflowY)&&n.clientHeight>300)m=Math.max(m,n.scrollHeight-n.clientHeight);});return m;});
  if(process.env.FULL&&extra>0){await p.setViewportSize({width:W,height:Math.min(844+extra,7000)});await p.waitForTimeout(250);}
  await p.screenshot({path:`${OUT}/${W}_${k}.png`});
  if(process.env.FULL&&extra>0){await p.setViewportSize({width:W,height:844});}
 }
 fs.writeFileSync(`${OUT}/${W}.json`,JSON.stringify(res,null,1));
 for(const k in res){const r=res[k];console.log(k.padEnd(10),"h",r.h,"sw",r.sw,"small",r.nsmall,"clip",(r.clip||[]).length,"hs",(r.hscroll||[]).length,"off",(r.offR||[]).length,"gut",(r.gut||[]).length,"tiny",Object.values(r.tiny||{}).reduce((a,b)=>a+b,0),r.err||"");}
 console.log(errs.join("\n"));await b.close();srv.close();})();
