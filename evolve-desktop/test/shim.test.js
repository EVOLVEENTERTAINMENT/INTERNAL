// The doorway, run against a real local store through a fake host, the way
// the board uses it: subscriptions refresh on writes, queries filter.
const assert = require('assert'); const vm = require('vm'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { LocalStore } = require('../app/store');
const store = new LocalStore(fs.mkdtempSync(path.join(os.tmpdir(), 'evsh-')));
const listeners = [];
store.onChange(ev => listeners.forEach(f => f(ev)));
const H = { 'db:get': a => store.get(a.path), 'db:set': a => store.set(a.path, a.data), 'db:update': a => store.update(a.path, a.data),
  'db:delete': a => store.delete(a.path), 'db:query': a => store.query(a.col, a.q), 'host:caps': () => ({}) };
const win = { evolveHost: { invoke: (ch, a) => { try { return Promise.resolve(H[ch](a)); } catch (e) { return Promise.reject(e); } }, on: (ch, cb) => listeners.push(cb) },
  setTimeout, btoa: s => Buffer.from(s, 'binary').toString('base64') };
win.window = win;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../app/shim/claude-shim.js'), 'utf8'), win);
(async () => {
  const db = await win.claude.use('db'); assert.ok(db);
  assert.equal(await win.claude.use('sample'), null);
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
