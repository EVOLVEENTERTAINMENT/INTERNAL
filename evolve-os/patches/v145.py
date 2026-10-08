import sys
s=open(sys.argv[1]).read()
R=[
# a list of clients for a select, keeping whatever the lead already says
('''function projOpts(){''','''/* V145. The clients a lead can be tied to: every one the Projects page knows,
   plus whatever the lead already names, so editing never drops it. */
function clientOpts(cur){
  const names=clientsOf(view()).map(c=>c.name).sort((a,b)=>a.localeCompare(b));
  if(cur&&names.indexOf(cur)<0)names.unshift(cur);
  return [["","No client yet"]].concat(names.map(n=>[n,n]));
}
function projOpts(){'''),
# the lead editor gains the field
('''    {k:"kind",label:"Project type",value:r.kind||""},
    {k:"value",label:"Proposed amount",value:r.value||""},
    {k:"decide",label:"They decide by (YYYY-MM-DD)",value:r.decide||""},
    {k:"nextMove",label:"Your next move",value:r.nextMove||""},
    {k:"temperature"''','''    {k:"client",label:"Client",value:r.client||"",options:clientOpts(r.client||"")},
    {k:"kind",label:"Project type",value:r.kind||""},
    {k:"value",label:"Proposed amount",value:r.value||""},
    {k:"decide",label:"They decide by (YYYY-MM-DD)",value:r.decide||""},
    {k:"nextMove",label:"Your next move",value:r.nextMove||""},
    {k:"temperature"'''),
('''      kind:v.kind||"",value:v.value||"",value_num:normValue(v.value),''',
 '''      client:v.client||"",
      kind:v.kind||"",value:v.value||"",value_num:normValue(v.value),'''),
# the Won sheet starts from the lead's client and keeps what it was given
('''    {k:"client",label:"Client name",value:r.name||""},''','''    {k:"client",label:"Client name",value:r.client||r.name||""},'''),
('''      win_reason:v.why||"",win_note:v.note||"",
      project_slug:slug||"",''','''      win_reason:v.why||"",win_note:v.note||"",
      project_slug:slug||"",client:v.client||r.client||"",'''),
# booked per client: won leads that name it, or were won into one of its projects
('''    (S.inv||[]).forEach(r=>{ if(!r.project&&slugKey(r.client||"")===c.key)take(r); });
    c.tot=invTotals(invs); c.logged=logged; c.ps=ps;''',
 '''    (S.inv||[]).forEach(r=>{ if(!r.project&&slugKey(r.client||"")===c.key)take(r); });
    c.tot=invTotals(invs); c.logged=logged; c.ps=ps;
    const mine={}; c.projects.forEach(p=>{mine[p.slug]=1;});
    c.tot.booked=wonFor(o=>(o.client&&slugKey(o.client)===c.key)||(o.project_slug&&mine[slugKey(o.project_slug)]));'''),
('''/* invoiced, paid, owed and hours, as one line, leaving out what is nought */
function totLine(t,mins,cls){
  const bits=[];''','''/* V145. Booked is the Money page's rule, won leads at their value, narrowed
   to the leads that pass the test. Never matched on a name alone. */
function wonFor(test){
  let n=0; Object.keys(S.pipe||{}).forEach(k=>{const o=S.pipe[k]; if(o&&isWon(o)&&test(o))n+=oppValue(o);});
  return n;
}
/* booked, invoiced, paid, owed and hours, as one line, leaving out what is nought */
function totLine(t,mins,cls){
  const bits=[];
  if(t.booked)bits.push(["booked",USD(t.booked)]);'''),
# a project row: leads won into that project
('''    const pt=totLine(invTotals(invForProj(p.slug,c.ps||coProjects(all))),projCost(p.slug).mins,"ptot");''',
 '''    const ptt=invTotals(invForProj(p.slug,c.ps||coProjects(all)));
    ptt.booked=wonFor(o=>o.project_slug&&slugKey(o.project_slug)===p.slug);
    const pt=totLine(ptt,projCost(p.slug).mins,"ptot");'''),
('const BUILD="V144 2026-10-09T05:00Z";','const BUILD="V145 2026-10-09T07:00Z";'),
]
assert 'function clientOpts' not in s and 'function wonFor' not in s
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
