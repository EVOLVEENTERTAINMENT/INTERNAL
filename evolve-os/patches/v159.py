import sys
s=open(sys.argv[1]).read()
R=[
# memory digest, read every time Claude is asked
('''function weekJSON(){''','''/* V159. What the board knows about his people, projects and words, handed to
   Claude every time it is asked, so it stops guessing who "Sue" or "the Vue"
   is. memory/core is the memory bank: {people:[{name,who,area,aliases}],
   words:[{word,means}], rules:[text]}. Only what he said or the board already
   holds goes in it. Kept short so it never crowds out the question. */
function memDigest(){
  const out=[], cut=(v,n)=>String(v||"").replace(/[\\u2013\\u2014]/g,", ").slice(0,n);
  const m=S.mem||{};
  const ppl=(Array.isArray(m.people)?m.people:[]).filter(p=>p&&p.name).map(p=>
    cut(p.name,60)+(p.who?": "+cut(p.who,160):"")+(p.area?" ["+cut(p.area,40)+"]":"")
    +((Array.isArray(p.aliases)&&p.aliases.length)?" (also called "+p.aliases.slice(0,6).map(a=>cut(a,30)).join(", ")+")":""));
  ((S.ctx&&Array.isArray(S.ctx.people))?S.ctx.people:[]).forEach(t=>ppl.push(cut(t,200)));
  if(ppl.length)out.push("People he has told the board about:\\n- "+ppl.slice(0,60).join("\\n- "));
  const wds=(Array.isArray(m.words)?m.words:[]).filter(w=>w&&w.word).map(w=>cut(w.word,40)+" means "+cut(w.means,160));
  ((S.ctx&&Array.isArray(S.ctx.glossary))?S.ctx.glossary:[]).forEach(t=>wds.push(cut(t,200)));
  if(wds.length)out.push("His words and short forms:\\n- "+wds.slice(0,60).join("\\n- "));
  const rl=(Array.isArray(m.rules)?m.rules:[]).filter(Boolean).map(r=>cut(typeof r==="string"?r:r.text,200)).filter(Boolean);
  if(rl.length)out.push("Rules he has set for where things go:\\n- "+rl.slice(0,40).join("\\n- "));
  const seen={}, pr=[];
  Object.keys(S.pstate||{}).forEach(k=>{const p=S.pstate[k]; if(!p||p.archived)return;
    const nm=String(p.name||k).trim(); const key=slugKey(nm); if(!nm||seen[key])return; seen[key]=1;
    pr.push(cut(nm,60)+(p.one_line?": "+cut(p.one_line,140):""));});
  if(pr.length)out.push("His live projects, use these exact names:\\n- "+pr.slice(0,40).join("\\n- "));
  const cl=[];
  Object.keys(S.clients||{}).forEach(k=>{const c=S.clients[k]; if(!c||!c.name)return;
    const who=CROLES.map(r=>c[r[0]]?cut(c[r[0]],40)+" ("+r[1]+")":"").filter(Boolean).join(", ");
    cl.push(cut(c.name,60)+(who?": "+who:""));});
  if(cl.length)out.push("His clients and their people:\\n- "+cl.slice(0,40).join("\\n- "));
  if(!out.length)return "";
  return "\\n\\nWHAT THE BOARD KNOWS. This is his own record, use it before you guess. A name or short form that is not here is unknown: say you do not know who or what it is, never invent it.\\n"
    +out.join("\\n\\n").slice(0,12000);
}
function weekJSON(){'''),
('''  return BRAIN.replace("<<CREW>>", crew||"No crew recorded yet.");''','''  return BRAIN.replace("<<CREW>>", crew||"No crew recorded yet.")+memDigest();'''),
# chat is saved after every turn, not only after an error
('''      question:o.question,proposals:o.proposals});
  }catch(err){''','''      question:o.question,proposals:o.proposals});
    saveChat();
  }catch(err){'''),
# a pasted list becomes one item per line
('''    const parts=v.split(/\\n{2,}/).map(x=>x.trim()).filter(Boolean);
    const day=[], keep=[], tctl=[], amb=[];''','''    let parts=v.split(/\\n{2,}/).map(x=>x.trim()).filter(Boolean);
    /* V159. A pasted list with no blank lines between items used to land as
       one scrap. Three or more lines, each short, is a list: one item each,
       with the bullet or number taken off the front. */
    { const ls=v.split(/\\n+/).map(x=>x.trim()).filter(Boolean);
      if(ls.length>=3&&ls.every(x=>x.length<=240))
        parts=ls.map(x=>x.replace(/^(?:[-*\\u2022\\u25E6\\u2023\\u2043\\u2219]|\\d{1,3}[.)]|\\[[ xX]?\\])\\s+/,"").trim()).filter(Boolean); }
    const day=[], keep=[], tctl=[], amb=[];'''),
('''    keep.forEach(catchIt);
    tctl.forEach(o=>timerExecuteCtl(o));''','''    keep.forEach(t=>catchIt(t));
    tctl.forEach(o=>timerExecuteCtl(o));'''),
# the sorter is told to flag what it does not know
('''If you cannot pick a day honestly, set day to null and say why in the why field.";''','''If you cannot pick a day honestly, set day to null and say why in the why field. If it names a person or a short form the board does not know, say so in the why field rather than guessing who or what it is.";'''),
# memory bank subscription
('''  db.doc("context/core").onSnapshot(s=>{if(s.exists)S.ctx=s.data();repaint();},e=>{feedErr("context",e);});''','''  db.doc("context/core").onSnapshot(s=>{if(s.exists)S.ctx=s.data();repaint();},e=>{feedErr("context",e);});
  db.doc("memory/core").onSnapshot(s=>{S.mem=s.exists?(s.data()||{}):{};},e=>{feedErr("memory",e);});'''),
('const BUILD="V158 2026-10-12T06:00Z";','const BUILD="V159 2026-10-12T18:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
