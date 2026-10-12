const out={};
const all=view(); const ps=coProjects(all).filter(isLive);
const p=ps.filter(x=>/college/i.test(x.name))[0]||ps[0];
out.proj=p.name;
const today=dk(bday(new Date()));
const snap=m=>{S.room=null;S.mode=m;paint();return document.body.innerText;};
const before={dash:snap("dash"),board:snap("board"),now:snap("now")};
pwTaskNew(p,"ZZTASK send Auburn the shot list",{due:today});
askCreate("Gavin","ZZHAND color grade the Abell spot","");
catchIt("ZZINBOX call the printer about posters today");
await new Promise(r=>setTimeout(r,500));
for(const m of ["dash","board","now","co","people","dump"]){const t=snap(m);
  out[m]={task:/ZZTASK/.test(t),hand:/ZZHAND/.test(t),inbox:/ZZINBOX/.test(t)};}
S.nowOpen=true;paint();const np=document.getElementById('nowpanel');out.nowpanel=np?np.innerText.slice(0,1500):null;
out.needpillAfter=document.getElementById('needpill').innerText;
out.dashDiff=snap("dash").split("\n").filter(l=>before.dash.split("\n").indexOf(l)<0);
return out;
