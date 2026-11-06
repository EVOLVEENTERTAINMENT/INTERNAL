// First sign in moves the board: the newest Download data file plus this Mac's
// own records go up to an empty Supabase, and never again once it has records.
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path');
const PG = process.env.EVOLVE_TEST_PG;
if (!PG) { console.log('automove skipped (no EVOLVE_TEST_PG)'); process.exit(0); }
const { SupabaseStore } = require('../app/supabase-store'); const { LocalStore } = require('../app/store');
const { autoMove } = require('../app/automove'); const { start } = require('./fake-supabase');
(async () => {
  const { Client } = require('pg'); const c = new Client({ connectionString: PG }); await c.connect(); await c.query('delete from docs');
  const fake = await start({ pgUrl: PG, email: 'jackson@example.com' });
  const mem = {}; const s = new SupabaseStore({ url: fake.url, anonKey: 'anon', storage: { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; }, removeItem: k => { delete mem[k]; } } });
  s.live = () => {}; await s.sendLink('jackson@example.com', 'http://x/'); await s.finishLink('link-code');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-')), dl = path.join(tmp, 'Downloads'); fs.mkdirSync(dl);
  // the newest file also has a crew name with a space, an id the store refuses and a collection the board could not read
  const exp = (n, title) => JSON.stringify({ format: 'evolve-os-export', version: 1, unread: n > 1 ? ['weather'] : [],
    collections: { projects: { p1: { title } }, tasks: Object.fromEntries([...Array(n)].map((_, i) => ['t' + i, { i }])),
      crew: n > 1 ? { 'John Smith': { role: 'Gaffer' }, 'a/b': { role: 'bad' } } : {} } });
  fs.writeFileSync(path.join(dl, 'Evolve_OS_Data_old.json'), exp(1, 'old')); fs.utimesSync(path.join(dl, 'Evolve_OS_Data_old.json'), 1, 1);
  fs.writeFileSync(path.join(dl, 'Evolve_OS_Data_2026-11-06.json'), exp(3, 'new'));
  fs.writeFileSync(path.join(dl, 'something_else.json'), '{}');
  const local = new LocalStore(path.join(tmp, 'local')); local.set('scraps/s1', { text: 'made in the app' }); local.set('projects/p1', { title: 'local copy' });
  assert.equal(await s.count(), 0);
  const r = await autoMove({ sb: s, local, downloads: dl });
  assert.equal(r.n, 6, 'p1, three tasks, one crew name, one scrap'); assert.ok(r.file.endsWith('2026-11-06.json'), 'the newest file');
  assert.equal((await s.get('projects/p1')).data.title, 'new', 'the export wins over the local copy');
  assert.equal((await s.get('scraps/s1')).data.text, 'made in the app');
  assert.equal((await s.get('crew/John Smith')).data.role, 'Gaffer', 'a name with a space comes through');
  assert.deepEqual(r.skipped, [{ path: 'crew/a/b', reason: 'bad_id' }]); assert.deepEqual(r.unread, ['weather']);
  const note = (await s.get('diag/import')).data;
  assert.deepEqual(note.unread, ['weather']); assert.deepEqual(note.skipped, r.skipped); assert.ok(note.file.endsWith('2026-11-06.json'));
  assert.deepEqual(note.counts, { collections: 4, records: 6, skipped: 1 }); assert.ok(/^\d{4}-\d\d-\d\dT/.test(note.at));
  assert.equal(await s.count(), 7, 'six records and the import note');
  await s.set('tasks/t0', { i: 'changed' });
  assert.deepEqual(await autoMove({ sb: s, local, downloads: dl }), { n: 0, skipped: 'not_empty' });
  assert.equal((await s.get('tasks/t0')).data.i, 'changed', 'never overwrites');
  // a file where every row is skipped and an empty local store: nothing moves, but the note is still written
  await c.query('delete from docs');
  const dl2 = path.join(tmp, 'Downloads2'); fs.mkdirSync(dl2);
  fs.writeFileSync(path.join(dl2, 'Evolve_OS_Data_bad.json'), JSON.stringify({ format: 'evolve-os-export', version: 1, unread: ['weather'], collections: { crew: { 'a/b': { role: 'bad' } } } }));
  const r2 = await autoMove({ sb: s, local: new LocalStore(path.join(tmp, 'local2')), downloads: dl2 });
  assert.equal(r2.n, 0); assert.deepEqual(r2.skipped, [{ path: 'crew/a/b', reason: 'bad_id' }]);
  const note2 = (await s.get('diag/import')).data;
  assert.deepEqual(note2.skipped, [{ path: 'crew/a/b', reason: 'bad_id' }]); assert.deepEqual(note2.unread, ['weather']); assert.deepEqual(note2.counts, { collections: 0, records: 0, skipped: 1 });
  // diag rows alone (the import note, a diag/boot from a board open) do not count as his records: a good file still moves
  await s.set('diag/boot', { db: true });
  assert.equal(await s.count(), 2, 'only diag rows');
  fs.writeFileSync(path.join(dl2, 'Evolve_OS_Data_good.json'), JSON.stringify({ format: 'evolve-os-export', version: 1, collections: { projects: { p9: { title: 'good' } } } }));
  const r3 = await autoMove({ sb: s, local: new LocalStore(path.join(tmp, 'local3')), downloads: dl2 });
  assert.equal(r3.n, 1, 'moved despite the diag rows'); assert.equal((await s.get('projects/p9')).data.title, 'good');
  assert.deepEqual(await autoMove({ sb: s, local: new LocalStore(path.join(tmp, 'local4')), downloads: dl2 }), { n: 0, skipped: 'not_empty' }, 'a real record stops it');
  await c.end(); await fake.close(); console.log('automove ok');
})().catch(e => { console.error(e); process.exit(1); });
