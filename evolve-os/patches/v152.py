import sys
s=open(sys.argv[1]).read()
R=[
# owner lens, from the owner record rather than a spelled name
('''function setRole(r){S.role=r;try{localStorage.setItem("sb-role",r);}catch(x){}paint();}''','''function setRole(r){S.role=r;try{localStorage.setItem("sb-role",r);}catch(x){}paint();}
/* V152. The owner lens is the first role, whatever the owner is called */
function isOwnerLens(){ return roleOf()===rolesList()[0][0]; }
/* V152. A crew member with on-site windows on their record sees the assistant hours */
function ambFor(x){
  if(!isAmb(x))return true;
  if(isOwnerLens()||x.cal!=="ASSISTANT HOURS")return false;
  const r=roleOf(), c=crewList().filter(y=>slugKey(y.name||"")===r)[0];
  return !!(c&&c.win);
}'''),
('''  return list.filter(x=>re.test((x.title||"")+" "+(x.desc||""))||(r==="grace"&&x.cal==="ASSISTANT HOURS"));''','''  return list.filter(x=>re.test((x.title||"")+" "+(x.desc||""))||(x.cal==="ASSISTANT HOURS"&&ambFor(x)));'''),
('''  const dayAll=forRole(onDay(today,all)
    .filter(x=>!x.all&&!x.gh&&!x.gone&&!isGhost(x)&&!isAmb(x)&&!isSoft(x)))''','''  const dayAll=forRole(onDay(today,all)
    .filter(x=>!x.all&&!x.gh&&!x.gone&&!isGhost(x)&&ambFor(x)&&!isSoft(x)))'''),
('''  const list=forRole(onDay(today,all)
    .filter(x=>!x.all&&!x.gh&&!x.gone&&!isGhost(x)&&!isAmb(x)&&!isSoft(x))).sort((a,b)=>a.s-b.s);''','''  const list=forRole(onDay(today,all)
    .filter(x=>!x.all&&!x.gh&&!x.gone&&!isGhost(x)&&ambFor(x)&&!isSoft(x))).sort((a,b)=>a.s-b.s);'''),
('      text:roleOf()==="jackson"?"Nothing left on the board today. Go make something."','      text:isOwnerLens()?"Nothing left on the board today. Go make something."'),
('    if(roleOf()==="jackson"){\n      acts.appendChild(e("button",{class:"b s",text:"Hand off",onclick:()=>handOff(x)}));','    if(isOwnerLens()){\n      acts.appendChild(e("button",{class:"b s",text:"Hand off",onclick:()=>handOff(x)}));'),
('  const full=(r==="jackson")?ownerName()+" Cole":nm;','  const own=r===rolesList()[0][0], full=own?(/\\s/.test(ownerName())?ownerName():ownerName()+" Cole"):nm;'),
('  if(ro)ro.textContent=(r==="jackson")?"Owner":"Lens";','  if(ro)ro.textContent=own?"Owner":"Lens";'),
# a name that could be two projects matches neither
('''  let hit=null;
  Object.keys(S.pstate).forEach(x=>{
    if(hit)return;
    const p=S.pstate[x];
    if(slugKey(p.name)===k||x.indexOf(k)===0||k.indexOf(x)===0)hit=p;});
  return hit;''','''  /* V152. The exact name first. A prefix only counts when it fits one project:
     "HHC" fits two, so it is left alone rather than guessed. */
  const keys=Object.keys(S.pstate);
  const ex=keys.filter(x=>slugKey(S.pstate[x].name)===k);
  if(ex.length)return S.pstate[ex[0]];
  const pre=keys.filter(x=>x.indexOf(k)===0||k.indexOf(x)===0);
  return pre.length===1?S.pstate[pre[0]]:null;'''),
# warranty runs from acceptance plus 60 days when the site never launched
('''  if(!ppIsDate(w.launched_on))return {t:"Accepted, ready to launch",hot:false};''','''  if(!ppIsDate(w.launched_on)){
    const b0=woAdd(w.work_ok_on,60);
    if(!(ppIsDate(b0)&&b0<=today))return {t:"Accepted, ready to launch",hot:false};
    return {t:"Warranty to "+ppFmt(woAdd(b0,45)),hot:false};
  }'''),
('const BUILD="V151 2026-10-10T14:00Z";','const BUILD="V152 2026-10-10T16:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
