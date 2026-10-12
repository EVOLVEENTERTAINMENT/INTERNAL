S.room=null;S.mode="dash";paint();
const o={};
o.nav=[...document.querySelectorAll('button')].filter(b=>/^\s*\d+\s*$/.test(b.innerText)).map(b=>({t:b.innerText,title:b.title,al:b.getAttribute('aria-label')}));
o.carried=[...document.querySelectorAll('.homelist .lgrp')].map(x=>x.innerText);
return o;
