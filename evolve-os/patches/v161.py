import sys,json
s=open(sys.argv[1]).read()
a=json.load(open(sys.argv[3]))
lines=s.split("\n"); tot=0; miss=[]
for x in a:
    old='"'+x['old']+'"'; new='"'+x['new'].replace('\\','\\\\').replace('"','\\"')+'"'
    n=s.count(old)
    if n==0: miss.append(x['line']); continue
    s=s.replace(old,new); tot+=n
a1='const BUILD="V160 2026-10-12T18:30Z";'; assert s.count(a1)==1
s=s.replace(a1,'const BUILD="V161 2026-10-12T19:30Z";')
open(sys.argv[2],'w').write(s); print("replaced",tot,"missing",miss)
