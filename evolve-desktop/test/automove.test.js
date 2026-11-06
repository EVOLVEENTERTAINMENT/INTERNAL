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
  const exp = (n, title) => JSON.stringify({ format: 'evolve-os-export', version: 1, collections: { projects: { p1: { title } }, tasks: Object.fromEntries([...Array(n)].map((_, i) => ['t' + i, { i }])) } });
  fs.writeFileSync(path.join(dl, 'Evolve_OS_Data_old.json'), exp(1, 'old')); fs.utimesSync(path.join(dl, 'Evolve_OS_Data_old.json'), 1, 1);
  fs.writeFileSync(path.join(dl, 'Evolve_OS_Data_2026-11-06.json'), exp(3, 'new'));
  fs.writeFileSync(path.join(dl, 'something_else.json'), '{}');
  const local = new LocalStore(path.join(tmp, 'local')); local.set('scraps/s1', { text: 'made in the app' }); local.set('projects/p1', { title: 'local copy' });
  assert.equal(await s.count(), 0);
  const r = await autoMove({ sb: s, local, downloads: dl });
  assert.equal(r.n, 5, 'p1, three tasks, one scrap'); assert.ok(r.file.endsWith('2026-11-06.json'), 'the newest file');
  assert.equal((await s.get('projects/p1')).data.title, 'new', 'the export wins over the local copy');
  assert.equal((await s.get('scraps/s1')).data.text, 'made in the app');
  assert.equal(await s.count(), 5);
  await s.set('tasks/t0', { i: 'changed' });
  assert.deepEqual(await autoMove({ sb: s, local, downloads: dl }), { n: 0, skipped: 'not_empty' });
  assert.equal((await s.get('tasks/t0')).data.i, 'changed', 'never overwrites');
  await c.end(); await fake.close(); console.log('automove ok');
})().catch(e => { console.error(e); process.exit(1); });
