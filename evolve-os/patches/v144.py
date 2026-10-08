import sys
s=open(sys.argv[1]).read()
HELP='''/* V144. One set of money rules for every total, the same as moneyNums: void
   is left out, a draft is not invoiced or owed yet, paid is what the payment
   records say, owed is the rest of what was billed. */
function invTotals(invs){
  const t={invoiced:0,paid:0,owed:0,late:0,n:0};
  (invs||[]).forEach(r=>{
    if(!r||isVoid(r))return;
    const amt=Number(r.amount)||0, st=invState(r);
    if(st.k==="draft")return;
    const got=paidAmount(r);
    t.invoiced+=amt; t.paid+=got; t.n++;
    if(isPaid(r))return;
    const rest=Math.max(0,amt-got);
    t.owed+=rest; if(st.k==="late")t.late+=rest;
  });
  return t;
}
/* invoiced, paid, owed and hours, as one line, leaving out what is nought */
function totLine(t,mins,cls){
  const bits=[];
  if(t.invoiced)bits.push(["invoiced",USD(t.invoiced)]);
  if(t.paid)bits.push(["paid",USD(t.paid)]);
  if(t.owed)bits.push(["owed",USD(t.owed),t.late>0]);
  if(mins)bits.push(["logged",dur(mins)]);
  if(!bits.length)return null;
  return e("div",{class:cls},bits.map(b=>e("span",{},[e("b",{class:b[2]?"hot":"",text:b[1]})," "+b[0]])));
}
'''
R=[
('function clientsOf(all){', HELP+'function clientsOf(all){'),
# client sums: their projects' invoices plus any billed to the client by name with no project, counted once
('''    let owed=0,late=0,open=0,over=0,mins=0,blocked=0;
    c.projects.forEach(p=>{
      mins+=p.mins;
      if(p.st&&p.st.blocked_by)blocked++;
      invForProj(p.slug,ps).forEach(r=>{
        if(r.paid)return;
        owed+=Number(r.amount)||0;
        if(invState(r).k==="late")late+=Number(r.amount)||0;});
      delsForProj(p.slug,ps).forEach(r=>{''',
 '''    let owed=0,late=0,open=0,over=0,mins=0,blocked=0,logged=0;
    const seen={}, invs=[];
    const take=r=>{ if(r&&!seen[r.id]){seen[r.id]=1;invs.push(r);} };
    c.projects.forEach(p=>{
      mins+=p.mins;
      logged+=projCost(p.slug).mins;
      if(p.st&&p.st.blocked_by)blocked++;
      invForProj(p.slug,ps).forEach(take);
      delsForProj(p.slug,ps).forEach(r=>{'''),
('''    c.owed=owed;c.late=late;c.open=open;c.over=over;c.mins=mins;c.blocked=blocked;''',
 '''    (S.inv||[]).forEach(r=>{ if(!r.project&&slugKey(r.client||"")===c.key)take(r); });
    c.tot=invTotals(invs); c.logged=logged; c.ps=ps;
    owed=c.tot.owed; late=c.tot.late;
    c.owed=owed;c.late=late;c.open=open;c.over=over;c.mins=mins;c.blocked=blocked;'''),
# the client card: totals under the header
('''  hd.appendChild(rt);
  /* five clients meant ten buttons of chrome standing around five lines of''',
 '''  hd.appendChild(rt);
  const ct=c.tot?totLine(c.tot,c.logged,"ctot"):null;
  if(ct)g.appendChild(ct);
  /* five clients meant ten buttons of chrome standing around five lines of'''),
# each project row in the card carries its own line
('''    if(p.n)r.appendChild(e("span",{class:"wh",text:p.n+" blk"}));
    rows.appendChild(r);});''',
 '''    if(p.n)r.appendChild(e("span",{class:"wh",text:p.n+" blk"}));
    const pt=totLine(invTotals(invForProj(p.slug,c.ps||coProjects(all))),projCost(p.slug).mins,"ptot");
    rows.appendChild(r); if(pt)rows.appendChild(pt);});'''),
# the split view list: what a project still owes you
('''    b.appendChild(e("span",{class:"sb",text:[c.phase.known?c.phase.n:"",
      q===null?"":q===0?"moved today":q+"d quiet"].filter(Boolean).join("  \\u00b7  ")}));''',
 '''    const ow=invTotals(c.inv).owed;
    b.appendChild(e("span",{class:"sb",text:[c.phase.known?c.phase.n:"",
      q===null?"":q===0?"moved today":q+"d quiet",ow?USD(ow)+" owed":""].filter(Boolean).join("  \\u00b7  ")}));'''),
# the project Money page counts owed by the same rule (it counted drafts)
('''  let owed=0; c.inv.forEach(x=>{ if(!x.paid&&!isVoid(x))owed+=Math.max(0,(Number(x.amount)||0)-paidAmount(x)); });''',
 '''  const owed=invTotals(c.inv).owed;'''),
# styles
('''.ccard .crows{display:flex;flex-direction:column}''',
 '''.ccard .crows{display:flex;flex-direction:column}
.ctot,.ptot{display:flex;flex-wrap:wrap;gap:3px 16px;font-size:11.5px;color:var(--fg3);font-variant-numeric:tabular-nums}
.ctot{padding-top:5px}
.ptot{padding:0 16px 10px 16px;margin-top:-6px;font-size:11px;pointer-events:none}
.ctot b,.ptot b{color:var(--fg2);font-weight:600}
.ctot b.hot,.ptot b.hot{color:var(--acc)}'''),
('const BUILD="V143 2026-10-09T03:00Z";','const BUILD="V144 2026-10-09T05:00Z";'),
]
assert 'function invTotals' not in s
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
