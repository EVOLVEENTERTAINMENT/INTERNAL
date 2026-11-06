// The Capture Line, built into the app. Texts and voice notes land in the
// "captures" collection (see supabase/functions/capture), and the board
// pulls them the same way it was built to on claude.ai: get_pending, then
// mark_filed once each one is handled. Same answers as the old worker.
'use strict';
const TOOLS = ['get_pending', 'mark_filed'];

async function call(store, tool, input) {
  if (tool === 'get_pending') {
    const rows = await store.query('captures', { where: [['state', '==', 'pending']], orderBy: [['at', 'asc']], limit: 100 });
    return { items: rows.map(r => ({ id: r.id, at: r.data.at, text: r.data.text, via: r.data.via, from: r.data.from })) };
  }
  if (tool === 'mark_filed') {
    const ids = Array.isArray(input && input.ids) ? input.ids.filter(x => typeof x === 'string' && /^[A-Za-z0-9._:-]{1,80}$/.test(x)) : [];
    let n = 0;
    for (const id of ids) {
      try { await store.update('captures/' + id, { state: 'filed', filed_at: new Date().toISOString() }); n++; }
      catch (e) { if (e.code !== 'not_found') throw e; }
    }
    return { filed: n };
  }
  const e = new Error('Capture Line has no tool ' + tool); e.code = 'tool_error'; throw e;
}
module.exports = { call, TOOLS, SERVER: 'Capture Line' };
