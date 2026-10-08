const {chromium}=require('playwright');const http=require('http');const fs=require('fs');
const file=process.argv[2], out=process.argv[3], W=+(process.argv[4]||1440);
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(8730+(W%7));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage({viewport:{width:W,height:900}});
 await p.addInitScript({path:__dirname+'/mock8.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}
   window.__errs=[];window.__ctx="load";
   window.addEventListener('error',e=>window.__errs.push([window.__ctx,String(e.message)]));
   window.addEventListener('unhandledrejection',e=>window.__errs.push([window.__ctx,"rej "+String(e.reason&&e.reason.message||e.reason)]));
   const ce=console.error;console.error=function(){window.__errs.push([window.__ctx,"console "+[...arguments].map(String).join(" ").slice(0,200)]);ce.apply(console,arguments);};});
 await p.goto('http://localhost:'+(8730+(W%7))+'/');await p.waitForTimeout(2500);
 const R=await p.evaluate(async(W)=>{
  const sl=ms=>new Promise(r=>setTimeout(r,ms));
  const screens=[];
  for(const m of ["board","now","co","dash","deliver","money","people","pipe","review","dump","settings","sweeps"])screens.push({k:"mode:"+m,go:()=>{S.room=null;S.pdr=null;S.mode=m;paint();}});
  for(const a of ["home","plan","work","dels","money","log","book"])screens.push({k:"pw:"+a,go:()=>{S.room=null;S.pdr=null;S.mode="co";S.pv="split";const w=pwState();w.id="acmebrand";w.full=true;w.area=a;w.ask=false;w.menu=false;paint();}});
  const report={},over={};
  for(const s of screens){
    window.__ctx=s.k;
    try{s.go();}catch(e){window.__errs.push([s.k,"go "+e.message]);continue;}
    await sl(200);
    // overflow check
    const sw=document.documentElement.scrollWidth;
    if(sw>window.innerWidth+1){
      const wide=[...document.querySelectorAll('body *')].filter(n=>{const r=n.getBoundingClientRect();return r.right>window.innerWidth+1&&r.width>0&&getComputedStyle(n).position!=="fixed";})
        .slice(0,5).map(n=>n.tagName+"."+String(n.className).slice(0,40)+" r="+Math.round(n.getBoundingClientRect().right));
      over[s.k]={sw,wide};}
    const n=document.querySelectorAll('button,[role=button]').length;
    report[s.k]={buttons:n,clicked:0};
    for(let i=0;i<n&&i<120;i++){
      try{s.go();}catch(e){}
      await sl(30);
      const bs=[...document.querySelectorAll('button,[role=button]')];
      const btn=bs[i]; if(!btn)break;
      const lab=(btn.getAttribute('aria-label')||btn.innerText||btn.title||"").trim().slice(0,40);
      if(/delete|remove|clear all|sign out|reset/i.test(lab))continue;
      window.__ctx=s.k+" > "+lab;
      try{btn.click();}catch(e){window.__errs.push([window.__ctx,"click "+e.message]);}
      await sl(60);
      report[s.k].clicked++;
      // close any overlay
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    }
  }
  return {report,over,errs:window.__errs};
 },W);
 fs.writeFileSync(out,JSON.stringify(R,null,1));
 const u={};R.errs.forEach(([c,m])=>{const k=m.slice(0,140);(u[k]=u[k]||[]).push(c);});
 console.log("screens",Object.keys(R.report).length,"clicks",Object.values(R.report).reduce((a,x)=>a+x.clicked,0));
 console.log("overflow",JSON.stringify(R.over,null,0).slice(0,1500));
 Object.entries(u).forEach(([m,cs])=>console.log(cs.length+"x  "+m+"\n     e.g. "+[...new Set(cs)].slice(0,4).join(" | ")));
 await b.close();srv.close();})();
