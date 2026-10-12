S.room=null;S.mode="dash";paint();
const bs=[...document.querySelectorAll('button')].filter(b=>/^\s*\d+\s*$/.test(b.innerText));
return bs.map(b=>b.outerHTML.slice(0,400)).concat([document.querySelector('.homelist').parentElement.innerText.split('CARRIED')[1]]);
