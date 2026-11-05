// The doorway, run against a real local store through a fake host, the way
// the board uses it: subscriptions refresh on writes, queries filter.
const assert = require('assert'); const vm = require('vm'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { LocalStore } = require('../app/store');
const store = new LocalStore(fs.mkdtempSync(path.join(os.tmpdir(), 'evsh-')));
const listeners = [];
store.onChange(ev => listeners.forEach(f => f(ev)));
const H = { 'db:get': a => store.get(a.path), 'db:set': a => store.set(a.path, a.data), 'db:update': a => store.update(a.path, a.data),
  'db:delete': a => store.delete(a.path), 'db:query': a => store.query(a.col, a.q), 'host:caps': () => ({ sample: true }),
  'ai:messages': a => { aiCalls.push(a); const last = a.messages[a.messages.length - 1];
    if (a.tools.length && typeof last.content === 'string') return { content: [{ type: 'tool_use', id: 'u1', name: 'mark_done', input: { id: 't9' } }], stop_reason: 'tool_use' };
    if (Array.isArray(last.content)) return { content: [{ type: 'text', text: '```json\n{"did":"marked ' + JSON.parse(last.content[0].content).id + '"}\n```' }], stop_reason: 'end_turn' };
    return { content: [{ type: 'text', text: 'Sure: {"ok":true}' }], stop_reason: 'end_turn' }; } };
const aiCalls = [];
const win = { evolveHost: { invoke: (ch, a) => { try { return Promise.resolve(H[ch](a)); } catch (e) { return Promise.reject(e); } }, on: (ch, cb) => listeners.push(cb) },
  setTimeout, btoa: s => Buffer.from(s, 'binary').toString('base64') };
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
  await assert.rejects(db.doc('prospects/zz').update({ x: 1 }));
  const docSeen = []; db.doc('prospects/b').onSnapshot(s => docSeen.push(s.exists));
  await new Promise(r => setTimeout(r, 20)); await db.doc('prospects/b').delete(); await new Promise(r => setTimeout(r, 30));
  assert.deepEqual(docSeen.slice(-1), [false]);
  un(); console.log('shim ok');
})().catch(e => { console.error(e); process.exit(1); });
