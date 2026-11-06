// Error codes cross the bridge: a failed db or connector call rejects in the
// page with the code main.js gave it, not only the message. The db part runs
// against the real store. The connector part first reaches the real mcp:call
// (the fake is stepped aside for a moment, so Google Calendar is not
// connected), then the fake, which answers the same way for an unknown server.
'use strict';
const hooks = require('../../app/testhooks');
module.exports = {
  main: async ctx => {
    await ctx.page(async H => {
      const db = await window.claude.use('db');
      const up = await db.doc('nothere/x').update({ a: 1 }).then(() => null, e => e);
      H.t('errors: update of a missing document rejects with not_found', !!up && up.code === 'not_found', up ? up.code + ': ' + up.message : 'resolved');
      H.t('errors: the message comes with it', !!up && /nothere\/x/.test(String(up.message)), up && up.message);
      const bad = await db.doc('nothere').get().then(() => null, e => e);
      H.t('errors: a bad path rejects with invalid_argument', !!bad && bad.code === 'invalid_argument', bad ? bad.code : 'resolved');
      let un = null;
      const sub = await new Promise(res => { un = db.doc('nothere').onSnapshot(() => res({ code: 'no error' }), res); setTimeout(() => res({ code: 'no callback' }), 3000); });
      if (un) un();
      H.t('errors: a subscription that cannot read reports the code', sub.code === 'invalid_argument', sub.code);
      // the board's own fallback: update fails with not_found, then set writes the record
      const merged = await dbMerge('nothere/y', { b: 2 });
      H.t('errors: dbMerge falls back to set for a missing record', merged === true && (await db.doc('nothere/y').get()).data().b === 2, String(merged));
      // the wire shape itself, as preload hands it to the shim
      const raw = await window.evolveHost.invoke('db:update', { path: 'nothere/z', data: { a: 1 } });
      H.t('errors: the app answers a failed call with {error: {code, message}}', !!raw && !!raw.error && raw.error.code === 'not_found' && typeof raw.error.message === 'string', JSON.stringify(raw));
    });

    const mcpPart = async (H, a) => {
      const mcp = await window.claude.use('mcp');
      if (!mcp) { H.skip('errors: ' + a.label + ' callTool rejects with server_not_connected', 'mcp is null here'); return; }
      const e = await mcp.callTool(a.server, 'list_events', {}).then(() => null, x => x);
      H.t('errors: ' + a.label + ' callTool rejects with server_not_connected', !!e && e.code === 'server_not_connected' && e.retryable === false, e ? e.code + ': ' + e.message : 'resolved');
      const ev = await new Promise(res => { mcp.watchTool(a.server, 'list_events', {}, res); setTimeout(() => res({ type: 'none' }), 3000); });
      H.t('errors: ' + a.label + ' watchTool hands the handler {type: error, error: {code}}', ev.type === 'error' && !!ev.error && ev.error.code === 'server_not_connected', JSON.stringify(ev).slice(0, 200));
    };
    const fake = hooks.api.fakes.mcp;
    hooks.api.fakes.mcp = null;
    try { await ctx.page(mcpPart, { server: 'Google Calendar', label: 'real app, no connectors:' }); }
    finally { hooks.api.fakes.mcp = fake; }
    if (fake) await ctx.page(mcpPart, { server: 'Nothere', label: 'fake connectors, unknown server:' });
    const raw = await ctx.page(async () => window.evolveHost.invoke('mcp:call', { server: 'Nothere', tool: 'list_events', input: {} }));
    ctx.t('errors: mcp:call answers a failed call with {error: {code, message}}', !!raw && !!raw.error && raw.error.code === 'server_not_connected', JSON.stringify(raw));

    const y = ctx.readCol('nothere').y;
    ctx.t('errors: the dbMerge fallback record is on disk', !!y && y.data.b === 2, y ? JSON.stringify(y.data) : 'missing');
  }
};
