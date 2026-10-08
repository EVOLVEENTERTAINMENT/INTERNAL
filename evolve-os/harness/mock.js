(function(){
  const due=new Date(Date.now()-9*864e5).toISOString().slice(0,10);
  const DATA={duelist:[{id:"d1",data:{name:"Brand film cut",client:"Acme",due:due,state:"In progress",project:"Acme brand"}}]};
  const snap=n=>{const docs=(DATA[n]||[]).map(d=>({id:d.id,data:()=>d.data,exists:true}));
    return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)};};
  const col=n=>{const o={onSnapshot:(cb)=>{setTimeout(()=>cb(snap(n)),0);return ()=>{};},
    get:()=>Promise.resolve(snap(n)),orderBy:()=>o,limit:()=>o,where:()=>o};return o;};
  const doc=p=>({onSnapshot:(cb)=>{setTimeout(()=>cb({exists:false,id:p,data:()=>undefined}),0);return ()=>{};},
    set:()=>Promise.resolve(),update:()=>Promise.resolve(),delete:()=>Promise.resolve(),get:()=>Promise.resolve({exists:false,data:()=>undefined})});
  const db={collection:col,doc:doc};
  window.claude={version:"mock",use:async n=>{if(n==="db")return db;if(n==="permissions")throw new Error("no");return null;}};
})();
