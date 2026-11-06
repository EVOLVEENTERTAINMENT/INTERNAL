// Settings on the board: the 11 sections, Connections, troubleshooting,
// Download data through EVOLVE_DOWNLOADS, and Quick capture off the fake line.
'use strict';
const fs = require('fs');
const path = require('path');
module.exports = {
  main: async ctx => {
    const a = { mcp: !!ctx.fixtures.mcp, ai: !!ctx.fixtures.ai, downloads: !!ctx.env.EVOLVE_DOWNLOADS, capText: 'Sample capture: order more sample tape' };
    const before = ctx.downloads.length;
    const v = await ctx.page(async (H, a) => {
      await H.tab('settings');
      H.t('settings: title is Settings', H.text('#ptitle') === 'Settings', H.text('#ptitle'));
      const heads = H.$$('#stage .dsec .hd h3').map(h => h.textContent.trim());
      const want = ['Timer', 'Calendars', 'Connections', 'Connector troubleshooting', 'Quick capture', 'The bin', 'Calendar write test', 'Board rules', 'Data safety', 'Artifact storage', 'Backup'];
      H.t('settings: the 11 sections in order', heads.join('|') === want.join('|'), heads.join('|'));
      const conns = {}; H.rows('Connections').forEach(r => { conns[r.nm] = r.tag; });
      H.t('settings: Saved data is live', conns['Saved data'] === 'live', JSON.stringify(conns));
      H.t('settings: Downloads is live', conns['Downloads'] === 'live');
      H.t('settings: Google Calendar is ' + (a.mcp ? 'live' : 'off'), conns['Google Calendar'] === (a.mcp ? 'live' : 'off'));
      H.t('settings: Messages is off', conns['Messages'] === 'off');
      const diag = H.rows('Connector troubleshooting').map(r => r.nm);
      if (a.mcp) H.t('settings: troubleshooting lists the fake connectors', diag.indexOf('Google Calendar') >= 0 && diag.indexOf('Capture Line') >= 0, diag.join(','));
      // without a connector the board never asks what is listed, so the row says it has not checked
      else H.t('settings: troubleshooting says nothing was listed', diag.indexOf('Nothing connected') >= 0 || diag.indexOf('Not checked yet') >= 0, diag.join(','));
      H.t('settings: Calendars reads 6 of 7', !!H.section('Calendars') && H.has(H.section('Calendars'), '6 of 7 being read'));

      if (!a.downloads) H.skip('backup: Download data saves a file', 'no EVOLVE_DOWNLOADS dir');
      else {
        const btn = H.button('Download data');
        H.t('backup: the Download data button is there', !!btn);
        if (btn) btn.click();
        const toast = await H.until(() => H.toasts().filter(t => /^Saved \d+ records/.test(t))[0], 20000);
        H.t('backup: the toast says how many records were saved', !!toast, toast || H.toasts().join(' | '));
      }

      if (!a.mcp) H.skip('capture: the line is pulled', 'no fake connectors (EVOLVE_FAKE_MCP)');
      else {
        await H.until(() => S.servers.cap, 5000);
        H.t('capture: the line is answering', !!(mcp && S.servers.cap) && H.has(H.section('Quick capture'), 'Answering as Capture Line'));
        await capPull(false);
        const sc = await H.until(() => S.scraps.filter(x => x.text === a.capText)[0], 15000);
        H.t('capture: the capture landed in the inbox as a scrap', !!sc, sc ? sc.id : 'none');
        return { cap: sc && sc.id };
      }
      return {};
    }, a);

    if (a.downloads) {
      const got = await ctx.until(() => ctx.downloads.length > before, 10000);
      ctx.t('backup: a file was written to EVOLVE_DOWNLOADS', !!got, ctx.downloads.length + ' files');
      if (got) {
        const f = ctx.downloads[ctx.downloads.length - 1].file;
        ctx.t('backup: the file is named Evolve_OS_Data_<date>.json', /^Evolve_OS_Data_\d{4}-\d{2}-\d{2}\.json$/.test(path.basename(f)), path.basename(f));
        let rows = [];
        try {
          const r = require('../../app/importer').readExport(fs.readFileSync(f, 'utf8'));
          rows = Array.isArray(r) ? r : (r && r.rows) || [];   // older readExport gave the array itself
          ctx.t('backup: importer.readExport reads it', rows.length > 0, rows.length + ' records' + (r && r.skipped && r.skipped.length ? ', skipped ' + JSON.stringify(r.skipped).slice(0, 120) : ''));
        } catch (e) { ctx.t('backup: importer.readExport reads it', false, e.message); }
        const have = {}; rows.forEach(r => { have[r.col + '/' + r.id] = 1; });
        const seeded = [];
        const snap = ctx.env.EVOLVE_SNAPSHOT;
        if (snap && fs.existsSync(snap)) for (const col of fs.readdirSync(snap)) { const d = path.join(snap, col); if (fs.statSync(d).isDirectory()) for (const f2 of fs.readdirSync(d)) if (f2.endsWith('.json')) seeded.push(col + '/' + f2.slice(0, -5)); }
        const missing = seeded.filter(k => !have[k]);
        ctx.t('backup: every seeded record is in the file', seeded.length > 0 && !missing.length, seeded.length + ' seeded, missing: ' + missing.join(','));
        ctx.t('backup: the boot writes are in the file too', !!have['diag/boot'] && !!have['crew/Gavin'] && !!have['people/owner']);
        const counts = {}; rows.forEach(r => { counts[r.col] = (counts[r.col] || 0) + 1; });
        ctx.t('backup: record counts per collection', counts.projects === 4 && counts.prospects === 5 && counts.scraps >= 6, JSON.stringify(counts).slice(0, 300));
      }
    }
    if (a.mcp) {
      const filed = ctx.mcpCalls().filter(c => c.tool === 'mark_filed' && Array.isArray(c.input.ids) && c.input.ids.indexOf('cap1') >= 0);
      ctx.t('capture: mark_filed was called for cap1', filed.length > 0, ctx.mcpCalls().filter(c => c.server === 'Capture Line').map(c => c.tool).join(','));
      ctx.t('capture: the scrap is on disk', !!(v && v.cap && ctx.readCol('scraps')[v.cap]), v && v.cap);
      const cl = ctx.readCol('prefs').capline;
      ctx.t('capture: prefs/capline on disk counts it', !!cl && Number(cl.data.ran) >= 1 && !cl.data.lastErr, cl ? JSON.stringify(cl.data) : 'missing');
      if (a.ai) ctx.t('capture: the fake Claude sorted it', ctx.aiCalls().some(c => (c.hits || []).indexOf('WHAT HE SAID:') >= 0 && c.afterTool === 'catch_note'), ctx.aiCalls().map(c => (c.hits || []).join('+') + '/' + c.round).join(', '));
    }
  }
};
