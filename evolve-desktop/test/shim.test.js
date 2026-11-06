// The doorway, run against a real local store through a fake host, the way
// the board uses it: subscriptions refresh on writes, queries filter.
const assert = require('assert'); const vm = require('vm'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { LocalStore } = require('../app/store');
const store = new LocalStore(fs.mkdtempSync(path.join(os.tmpdir(), 'evsh-')));
const listeners = [];
store.onChange(ev => listeners.forEach(f => f(ev)));
const fail = (code, message) => { const e = new Error(message); e.code = code; return e; };
const H = { 'db:get': a => store.get(a.path), 'db:set': a => store.set(a.path, a.data), 'db:update': a => store.update(a.path, a.data),
  'db:delete': a => store.delete(a.path), 'host:caps': () => ({ sample: true, mcp: true }),
  // the "broken" collection cannot be read, the way a store without access answers
  'db:query': a => { if (a.col === 'broken') throw fail('not_granted', 'no access'); return store.query(a.col, a.q); },
  'mcp:list': () => ({ servers: [{ server: 'Google Calendar', tools: [] }] }),
  'mcp:call': a => { if (a.server === 'Google Calendar') return { events: [] }; throw fail('server_not_connected', a.server + ' is not connected'); },
  'ai:messages': a => { aiCalls.push(a); const last = a.messages[a.messages.length - 1];
    const first = String(a.messages[0].content);
    if (first.startsWith('fail ')) return { error: { code: first.split(/\s+/)[1], message: 'no' } };
    const useRound = { content: [{ type: 'tool_use', id: 'u1', name: 'mark_done', input: { id: 't9' } }], stop_reason: 'tool_use' };
    // "slow": the second round takes 120 ms to come back, and comes back with another tool call
    if (first.startsWith('slow') && Array.isArray(last.content)) return new Promise(r => setTimeout(() => r(useRound), 120));
    if (a.tools.length && typeof last.content === 'string') return useRound;
    if (Array.isArray(last.content)) return { content: [{ type: 'text', text: '```json\n{"did":"marked ' + JSON.parse(last.content[0].content).id + '"}\n```' }], stop_reason: 'end_turn' };
    return { content: [{ type: 'text', text: 'Sure: {"ok":true}' }], stop_reason: 'end_turn' }; },
  'ai:abort': a => { aborts.push(a.id); return { aborted: true }; } };
const aiCalls = [], aborts = [];
// Same answer the app gives for a failed call: {error: {code, message}}
// instead of a rejection, because the real bridge keeps only the message.
const guard = fn => async a => { try { return await fn(a); } catch (e) { return { error: { code: e.code || 'unavailable', message: String(e.message || e) } }; } };
const win = { evolveHost: { invoke: (ch, a) => guard(H[ch])(a), on: (ch, cb) => listeners.push(cb) },
  setTimeout, AbortController, btoa: s => Buffer.from(s, 'binary').toString('base64') };
win.window = win;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../app/shim/claude-shim.js'), 'utf8'), win);
(async () => {
  const db = await win.claude.use('db'); assert.ok(db);
  const sample = await win.claude.use('sample'); assert.ok(sample);
  assert.deepEqual(await sample.json('hi'), { ok: true });
  const done = [];
  const out = await sample.json('do it', { modelTier: 'quick', tools: [{ name: 'mark_done', description: 'd', inputSchema: { type: 'object' }, execute: i => { done.push(i.id); return { id: i.id }; } }] });
  assert.deepEqual(out, { did: 'marked t9' }); assert.deepEqual(done, ['t9']); assert.equal(aiCalls[1].tier, 'quick');
  assert.equal((await sample('plain')).text, 'Sure: {"ok":true}');
  assert.ok(aiCalls.every(c => typeof c.id === 'string' && c.id.length > 8), 'every call carries an id');
  assert.ok(new Set(aiCalls.map(c => c.id)).size === aiCalls.length, 'ids differ');
  // the app answers a failed call with {error}: that becomes the rejection, and "aborted" reads as "cancelled"
  await assert.rejects(sample.json('fail timeout'), e => e.code === 'timeout');
  await assert.rejects(sample.json('fail aborted'), e => e.code === 'cancelled');
  await assert.rejects(sample.json('fail not_granted'), e => e.code === 'not_granted');
  // abort during a tool round: the tool ran once, then the signal fires while the second
  // call is in flight. The promise rejects at once, the app is told which call to cut, and
  // the tool_use that comes back after the abort never runs.
  const ac = new win.AbortController(); const ran = [];
  const tool = { name: 'mark_done', description: 'd', inputSchema: { type: 'object' }, execute: i => { ran.push(i.id); return { id: i.id }; } };
  const started = Date.now();
  const slow = sample.json('slow', { tools: [tool], signal: ac.signal });
  await new Promise(r => setTimeout(r, 30));
  assert.deepEqual(ran, ['t9']);
  const idInFlight = aiCalls[aiCalls.length - 1].id;
  ac.abort();
  await assert.rejects(slow, e => e.code === 'cancelled');
  assert.ok(Date.now() - started < 110, 'rejected before the slow round came back');
  assert.deepEqual(aborts, [idInFlight]);
  await new Promise(r => setTimeout(r, 150));
  assert.deepEqual(ran, ['t9'], 'the tool_use after the abort did not run');
  // a signal that already fired: no call is made at all
  const before = aiCalls.length;
  await assert.rejects(sample.json('x', { signal: ac.signal }), e => e.code === 'cancelled');
  assert.equal(aiCalls.length, before);
  // no signal: calls run as before, no abort is sent
  assert.deepEqual(await sample.json('hi'), { ok: true }); assert.deepEqual(aborts, [idInFlight]);
  const seen = [];
  const un = db.collection('prospects').where('status', '==', 'on_sheet').onSnapshot(s => seen.push(s.docs.map(d => d.id)));
  await new Promise(r => setTimeout(r, 20));
  await db.doc('prospects/a').set({ status: 'on_sheet', name: 'A' });
  await db.doc('prospects/b').set({ status: 'queued', name: 'B' });
  await new Promise(r => setTimeout(r, 30));
  assert.deepEqual(seen[seen.length - 1], ['a']);
  const one = await db.doc('prospects/a').get(); assert.equal(one.exists, true); assert.equal(one.data().name, 'A');
  await db.doc('prospects/a').update({ name: 'A2' });
  assert.equal((await db.doc('prospects/a').get()).data().name, 'A2');
  // the code crosses the bridge: a missing document is not_found, so the board can fall back to set
  await assert.rejects(db.doc('prospects/zz').update({ x: 1 }), e => e.code === 'not_found' && /prospects\/zz/.test(e.message));
  const docSeen = []; db.doc('prospects/b').onSnapshot(s => docSeen.push(s.exists));
  await new Promise(r => setTimeout(r, 20)); await db.doc('prospects/b').delete(); await new Promise(r => setTimeout(r, 30));
  assert.deepEqual(docSeen.slice(-1), [false]);
  // a subscription that cannot read reports the code to its error callback
  const subErr = await new Promise(res => { db.collection('broken').onSnapshot(() => res({ code: 'no error' }), res); });
  assert.deepEqual(subErr, { code: 'not_granted', message: 'no access' });
  // the connectors: an unknown server rejects with server_not_connected, in callTool and in watchTool
  const mcp = await win.claude.use('mcp'); assert.ok(mcp);
  assert.deepEqual((await mcp.callTool('Google Calendar', 'list_events', {})).payload, { events: [] });
  await assert.rejects(mcp.callTool('Nothere', 'list_events', {}), e => e.code === 'server_not_connected' && e.retryable === false && /Nothere/.test(e.message));
  const watched = await new Promise(res => { mcp.watchTool('Nothere', 'list_events', {}, res); });
  assert.equal(watched.type, 'error'); assert.equal(watched.error.code, 'server_not_connected');
  un(); console.log('shim ok');
})().catch(e => { console.error(e); process.exit(1); });
