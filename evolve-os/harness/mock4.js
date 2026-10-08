(function(){
  const D=n=>{const d=new Date(Date.UTC(2026,9,n,12));return d.toISOString().slice(0,10);};
  const DATA={
   projects:[{id:"acmebrand",data:{name:"Acme brand",client:"Acme",stage:"Production"}}],
   tasks:[
    {id:"A",data:{title:"Script",project:"acmebrand",start:D(12),due:D(14),status:"todo",phase:""}},
    {id:"B",data:{title:"Shoot",project:"acmebrand",start:D(15),due:D(17),status:"todo",depends:["A"]}},
    {id:"C",data:{title:"Stills",project:"acmebrand",start:D(15),due:D(16),status:"todo",depends:["A"]}},
    {id:"Dd",data:{title:"Edit",project:"acmebrand",start:D(18),due:D(22),status:"doing",depends:["B"]}},
    {id:"E",data:{title:"Retouch",project:"acmebrand",start:D(18),due:D(19),status:"todo",depends:["C"]}},
    {id:"F",data:{title:"Permits",project:"acmebrand",start:D(13),due:D(13),status:"blocked"}},
    {id:"G",data:{title:"Old done",project:"acmebrand",start:D(10),due:D(11),status:"done"}}],
   milestones:[{id:"m1",data:{title:"Picture lock",project:"acmebrand",date:D(22)}}]};
  const snap=n=>{const docs=(DATA[n]||[]).map(d=>({id:d.id,data:()=>d.data,exists:true}));
    return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)};};
  const col=n=>{const o={onSnapshot:(cb)=>{setTimeout(()=>cb(snap(n)),0);return ()=>{};},
    get:()=>Promise.resolve(snap(n)),orderBy:()=>o,limit:()=>o,where:()=>o};return o;};
  const doc=p=>({onSnapshot:(cb)=>{setTimeout(()=>cb({exists:false,id:p,data:()=>undefined}),0);return ()=>{};},
    set:()=>Promise.resolve(),update:()=>Promise.resolve(),delete:()=>Promise.resolve(),get:()=>Promise.resolve({exists:false,data:()=>undefined})});
  window.claude={version:"mock",use:async n=>{if(n==="db")return {collection:col,doc:doc};throw new Error("no");}};
})();
