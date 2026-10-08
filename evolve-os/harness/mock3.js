(function(){
  const ago=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  const ST={};const put=(c,id,d)=>{(ST[c]=ST[c]||{})[id]=JSON.parse(JSON.stringify(d));};
  put("duelist","d1",{name:"Brand film cut",client:"Acme",due:ago(9),state:"In progress",project:"acmebrand"});
  put("projects","acmebrand",{name:"Acme brand",client:"Acme",stage:"Production"});
  put("clients","c1",{name:"Acme"});
  put("pipeline","l1",{name:"Laurel Oaks",value:"5000"});
  put("tasks","t1",{title:"Rough cut notes",project:"acmebrand",due:ago(4),status:"todo",milestone:"m1"});
  put("tasks","t2",{title:"Color pass",project:"acmebrand",due:ago(-3),status:"todo",depends:["t1"]});
  put("milestones","m1",{title:"Picture lock",project:"acmebrand",date:ago(5)});
  put("invoices","i1",{client:"Acme",amount:2400,due:ago(12),project:"acmebrand"});
  put("expenses","e1",{amount:120,category:"Gear",project:"acmebrand"});
  put("decisions","x1",{what:"Shoot on the 14th",project:"acmebrand",at:new Date().toISOString()});
  put("bin","bold",{path:"clients/zz",kind:"client",label:"Old one",data:{name:"Old one"},at:new Date(Date.now()-40*864e5).toISOString()});
  const subs={};window.__ST=ST;window.__fail={};
  const snap=c=>{const docs=Object.keys(ST[c]||{}).map(id=>({id,data:()=>JSON.parse(JSON.stringify(ST[c][id])),exists:true}));
    return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)};};
  const fire=c=>setTimeout(()=>(subs[c]||[]).forEach(cb=>cb(snap(c))),0);
  const col=c=>{const o={onSnapshot:cb=>{(subs[c]=subs[c]||[]).push(cb);setTimeout(()=>cb(snap(c)),0);return ()=>{};},
    get:()=>Promise.resolve(snap(c)),orderBy:()=>o,limit:()=>o,where:()=>o};return o;};
  const doc=p=>{const [c,id]=p.split("/");const chk=()=>{if(window.__fail[c])return Promise.reject({code:"boom"});return null;};
    return {onSnapshot:cb=>{setTimeout(()=>cb({exists:!!(ST[c]&&ST[c][id]),id,data:()=>ST[c]&&ST[c][id]}),0);return ()=>{};},
    set:d=>chk()||(put(c,id,d),fire(c),Promise.resolve()),
    update:d=>chk()||(ST[c]&&ST[c][id]?(Object.assign(ST[c][id],d),fire(c),Promise.resolve()):Promise.reject({code:"not_found"})),
    delete:()=>chk()||(ST[c]&&delete ST[c][id],fire(c),Promise.resolve()),
    get:()=>Promise.resolve({exists:!!(ST[c]&&ST[c][id]),data:()=>ST[c]&&ST[c][id]})};};
  window.claude={version:"mock",use:async n=>{if(n==="db")return {collection:col,doc:doc};throw new Error("no");}};
})();
