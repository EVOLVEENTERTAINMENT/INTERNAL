import re,sys,json
s=open(sys.argv[1]).read()
SAFE=json.load(open(sys.argv[3]))
pat=re.compile(r'\.(?:'+'|'.join(re.escape(c) for c in SAFE)+r')(?![\w-])')
removed=[0,0]
TRIM=[]
def clean(css):
    out=[];i=0;n=len(css)
    while i<n:
        if css.startswith('/*',i):
            j=css.find('*/',i)+2; out.append(css[i:j]); i=j; continue
        j=css.find('{',i)
        if j<0: out.append(css[i:]); break
        k=css.find('}',i)
        if 0<=k<j: out.append(css[i:k+1]); i=k+1; continue
        sel=css[i:j]
        # comments sitting in front of a rule go out as they are
        cm=re.match(r'(\s*(?:/\*.*?\*/\s*)+)',sel,re.S)
        if cm:
            out.append(cm.group(1)); i+=len(cm.group(1)); continue
        # find the matching close
        depth=0;m=j
        while m<n:
            if css[m]=='{':depth+=1
            elif css[m]=='}':
                depth-=1
                if depth==0:break
            m+=1
        body=css[j+1:m]
        if sel.strip().startswith('@'):
            if '{' in body: out.append(sel+'{'+clean(body)+'}')
            else: out.append(css[i:m+1])
            i=m+1; continue
        parts=sel.split(',')
        keep=[p for p in parts if not (pat.search(p) and ':not(' not in p)]
        if len(keep)==len(parts): out.append(css[i:m+1])
        elif keep:
            lead=sel[:len(sel)-len(sel.lstrip())]
            new=lead+','.join(k.strip() if idx else k.lstrip() for idx,k in enumerate(keep))
            TRIM.append((sel.strip(),new.strip()))
            out.append(new+'{'+body+'}'); removed[1]+=1
        else:
            out.append(sel[:len(sel)-len(sel.lstrip())]); removed[0]+=1
        i=m+1
    return ''.join(out)
def rep(m): return m.group(1)+clean(m.group(2))+m.group(3)
s2=re.sub(r'(<style[^>]*>)(.*?)(</style>)',rep,s,flags=re.S)
a='const BUILD="V141 2026-10-09T00:00Z";'; assert s2.count(a)==1
s2=s2.replace(a,'const BUILD="V142 2026-10-09T01:00Z";')
# no safe class may remain in any selector
left=[c for c in SAFE if re.search(r'\.'+re.escape(c)+r'(?![\w-])',''.join(re.findall(r'<style[^>]*>(.*?)</style>',s2,re.S)))]
open(sys.argv[2],'w').write(s2)
[print("  TRIM",a," ==> ",b) for a,b in TRIM]
print("rules removed",removed[0],"selector lists trimmed",removed[1],"bytes saved",len(s)-len(s2),"left in css:",left)
