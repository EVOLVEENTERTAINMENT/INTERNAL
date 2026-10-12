const o={};
o.fix=fixFindings().map(f=>f.kind+": "+f.what.slice(0,120));
o.ny=needYou(view()).map(r=>r.id+" | "+r.who+" | "+String(r.cond).slice(0,90));
S.room=null;S.mode="board";paint();
const b=[...document.querySelectorAll('button')].filter(x=>x.textContent==="Fix them one at a time")[0];
b.click(); await new Promise(r=>setTimeout(r,200));
o.after=S.mode+" :: "+document.body.innerText.slice(0,900);
return o;
