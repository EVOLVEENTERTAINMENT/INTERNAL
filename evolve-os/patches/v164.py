import sys
s=open(sys.argv[1]).read()
JS=r'''
/* V164. ALL LEADS. Every prospect the lead engine has saved, grouped by
   where it sits, searchable. The Calls panel above shows only tonight's
   sheet. Nothing here dials or sends; the only writes are moving a lead onto
   the sheet or out of parked, both through prSave so they can be undone. */
const LD_GROUPS=[["queued","Queued"],["pool","Not checked yet"],["needs_phone","Need a phone"],["parked","Parked"],
  ["called","Called"],["talking","Talking"],["promoted","Moved to Pipeline"],["dead","Dead"]];
const LD_VERDICT={STILL_OLD:"Old site",BORDERLINE:"Borderline",LOOKS_REBUILT:"Rebuilt",UNREACHABLE:"Won't load"};
function ldMatch(p,q){
  if(!q)return true;
  return [p.name,p.category,p.city_state,p.prospect_id].join(" ").toLowerCase().indexOf(q.toLowerCase())>=0;
}
function ldRow(p){
  const id=p.prospect_id||p.id, open=S.ldOpen===id;
  const r=e("div",{class:"rw prw clk",style:"align-items:flex-start;flex-wrap:wrap;gap:8px",
    onclick:ev=>{ if(ev.target.closest("a,button"))return; S.ldOpen=open?null:id; paint(); }});
  const g=e("div",{class:"g",style:"flex:1 1 260px;min-width:0"});
  g.appendChild(e("div",{class:"nm",style:"white-space:normal",text:p.name||id}));
  g.appendChild(e("div",{class:"sb",text:[p.category,p.city_state,LD_VERDICT[p.verdict]||""].filter(Boolean).join("  ·  ")}));
  const why=(p.enriched&&p.enriched.one_problem)||(p.why_dated||[])[0]||p.pitch_angle_v7||"";
  if(why&&!open)g.appendChild(e("div",{class:"sb",style:"white-space:normal",text:String(why).slice(0,160)}));
  if(open){
    const bx=e("div",{style:"margin-top:8px"});
    const line=(k,v)=>{ if(!v)return; bx.appendChild(e("div",{style:"margin:0 0 8px"},[
      e("div",{class:"cap",text:k}),e("div",{class:"sb",style:"white-space:normal;color:var(--fg)",text:String(v)})])); };
    const en=p.enriched||{};
    line("Their one problem",en.one_problem);
    line("Why the site looks old",(p.why_dated||[]).join(". ")||p.age_evidence_v7);
    line("How to open",en.pitch_angle||p.pitch_angle_v7);
    line("Who decides",en.buyer_reason);
    if(p.status_reason&&p.status!=="queued"&&p.status!=="pool")line("Why it is here",p.status_reason);
    if(p.last_outcome)line("Last call",String(p.last_outcome).replace(/_/g," "));
    g.appendChild(bx);
  }
  r.appendChild(g);
  const a=e("div",{style:"display:flex;flex-wrap:wrap;gap:6px;flex:0 1 auto;min-width:0;max-width:100%"});
  if(p.phone)a.appendChild(e("a",{class:"b s",href:"tel:"+String(p.phone).replace(/[^0-9+]/g,""),text:"Call "+p.phone}));
  const site=p.website||(p.final_domain?"https://"+p.final_domain:"");
  if(site)a.appendChild(e("a",{class:"b s",href:site,target:"_blank",rel:"noopener",text:"Site"}));
  if((p.status==="queued"||p.status==="pool")&&p.phone)
    a.appendChild(e("button",{class:"b s on",text:"Put on the sheet",onclick:()=>prSave(p,{status:"on_sheet"},"Put on the sheet")}));
  if(p.status==="parked")
    a.appendChild(e("button",{class:"b s",text:"Unpark",onclick:()=>prSave(p,{status:"queued"},"Moved to queued")}));
  r.appendChild(a);
  return r;
}
function leadsPanel(){
  const all=prList(); if(!all.length)return null;
  const cnt={}; all.forEach(p=>{cnt[p.status]=(cnt[p.status]||0)+1;});
  const groups=LD_GROUPS.filter(g=>cnt[g[0]]);
  if(!S.ldTab||!cnt[S.ldTab])S.ldTab=groups.length?groups[0][0]:null;
  const box=e("div",{});
  const tabs=e("div",{style:"display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px"});
  groups.forEach(g=>tabs.appendChild(e("button",{class:"b s"+(S.ldTab===g[0]?" on":""),"aria-pressed":String(S.ldTab===g[0]),
    text:g[1]+"  "+cnt[g[0]],onclick:()=>{S.ldTab=g[0];S.ldN=25;S.ldOpen=null;paint();}})));
  box.appendChild(tabs);
  const q=e("input",{type:"search","aria-label":"Search leads",placeholder:"Search by name, type or town",
    style:"width:100%;box-sizing:border-box;margin:0 0 10px;padding:9px 12px;border-radius:10px;border:1px solid var(--hair2);background:var(--s4);color:var(--fg);font:inherit"});
  q.value=S.ldQ||"";
  const list=e("div",{class:"rows",id:"ldlist"});
  const fill=()=>{
    wipe(list);
    const qq=(S.ldQ||"").trim();
    const rows=all.filter(p=>qq?ldMatch(p,qq):p.status===S.ldTab)
      .sort((a,b)=>(a.queue_pos||9999)-(b.queue_pos||9999)||String(a.name||"").localeCompare(String(b.name||"")));
    const n=S.ldN||25;
    if(!rows.length)list.appendChild(e("div",{class:"void",text:"Nothing here."}));
    rows.slice(0,n).forEach(p=>list.appendChild(ldRow(p)));
    if(rows.length>n)list.appendChild(e("button",{class:"b s",style:"margin-top:8px",text:"Show "+Math.min(25,rows.length-n)+" more",
      onclick:()=>{S.ldN=n+25;paint();}}));
  };
  q.addEventListener("input",()=>{S.ldQ=q.value;S.ldN=25;fill();});
  box.appendChild(q); box.appendChild(list); fill();
  const sec=dsec("All leads",all.length+" saved",box);
  sec.classList.add("bfinds"); return sec;
}
'''
R=[
('''function modePipeline(){''',JS+'''function modePipeline(){'''),
('''  { const cp=callsPanel(); if(cp)box.appendChild(cp); }''','''  { const cp=callsPanel(); if(cp)box.appendChild(cp); }
  { const lp=leadsPanel(); if(lp)box.appendChild(lp); }'''),
('const BUILD="V163 2026-10-12T21:30Z";','const BUILD="V164 2026-10-12T22:30Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
