import sys
s=open(sys.argv[1]).read()
CSS=r'''
/* V178. Phone pass. Every screen checked at 390 wide: thumb sized targets,
   nothing under about 10px, rows that stack instead of squeezing the words,
   and nothing running off the right edge. Desktop is untouched. */
@media (max-width:660px){
  /* top bar */
  .side .modes{-webkit-mask:none;mask:none}
  .side .modes button{padding-left:8px;padding-right:8px;min-height:40px}
  .p6-timerpill{min-width:38px;min-height:36px;display:inline-flex;align-items:center;justify-content:center}
  .b.s{min-height:40px}
  .chip{font-size:11px}
  input,select,textarea,.cmdin textarea,.talkin textarea{font-size:16px}
  .bar .nowpill,.bar .needpill,.bar .p6-timerpill{height:40px;min-height:40px}
  .bar .b,.bar .barmore{height:40px;min-height:40px}
  .wide{overflow-x:hidden}
  .block2 .r{flex-wrap:wrap}
  .block2 .d{flex:1 1 100%;min-width:0;font-size:10.5px}
  .block2 .w{font-size:10px}
  .seg button{min-height:38px}
  .toolnav .b.s{min-width:40px}
  .ppn button{min-height:40px}
  .pkinds button{min-height:36px}
  .ppback,.ppnm{min-height:36px}
  .pmore{min-height:32px;padding-top:6px;padding-bottom:6px}
  .ppfacts .f,button.f{min-height:40px}
  button.gl{min-height:36px}
  :is(#v178,body) :is(.k,.tag,.wh,.anch,.ct,.kempty,.gdy,.tgh,.cap:not(.b)){font-size:10px}
  .ppn button i{font-size:10px}
  .lgrp .n,.mini .r .d{font-size:10px}
  /* Home */
  .r.td.ndy .tickpad{display:none}
  .r.td.ndy .ra{padding-left:0}
  .oneline .k,.hbp .k{font-size:10px}
  .mini .r.td .w{font-size:11px}
  .mini .r.td .tick{width:36px;height:36px}
  .hbp{max-width:100%}
  /* Board */
  .toolnav{gap:6px}
  .toolnav .b.s{padding-left:9px;padding-right:9px}
  .toolnav>.h{min-width:0!important;flex:1 1 auto}
  .strip .mt button.chip,.wli button.chip{min-height:32px;padding:0 11px;font-size:11px;display:inline-flex;align-items:center}
  .gut .t{font-size:11px}
  .dhead .dw{font-size:10px}
  .calset .cal{font-size:10.5px}
  .wl{min-width:0;grid-template-columns:1fr;gap:10px}
  .wli .tm .mono,.wlh .mt{font-size:10.5px}
  .wli .tl{font-size:13px}
  .wlgap,.wlnone{font-size:10px}
  .wladd{font-size:11px;min-height:36px}
  .wli .tg .chip{font-size:10px}
  .nowpanel .rw{flex-wrap:wrap}
  .nowpanel .rw .g{flex:1 1 calc(100% - 50px)}
  .nowpanel .rw>.b{flex:1 1 auto}
  .nowpanel .rw .sb{font-size:11.5px}
  .nowg{font-size:10.5px}
  /* Projects */
  .kan{display:flex;min-width:0;gap:10px}
  .kanwrap{scroll-snap-type:x mandatory;overflow-x:auto}
  .kcol{flex:0 0 84%;scroll-snap-align:start}
  .pbody .pcc{grid-template-columns:1fr!important;gap:22px}
  .pphl{grid-template-columns:70px minmax(0,1fr)}
  .pphl .s{white-space:normal}
  .pphl b{grid-column:2}
  .seg[style*="margin-left"]{margin-left:0!important;width:100%}
  .seg[style*="margin-left"] button{flex:1}
  .ccard .chd .rt:empty{display:none}
  .pkinds button{padding:7px 11px!important;font-size:11.5px!important}
  .pcap{font-size:10px}
  .pcap button{padding:10px 4px;margin:-10px -4px -10px auto;white-space:nowrap;flex:none}
  .ppnote button{padding:9px 0}
  .pprail button{min-height:36px}
  .ppfacts small,.ppr .l,.pphl .l,.ppcount button span,.prow .ph,.kcard .ag,.kcard .cl{font-size:10px}
  .ppn button i.soon{font-size:9.5px}
  .gleg{font-size:10.5px}
  .kpis .kpi2:last-child:nth-child(odd){grid-column:1/-1}
  .gt{grid-template-columns:96px minmax(0,1fr)}
  /* Inbox */
  .dumprow{flex-wrap:wrap;gap:8px 10px;padding:13px 14px}
  .dumprow .x{width:34px;font-size:11px}
  .dumprow .tx{flex:1 1 calc(100% - 44px)}
  .dumprow .act{flex:1 1 100%;flex-wrap:wrap;gap:6px}
  .dumprow .act .b{flex:1 1 auto;justify-content:center;min-height:40px}
  .dhero .dnav{-webkit-mask:none;mask:none;overflow:visible}
  .dhero{padding:4px 3px 12px}
  /* Pipeline */
  .prw > div:last-child{width:100%}
  .prw > div:last-child > .b,.prw .g > div > .b{flex:1 1 auto;justify-content:center;min-height:40px}
  /* Money */
  .pcal{gap:2px}
  .pcd{min-height:44px;padding:3px}
  .pcd b{font-size:11px}
  .pcd.h{font-size:10.5px}
  .pin,.pout{font-size:10px;padding:0 2px;letter-spacing:-.02em}
  .pk{font-size:11.5px}
  .pk i{width:12px;height:8px}
  .chbars .lb{font-size:10.5px}
  /* People */
  .li{flex-wrap:wrap}
  .li .g{flex:1 1 100%}
  .li .rt{flex-direction:row;flex-wrap:wrap;align-items:center;width:100%}
  .pan:has(>.pane){padding:0;background:none;box-shadow:none}
  .rows .rw:has(>.when){flex-wrap:wrap;row-gap:6px}
  .rows .rw:has(>.when)>.g{flex-basis:100%}
  .rows .rw:has(>.when)>.when{margin-right:auto}
  .rows .rw .nm{white-space:normal}
  .crewfoot .rt .b{min-width:40px}
  .wgrid{grid-template-columns:minmax(132px,1.6fr) repeat(8,minmax(46px,1fr))}
  .wgrid>div.wn{position:sticky;left:0;background:var(--s1)}
  /* Recap, Settings, Automations */
  .rrow{flex-wrap:wrap;row-gap:3px}
  .rrow .tx{flex:1 1 180px}
  .rrow .wn{margin-left:auto;text-align:right}
  .dashwrap>.cohero+div:not([class]):has(>.b){flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;margin:0 -13px 12px!important;padding:0 13px}
  .dashwrap>.cohero+div:not([class]):has(>.b)>.b{flex:none}
  .autiles{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
  .autile{padding:10px 10px 11px}
  .autile .v{font-size:19px}
  .autile .s{font-size:10.5px}
  .aucard .top{flex-wrap:wrap}
  .aucard .top .g{flex:1 1 calc(100% - 120px)}
  .aucard .top>.b{margin-left:auto}
  .rd .k,.sheet .dl .dd,.autile .k,.sheet h4{font-size:10.5px}
  .aucard .cad .ct{font-size:11px}
  .aucard .state{font-size:10px}
}
@media (max-width:1059px){ body.nobar .ppn{padding-bottom:8px} }
.block2 .d{min-width:0;flex:0 1 auto;overflow-wrap:anywhere}
.gleg .k.bar{padding:0;height:8px;min-height:0;width:16px;position:static}
.dstrip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.dstrip .b{width:100%}
</style>'''
R=[
('\n</style>', CSS),
# People showed Heard back twice: inside the waiting pane and again as its own section
('''function paneWaiting(){''','''function paneWaiting(noHeard){'''),
('''  if(S.heard.length){
    const h=e("div",{class:"blk"});
    h.appendChild(e("h3",{},["Heard back",''','''  if(S.heard.length&&!noHeard){
    const h=e("div",{class:"blk"});
    h.appendChild(e("h3",{},["Heard back",'''),
('''  R.appendChild(paneWaiting());
  g2.appendChild(R);''','''  R.appendChild(paneWaiting(true));
  g2.appendChild(R);'''),
# the project tab bar scrolls to the open tab
('''    nav.appendChild(b);});
  grid.appendChild(nav);
''','''    nav.appendChild(b);});
  grid.appendChild(nav);
  setTimeout(()=>{ const cb=nav.querySelector('[aria-current="true"]');
    if(cb&&nav.scrollWidth>nav.clientWidth){ const nr=nav.getBoundingClientRect(), br=cb.getBoundingClientRect();
      nav.scrollLeft+=Math.round((br.left+br.width/2)-(nr.left+nr.width/2)); } },0);
'''),
('''  const flight=ps.filter(p=>p.stage!=="Delivery").length;
  const blocked=ps.filter(p=>p.st&&heldBy(p.st)).length;''','''  const flight=ps.filter(isLive).length;
  const blocked=ps.filter(p=>isLive(p)&&p.st&&heldBy(p.st)).length;'''),
('''    c.live=c.projects.filter(p=>p.stage!=="Delivery").length;''','''    c.live=c.projects.filter(isLive).length;'''),
('''+ps.filter(p=>p.stage!=="Delivery").length+" live projects"''','''+ps.filter(isLive).length+" live projects"'''),
('const BUILD="V177 2026-10-13T03:00Z";','const BUILD="V178 2026-10-13T14:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
