import sys
s=open(sys.argv[1]).read()
R=[
# a timed out call is cancelled, so it cannot keep acting
('''  let t=null;
  const timeout=new Promise((_,rej)=>{
    t=setTimeout(()=>rej({code:"timeout",
      message:"Claude did not come back in time"}),SAMPLE_MS);});
  try{
    return await Promise.race([sample.json(q,opts||{}),timeout]);
  }finally{ clearTimeout(t); }''','''  let t=null;
  /* V175. On a timeout the call is cancelled, not just abandoned, so its
     tool calls cannot keep landing after he has asked again. */
  const ac=(typeof AbortController!=="undefined")?new AbortController():null;
  const o=Object.assign({},opts||{}); if(ac&&!o.signal)o.signal=ac.signal;
  const timeout=new Promise((_,rej)=>{
    t=setTimeout(()=>{ try{ac&&ac.abort();}catch(x){}
      rej({code:"timeout",message:"Claude did not come back in time"}); },SAMPLE_MS);});
  try{
    return await Promise.race([sample.json(q,o),timeout]);
  }finally{ clearTimeout(t); }'''),
# once the chat has read mail or messages, its board writes are staged for his OK
('''    const out=await askModel(q,{modelTier:"complex",cache:false,tools:claudeTools()});''','''    /* V175. Mail and messages are other people's words. Once a turn has read
       them, anything it writes to the board waits for his OK, the same as the
       sweeps. A call that has timed out cannot write at all. */
    let readSeen=false, dead=false;
    const tools=claudeTools().map(tl=>{
      const ex=tl.execute, rd=/^(search_email|read_email_thread|read_messages|read_thread)$/.test(tl.name);
      return Object.assign({},tl,{execute:async(i,c)=>{
        if(dead)throw new Error("this request was cancelled");
        if(rd){readSeen=true; return ex(i,c);}
        if(readSeen&&(tl.name==="catch_note"||tl.name==="add_waiting")){
          const was=MODEL_STAGING; MODEL_STAGING=true;
          try{ return await ex(i,c); }finally{ MODEL_STAGING=was; }
        }
        return ex(i,c);}});
    });
    let out;
    try{ out=await askModel(q,{modelTier:"complex",cache:false,tools:tools}); }
    catch(er){ dead=true; throw er; }'''),
('''    S.chat.push({role:"assistant",text:c==="not_granted"?"Claude is not switched on for this page."
      :c==="rate_limited"?"Too many at once. A few seconds.":"That did not come back cleanly. Say it again."});''','''    S.chat.push({role:"assistant",text:c==="not_granted"?"Claude is not switched on for this page."
      :c==="rate_limited"?"Too many at once. A few seconds."
      :c==="timeout"?"That took too long, so I stopped it. Nothing more will happen from it. Say it again."
      :"That did not come back cleanly. Say it again."});'''),
('const BUILD="V174 2026-10-13T01:30Z";','const BUILD="V175 2026-10-13T02:00Z";'),
]
for a,b in R:
    assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok",len(R))
