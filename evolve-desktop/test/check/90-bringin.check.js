// File > Bring in board data, through the real menu item with the dialog
// answered by EVOLVE_BRING_IN. The board reloads, so this runs last, and the
// theme chosen in 10-boot is checked across that reload.
'use strict';
module.exports = {
  main: async ctx => {
    if (!ctx.env.EVOLVE_BRING_IN) { ctx.skip('bring in: the export file is brought in', 'no EVOLVE_BRING_IN file'); return; }
    // Three ways to see the reload, so a miss says which part did not happen:
    // the load events, and a marker set on the old page that a reload wipes.
    // Every page call here is time boxed, and the window state goes to the
    // app log every five seconds, so a reload that never answers still tells
    // its story in the log instead of freezing the whole file.
    const wc = ctx.win.webContents;
    const race = (p, ms, v) => Promise.race([p.catch(e => 'ERR ' + (e && e.message || e)), new Promise(r => setTimeout(() => r(v), ms))]);
    const events = [];
    for (const ev of ['did-start-loading', 'did-stop-loading', 'did-finish-load', 'did-fail-load', 'did-navigate', 'render-process-gone', 'unresponsive', 'responsive', 'will-prevent-unload'])
      wc.on(ev, (e, ...a) => events.push(ev + (a.length ? ' ' + JSON.stringify(a.slice(0, 2)).slice(0, 120) : '')));
    // Chrome's debugging protocol can be attached here (EVOLVE_CHECK_CDP=1)
    // to log every request after the reload and any blocking dialog. It is
    // off by default because an attached debugger also switches off the
    // throttling of a hidden window, which hides the very thing under test.
    const dbg = wc.debugger, cdp = [], short = u => String(u || '').replace(/^evolve:\/\/app\//, '').slice(0, 70);
    // With EVOLVE_CHECK_CDP the tracer in testhooks.js is already attached and
    // logging from the first load, so this file only attaches when it is not.
    if (ctx.env.EVOLVE_CHECK_CDP && !dbg.isAttached()) try {
      dbg.attach('1.3'); await dbg.sendCommand('Network.enable'); await dbg.sendCommand('Page.enable');
      dbg.on('message', (e, method, p) => {
        if (method === 'Network.requestWillBeSent') cdp.push('req ' + p.requestId + ' ' + short(p.request.url) + (p.request.headers && p.request.headers.Range ? ' ' + p.request.headers.Range : ''));
        else if (method === 'Network.responseReceived') cdp.push('res ' + p.requestId + ' ' + p.response.status + ' ' + short(p.response.url));
        else if (method === 'Network.loadingFinished') cdp.push('fin ' + p.requestId);
        else if (method === 'Network.loadingFailed') cdp.push('fail ' + p.requestId + ' ' + p.errorText + (p.canceled ? ' canceled' : ''));
        else if (method === 'Page.javascriptDialogOpening') cdp.push('dialog ' + p.type + ' ' + String(p.message).slice(0, 80));
        else if (/^Page\.(frameStoppedLoading|loadEventFired|domContentEventFired|frameNavigated)$/.test(method)) cdp.push(method);
      });
    } catch (e) { console.log('bring in cdp: ' + (e && e.message || e)); }
    await race(ctx.js('window.__beforeReload = 1; "ok"'), 5000, 'no answer');
    ctx.t('bring in: the menu item is there', ctx.menuClick('Bring in board data...'));
    const msg = await ctx.until(() => ctx.dialogs.filter(d => /brought in/.test(d.text))[0], 20000);
    ctx.t('bring in: the app says 3 records brought in', !!msg && /^3 records brought in/.test(msg.text), msg ? msg.text : ctx.dialogs.map(d => d.text).join(' | '));
    let fin = false, gone = false, last = '';
    for (let i = 0; i < 12 && !(fin && gone); i++) {
      await ctx.wait(5000);
      last = String(await race(ctx.js('typeof window.__beforeReload + "|" + (typeof S !== "undefined" && S.migrated)'), 2000, 'no answer'));
      fin = events.includes('did-finish-load'); gone = /^undefined\|/.test(last);
      console.log('bring in state ' + i + ' ' + JSON.stringify({ page: last, loading: wc.isLoading(), waiting: wc.isWaitingForResponse(), crashed: wc.isCrashed(), url: wc.getURL(), events: events.slice(-8), cdp: cdp.splice(0) }));
    }
    try { if (cdp.length && dbg.isAttached()) dbg.detach(); } catch (e) {}
    ctx.t('bring in: the board reloaded', fin || gone, JSON.stringify({ finishEvent: fin, markerGone: gone, page: last, events }));
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
