const STAGES=["Concept","Pre-Production","Production","Post","Delivery"];
const STAGEMAP={"concept":"Concept","discovery":"Concept","brief":"Concept","idea":"Concept",
  "pre-production":"Pre-Production","preproduction":"Pre-Production","prepro":"Pre-Production",
  "pre":"Pre-Production","planning":"Pre-Production","scheduling":"Pre-Production",
  "production":"Production","shoot":"Production","shooting":"Production","filming":"Production",
  "post":"Post","edit":"Post","editing":"Post","rough cut":"Post","roughcut":"Post",
  "revisions":"Post","colour":"Post","color":"Post","sound":"Post",
  "delivery":"Delivery","final delivery":"Delivery","delivered":"Delivery","live":"Delivery","done":"Delivery",
  /* the agency is film, photo, web and design, but this map only spoke film,
     so a web run sitting at Build matched nothing and fell through to Concept.
     web and design words enter the same five stage spine under their own
     names, which keeps every progress bar and every stored film stage exactly
     as it was. they are added after the film words on purpose: stageOf falls
     back to a substring scan in key order, so the film vocabulary keeps the
     words it already owned. */
  "post-production":"Post","postproduction":"Post","post production":"Post",
  "kickoff":"Concept","kick off":"Concept","research":"Concept","strategy":"Concept",
  "audit":"Concept","moodboard":"Concept","mood board":"Concept","sitemap":"Concept",
  "scoping":"Concept","scope":"Concept","proposal":"Concept",
  "design":"Pre-Production","wireframe":"Pre-Production","wireframes":"Pre-Production",
  "wireframing":"Pre-Production","mockup":"Pre-Production","mockups":"Pre-Production",
  "comps":"Pre-Production","prototype":"Pre-Production","styleframes":"Pre-Production",
  "art direction":"Pre-Production","layout":"Pre-Production",
  "build":"Production","development":"Production","dev":"Production",
  "building":"Production","coding":"Production","implementation":"Production",
  "retouch":"Production","retouching":"Production","artwork":"Production",
  "culling":"Production","selects":"Production",
  "qa":"Post","testing":"Post","staging":"Post","amends":"Post","feedback":"Post",
  "proofing":"Post","proof":"Post","polish":"Post","bug fixes":"Post","review":"Post",
  "launch":"Delivery","launched":"Delivery","handoff":"Delivery","hand-off":"Delivery",
  "handover":"Delivery","shipped":"Delivery","ship":"Delivery","published":"Delivery",
  "publish":"Delivery","rollout":"Delivery","final files":"Delivery","print":"Delivery"};
function stageOf(raw){
  const k=String(raw||"").toLowerCase().trim();
  if(STAGEMAP[k])return STAGEMAP[k];
  let hit=null;
  Object.keys(STAGEMAP).forEach(x=>{if(!hit&&k.indexOf(x)>=0)hit=STAGEMAP[x];});
  return hit||"Concept";
}
const fs=require('fs');const dir=process.argv[2];
for(const f of fs.readdirSync(dir)){ if(f.indexOf('-')<0&&f!=='lovc.json')continue; const d=JSON.parse(fs.readFileSync(dir+'/'+f));
 const s=String(d.stage||'').toLowerCase(); let hit=null;Object.keys(STAGEMAP).forEach(x=>{if(!hit&&s.indexOf(x)>=0)hit=x;});
 const i=s.indexOf(hit); console.log(f.padEnd(26), stageOf(d.stage).padEnd(15), JSON.stringify(hit), '..'+s.slice(Math.max(0,i-15),i+20)+'..', '| nd:', /^\d{4}-\d{2}-\d{2}$/.test(String(d.next_date||'')));}
