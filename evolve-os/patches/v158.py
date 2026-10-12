import sys
s=open(sys.argv[1]).read()
R=[
('''@media (max-width:700px){.bfinds{padding:0 14px}}''','''@media (max-width:700px){.bfinds{padding:0 14px}}
/* V158. Today, from the 5:30 brief */
.tdy{background:var(--s1);border-radius:14px;box-shadow:var(--up);padding:16px;margin-bottom:12px}
.tdy .hl{font-family:var(--disp);font-size:19px;font-weight:650;line-height:1.3;letter-spacing:-.01em}
.tdy .one{margin-top:12px;padding:12px;border-radius:10px;background:var(--acc-soft);border:1px solid var(--acc-line)}
.tdy .lab{font:600 10.5px/1 var(--mono,ui-monospace),monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--fg3);margin:10px 0 5px}
.tdy .one .lab{color:var(--acc-t);margin-top:0}
.tdy .brow{display:flex;gap:10px;align-items:center;width:100%;padding:11px 0;border:0;border-top:1px solid var(--hair);background:none;color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.tdy .brow .t{flex:0 0 76px;font:600 12px var(--mono,ui-monospace),monospace;color:var(--fg2)}
.tdy .brow .n{flex:1 1 auto;font-weight:550;min-width:0}
.tdy .brow .c{color:var(--fg4)}
.tdy .det{padding:0 0 12px 86px}
.tdy .det .tx{color:var(--fg2);font-size:14px}
@media (max-width:700px){.tdy .det{padding-left:0}}'''),
('''/* Home, when a crew member is picked: their own list from the same brief */''','''/* V158. Home, owner only: today's brief from the 5:30 task, brief/<date>.
   Only today's is shown. Before it is written, nothing shows. */
function todayBrief(){
  if(!isOwnerLens())return null;
  const b=(S.briefs||{})[dk(new Date())];
  if(!b||typeof b!=="object")return null;
  const str=v=>typeof v==="string"?v.trim():"";
  const hl=str(b.headline), one=str(b.one_thing);
  const bl=Array.isArray(b.blocks)?b.blocks.filter(x=>x&&str(x.title)):[];
  if(!hl&&!one&&!bl.length)return null;
  const box=e("div",{});
  if(hl||one){
    const c=e("div",{class:"tdy"});
    if(hl)c.appendChild(e("div",{class:"hl",text:hl}));
    if(one)c.appendChild(e("div",{class:"one"},[e("div",{class:"lab",text:"The one thing"}),e("div",{text:one})]));
    box.appendChild(c);
  }
  if(bl.length){
    const c=e("div",{class:"tdy"});
    c.appendChild(e("div",{class:"lab",style:"margin:0 0 4px",text:"Today's blocks"}));
    S.tdyOpen=S.tdyOpen||{};
    bl.forEach((x,i)=>{
      const k=i+"|"+str(x.title), op=!!S.tdyOpen[k];
      const done=str(x.what_done_looks_like), prep=str(x.prep);
      const has=!!(done||prep);
      c.appendChild(e("button",{class:"brow","aria-expanded":has?String(op):null,
        onclick:has?()=>{S.tdyOpen[k]=!op;paint();}:null},[
        e("span",{class:"t",text:str(x.time)}),
        e("span",{class:"n",text:str(x.title)}),
        e("span",{class:"c",text:has?(op?"\\u25BE":"\\u25B8"):""})]));
      if(op&&has){
        const d=e("div",{class:"det"});
        if(done){d.appendChild(e("div",{class:"lab",text:"Done looks like"}));d.appendChild(e("div",{class:"tx",text:done}));}
        if(prep){d.appendChild(e("div",{class:"lab",text:"Before you start"}));d.appendChild(e("div",{class:"tx",text:prep}));}
        c.appendChild(d);
      }
    });
    c.appendChild(e("div",{class:"note",style:"margin-top:8px",text:"Tap a block to see what done looks like."}));
    box.appendChild(c);
  }
  const sec=dsec("Today","",box);
  sec.classList.add("bfinds"); return sec;
}
/* Home, when a crew member is picked: their own list from the same brief */'''),
('''  { const yw=yourWeek(); if(yw)box.appendChild(yw); }
  box.appendChild(T);''','''  { const tb=todayBrief(); if(tb)box.appendChild(tb); }
  { const yw=yourWeek(); if(yw)box.appendChild(yw); }
  box.appendChild(T);'''),
('const BUILD="V157 2026-10-12T05:00Z";','const BUILD="V158 2026-10-12T06:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
