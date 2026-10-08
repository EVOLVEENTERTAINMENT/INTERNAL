(function(){
  const ago=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  const iso=(d,h)=>new Date(Date.now()-d*864e5+h*3600e3).toISOString();
  const DATA={
   projects:[{id:"acmebrand",data:{name:"Acme brand",client:"Acme",stage:"Production"}},
             {id:"acmesocial",data:{name:"Acme social",client:"Acme",stage:"Production"}}],
   clients:[{id:"c1",data:{name:"Acme"}}],
   invoices:[
    {id:"i1",data:{client:"Acme",project:"acmebrand",amount:2400,due:ago(12),state:"sent"}},
    {id:"i2",data:{client:"Acme",project:"acmebrand",amount:1000,due:ago(20),state:"paid",payments:[{amount:1000,at:ago(15)}]}},
    {id:"i3",data:{client:"Acme",project:"acmebrand",amount:500,due:ago(-10),state:"draft"}},
    {id:"i4",data:{client:"Acme",project:"acmebrand",amount:800,due:ago(5),state:"void"}},
    {id:"i5",data:{client:"Acme",project:"acmesocial",amount:1200,due:ago(-5),state:"sent",payments:[{amount:300,at:ago(2)}]}},
    {id:"i6",data:{client:"Acme",amount:600,due:ago(-20),state:"sent"}}],
   time_entries:[
    {id:"e1",data:{project_id:"acmebrand",started_at:iso(3,0),ended_at:iso(3,1.5),rate:100}},
    {id:"e2",data:{project_id:"acmebrand",started_at:iso(2,0),ended_at:iso(2,0.5),rate:100}},
    {id:"e3",data:{project_id:"acmesocial",started_at:iso(1,0),ended_at:iso(1,1),rate:100}}]};
  const snap=n=>{const docs=(DATA[n]||[]).map(d=>({id:d.id,data:()=>d.data,exists:true}));
    return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)};};
  const col=n=>{const o={onSnapshot:(cb)=>{setTimeout(()=>cb(snap(n)),0);return ()=>{};},
    get:()=>Promise.resolve(snap(n)),orderBy:()=>o,limit:()=>o,where:()=>o};return o;};
  const doc=p=>({onSnapshot:(cb)=>{setTimeout(()=>cb({exists:false,id:p,data:()=>undefined}),0);return ()=>{};},
    set:()=>Promise.resolve(),update:()=>Promise.resolve(),delete:()=>Promise.resolve(),get:()=>Promise.resolve({exists:false,data:()=>undefined})});
  window.claude={version:"mock",use:async n=>{if(n==="db")return {collection:col,doc:doc};throw new Error("no");}};
})();
