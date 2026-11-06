// The scheduled tasks' database tool against the stand-in Supabase.
const assert = require('assert'); const { execFile } = require('child_process'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { start } = require('./fake-supabase');
const PG = process.env.EVOLVE_TEST_PG;
if (!PG) { console.log('evoldb skipped (no EVOLVE_TEST_PG)'); process.exit(0); }
(async () => {
  const { Client } = require('pg'); const c = new Client({ connectionString: PG }); await c.connect(); await c.query('delete from docs'); await c.end();
  const fake = await start({ pgUrl: PG, email: 'j@x' });
  const tool = path.join(__dirname, '../tools/evoldb.py');
  // The script carries no key of its own: the real one is a network secret the proxy puts in.
  // The stand-in server has no proxy, so the tests hand it a made up key through the
  // test only option, which the script honours only for a localhost URL.
  const runWith = (env, args) => new Promise(res => execFile('python3', ['-I', tool, ...args], { env: Object.assign({ PATH: process.env.PATH }, env), encoding: 'utf8' },
    (e, out, err) => res({ code: e ? e.code : 0, out: out.trim() ? JSON.parse(out.trim()) : null, err })));
  const run = (...a) => runWith({ EVOLVE_DB_URL: fake.url }, ['--localhost-test-key', 'service', ...a]);
  let r;
  // no key path through the environment any more: the variable is ignored and the request carries only the placeholder
  r = await runWith({ EVOLVE_DB_URL: fake.url, SUPABASE_SERVICE_KEY: 'service' }, ['get', 'brain', 'digest']); assert.equal(r.code, 2); assert.ok(/http 401/.test(r.out.error), r.out.error);
  r = await runWith({ EVOLVE_DB_URL: fake.url }, ['get', 'brain', 'digest']); assert.equal(r.code, 2); assert.ok(/http 401/.test(r.out.error));
  // the test key is refused for anything that is not localhost, before any request goes out
  r = await runWith({ EVOLVE_DB_URL: 'https://example.supabase.co' }, ['--localhost-test-key', 'service', 'get', 'brain', 'digest']); assert.equal(r.code, 2); assert.ok(/test server only/.test(r.out.error), r.out.error);
  r = await runWith({ EVOLVE_DB_URL: 'http://localhost.evil.example' }, ['--localhost-test-key=service', 'get', 'brain', 'digest']); assert.equal(r.code, 2); assert.ok(/test server only/.test(r.out.error));
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
  // writer attribution: --by stamps updated_by and updated_at on set, update and every batch write
  const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
  r = await run('--by', 's-state', 'set', 'projects', 'laurel-oaks', '--data', '{"name":"Laurel Oaks","stage":"Post"}'); assert.equal(r.code, 0, r.err); assert.equal(r.out.updated_by, 's-state'); assert.ok(ISO.test(r.out.updated_at), r.out.updated_at);
  r = await run('get', 'projects', 'laurel-oaks'); assert.equal(r.out.data.updated_by, 's-state'); assert.ok(ISO.test(r.out.data.updated_at)); assert.equal(r.out.data.name, 'Laurel Oaks');
  r = await run('update', 'projects', 'laurel-oaks', '--data', '{"stage":"Delivery"}', '--by', 's-inbox', '--if-version', '1'); assert.equal(r.code, 0, r.err); assert.equal(r.out.version, 2); assert.equal(r.out.updated_by, 's-inbox');
  r = await run('get', 'projects', 'laurel-oaks'); assert.equal(r.out.data.updated_by, 's-inbox'); assert.equal(r.out.data.stage, 'Delivery'); assert.equal(r.out.data.name, 'Laurel Oaks');
  r = await run('update', 'projects', 'laurel-oaks', '--data', '{"stage":"Done"}'); assert.equal(r.out.version, 3);
  r = await run('get', 'projects', 'laurel-oaks'); assert.equal(r.out.data.updated_by, 's-inbox', 'a write without --by leaves the last writer mark alone');
  const bf2 = path.join(dir, 'batch2.json'); fs.writeFileSync(bf2, JSON.stringify([{ op: 'set', collection: 'runs', doc_id: 'r2', data: { at: 'now' } }, { op: 'update', collection: 'projects', doc_id: 'laurel-oaks', data: { stage: 'Post' } }]));
  r = await run('batch', bf2, '--by', 's-leads'); assert.equal(r.code, 0, r.err); assert.equal(r.out.applied, 2); assert.equal(r.out.updated_by, 's-leads'); assert.ok(r.out.results.every(x => x.updated_by === 's-leads' && ISO.test(x.updated_at)));
  r = await run('get', 'runs', 'r2'); assert.equal(r.out.data.updated_by, 's-leads'); assert.equal(r.out.data.at, 'now');
  r = await run('get', 'projects', 'laurel-oaks'); assert.equal(r.out.data.updated_by, 's-leads'); assert.equal(r.out.data.stage, 'Post');
  // a document that carries its own updated_at keeps it; updated_by is still stamped
  r = await run('--by', 's-state', 'set', 'runs', 'r3', '--data', '{"at":"now","updated_at":"2026-11-06T05:30:00Z"}'); assert.equal(r.code, 0, r.err); assert.equal(r.out.updated_at, '2026-11-06T05:30:00Z'); assert.equal(r.out.updated_by, 's-state');
  r = await run('get', 'runs', 'r3'); assert.equal(r.out.data.updated_at, '2026-11-06T05:30:00Z'); assert.equal(r.out.data.updated_by, 's-state');
  r = await run('--by', 's-state', 'update', 'runs', 'r3', '--data', '{"status":"done"}'); assert.equal(r.code, 0, r.err); assert.ok(ISO.test(r.out.updated_at));
  r = await run('get', 'runs', 'r3'); assert.notEqual(r.out.data.updated_at, '2026-11-06T05:30:00Z', 'a patch without its own updated_at gets the stamp');
  r = await run('--by', 'bad id with spaces', 'get', 'runs', 'r2'); assert.equal(r.code, 2); assert.ok(/--by/.test(r.out.error));
  r = await run('delete', 'runs', 'r2', '--by', 's-leads'); assert.equal(r.code, 0, 'delete takes --by and ignores it');
  const c2 = new Client({ connectionString: PG }); await c2.connect();
  const own = await c2.query('select count(*)::int n from docs where owner is null'); assert.equal(own.rows[0].n, 0, 'service writes still belong to the owner'); await c2.end();
  await fake.close(); console.log('evoldb ok');
})().catch(e => { console.error(e); process.exit(1); });
