import sys
s=open(sys.argv[1]).read()
R=[
('''function heldBy(st){''','''/* V174. The first clause of stored prose, so a Home row reads as one line. */
function clause(t,n){
  let v=String(t||"").replace(/\\s+/g," ").trim(); n=n||80;
  const m=/^(.{12,}?)([.;]\\s|,\\s(?=on |about |for |since |who |which |and the |the ))/.exec(v);
  if(m)v=m[1];
  return v.length>n?v.slice(0,n-1).replace(/\\s+\\S*$/,"")+"…":v;
}
function heldBy(st){'''),
('''      cond:p.name+" is blocked on "+st.blocked_by+(function(){
        const a=st.updated_at?ageDays(st.updated_at):null;
        return a!==null&&a>=2?" (written "+new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(new Date(st.updated_at))+")":"";})(),
      conseq:"Every other move on this project is waiting behind that one.",''','''      cond:"Waiting on "+clause(st.blocked_by,70),
      conseq:st.next_action?"Your move: "+clause(st.next_action,110):"Every other move on this project is waiting behind that one.",'''),
('''      cond:(w.what||"Something")+" has been quiet "+d+" days",''','''      cond:clause(w.what||"Something",80)+", quiet "+d+" days",'''),
('const BUILD="V173 2026-10-13T01:00Z";','const BUILD="V174 2026-10-13T01:30Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
