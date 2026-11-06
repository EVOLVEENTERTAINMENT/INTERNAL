// The scheduled tasks' database tool against the stand-in Supabase.
const assert = require('assert'); const { execFile } = require('child_process'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { start } = require('./fake-supabase');
const PG = process.env.EVOLVE_TEST_PG;
if (!PG) { console.log('evoldb skipped (no EVOLVE_TEST_PG)'); process.exit(0); }
(async () => {
  const { Client } = require('pg'); const c = new Client({ connectionString: PG }); await c.connect(); await c.query('delete from docs'); await c.end();
  const fake = await start({ pgUrl: PG, email: 'j@x', code: '123456' });
  const tool = path.join(__dirname, '../tools/evoldb.py');
  const run = (...a) => new Promise(res => execFile('python3', ['-I', tool, ...a], { env: { EVOLVE_DB_URL: fake.url, SUPABASE_SERVICE_KEY: 'service', PATH: process.env.PATH }, encoding: 'utf8' },
    (e, out, err) => res({ code: e ? e.code : 0, out: out.trim() ? JSON.parse(out.trim()) : null, err })));
  let r;
  r = await run('set', 'brain', 'digest', '--data', '{"headline":"a","n":1}'); assert.equal(r.out.version, 1, r.err);
  r = await run('update', 'brain', 'digest', '--data', '{"n":2}', '--if-version', '1'); assert.equal(r.out.version, 2);
  r = await run('update', 'brain', 'digest', '--data', '{"n":3}', '--if-version', '1'); assert.equal(r.code, 3); assert.ok(/version_moved/.test(r.out.error));
  r = await run('update', 'brain', 'nope', '--data', '{"n":3}'); assert.equal(r.code, 4);
  r = await run('get', 'brain', 'digest'); assert.deepEqual(r.out.data, { headline: 'a', n: 2 }); assert.equal(r.out.version, 2);
  await run('set', 'prospects', 'a', '--data', '{"status":"on_sheet","q":2}'); await run('set', 'prospects', 'b', '--data', '{"status":"queued","q":1}'); await run('set', 'prospects', 'c', '--data', '{"status":"dead","q":0}');
  r = await run('query', 'prospects', '--where', '["status","in",["on_sheet","queued"]]', '--order-by', 'q'); assert.deepEqual(r.out.map(x => x.id), ['b', 'a']);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'evdb-'));
  r = await run('list', 'prospects', '--out-dir', dir); assert.equal(r.out.written, 3);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'prospects', 'a.json'))).data.status, 'on_sheet');
  const bf = path.join(dir, 'batch.json'); fs.writeFileSync(bf, JSON.stringify([{ op: 'set', collection: 'runs', doc_id: 'r1', data: { at: 'now' } }, { op: 'update', collection: 'prospects', doc_id: 'a', data: { status: 'called' }, if_version: 1 }]));
  r = await run('batch', bf); assert.equal(r.out.applied, 2);
  r = await run('delete', 'prospects', 'c', '--if-version', '9'); assert.equal(r.code, 3);
  r = await run('delete', 'prospects', 'c'); assert.equal(r.code, 0);
  const c2 = new Client({ connectionString: PG }); await c2.connect();
  const own = await c2.query('select count(*)::int n from docs where owner is null'); assert.equal(own.rows[0].n, 0, 'service writes still belong to the owner'); await c2.end();
  await fake.close(); console.log('evoldb ok');
})().catch(e => { console.error(e); process.exit(1); });
