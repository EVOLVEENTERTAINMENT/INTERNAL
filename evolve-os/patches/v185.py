import sys
s=open(sys.argv[1]).read()
OLD='''async function downloadData(){
  const stamp=dk(new Date());
  const name="Evolve_OS_Data_"+stamp+".json";
  let text;
  try{ text=JSON.stringify(await exportAll(),null,1); }
  catch(x){ say("The data file could not be created.",true); return; }
  try{
    if(dlx&&dlx.save){
      await dlx.save({filename:name,
        data:new Blob([text],{type:"application/json"})});
    }else{'''
NEW='''/* V185. Reading every collection takes a while and the button gave no sign
   of it, so a click looked like it did nothing. The button now says it is
   working, and the result says how many records were saved or that nothing
   was, which also covers the viewer saying no in the save prompt. */
let dlBusy=false;
async function downloadData(ev){
  if(dlBusy)return;
  const btn=ev&&ev.currentTarget, was=btn?btn.textContent:"";
  dlBusy=true; if(btn){btn.disabled=true;btn.textContent="Gathering your data...";}
  try{ await downloadDataRun(); }
  finally{ dlBusy=false; if(btn){btn.disabled=false;btn.textContent=was;} }
}
async function downloadDataRun(){
  const stamp=dk(new Date());
  const name="Evolve_OS_Data_"+stamp+".json";
  let text, n=0;
  try{
    const all=await exportAll();
    Object.keys(all.collections||{}).forEach(c=>{ n+=Object.keys(all.collections[c]).length; });
    text=JSON.stringify(all,null,1);
  }
  catch(x){ say("The data file could not be created.",true); return; }
  try{
    if(dlx&&dlx.save){
      try{
        await dlx.save({filename:name,
          data:new Blob([text],{type:"application/json"})});
      }catch(x){
        if(x&&x.code==="declined"){ say("Not saved. Click Download data to try again.",true); return; }
        throw x;
      }
      say("Saved "+n+" records to your Downloads.");
      return;
    }else{'''
R=[(OLD,NEW),('const BUILD="V184 2026-11-06T00:30Z";','const BUILD="V185 2026-11-06T04:30Z";')]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:80]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
