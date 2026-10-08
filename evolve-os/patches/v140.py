import sys
s=open(sys.argv[1]).read()
R=[
(' pointing at them. The things that get missed because no block exists."},',' pointing at them."},'),
('''onclick:()=>{mark(key,x.id,"miss");say("Carried, not failed.");}}));''','''onclick:()=>{mark(key,x.id,"miss");say("Carried.");}}));'''),
('''["Not happening","carried, not failed",()=>{mark(key,cur.id,"miss");say("Carried, not failed.");}],''','''["Not happening","carried",()=>{mark(key,cur.id,"miss");say("Carried.");}],'''),
('''say(was?"Unticked.":"Carried, not failed.");''','''say(was?"Unticked.":"Carried.");'''),
('''text:"Nothing is overdue. It was all carried. Clear the small stuff''','''text:"It was all carried. Clear the small stuff'''),
('''sec("Slipped, and what carries",''','''sec("What carries",'''),
('''["Nothing is overdue","Things are carried, not failed. The wording on this board never tells you that you are behind."],''',
 '''["Things are carried","The wording on this board only ever says carried."],'''),
('''primitive:"Marks each block done, moved or missed. Nothing else is touched.",''','''primitive:"Marks each block done, moved or did not happen. Nothing else is touched.",'''),
('''points:["Mark each block done, moved, or missed",''','''points:["Mark each block done, moved or did not happen",'''),
('const BUILD="V139 2026-10-08T22:00Z";','const BUILD="V140 2026-10-08T23:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:70]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
