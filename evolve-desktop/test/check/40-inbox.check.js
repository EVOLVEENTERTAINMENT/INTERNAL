// Inbox: the sample scraps, binning one, a delete that goes to the bin in
// Settings and comes back, the brain dump and the chat with the fake Claude.
'use strict';
module.exports = {
  main: async ctx => {
    const a = { ai: !!ctx.fixtures.ai, chatNote: 'Sample chat note from the fake Claude' };
    const v = await ctx.page(async (H, a) => {
      await H.tab('dump');
      H.t('inbox: title is Inbox', H.text('#ptitle') === 'Inbox', H.text('#ptitle'));
      const raw = S.scraps.filter(x => x.state === 'raw'), binned = S.scraps.filter(x => x.state === 'binned');
      H.t('inbox: the 3 raw sample scraps are loaded', ['s1', 's2', 's3'].every(id => raw.some(x => x.id === id)), raw.map(x => x.id).join(','));
      H.t('inbox: the 3 binned sample scraps are loaded', ['s4', 's5', 's6'].every(id => binned.some(x => x.id === id)), binned.map(x => x.id).join(','));
      H.t('inbox: raw scraps are on the page', H.has('#stage', 'Sample note 1') && H.has('#stage', 'Sample note 3'));
      setScrap('s1', { state: 'binned', binned_why: 'check' }); await H.wait(400);
      H.t('inbox: binning s1 takes it off the raw list', !S.scraps.some(x => x.id === 's1' && x.state === 'raw'));

      const s2 = S.scraps.filter(x => x.id === 's2')[0];
      const b = await binDel('scraps/s2', s2, 'Sample note 2', 'scrap', null, null);
      H.t('bin: a deleted record lands in the bin', !!b && !!b.id, b && b.id);
      S.scraps = S.scraps.filter(x => x.id !== 's2'); paint();
      await H.until(() => (S.bin || []).some(x => x.id === (b && b.id)), 5000);
      await H.tab('settings');
      const row = H.rows('The bin').filter(r => r.nm === 'Sample note 2')[0];
      H.t('bin: Settings lists it', !!row, H.rows('The bin').map(r => r.nm).join(','));
      if (row) {
        const back = H.$$('button').filter(x => row.el.contains(x) && x.textContent.trim() === 'Put it back')[0];
        H.t('bin: the row has Put it back', !!back);
        if (back) back.click();
      }
      const restored = await H.until(() => S.scraps.some(x => x.id === 's2'), 8000);
      H.t('bin: Put it back restores the scrap', !!restored);
      H.t('bin: the bin row is gone', !(S.bin || []).some(x => x.id === (b && b.id)));
      await H.tab('dump');

      if (!a.ai) {
        H.skip('brain dump: Claude sorts the lines into items', 'no fake Claude (EVOLVE_FAKE_AI)');
        H.skip('chat: the canned catch_note made a scrap', 'no fake Claude (EVOLVE_FAKE_AI)');
        return { bin: b && b.id };
      }
      bdOpenWith('Call the sample dentist tomorrow\nSample Client owes the logo files');
      const items = await H.until(() => (S.bd && S.bd.items && S.bd.items.length) ? S.bd.items : null, 15000);
      H.t('brain dump: Claude sorts the lines into items', !!items && items.length === 2, items ? items.map(x => x.id + ':' + x.kind).join(',') : 'no items');
      H.t('brain dump: the kinds come through', !!items && items[0].kind === 'task' && items[1].kind === 'waiting');
      H.t('brain dump: the sheet is on the page', H.has('#stage', 'Call the sample dentist'));
      S.bd = null; S.bdText = ''; paint();

      S.lane = 'ask'; paintCmd();
      H.$('#cmd').value = 'Remind me to send the sample invoice';
      H.click('#cmdgo');
      await H.until(() => S.busy, 2000);
      const quiet = await H.until(() => !S.busy, 20000);
      const last = S.chat[S.chat.length - 1];
      H.t('chat: Claude answered', !!quiet && !!last && last.role === 'assistant' && last.text === 'Caught it.', last ? last.role + ': ' + last.text : 'no turn');
      const note = S.scraps.filter(x => x.text === a.chatNote)[0];
      H.t('chat: the canned catch_note made a scrap', !!note, note ? note.id : 'none');
      H.t('chat: the talk panel is open', !!H.$('#talk'));
      S.lane = 'dump'; paintCmd();
      await H.wait(1200);
      return { bin: b && b.id, note: note && note.id };
    }, a);

    const scraps = ctx.readCol('scraps');
    ctx.t('inbox: s1 is binned on disk', !!scraps.s1 && scraps.s1.data.state === 'binned', scraps.s1 && scraps.s1.data.state);
    ctx.t('bin: s2 is back on disk', !!scraps.s2);
    ctx.t('bin: the bin row is gone from disk', !!(v && v.bin) && !ctx.readCol('bin')[v.bin], v && v.bin);
    if (a.ai) {
      const log = ctx.readCol('chat').log;
      ctx.t('chat: chat/log is on disk', !!log && Array.isArray(log.data.turns) && log.data.turns.some(t => t.role === 'assistant'), log ? log.data.turns.length + ' turns' : 'missing');
      ctx.t('chat: the scrap is on disk', !!(v && v.note && scraps[v.note]));
      const ai = ctx.aiCalls();
      ctx.t('chat: the fake Claude saw a tool round', ai.some(c => c.afterTool === 'catch_note'), ai.length + ' calls');
    }
  }
};
