const ps=coProjects(view()).filter(isLive);
S.room=null;S.mode="co";paint();const co=document.body.innerText.slice(0,1500);
return {n:ps.length,nopid:ps.filter(p=>!(p.st&&p.st.project_id)).map(p=>p.name+" mins:"+p.mins),co};
