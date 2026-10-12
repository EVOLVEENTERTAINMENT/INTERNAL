import json,sys,re
cases=json.load(open(sys.argv[1])); out=json.loads(re.search(r'\{.*\}',open(sys.argv[2]).read(),re.S).group(0))
items={i.get('id'):i for i in out.get('items',[])}
tot=0; ok=0; fails=[]; checks={}
def chk(name,good,line):
    global tot,ok
    tot+=1; c=checks.setdefault(name,[0,0]); c[1]+=1
    if good: ok+=1; c[0]+=1
    else: fails.append(f"{name}: {line}")
for i,(line,exp) in enumerate(cases,1):
    it=items.get("L%d"%i)
    if not it: chk("answered",False,line); continue
    chk("kind",it.get('kind') in exp['kind'],f"{line} -> {it.get('kind')}")
    if 'project' in exp: chk("project",(it.get('project') or '')==exp['project'],f"{line} -> '{it.get('project')}' want '{exp['project']}'")
    if 'project_any' in exp: chk("project",(it.get('project') or '') in exp['project_any'],f"{line} -> '{it.get('project')}'")
    if 'date' in exp: chk("date",(it.get('date') or '')==exp['date'],f"{line} -> '{it.get('date')}' want '{exp['date']}'")
    if exp.get('person'): chk("person",bool(it.get('person')),f"{line} -> no person")
    if 'sure' in exp: chk("sure",bool(it.get('sure'))==exp['sure'],f"{line} -> sure={it.get('sure')}")
    if 'dup' in exp: chk("repeat",it.get('dup_of')==exp['dup'],f"{line} -> dup_of '{it.get('dup_of')}'")
qs=out.get('questions',[])
print("score %d/%d = %d%%"%(ok,tot,round(100*ok/tot)))
for k,v in checks.items(): print(" ",k,"%d/%d"%(v[0],v[1]))
print(" questions:",[q.get('text') for q in qs])
print(" learned:",out.get('learned'))
for f in fails: print("  x",f)
