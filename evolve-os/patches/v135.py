import sys
s=open(sys.argv[1]).read()
R=[
# Home Owed row: left column already says carried, keep just the days on the right
('text:"carried "+Math.abs(dt)+" day"+(Math.abs(dt)===1?"":"s")}));',
 'text:Math.abs(dt)+" day"+(Math.abs(dt)===1?"":"s")}));'),
# slate next date: invoices keep "over", everything else carried
('cands.push({n:daysTo(r.due),t:USD(r.amount)+" due"}));',
 'cands.push({n:daysTo(r.due),t:USD(r.amount)+" due",inv:true}));'),
('out.date=(c.n<0?Math.abs(c.n)+"d over":',
 'out.date=(c.n<0?Math.abs(c.n)+(c.inv?"d over":"d carried"):'),
# company callout
('h=over.name+" is past its date";\n    p=(over.client?over.client+" is waiting. ":"")+Math.abs(daysTo(over.due))+" days over. Move it or move the date.";',
 'h=over.name+", carried "+Math.abs(daysTo(over.due))+" day"+(Math.abs(daysTo(over.due))===1?"":"s");\n    p=(over.client?over.client+" is waiting. ":"")+"Move it or move the date.";'),
# needs you folded
('"One other thing on it is already late behind this."','"One other thing on it is already carried behind this."'),
(':n+" other things on it are already late behind this.");',':n+" other things on it are already carried behind this.");'),
('g.cond=n+" things are past the date you gave "+first.who;','g.cond=n+" things for "+first.who+" are carried";'),
# weekly brief deliverables (invoice row below stays)
('s.appendChild(row(n<0?Math.abs(n)+"d late":n===0?"today":"in "+n+"d",\n      [e("b",{text:r.name}),',
 's.appendChild(row(n<0?Math.abs(n)+"d carried":n===0?"today":"in "+n+"d",\n      [e("b",{text:r.name}),'),
# recap
('carry.push({t:r.name+" is "+Math.abs(n)+" days past the date you gave",',
 'carry.push({t:r.name+", carried "+Math.abs(n)+" day"+(Math.abs(n)===1?"":"s"),'),
# fix list
('what:r.name+" is carrying "+n+" day"+(n===1?"":"s")+" past the date you gave",',
 'what:r.name+", carried "+n+" day"+(n===1?"":"s"),'),
# delivery rows
(':r.due?(n===null?"":n<0?Math.abs(n)+"d over":',':r.due?(n===null?"":n<0?Math.abs(n)+"d carried":'),
# workspace task due label
('const txt=n<0?Math.abs(n)+"d late":','const txt=n<0?Math.abs(n)+"d carried":'),
# workspace attention
('else if(d&&d.n<0)add(0,"Late",true,t.title,d.t,go);','else if(d&&d.n<0)add(0,"Carried",true,t.title,d.t,go);'),
('if(n<0)add(0,"Late",true,m.title,"milestone, "+Math.abs(n)+" days past its date",go);',
 'if(n<0)add(0,"Carried",true,m.title,"milestone, carried "+plur(Math.abs(n),"day"),go);'),
('r.name+" is with the client",Math.abs(n)+" days past its date",go);','r.name+" is with the client","carried "+plur(Math.abs(n),"day"),go);'),
('else if(n!==null&&n<0)add(0,"Late",true,r.name,Math.abs(n)+" days past its date",go);',
 'else if(n!==null&&n<0)add(0,"Carried",true,r.name,"carried "+plur(Math.abs(n),"day"),go);'),
('add(0,"Late",true,"The next move is "+Math.abs(n)+" days past its date","",()=>naEdit(p));',
 'add(0,"Carried",true,"The next move, carried "+plur(Math.abs(n),"day"),"",()=>naEdit(p));'),
# health and schedule
('why:[n.late?plur(n.late,"thing")+" past its date":"",n.clashes?plur(n.clashes,"schedule clash")',
 'why:[n.late?plur(n.late,"thing")+" carried":"",n.clashes?plur(n.clashes,"schedule clash")'),
('[n.late?plur(n.late,"thing")+" past its date":"",n.clashes?plur(n.clashes,"clash")+" between linked tasks":""].filter(Boolean).join(", ")||"Nothing late, nothing clashing"]',
 '[n.late?plur(n.late,"thing")+" carried":"",n.clashes?plur(n.clashes,"clash")+" between linked tasks":""].filter(Boolean).join(", ")||"Nothing carried, nothing clashing"]'),
('cell(n.late,"Late",true,toWork("late"));','cell(n.late,"Carried",true,toWork("late"));'),
('e("i",{class:"k late"}),"past its date"]','e("i",{class:"k late"}),"carried"]'),
('["late","Late"],["blocked","Blocked"]','["late","Carried"],["blocked","Blocked"]'),
('grp("Late",live.filter(F.late));','grp("Carried",live.filter(F.late));'),
('const BUILD="V134 2026-10-08T14:00Z";','const BUILD="V135 2026-10-08T16:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80])
    s=s.replace(a,b)
open(sys.argv[2],'w').write(s)
print("ok",len(R))
