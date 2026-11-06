// People (crew seeded, add and remove through the form, the waiting row),
// Deliverables, Leads and Brain.
'use strict';
module.exports = {
  // A failed check can be listed here as {name, why} with the file:line of a
  // known bug outside the checks; it is then reported as known and does not
  // fail the run. Nothing is listed right now: the two word crew name below
  // used to be refused by the store's id rule (app/store.js) and is accepted since.
  KNOWN_FAILURES: [],
  main: async ctx => {
    const v = await ctx.page(async H => {
      await H.tab('people');
      H.t('people: title is People', H.text('#ptitle') === 'People', H.text('#ptitle'));
      H.t('people: the crew is seeded', !!S.crew.Gavin && !!S.crew.Grace, Object.keys(S.crew).join(','));
      H.t('people: the sample waiting row shows', H.has('#stage', 'Sample logo files'));
      crewEdit(null); await H.wait(150);
      H.t('people: the add form opens', !!H.$('.veil .modal'));
      H.fill({ 0: 'Samplecrew', 1: 'Sample shooter', 2: 'Mon, Tue' }); H.modal('Save'); await H.wait(500);
      H.t('people: Samplecrew is added', !!S.crew.Samplecrew && S.crew.Samplecrew.role === 'Sample shooter', JSON.stringify(S.crew.Samplecrew || null).slice(0, 120));
      H.t('people: Samplecrew shows on the page', H.has('#stage', 'Samplecrew'));
      crewEdit(null); await H.wait(150);
      H.fill({ 0: 'Sample Person', 1: 'Sample editor' }); H.modal('Save'); await H.wait(500);
      H.t('people: a two word name is accepted by the board', !!S.crew['Sample Person']);
      crewRemove({ name: 'Samplecrew', key: 'Samplecrew' }); await H.wait(150);
      H.t('people: removing asks first', !!H.$('.veil .modal'));
      H.modal('Do it'); await H.wait(500);
      H.t('people: Samplecrew is off the crew', !S.crew.Samplecrew);

      await H.tab('deliver');
      H.t('deliverables: title is Deliverables', H.text('#ptitle') === 'Deliverables', H.text('#ptitle'));
      H.t('deliverables: rows are loaded', (S.dels || []).length >= 1, (S.dels || []).length + ' rows');
      H.t('deliverables: the sample row shows', H.has('#stage', 'Sample brand film'));

      await H.tab('leads');
      const n = await H.until(() => prList().length, 15000);
      H.t('leads: the 5 sample prospects are loaded', n === 5, String(n));
      H.t('leads: the page shows Sample Business 1', H.has('#stage', 'Sample Business 1'));

      await H.tab('brain');
      H.t('brain: title is Brain', H.text('#ptitle') === 'Brain', H.text('#ptitle'));
      H.t('brain: the Automations section is there', !!H.section('Automations'));
      H.t('brain: 12 automation cards', H.$$('#stage .aucard').length === 12, H.$$('#stage .aucard').length + ' cards');
      H.t('brain: every automation is named', SWEEPS.every(s => H.has('#stage', s.name)), SWEEPS.filter(s => !H.has('#stage', s.name)).map(s => s.name).join(','));
      return {};
    });
    const crew = ctx.readCol('crew');
    ctx.t('people: Gavin and Grace are on disk', !!crew.Gavin && !!crew.Grace, Object.keys(crew).join(','));
    ctx.t('people: Samplecrew is marked removed on disk', !!crew.Samplecrew && crew.Samplecrew.data.removed === true, crew.Samplecrew ? JSON.stringify(crew.Samplecrew.data) : 'missing');
    ctx.t('people: a two word name saves to disk', !!crew['Sample Person'], Object.keys(crew).join(','));
  }
};
