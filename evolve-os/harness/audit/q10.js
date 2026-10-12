askCreate("Gavin","ZZHAND color grade the Abell spot","");
await new Promise(r=>setTimeout(r,300));
S.room=null;S.mode="dash";paint();
const b=[...document.querySelectorAll('button')].filter(x=>x.textContent==="Gavin")[0];
b.click();await new Promise(r=>setTimeout(r,300));
const t=document.body.innerText;
S.mode="board";paint();const t2=document.body.innerText;
return {role:S.role, homeHas:/ZZHAND/.test(t), boardHas:/ZZHAND/.test(t2), home:t.slice(0,1200)};
