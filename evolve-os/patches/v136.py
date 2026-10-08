import sys
s=open(sys.argv[1]).read()
R=[
('cell(String(D.late),"Past the date",D.late?["chase","hot"]:["clear","ok"]);','cell(String(D.late),"Carried",D.late?["chase","hot"]:["clear","ok"]);'),
('if(late)sch.push(e("span",{class:"hot",text:plur(late,"thing")+" late"}));\n  else sch.push("Nothing late");',
 'if(late)sch.push(e("span",{class:"hot",text:plur(late,"thing")+" carried"}));\n  else sch.push("Nothing carried");'),
('why:"Nothing late, blocked or clashing in the records"','why:"Nothing carried, blocked or clashing in the records"'),
('text:(late?late+" late.  ":"")+by[nm].slice(0,2)','text:(late?late+" carried.  ":"")+by[nm].slice(0,2)'),
('+(late?"\\nPast its date":"")+(clash','+(late?"\\nCarried":"")+(clash'),
('m.done?"\\nReached":late?"\\nPast its date":""','m.done?"\\nReached":late?"\\nCarried":""'),
('late?Math.abs(daysTo(m.end||m.date))+"d past":','late?Math.abs(daysTo(m.end||m.date))+"d carried":'),
('late?e("span",{class:"hot",text:late+" late"}):null','late?e("span",{class:"hot",text:late+" carried"}):null'),
('"See what is open, what is late, and what is sitting with the client"','"See what is open, what is carried, and what is sitting with the client"'),
('const BUILD="V135 2026-10-08T16:00Z";','const BUILD="V136 2026-10-08T17:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80])
    s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
