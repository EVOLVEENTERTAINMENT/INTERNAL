const ps=coProjects(view());
return ps.filter(p=>/college|abell|boos|hhc|hle|harold|webb/i.test(p.name+p.slug)).map(p=>({name:p.name,slug:p.slug,live:isLive(p),eng:isEngaged(p),pid:p.st&&p.st.project_id,na:p.st&&String(p.st.next_action||"").slice(0,50),mins:p.mins}));
