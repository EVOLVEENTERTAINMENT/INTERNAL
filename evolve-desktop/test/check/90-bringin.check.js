// File > Bring in board data, through the real menu item with the dialog
// answered by EVOLVE_BRING_IN. The board reloads, so this runs last, and the
// theme chosen in 10-boot is checked across that reload.
'use strict';
module.exports = {
  main: async ctx => {
    if (!ctx.env.EVOLVE_BRING_IN) { ctx.skip('bring in: the export file is brought in', 'no EVOLVE_BRING_IN file'); return; }
    const loaded = ctx.nextLoad(30000);
    ctx.t('bring in: the menu item is there', ctx.menuClick('Bring in board data...'));
    const msg = await ctx.until(() => ctx.dialogs.filter(d => /brought in/.test(d.text))[0], 20000);
    ctx.t('bring in: the app says 3 records brought in', !!msg && /^3 records brought in/.test(msg.text), msg ? msg.text : ctx.dialogs.map(d => d.text).join(' | '));
    ctx.t('bring in: the board reloaded', await loaded);
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
