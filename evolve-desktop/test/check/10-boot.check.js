// Boot and chrome: BUILD, the rail, the migration gate, search, the catch
// bar, the conveniences kept in localStorage, and diag/boot on disk.
'use strict';
module.exports = {
  main: async ctx => {
    const fx = { mcp: !!ctx.fixtures.mcp, ai: !!ctx.fixtures.ai };
    const v = await ctx.page(async (H, fx) => {
      H.t('boot: BUILD is defined', typeof BUILD === 'string' && BUILD.charAt(0) === 'V', typeof BUILD === 'string' ? BUILD : typeof BUILD);
      H.t('boot: the #modes rail is in the page', !!H.$('#modes'));
      const mig = await H.until(() => S.migrated, 10000);
      H.t('boot: the migration gate opened', mig === 'snapshots in' || mig === 'ready', String(mig));
      const st = H.$('#standing');
      H.t('boot: the standing strip is empty', !!st && (st.hidden === true || !st.children.length), H.text('#standing'));
      H.t('boot: db capability is live', !!db);
      H.t('boot: downloads capability is live', !!dlx);
      if (fx.mcp) H.t('boot: mcp capability is live (fake connectors)', !!mcp);
      else {
        H.t('boot: mcp is null without connectors', !mcp);
        H.t('boot: chip says the calendar is not reachable', H.text('#connt') === 'Calendar not reachable', H.text('#connt'));
      }
      if (fx.ai) H.t('boot: sample capability is live (fake Claude)', !!sample); else H.t('boot: sample is null without a key', !sample);

      const want = { dash: 'Home', board: 'Board', leads: 'Leads', co: 'Projects', pipe: 'Pipeline', money: 'Money', people: 'People', deliver: 'Deliverables', dump: 'Inbox', brain: 'Brain', settings: 'Settings' };
      const tabs = H.$$('#modes button[data-m]').map(b => b.dataset.m);
      H.t('rail: 11 tabs', tabs.length === 11, tabs.join(','));
      for (const m of tabs) {
        await H.tab(m);
        const cur = (H.$('#modes button[aria-current="true"]') || { dataset: {} }).dataset.m;
        H.t('rail: ' + m + ' is current after a click', cur === m, String(cur));
        H.t('rail: ' + m + ' title is ' + want[m], H.text('#ptitle') === want[m], H.text('#ptitle'));
        H.t('rail: ' + m + ' painted something', H.$('#stage').children.length > 0);
      }

      const inp = H.$('#srch'); inp.value = 'Sample'; searchPaint();
      H.t('search: typing Sample lists results', SRCH.rows.length > 0 && !H.$('#spanel').hidden, SRCH.rows.length + ' rows');
      H.t('search: a sample project is among them', SRCH.rows.some(r => /Sample/.test(r.t)), SRCH.rows.slice(0, 3).map(r => r.t).join(' | '));
      inp.value = ''; searchPaint();

      await H.tab('dash');
      S.lane = 'dump'; paintCmd();
      H.$('#cmd').value = 'Call the sample dentist';
      H.click('#cmdgo');
      const sc = await H.until(() => S.scraps.filter(x => x.text === 'Call the sample dentist')[0], 3000);
      H.t('catch bar: Save makes a raw scrap', !!sc && sc.state === 'raw', sc ? sc.id : 'none');
      H.t('catch bar: the box is cleared', H.$('#cmd').value === '');

      setTheme('light');
      let th = ''; try { th = localStorage.getItem('sb-theme'); } catch (e) {}
      H.t('localStorage: the theme choice is remembered', th === 'light' && document.documentElement.getAttribute('data-theme') === 'light', String(th));
      H.click('#railtog');
      let rail = null; try { rail = localStorage.getItem('sb-rail'); } catch (e) {}
      H.t('localStorage: the rail width is remembered', rail === '0' || rail === '1', String(rail));
      H.click('#railtog');
      await H.wait(400);
      return { scrap: sc ? sc.id : null };
    }, fx);

    const boot = ctx.readCol('diag').boot;
    ctx.t('boot: diag/boot is on disk with db and downloads', !!boot && !!boot.data && boot.data.db === true && boot.data.downloads === true, boot ? JSON.stringify(boot.data).slice(0, 200) : 'missing');
    if (boot && boot.data) {
      ctx.t('boot: diag/boot says mcp ' + fx.mcp, boot.data.mcp === fx.mcp, String(boot.data.mcp));
      ctx.t('boot: diag/boot says sample ' + fx.ai, boot.data.sample === fx.ai, String(boot.data.sample));
    }
    const sc = v && v.scrap ? ctx.readCol('scraps')[v.scrap] : null;
    ctx.t('catch bar: the scrap is on disk as raw', !!sc && sc.data.state === 'raw' && sc.data.text === 'Call the sample dentist', sc ? JSON.stringify(sc.data).slice(0, 120) : 'missing');
  }
};
