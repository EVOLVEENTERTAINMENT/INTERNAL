import sys
s=open(sys.argv[1]).read()
PANEL=r'''
/* ==========================================================================
   V153. THIS WEEK, BY PERSON. The Monday team brief task writes
   teambrief/<Monday> with a list per person. The board shows the newest one
   as written, the same for everybody: who owns what, the date, and the
   brief's own word for where it stands. Nothing is worked out here.
   ========================================================================== */
function tbLatest(){
  const ks=Object.keys(S.tbriefs||{}).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  return ks.length?Object.assign({id:ks[ks.length-1]},S.tbriefs[ks[ks.length-1]]):null;
}
function tbPeople(b){
  const own=slugKey(ownerName()), out=[];
  crewNames().forEach(n=>{const k=slugKey(n); if(k&&k!==own&&Array.isArray(b[k]))out.push([k,n]);});
  if(Array.isArray(b[own]))out.push([own,ownerName()]);
  return out;
}
function tbRows(list){
  const body=e("div",{class:"rows"});
  (list||[]).forEach(x=>{
    const r=e("div",{class:"rw"});
    const g=e("div",{class:"g"});
    g.appendChild(e("div",{class:"nm",style:"white-space:normal;overflow:visible;text-overflow:clip",text:String(x.text||"")}));
    r.appendChild(g);
    const due=/^\d{4}-\d{2}-\d{2}$/.test(String(x.due||""))?ppFmt(x.due):String(x.due||"");
    r.appendChild(e("span",{class:"mono",style:"flex:none;white-space:nowrap;color:var(--fg3);align-self:flex-start",
      text:[due,String(x.status||"")].filter(Boolean).join("  ")}));
    body.appendChild(r);
  });
  return body;
}
function tbStale(b){ return b&&ppAdd(b.id,8)<ppToday(); }
function tbNote(b){ return tbStale(b)?"Last week's brief. This Monday's has not been written yet.":""; }
function teamWeek(){
  const b=tbLatest(); if(!b)return null;
  const box=e("div",{});
  const st=tbNote(b); if(st)box.appendChild(e("div",{class:"note",style:"margin:0 0 10px",text:st}));
  if(b.one_line)box.appendChild(e("div",{class:"note",style:"margin:0 0 12px;max-width:72ch"},[e("b",{text:"The week: "}),String(b.one_line)]));
  if((b.big_three||[]).length){
    box.appendChild(e("div",{class:"cap",style:"margin:4px 0 6px",text:"The three that matter most"}));
    const ol=e("div",{class:"rows"});
    b.big_three.forEach((x,i)=>{ const r=e("div",{class:"rw"});
      r.appendChild(e("div",{class:"g"},[e("div",{class:"nm",style:"white-space:normal;overflow:visible;text-overflow:clip",text:(i+1)+".  "+String(x.text||"")})])); ol.appendChild(r); });
    box.appendChild(ol);
  }
  const ppl=tbPeople(b);
  if(ppl.length){
    if(!S.tbWho||!ppl.some(p=>p[0]===S.tbWho))S.tbWho=ppl[0][0];
    const tabs=e("div",{style:"display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 8px"});
    ppl.forEach(p=>tabs.appendChild(e("button",{class:"b s"+(S.tbWho===p[0]?" on":""),"aria-pressed":String(S.tbWho===p[0]),
      text:p[1]+"  "+b[p[0]].length,onclick:()=>{S.tbWho=p[0];paint();}})));
    box.appendChild(tabs);
    box.appendChild(tbRows(b[S.tbWho]));
  }
  const dec=b.decisions||[];
  if(dec.length){
    const row=e("div",{style:"display:flex;align-items:center;gap:10px;margin:14px 0 6px"},[
      e("span",{class:"cap",text:"For the sync"}),
      e("span",{class:"mono",text:plur(dec.length,"decision")}),
      e("button",{class:"b s",text:S.tbDec?"Hide them":"Show them",onclick:()=>{S.tbDec=!S.tbDec;paint();}})]);
    box.appendChild(row);
    if(S.tbDec)box.appendChild(tbRows(dec));
  }
  const sec=dsec("This week, by person","from the Monday team brief, week of "+ppFmt(b.week_of||b.id),box);
  sec.classList.add("bfinds"); return sec;
}
/* Home, when a crew member is picked: their own list from the same brief */
function yourWeek(){
  if(isOwnerLens())return null;
  const b=tbLatest(); if(!b)return null;
  const k=roleOf(), list=b[k]; if(!Array.isArray(list))return null;
  const box=e("div",{});
  const st=tbNote(b); if(st)box.appendChild(e("div",{class:"note",style:"margin:0 0 10px",text:st}));
  box.appendChild(tbRows(list));
  const sec=dsec("Your week","from the Monday team brief",box);
  sec.classList.add("bfinds"); return sec;
}
'''
R=[
('function modePeople(){\n',PANEL+'function modePeople(){\n'),
('''    e("button",{class:"b s",text:"Log someone who owes you",onclick:addWaiting})]));
  box.appendChild(hero);
''','''    e("button",{class:"b s",text:"Log someone who owes you",onclick:addWaiting})]));
  box.appendChild(hero);
  { const tw=teamWeek(); if(tw)box.appendChild(tw); }
'''),
('''  T.appendChild(tl);
  box.appendChild(T);
''','''  T.appendChild(tl);
  { const yw=yourWeek(); if(yw)box.appendChild(yw); }
  box.appendChild(T);
'''),
('''  db.collection("agenda").onSnapshot(s=>{S.agenda={};''','''  /* V153. The Monday team brief task writes teambrief/<Monday>; the board
     reads it for This week, by person */
  db.collection("teambrief").onSnapshot(s=>{S.tbriefs={};
    s.docs.forEach(d=>{S.tbriefs[d.id]=d.data()||{};});repaint();},e=>{feedErr("teambrief",e);});
  db.collection("agenda").onSnapshot(s=>{S.agenda={};'''),
('const BUILD="V152 2026-10-10T16:00Z";','const BUILD="V153 2026-10-10T18:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
