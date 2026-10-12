import sys
s=open(sys.argv[1]).read()
R=[
('''function stageOf(raw){
  const k=String(raw||"").toLowerCase().trim();''','''function stageOf(raw){
  /* V154. The nightly now writes stage_key as one of the five exactly */
  if(STAGES.indexOf(String(raw||"").trim())>=0)return String(raw).trim();
  const k=String(raw||"").toLowerCase().trim();'''),
('    p.stage=stageOf(p.st&&p.st.stage);','    p.stage=stageOf(p.st&&(p.st.stage_key||p.st.stage));'),
('const BUILD="V153 2026-10-10T18:00Z";','const BUILD="V154 2026-10-12T02:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
