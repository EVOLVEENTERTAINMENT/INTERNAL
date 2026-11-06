// Board: day and week, Recap, Close the day, and with the fake calendar the
// events, the chip, invalidate, the approval queue and undo.
'use strict';
module.exports = {
  main: async ctx => {
    const fx = ctx.fixtures.mcp || null;
    const evolveId = fx ? Object.keys(fx.calendar || {})[0] : '';
    await ctx.page(async (H, a) => {
      await H.tab('board');
      H.t('board: title is Board', H.text('#ptitle') === 'Board', H.text('#ptitle'));
      H.click(H.button('Week')); await H.wait(200);
      H.t('board: Week switches the view', S.view === 'week', S.view);
      H.click(H.button('Day')); await H.wait(200);
      H.t('board: Day switches the view', S.view === 'day', S.view);
      H.click(H.button('Recap')); await H.wait(200);
      H.t('board: Recap opens the review room', S.mode === 'review' && H.text('#ptitle') === 'Recap', S.mode + ' / ' + H.text('#ptitle'));
      S.recap = false; S.mode = 'board'; paint();
      if (!a.fake) { H.t('calendar: chip says the calendar is not reachable', /not reachable|no connector/i.test(calChipText()), calChipText()); return; }
      const got = await H.until(() => S.events.length >= 2, 20000);
      H.t('calendar: the fixture events loaded', !!got, S.events.length + ' events: ' + S.events.map(x => x.title).join(', '));
      H.t('calendar: rawCal holds the EVOLVE calendar', !!rawCal.EVOLVE);
      H.t('calendar: chip says live', /live/.test(calChipText()), calChipText());
      H.t('calendar: writes are allowed', canWriteCalendar());
      H.t('calendar: the day shows Sample edit block', H.has('#stage', 'Sample edit block'));
    }, { fake: !!fx });

    if (fx) {
      const n0 = ctx.mcpCalls().filter(c => c.tool === 'list_events').length;
      await ctx.page(async H => { await mcp.invalidate(GC, 'list_events'); await H.wait(800); });
      const n1 = ctx.mcpCalls().filter(c => c.tool === 'list_events').length;
      ctx.t('calendar: invalidate refetches list_events', n1 > n0, n0 + ' calls, then ' + n1);

      const v2 = await ctx.page(async H => {
        const d = plus(bday(new Date()), 1);
        const s = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 16, 0).getTime(), e = s + 3600000;
        const ok = stage({ type: 'create', cal: 'EVOLVE', title: 'Sample check block', desc: 'made by the check', toS: s, toE: e, note: 'check' });
        H.t('queue: stage puts a create in the queue', ok === true && S.pending.length === 1, S.pending.length + ' pending');
        H.t('queue: the header counts it', !H.$('#qbtn').hidden && /1 waiting/.test(H.text('#qbtn')), H.text('#qbtn'));
        await approve(S.pending.filter(p => p.title === 'Sample check block'));
        const empty = await H.until(() => !S.pending.length, 10000);
        H.t('queue: approve empties the queue', !!empty, S.pending.length + ' left');
        const live = await H.until(() => S.events.filter(x => x.title === 'Sample check block')[0], 10000);
        H.t('queue: the new block comes back from the calendar', !!live, live ? live.id : 'not listed');
        H.t('queue: the write is in history', !!(S.hist[0] && !S.hist[0].undone), S.hist[0] && S.hist[0].label);
        return { evId: live ? live.id : null };
      });
      const cr = ctx.mcpCalls().filter(c => c.tool === 'create_event')[0];
      ctx.t('queue: the fixture received create_event with the staged args', !!cr && cr.input.summary === 'Sample check block' && cr.input.calendarId === evolveId && cr.input.notificationLevel === 'NONE' && !!cr.input.startTime,
        cr ? JSON.stringify(cr.input).slice(0, 250) : 'no create_event call');

      await ctx.page(async H => {
        await undoBatch(S.hist[0]);
        const gone = await H.until(() => !S.events.some(x => x.title === 'Sample check block'), 10000);
        H.t('queue: undo takes the block back off the calendar', !!gone);
        H.t('queue: history marks it undone', !!(S.hist[0] && S.hist[0].undone));
      });
      const del = ctx.mcpCalls().filter(c => c.tool === 'delete_event')[0];
      ctx.t('queue: the fixture received delete_event for the undo', !!del && !!v2 && del.input.eventId === v2.evId, del ? JSON.stringify(del.input).slice(0, 200) : 'no delete_event call');
      const log = ctx.readCol('changelog');
      ctx.t('queue: the change is in changelog on disk', Object.keys(log).some(k => (log[k].data || {}).undone === true), Object.keys(log).length + ' rows');
    }

    const closed = await ctx.page(async H => {
      await H.tab('board');
      startCloseRun(); await H.wait(300);
      H.t('close: Close the day opens the review room', S.mode === 'review' && H.text('#ptitle') === 'Close the day', S.mode + ' / ' + H.text('#ptitle'));
      const key = S.closing;
      H.t('close: it opens on a day', /^\d{4}-\d{2}-\d{2}$/.test(String(key)), String(key));
      H.click(H.button('Done closing')); await H.wait(500);
      H.t('close: the day is marked closed', !!(S.done[key] && S.done[key].closedAt), key);
      S.closing = null; S.closeRun = null; S.mode = 'board'; paint();
      return { key };
    });
    const done = closed && closed.key ? ctx.readCol('done')[closed.key] : null;
    ctx.t('close: done/<date> is on disk with closedAt', !!done && !!done.data.closedAt, closed && closed.key);
  }
};
