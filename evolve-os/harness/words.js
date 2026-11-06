/* words.js. Opens a board file in headless Chromium on the mock data
   (mock2.js, the same seed probe.js uses), paints every mode and the main sub
   views, and gathers the text a viewer can see on each screen: the body text,
   plus title, placeholder and aria-label values on visible elements, which
   show on hover or in an empty box. It then lists every whole word hit on
   overdue, late, missed and behind (case does not matter, so template,
   calculate and related do not count) and any em dash or en dash on screen,
   each with the screen it was seen on. After that it scans the source: every
   string literal in the script blocks that holds one of those dashes, and
   every line of the file that holds one, so nothing is missed.
   Usage: node harness/words.js <file.html> [out.json]
   The Chromium path comes from EVOLVE_CHROMIUM when set; the default below
   is specific to this container (the playwright browser folder), like the
   port 8777 the local server uses. Set EVOLVE_CHROMIUM elsewhere.
   Exit code is 0 when the page painted without errors; the hit list is for a
   person to judge, so it does not fail the run. */
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const file=process.argv[2], out=process.argv[3];
if(!file){console.log('usage: node words.js <file.html> [out.json]');process.exit(2);}
const PORT=8777;
const CHROMIUM=process.env.EVOLVE_CHROMIUM||'/opt/pw-browsers/chromium';
const WORDS=/\b(overdue|late|missed|behind)\b/gi;
// the two dash characters are built from their codes (8211 en, 8212 em) so this file holds neither
const DASH=new RegExp('['+String.fromCharCode(8211,8212)+']','g');
const DASHNAME=ch=>ch.charCodeAt(0)===8212?'em dash':'en dash';
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(PORT);
(async()=>{
 const b=await chromium.launch({executablePath:CHROMIUM});
 const p=await b.newPage({viewport:{width:1440,height:1000}});
 const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.addInitScript({path:__dirname+'/mock2.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}});
 await p.goto('http://localhost:'+PORT+'/');await p.waitForTimeout(2500);
 const S0='S.room=null;S.pdr=null;S.queueOpen=false;S.nowOpen=false;S.talkOpen=false;S.recap=false;';
 const screens=[
  ['dash','S.mode="dash"'],
  ['board day','S.mode="board";S.view="day"'],
  ['board week list','S.mode="board";S.view="week";S.wk="list"'],
  ['board week grid','S.mode="board";S.view="week";S.wk="grid"'],
  ['now','S.mode="now"'],
  ['co split','S.mode="co";S.pv="split";pwState().full=false'],
  ['co client','S.mode="co";S.pv="client"'],
  ['co stage','S.mode="co";S.pv="stage"'],
  ['co arch','S.mode="co";S.pv="arch"'],
  ['leads','S.mode="leads"'],
  ['pipe','S.mode="pipe"'],
  ['money','S.mode="money"'],
  ['people','S.mode="people"'],
  ['deliver','S.mode="deliver"'],
  ['dump','S.mode="dump"'],
  ['brain','S.mode="brain"'],
  ['settings','S.mode="settings"'],
  ['review','S.mode="review"'],
  ['review recap','S.mode="review";S.recap=true'],
  ['sweeps','S.mode="sweeps"'],
  ['now panel','S.mode="dash";S.nowOpen=true'],
  ['queue','S.mode="board";S.queueOpen=true'],
  ['talk','S.mode="dash";S.talkOpen=true'],
 ];
 for(const a of ['home','plan','work','dels','money','log','book','client','team','files'])
   screens.push(['pw '+a,'S.mode="co";S.pv="split";const w=pwState();w.id="acmebrand";w.full=true;w.area="'+a+'";w.ask=false;w.menu=false']);
 const seen={};   // screen -> {text, attrs, err}
 for(const [k,js] of screens){
   try{await p.evaluate(S0+js+';paint();window.scrollTo(0,0);');}
   catch(e){seen[k]={err:String(e).slice(0,200),text:'',attrs:[]};continue;}
   await p.waitForTimeout(350);
   seen[k]=await p.evaluate(()=>{
     const vis=n=>{const r=n.getBoundingClientRect();const cs=getComputedStyle(n);
       return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none';};
     const attrs=[];
     document.querySelectorAll('[title],[placeholder],[aria-label]').forEach(n=>{
       if(!vis(n))return;
       ['title','placeholder','aria-label'].forEach(a=>{const v=n.getAttribute(a);if(v&&v.trim())attrs.push(a+': '+v.trim());});});
     return {text:document.body.innerText||'',attrs:attrs};});
 }
 await b.close();srv.close();

 // on screen hits: one row per distinct line, with every screen it showed on
 const rows={};
 const note=(kind,line,what,screen)=>{
   const key=kind+'|'+what+'|'+line;
   (rows[key]=rows[key]||{kind:kind,what:what,line:line,screens:[]});
   if(rows[key].screens.indexOf(screen)<0)rows[key].screens.push(screen);};
 const scanLine=(line,screen,kind)=>{
   const t=line.trim(); if(!t)return;
   let m; WORDS.lastIndex=0;
   while((m=WORDS.exec(t)))note(kind,t.slice(0,160),m[1].toLowerCase(),screen);
   DASH.lastIndex=0;
   while((m=DASH.exec(t)))note(kind,t.slice(0,160),DASHNAME(m[0]),screen);};
 Object.keys(seen).forEach(k=>{
   seen[k].text.split('\n').forEach(l=>scanLine(l,k,'screen'));
   seen[k].attrs.forEach(l=>scanLine(l,k,'hover'));});
 const hits=Object.values(rows);

 // the source: string literals in the script blocks, then every line
 const html=fs.readFileSync(file,'utf8');
 const lineOf=i=>html.slice(0,i).split('\n').length;
 const lits=[];
 const sre=/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi; let sm;
 while((sm=sre.exec(html))){
   const base=sm.index+sm[0].indexOf(sm[1]);
   const lre=/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g; let lm;
   while((lm=lre.exec(sm[1]))){
     if(DASH.test(lm[0])){DASH.lastIndex=0;lits.push({line:lineOf(base+lm.index),literal:lm[0].slice(0,160)});}
     DASH.lastIndex=0;}
 }
 const srcLines=[];
 html.split('\n').forEach((l,i)=>{ DASH.lastIndex=0; if(DASH.test(l))srcLines.push({line:i+1,text:l.trim().slice(0,160)}); DASH.lastIndex=0; });

 const painted=Object.keys(seen).filter(k=>!seen[k].err);
 const failed=Object.keys(seen).filter(k=>seen[k].err).map(k=>k+': '+seen[k].err);
 const R={file:path.basename(file),screens:painted.length,failedScreens:failed,pageErrors:errs,
   onScreen:hits.sort((a,b)=>(a.what+a.line).localeCompare(b.what+b.line)),
   sourceLiterals:lits,sourceLines:srcLines};
 if(out)fs.writeFileSync(out,JSON.stringify(R,null,1));
 console.log('file',R.file,'screens painted',painted.length,'of',screens.length,'page errors',errs.length);
 if(failed.length)console.log('could not paint:\n  '+failed.join('\n  '));
 if(errs.length)console.log('page errors:\n  '+errs.join('\n  '));
 const by={}; hits.forEach(h=>{by[h.what]=(by[h.what]||0)+1;});
 console.log('on screen hits (distinct lines):',JSON.stringify(by));
 hits.forEach(h=>console.log('  ['+h.what+'] ('+h.kind+') '+JSON.stringify(h.line)+'\n      on: '+h.screens.join(', ')));
 console.log('source string literals with a dash:',lits.length);
 lits.forEach(l=>console.log('  line '+l.line+': '+l.literal));
 console.log('source lines with a dash:',srcLines.length);
 srcLines.forEach(l=>console.log('  line '+l.line+': '+l.text));
 process.exit(errs.length||failed.length?1:0);
})().catch(e=>{console.log('harness failed',e);srv.close();process.exit(2);});
