// Projects: the list, a workspace, the next action, a task, a milestone, a
// deliverable and its drawer tabs, and the timer.
'use strict';
module.exports = {
  main: async ctx => {
    const v = await ctx.page(async H => {
      await H.tab('co');
      H.t('projects: title is Projects', H.text('#ptitle') === 'Projects', H.text('#ptitle'));
      const ps = coProjects(view());
      H.t('projects: the 4 sample projects are listed', ps.filter(p => /^Sample /.test(p.name)).length === 4, ps.map(p => p.slug).join(','));
      H.t('projects: the page shows Sample Cafe website', H.has('#stage', 'Sample Cafe website'));
      // the board keys a project by slugKey(id), so the cafe is found by name
      const p0 = ps.filter(x => x.name === 'Sample Cafe website')[0];
      H.t('projects: Sample Cafe website has a slug', !!p0 && !!p0.slug, p0 && p0.slug);
      openProject(p0.slug); await H.wait(400);
      H.t('workspace: opens on the cafe', pwState().id === p0.slug && S.mode === 'co' && S.pv === 'split', pwState().id + ' / ' + S.pv);
      H.t('workspace: the page shows the project name', H.has('#stage', 'Sample Cafe website'));
      const p = coProjects(view()).filter(x => x.slug === p0.slug)[0];
      const saved = await naSet(p, 'Send the sample contract', 'Jackson', '');
      H.t('workspace: the next action saves', saved === true && S.pstate[p.slug].next_action === 'Send the sample contract', String(saved));
      const task = pwTaskNew(p, 'Sample task one'); await H.wait(400);
      H.t('workspace: a task is added', !!task && S.tasks.some(t => t.id === task.id), task && task.id);
      const mile = ppMileNew(p, 'Sample milestone', dk(plus(bday(new Date()), 3))); await H.wait(400);
      H.t('workspace: a milestone is added', !!mile && (S.miles || []).some(m => m.id === mile.id), mile && mile.id);
      const del = pwDelNew(p, 'Sample hero film, 60 sec'); await H.wait(400);
      H.t('workspace: a deliverable is added', !!del && (S.dels || []).some(d => d.id === del.id) && del.spec === '60 sec', del && del.id);
      pwOpenDrawer({ t: 'del', id: del.id }); await H.wait(400);
      const tabs = () => H.$$('#pdr .pdtabs button');
      const names = tabs().map(b => b.textContent.replace(/\d+$/, '').trim());
      H.t('drawer: six tabs', names.join('|') === 'Overview|Tasks|Versions|Feedback|Files|Approval', names.join('|'));
      for (let i = 0; i < names.length; i++) {
        tabs()[i].click(); await H.wait(150);
        H.t('drawer: ' + names[i] + ' tab opens', tabs()[i].getAttribute('aria-current') === 'true');
      }
      pwClose(); await H.wait(200);

      const pid = (p.st && p.st.project_id) || p.slug;
      await new Promise(res => timerDoStart(pid, p.name, null, '', 'manual', res));
      H.t('timer: starts', timerIsRunning() && !!S.time_active && !!S.time_active.entry_id, JSON.stringify(S.time_active));
      const entry = S.time_active && S.time_active.entry_id;
      H.t('timer: the pill shows', !H.$('#p6-timerpill').hidden);
      await H.wait(600);
      await new Promise(res => timerDoStop(res));
      H.t('timer: stops', !timerIsRunning() && !!(S.time_entries[entry] || {}).ended_at);
      return { slug: p.slug, task: task && task.id, mile: mile && mile.id, del: del && del.id, entry };
    });
    const pj = v && v.slug ? ctx.readCol('projects')[v.slug] : null;
    ctx.t('workspace: projects/<slug> on disk has the next action', !!pj && pj.data.next_action === 'Send the sample contract', (v && v.slug) + ': ' + (pj ? pj.data.next_action : 'missing'));
    ctx.t('workspace: the task is on disk', !!(v && v.task && ctx.readCol('tasks')[v.task]), v && v.task);
    ctx.t('workspace: the milestone is on disk', !!(v && v.mile && ctx.readCol('milestones')[v.mile]), v && v.mile);
    ctx.t('workspace: the deliverable is on disk', !!(v && v.del && ctx.readCol('duelist')[v.del]), v && v.del);
    const te = v && v.entry ? ctx.readCol('time_entries')[v.entry] : null;
    ctx.t('timer: time_entries row on disk has started_at and ended_at', !!te && !!te.data.started_at && !!te.data.ended_at, te ? JSON.stringify(te.data).slice(0, 160) : 'missing');
    const ta = ctx.readCol('time_active').current;
    ctx.t('timer: time_active/current on disk points at nothing', !!ta && ta.data.entry_id === null, ta ? JSON.stringify(ta.data) : 'missing');
  }
};
