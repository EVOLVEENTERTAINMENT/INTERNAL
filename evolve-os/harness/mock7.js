(function(){
  const day=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
  const nm=((new Date().getMonth()+1)%12)+1;
  const DATA={
   projects:[{id:"acmebrand",data:{name:"Acme brand",client:"Acme",stage:"Production"}}],
   invoices:[
    {id:"i1",data:{client:"Acme",project:"acmebrand",amount:2400,due:day(5),state:"sent"}},
    {id:"i2",data:{client:"Acme",project:"acmebrand",amount:1200,due:day(20),state:"sent",payments:[{amount:300,on:day(-1)}]}},
    {id:"i3",data:{client:"Acme",project:"acmebrand",amount:500,due:day(10),state:"draft"}},
    {id:"i4",data:{client:"Acme",project:"acmebrand",amount:1000,due:day(-12),state:"sent"}}],
   costs:[
    {id:"c1",data:{name:"Studio rent",amount:1200,kind:"business",every:"month",day:"1"}},
    {id:"c2",data:{name:"Software",amount:300,kind:"business",every:"month",day:"15"}},
    {id:"c3",data:{name:"Living",amount:2500,kind:"personal",every:"month",day:"3"}},
    {id:"c4",data:{name:"Insurance",amount:1200,kind:"business",every:"year",day:"10",month:String(nm)}},
    {id:"c5",data:{name:"Groceries",amount:150,kind:"personal",every:"week",day:"6"}}]};
  window.__DATA=DATA;
  const PREFS={plan_avg:2900,plan_win:5,plan_cash:1500,plan_cash_at:day(0)};
  const snap=n=>{const docs=(DATA[n]||[]).map(d=>({id:d.id,data:()=>d.data,exists:true}));
    return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)};};
  const col=n=>{const o={onSnapshot:(cb)=>{setTimeout(()=>cb(snap(n)),0);return ()=>{};},
    get:()=>Promise.resolve(snap(n)),orderBy:()=>o,limit:()=>o,where:()=>o};return o;};
  const doc=p=>({onSnapshot:(cb)=>{setTimeout(()=>cb(p==="prefs/operating"?{exists:true,id:p,data:()=>PREFS}:{exists:false,id:p,data:()=>undefined}),0);return ()=>{};},
    set:()=>Promise.resolve(),update:()=>Promise.resolve(),delete:()=>Promise.resolve(),get:()=>Promise.resolve({exists:false,data:()=>undefined})});
  window.claude={version:"mock",use:async n=>{if(n==="db")return {collection:col,doc:doc};throw new Error("no");}};
})();
