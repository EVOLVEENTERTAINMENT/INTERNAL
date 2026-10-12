import sys
s=open(sys.argv[1]).read()
R=[
# one way in for any list: the brain dump
('''function bdStart(){''','''/* V170. Every way in hands a list to the brain dump, so a list typed,
   pasted, dictated or pulled off the page is read by Claude, not saved as
   raw notes. */
function bdOpenWith(text){
  S.room=null; S.mode="dump"; S.triage=null; S.bdText=String(text||""); paint(); bdStart();
  try{document.getElementById("scroll").scrollTop=0;}catch(x){}
}
/* A single line worth Claude's time: it names a day, a time, a length, or a
   team member as the doer. Anything else is still caught as written. */
function bdWorth(t){
  const v=String(t||"");
  /* a timer command, a change to the day, or an event the sheet already
     reads keeps its own path */
  try{ const o=capParse(v); if(o&&["timerctl","ripple","ambiguous","event"].indexOf(o.verb)>=0)return false; }catch(x){}
  if(/\\b(today|tonight|tomorrow|this week|next week|mon(day)?|tue(s(day)?)?|wed(nesday)?|thu(rs(day)?)?|fri(day)?|sat(urday)?|sun(day)?)\\b/i.test(v))return true;
  if(/\\b\\d{1,2}(:\\d{2})?\\s*(am|pm)\\b|\\b\\d+\\s*(mins?|minutes?|hrs?|hours?)\\b/i.test(v))return true;
  const crew=crewNames().map(k=>String((S.crew[k]&&S.crew[k].name)||k).split(" ")[0]).filter(Boolean);
  return crew.some(c=>new RegExp("^\\\\s*"+c.replace(/[^A-Za-z]/g,"")+"\\\\b","i").test(v));
}
function bdUnbin(p){
  if(!p||!p.src)return;
  dbMerge("scraps/"+p.src,{state:"raw",binned_why:""});
}
function bdStart(){'''),
('''    if(sample&&v.split(/\\n+/).map(x=>x.trim()).filter(Boolean).length>=3){
      S.room=null; S.mode="dump"; S.bdText=v; paint(); bdStart();
      try{document.getElementById("scroll").scrollTop=0;}catch(x){}
      return;
    }''','''    if(sample&&(v.split(/\\n+/).map(x=>x.trim()).filter(Boolean).length>=2||bdWorth(v))){ bdOpenWith(v); return; }'''),
# capture sheet
('''    const v2=ta.value.trim(); if(!v2){v.remove();restoreFocus();return;}
    const parts=lines();''','''    const v2=ta.value.trim(); if(!v2){v.remove();restoreFocus();return;}
    const parts=lines();
    if(sample&&(parts.length>=2||bdWorth(v2))){ v.remove(); bdOpenWith(v2); return; }'''),
# page pad
('''  if(!lines.length){say("Nothing new on the page.");return;}
  lines.forEach(catchIt);''','''  if(!lines.length){say("Nothing new on the page.");return;}
  if(sample&&lines.length>=2){
    padSave(key,String(val).split("\\n").map(x=>{const t=x.trim();return (t&&t.slice(0,1)!=="✓")?"✓ "+t:x;}).join("\\n"));
    bdOpenWith(lines.join("\\n")); return;
  }
  lines.forEach(t=>catchIt(t));'''),
# dictation lands somewhere visible
('''  const ta=document.getElementById("cmd");
  const base=ta.value.trim();
  try{
    rec=new SRc();''','''  let ta=document.getElementById("cmd");
  /* V170. On a phone the bar is hidden, so words went into a box nobody
     could see. They go into the brain dump box instead. */
  if(!ta||ta.offsetParent===null||S.mode==="dump"){
    if(S.mode!=="dump"){S.room=null;S.mode="dump";paint();}
    const bt=document.getElementById("bdta"); if(bt)ta=bt;
  }
  const base=ta.value.trim();
  try{
    rec=new SRc();'''),
('''      ta.value=(base?base+" ":"")+txt;
      ta.style.height="auto"; ta.style.height=Math.min(180,ta.scrollHeight)+"px";};''','''      ta.value=(base?base+" ":"")+txt;
      if(ta.id==="bdta")S.bdText=ta.value;
      else{ ta.style.height="auto"; ta.style.height=Math.min(180,ta.scrollHeight)+"px"; }};'''),
# phone capture line reads long texts whole
('''    +"WHAT HE SAID:\\n"+String(it.text||"").slice(0,2000)+"\\n\\n"''','''    +"WHAT HE SAID:\\n"+String(it.text||"").slice(0,8000)+"\\n\\n"'''),
# approval list on a phone: the floating tab no longer covers Approve all; rows in time order
('''body.sorting .cmdtab,body.sorting #cmdbar{display:none}''','''body.sorting .cmdtab,body.sorting #cmdbar{display:none}
body.queueing .cmdtab{display:none}'''),
('''  const old=document.getElementById("queue"); if(old)old.remove();
  if(!S.queueOpen||!S.pending.length)return;''','''  const old=document.getElementById("queue"); if(old)old.remove();
  document.body.classList.toggle("queueing",!!(S.queueOpen&&S.pending.length));
  if(!S.queueOpen||!S.pending.length)return;'''),
('''  const ls=e("div",{class:"ls"});
  S.pending.forEach(p=>{
    const r=e("div",{class:"li"});''','''  const ls=e("div",{class:"ls"});
  S.pending.slice().sort((a,b)=>(a.toS||a.fromS||0)-(b.toS||b.fromS||0)).forEach(p=>{
    const r=e("div",{class:"li"});'''),
# dropping a brain dump item puts the thought back in Inbox
('''const drop=pid=>{S.pending=S.pending.filter(p=>p.pid!==pid);queueSave();paint();};''','''const drop=pid=>{S.pending.filter(p=>p.pid===pid).forEach(bdUnbin);S.pending=S.pending.filter(p=>p.pid!==pid);queueSave();paint();};'''),
('''    e("button",{class:"b",text:"Drop them all",onclick:()=>{S.pending=[];queueSave();S.queueOpen=false;paint();}}),''','''    e("button",{class:"b",text:"Drop them all",onclick:()=>{S.pending.forEach(bdUnbin);S.pending=[];queueSave();S.queueOpen=false;paint();}}),'''),
('''          desc:(x.orig||x.title)+(x.project?"\\n\\n"+x.project:""),toS:+st,toE:+st+x.mins*60000,note:"From the brain dump"};''','''          desc:(x.orig||x.title)+(x.project?"\\n\\n"+x.project:""),toS:+st,toE:+st+x.mins*60000,note:"From the brain dump"};
        if(x.src)c.src=x.src;'''),
('''function startCloseRun(){
  const d=unclosedDays();
  if(!d.length){say("There is nothing open to close.");return;}''','''function startCloseRun(){
  /* V170. Earlier days still open first, then today, so the evening tap
     closes the day he is in rather than saying there is nothing open. */
  const d=unclosedDays().slice(), t=dk(bday(new Date()));
  if(d.indexOf(t)<0)d.push(t);'''),
('''      onclick:()=>{S.nowOpen=false;S.mode="dump";S.anchor=bday(now);S.room=null;paint();}}),''','''      onclick:()=>{S.nowOpen=false;S.mode="board";S.view="day";S.anchor=bday(now);S.room=null;paint();}}),'''),
('''function tbStale(b){ return b&&ppAdd(b.id,8)<ppToday(); }''','''function tbStale(b){ return b&&ppAdd(b.id,7)<=ppToday(); }'''),
('const BUILD="V169 2026-10-12T22:30Z";','const BUILD="V170 2026-10-12T23:10Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
