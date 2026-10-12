S.room=null;S.mode="dash";paint();
const h=document.querySelector('.hbp');const cs=h.querySelector('.sb');
return {html:h.outerHTML.slice(0,500),sbdisp:cs?getComputedStyle(cs).display:null, now:String(new Date())};
