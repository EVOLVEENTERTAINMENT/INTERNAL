import re,sys,json
s=open(sys.argv[1]).read()
styles=[(m.start(1),m.end(1)) for m in re.finditer(r'<style[^>]*>(.*?)</style>',s,re.S)]
css="".join(s[a:b] for a,b in styles)
rest=s
for a,b in reversed(styles): rest=rest[:a]+rest[b:]
css_nc=re.sub(r'/\*.*?\*/','',css,flags=re.S)
# class tokens in selectors only (outside declaration blocks)
sel_text=re.sub(r'\{[^{}]*\}',' ',css_nc)
classes=set(re.findall(r'\.(-?[A-Za-z_][\w-]*)',sel_text))
classes={c for c in classes if not re.fullmatch(r'\d.*',c)}
orph=[]
for c in sorted(classes):
    if re.search(r'(?<![\w-])'+re.escape(c)+r'(?![\w-])',rest): continue
    orph.append(c)
# dynamic builders: any string literal ending in a prefix that + var could complete
prefixes=set(re.findall(r'["\'\s]([a-z][\w-]*)["\']\s*\+',rest))
unsure=[c for c in orph if any(c.startswith(p) and c!=p for p in prefixes)]
print(len(classes),"classes,",len(orph),"orphans,",len(unsure),"could be built:",unsure)
json.dump({"orph":orph,"unsure":unsure},open("orph.json","w"))
