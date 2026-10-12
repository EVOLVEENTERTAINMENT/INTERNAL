import sys
s=open(sys.argv[1]).read()
R=[
('''  if(cs==="built"&&p.concept.pdf_url)prep.appendChild(e("a",{class:"b s",href:p.concept.pdf_url,target:"_blank",rel:"noopener",text:"Open the concept"}));''',
'''  if(cs==="built"&&p.concept.html)prep.appendChild(e("button",{class:"b s",text:"Open the concept",onclick:()=>prConcept(p)}));
  else if(cs==="built"&&p.concept.pdf_url)prep.appendChild(e("a",{class:"b s",href:p.concept.pdf_url,target:"_blank",rel:"noopener",text:"Open the concept"}));'''),
('''    line("Open with",b.open_with); line("Show them",b.show_them); line("The offer",b.the_offer);''',
'''    const of=b.the_offer;
    line("Open with",b.open_with); line("Show them",b.show_them);
    line("The offer",of&&typeof of==="object"
      ?[of.say_out_loud,of.turnaround,of.deposit,of.revisions_included?of.revisions_included+" rounds of revisions":"",of.when_bigger].filter(Boolean)
        .map(x=>String(x).charAt(0).toUpperCase()+String(x).slice(1)).join(". ")+"."
      :of);'''),
('''function prRow(p,talking){''','''/* V156. The concept the engine built, shown at phone width in a sandbox:
   no scripts, nothing it can reach. */
function prConcept(p){
  const v=e("div",{class:"veil",role:"dialog","aria-modal":"true"});
  const m=e("div",{class:"modal",style:"max-width:440px"});
  m.appendChild(e("h3",{text:p.name||p.prospect_id}));
  const bd=e("div",{class:"bd"});
  const fr=e("iframe",{sandbox:"",title:p.name||"concept",
    style:"width:390px;max-width:100%;height:640px;border:0;border-radius:var(--r);background:#fff;display:block;margin:0 auto"});
  /* the engine lays the concept out at 390px; let it shrink to the screen */
  const fit="<style>html,body{width:auto!important;max-width:390px;overflow-x:hidden}</style>";
  const h=String(p.concept.html||"");
  fr.srcdoc=/<\/head>/i.test(h)?h.replace(/<\/head>/i,fit+"</head>"):fit+h;
  bd.appendChild(fr);
  bd.appendChild(e("div",{class:"modrow"},[e("span",{style:"flex:1 1 auto"}),
    e("button",{class:"b on",text:"Close",onclick:()=>v.remove()})]));
  m.appendChild(bd); v.appendChild(m); openVeil(v);
}
function prRow(p,talking){'''),
('const BUILD="V155 2026-10-12T03:00Z";','const BUILD="V156 2026-10-12T04:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
