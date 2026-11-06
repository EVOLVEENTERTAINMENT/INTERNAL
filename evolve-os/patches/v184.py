import sys
s=open(sys.argv[1]).read()
R=[
('@media (max-width:1059px){ body.nobar .ppn{padding-bottom:8px} }', '''@media (max-width:1059px){ body.nobar .ppn{padding-bottom:8px} }
/* V184. Seven tabs now that Leads has one, so they sit closer together on a phone. */
@media (max-width:440px){ .side .modes button{padding-left:4px;padding-right:4px} }
@media (max-width:660px){ .colmain .bar{height:auto;min-height:54px;padding-top:7px;padding-bottom:7px} }
/* The timeline's .grow row line was also landing on the header's spacer, which is a .grow too, and drew a rule through the pills. */
.bar .grow{position:static;height:auto;border:0;background:none}'''),
('const BUILD="V183 2026-11-05T23:50Z";','const BUILD="V184 2026-11-06T00:30Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
