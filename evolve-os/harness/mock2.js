(function(){
  const ago=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  const DATA={
   duelist:[{id:"d1",data:{name:"Brand film cut",client:"Acme",due:ago(9),state:"In progress",project:"acmebrand"}},
            {id:"d2",data:{name:"Stills selects",client:"Acme",due:ago(3),state:"With client",project:"acmebrand"}},
            {id:"d3",data:{name:"Teaser",client:"Acme",due:ago(1),state:"In progress",project:"acmebrand"}}],
   projects:[{id:"acmebrand",data:{name:"Acme brand",client:"Acme",stage:"Production",next_action:"Send notes",next_action_due:ago(2)}}],
   tasks:[{id:"t1",data:{title:"Rough cut notes",project:"acmebrand",due:ago(4),status:"todo"}}],
   milestones:[{id:"m1",data:{title:"Picture lock",project:"acmebrand",date:ago(5)}}],
   invoices:[{id:"i1",data:{client:"Acme",amount:2400,due:ago(12),project:"acmebrand"}}]};
  const snap=n=>{const docs=(DATA[n]||[]).map(d=>({id:d.id,data:()=>d.data,exists:true}));
    return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)};};
  const col=n=>{const o={onSnapshot:(cb)=>{setTimeout(()=>cb(snap(n)),0);return ()=>{};},
    get:()=>Promise.resolve(snap(n)),orderBy:()=>o,limit:()=>o,where:()=>o};return o;};
  const doc=p=>({onSnapshot:(cb)=>{setTimeout(()=>cb({exists:false,id:p,data:()=>undefined}),0);return ()=>{};},
    set:()=>Promise.resolve(),update:()=>Promise.resolve(),delete:()=>Promise.resolve(),get:()=>Promise.resolve({exists:false,data:()=>undefined})});
  window.claude={version:"mock",use:async n=>{if(n==="db")return {collection:col,doc:doc};throw new Error("no");}};
})();
