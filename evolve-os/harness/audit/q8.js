S.room=null;S.mode="board";paint();
const b=[...document.querySelectorAll('button')].filter(x=>x.textContent==="Close the day")[0];
b.click(); await new Promise(r=>setTimeout(r,300));
return S.mode+" closing="+S.closing+"\n"+document.body.innerText;
