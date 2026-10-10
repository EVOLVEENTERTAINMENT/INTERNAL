import sys
s=open(sys.argv[1]).read()
R=[
# 1. one set of tab names
('const PW_AREAS=[["home","Command",1],','const PW_AREAS=[["home","Overview",1],'),
('["money","Money",0],["team","Team",0],["log","Activity",0]];','["money","Money",0],["team","People",0],["log","Log",0]];'),
('const PP_NAV=[["home","Home","p"],','const PP_NAV=[["home","Overview","p"],'),
('["team","People","c"],["log","Project log","c"]];','["team","People","c"],["log","Log","c"]];'),
('''      onclick:()=>pwGo(a[0])},[e("span",{text:a[1]})]);''','''      onclick:()=>pwGo(a[0])},[e("span",{text:a[0]==="book"?ppOpsName(c.kind):a[1]})]);'''),
('a.appendChild(pwCap("Activity",mv.length?String(mv.length):""));','a.appendChild(pwCap("Log",mv.length?String(mv.length):""));'),
('["Project log",()=>{w.sy=0;pwGo("log");}]','["Log",()=>{w.sy=0;pwGo("log");}]'),
# 2. Close the day, one door on Board
('''  nav.appendChild(e("button",{class:"b s",text:"Recap",
    title:"How the week actually went",onclick:()=>{S.recap=true;S.mode="review";paint();}}));''','''  nav.appendChild(e("button",{class:"b s",text:"Recap",
    title:"How the week actually went",onclick:()=>{S.recap=true;S.mode="review";paint();}}));
  /* V151. The one door to closing a day */
  nav.appendChild(e("button",{class:"b s",text:"Close the day",onclick:startCloseRun}));'''),
('settings:"Settings",review:S.fixRun?"The fix list":"Recap",','settings:"Settings",review:S.fixRun?"The fix list":S.closing?"Close the day":"Recap",'),
('''    :left?left+" left":"",!!(nt&&nt.live)||!!oc);''','''    :left?left+" left":"",!!(nt&&nt.live)||!!oc);
  /* V151. The badge opens the closing, the button still opens Board */
  { const mbd=document.getElementById("m-board");
    if(mbd)mbd.onclick=(!(nt&&nt.live)&&oc)?(ev=>{ev.stopPropagation();ev.preventDefault();startCloseRun();}):null; }'''),
# 3. capture bar
('<button id="lane-dump" aria-pressed="true">Dump</button>','<button id="lane-dump" aria-pressed="true">Note</button>'),
('<button class="b s" id="mic" title="Dictate" hidden>Talk</button>','<button class="b s" id="mic" title="Dictate" hidden>Speak</button>'),
('<button class="b on" id="cmdgo">Catch</button>','<button class="b on" id="cmdgo">Save</button>'),
('    mb.textContent=S.micOn?"Listening":"Talk";','    mb.textContent=S.micOn?"Listening":"Speak";'),
('    go.textContent="Catch"; go.className="b on";','    go.textContent="Save"; go.className="b on";'),
(':x.type==="note"?"Brain note":"Dump";',':x.type==="note"?"Brain note":"Note";'),
('const BUILD="V150 2026-10-10T12:00Z";','const BUILD="V151 2026-10-10T14:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
