import sys
src,dst=sys.argv[1],sys.argv[2]
s=open(src,encoding="utf-8").read()
P=[
('''      if(dt<0)row.appendChild(e("span",{class:"lt",
        text:Math.abs(dt)+" day"+(Math.abs(dt)===1?"":"s")+" past"}));''',
 '''      if(dt<0)row.appendChild(e("span",{class:"lt",
        text:"carried "+Math.abs(dt)+" day"+(Math.abs(dt)===1?"":"s")}));'''),
('''      cond:r.name+" is "+Math.abs(dt)+" day"+(Math.abs(dt)===1?"":"s")+" past the date you gave",''',
 '''      cond:r.name+", carried "+Math.abs(dt)+" day"+(Math.abs(dt)===1?"":"s"),'''),
('''D.late?[D.late+" over","hot"]:null,''','''D.late?[D.late+" carried","hot"]:null,'''),
('''if(c.over)rt.appendChild(e("span",{class:"tag hot",text:c.over+" over"}));''',
 '''if(c.over)rt.appendChild(e("span",{class:"tag hot",text:c.over+" carried"}));'''),
('''set("m-co",stuckN?(stuck?stuck+" blocked":D.late+" over"):"",!!stuckN);''',
 '''set("m-co",stuckN?(stuck?stuck+" blocked":D.late+" carried"):"",!!stuckN);'''),
('''set("m-deliver", DD.late?DD.late+" over"''','''set("m-deliver", DD.late?DD.late+" carried"'''),
('''const BUILD="V133 2026-10-08T06:00Z";''','''const BUILD="V134 2026-10-08T14:00Z";'''),
]
for a,b in P: assert s.count(a)==1,(s.count(a),a[:80])
for a,b in P: s=s.replace(a,b)
open(dst,"w",encoding="utf-8").write(s)
print("ok")
