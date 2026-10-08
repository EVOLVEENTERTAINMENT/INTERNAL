const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const crypto=require('crypto');
const [A,B,W]=[process.argv[2],process.argv[3],+(process.argv[4]||1440)];
async function grab(file,port){
 const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(file));}).listen(port);
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage({viewport:{width:W,height:900}});
 await p.addInitScript({path:__dirname+'/mock2.js'});
 await p.addInitScript(()=>{try{localStorage.setItem('evolve-toured','1')}catch(e){}
   const F=Date.UTC(2026,9,9,15,0,0);const D=Date;class FD extends D{constructor(...a){if(a.length)super(...a);else super(F);}static now(){return F;}};window.Date=FD;});
 await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(2000);
 const out=await p.evaluate(async()=>{
  const sl=ms=>new Promise(r=>setTimeout(r,ms));const res={};
  const screens=[];
  for(const m of ["board","now","co","dash","deliver","money","people","pipe","review","dump","settings","sweeps"])screens.push(["mode:"+m,()=>{S.room=null;S.pdr=null;S.mode=m;paint();}]);
  for(const a of ["home","plan","work","dels","money","log","book"])screens.push(["pw:"+a,()=>{S.room=null;S.pdr=null;S.mode="co";S.pv="split";const w=pwState();w.id="acmebrand";w.full=true;w.area=a;paint();}]);
  const fz=document.createElement("style");fz.textContent="*,*::before,*::after{animation:none!important;transition:none!important}";document.head.appendChild(fz);
  for(const [k,go] of screens){go();if(!fz.isConnected)document.head.appendChild(fz);await sl(250);
    const els=[...document.querySelectorAll('*')];
    res[k]=els.map(n=>{const cs=getComputedStyle(n);const ps=[];for(let i=0;i<cs.length;i++){const pr=cs[i];if(/^(animation|transition)/.test(pr))continue;ps.push(pr+":"+cs.getPropertyValue(pr));}return n.tagName+"|"+n.className+"|"+ps.sort().join(";");});}
  return res;});
 await b.close();srv.close();return out;}
(async()=>{const a=await grab(A,8801),b=await grab(B,8802);let bad=0,tot=0;
 for(const k of Object.keys(a)){const x=a[k],y=b[k];tot+=x.length;
   if(x.length!==y.length){console.log(k,"element count differs",x.length,y.length);bad++;continue;}
   let d=0;for(let i=0;i<x.length;i++)if(x[i]!==y[i]){if(d<2){const P=s=>Object.fromEntries(s.split("|").slice(2).join("|").split(";").map(z=>[z.split(":")[0],z.split(":").slice(1).join(":")]));const X=P(x[i]),Y=P(y[i]);console.log(k,"diff at",x[i].split("|").slice(0,2).join("|"),[...new Set(Object.keys(X).concat(Object.keys(Y)))].filter(q=>X[q]!==Y[q]).slice(0,4).map(q=>q+"="+String(X[q]).slice(0,40)+" / "+String(Y[q]).slice(0,40)).join(" ; "));}d++;}
   if(d){bad++;console.log(k,d,"elements differ");}}
 console.log("width",W,"screens",Object.keys(a).length,"elements compared",tot,"screens with differences",bad);})();
