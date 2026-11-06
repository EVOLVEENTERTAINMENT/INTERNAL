// File > Bring in board data, through the real menu item with the dialog
// answered by EVOLVE_BRING_IN. The board reloads, so this runs last, and the
// theme chosen in 10-boot is checked across that reload.
'use strict';
module.exports = {
  main: async ctx => {
    if (!ctx.env.EVOLVE_BRING_IN) { ctx.skip('bring in: the export file is brought in', 'no EVOLVE_BRING_IN file'); return; }
    // Three ways to see the reload, so a miss says which part did not happen:
    // the load events, and a marker set on the old page that a reload wipes.
    const wc = ctx.win.webContents;
    const loaded = ctx.nextLoad(45000);
    const started = new Promise(res => { let d = false; const fin = v => { if (!d) { d = true; res(v); } }; wc.once('did-start-loading', () => fin(true)); setTimeout(() => fin(false), 45000); });
    await ctx.js('window.__beforeReload = 1; "ok"');
    ctx.t('bring in: the menu item is there', ctx.menuClick('Bring in board data...'));
    const msg = await ctx.until(() => ctx.dialogs.filter(d => /brought in/.test(d.text))[0], 20000);
    ctx.t('bring in: the app says 3 records brought in', !!msg && /^3 records brought in/.test(msg.text), msg ? msg.text : ctx.dialogs.map(d => d.text).join(' | '));
    const fin = await loaded;
    const gone = await ctx.until(async () => (await ctx.js('typeof window.__beforeReload').catch(() => 'unknown')) === 'undefined', 10000).catch(() => false);
    ctx.t('bring in: the board reloaded', !!(fin || gone), JSON.stringify({ finishEvent: fin, startEvent: await started, markerGone: !!gone, loading: wc.isLoading(), url: wc.getURL(), dialogs: ctx.dialogs.map(d => d.text) }));
    await ctx.ready();
    const ideas = ctx.readCol('ideas');
    ctx.t('bring in: the ideas are on disk', Object.keys(ideas).length === 2, Object.keys(ideas).join(','));
    ctx.t('bring in: the decision is on disk', !!ctx.readCol('decisions').dec_sample_1);
    await ctx.page(async H => {
      const n = await H.until(() => (S.ideas || []).length >= 2, 10000);
      H.t('bring in: the board shows the ideas after the reload', !!n, String((S.ideas || []).length));
      H.t('bring in: the sample projects are still there', coProjects(view()).filter(p => /^Sample /.test(p.name)).length === 4, coProjects(view()).map(p => p.name).join(','));
      H.t('localStorage: the theme survived the reload', document.documentElement.getAttribute('data-theme') === 'light' && S.theme === 'light', String(S.theme));
      setTheme('dark');
    });
  }
};
