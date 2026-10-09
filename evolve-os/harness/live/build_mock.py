import json,sys
S='/tmp/claude-0/-home-user-INTERNAL/a7daf43b-4152-56e0-97d5-60762b5270c4/scratchpad'
d=json.load(open(S+'/hl/livedata.json'))
js='window.__LIVE='+json.dumps(d)+';\n'+r'''
(function(){
  const L=window.__LIVE, ST={};
  Object.keys(L.db).forEach(c=>{ST[c]={};Object.keys(L.db[c]).forEach(id=>{ST[c][id]=JSON.parse(JSON.stringify(L.db[c][id]));});});
  window.__ST=ST; window.__WRITES=[];
  const subs={};
  const snap=c=>{const docs=Object.keys(ST[c]||{}).map(id=>({id,data:()=>JSON.parse(JSON.stringify(ST[c][id])),exists:true}));
    return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)};};
  const fire=c=>setTimeout(()=>(subs[c]||[]).forEach(cb=>cb(snap(c))),0);
  const col=c=>{const o={onSnapshot:cb=>{(subs[c]=subs[c]||[]).push(cb);setTimeout(()=>cb(snap(c)),0);return ()=>{};},
    get:()=>Promise.resolve(snap(c)),orderBy:()=>o,limit:()=>o,where:()=>o};return o;};
  const dsubs={};
  const doc=p=>{const [c,id]=p.split("/");
    const ds=()=>({exists:!!(ST[c]&&ST[c][id]),id,data:()=>ST[c]&&ST[c][id]?JSON.parse(JSON.stringify(ST[c][id])):undefined});
    const dfire=()=>setTimeout(()=>(dsubs[p]||[]).forEach(cb=>cb(ds())),0);
    const w=(op,d)=>{window.__WRITES.push([op,p]); if(c!=="diag")window.__WROTE=true;};
    return {onSnapshot:cb=>{(dsubs[p]=dsubs[p]||[]).push(cb);setTimeout(()=>cb(ds()),0);return ()=>{};},
      set:d=>{w("set",d);(ST[c]=ST[c]||{})[id]=JSON.parse(JSON.stringify(d));fire(c);dfire();return Promise.resolve();},
      update:d=>{w("update",d);if(!(ST[c]&&ST[c][id]))return Promise.reject({code:"not_found"});Object.assign(ST[c][id],d);fire(c);dfire();return Promise.resolve();},
      delete:()=>{w("delete");if(ST[c])delete ST[c][id];fire(c);dfire();return Promise.resolve();},
      get:()=>Promise.resolve(ds())};};
  // the calendar, from real events
  const EV=L.events;
  const shape=(cal,r)=>({id:r[0],summary:r[1],start:{dateTime:r[2],timeZone:"America/Chicago"},end:{dateTime:r[3],timeZone:"America/Chicago"},
    status:"confirmed",recurringEventId:r[4]||undefined,htmlLink:"https://www.google.com/calendar/event?eid=x",updated:"2026-10-08T00:00:00Z",
    organizer:{email:cal,self:true},attendees:r[5]?[{self:true,responseStatus:"accepted"}].concat(Array.from({length:r[5]},(_,i)=>({email:"p"+i+"@x.com",responseStatus:"needsAction"}))):undefined});
  const list=a=>{const s=+new Date(a.startTime),e=+new Date(a.endTime);
    return {payload:{events:(EV[a.calendarId]||[]).filter(r=>+new Date(r[2])<e&&+new Date(r[3])>s).map(r=>shape(a.calendarId,r))}};};
  window.__CALLS=[];
  const mcp={
    listTools:async()=>({servers:[{server:"Google Calendar",tools:[{name:"list_events"},{name:"get_event"},{name:"create_event"},{name:"update_event"},{name:"delete_event"}],authStatus:"ok"},
                                  {server:"Gmail",tools:[{name:"search_threads"},{name:"get_thread"}],authStatus:"ok"}]}),
    callTool:async(sv,t,a)=>{window.__CALLS.push([sv,t]);
      if(sv==="Google Calendar"&&t==="list_events")return list(a);
      if(sv==="Google Calendar"&&t==="get_event"){for(const k in EV){const r=EV[k].find(x=>x[0]===a.eventId);if(r)return {payload:shape(k,r)};}return {payload:null};}
      if(sv==="Gmail"&&t==="search_threads")return {payload:{threads:[]}};
      throw {code:"not_in_test"};},
    watchTool:(sv,t,a,cb)=>{setTimeout(()=>{try{cb({type:"data",result:list(a)});}catch(e){cb({type:"error",error:{code:"upstream_error",message:String(e)}});}},30);return ()=>{};},
    invalidate:async()=>{}};
  window.claude={version:"mock",use:async n=>{if(n==="db")return {collection:col,doc:doc};if(n==="mcp")return mcp;throw new Error("no");}};
})();
'''
open(S+'/hl/mocklive.js','w').write(js); print(len(js))
