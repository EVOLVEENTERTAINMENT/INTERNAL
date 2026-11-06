// The Supabase store against the stand-in above, on real Postgres with the
// real schema. Skips itself when no test database is running.
const assert = require('assert');
const { SupabaseStore } = require('../app/supabase-store');
const { start } = require('./fake-supabase');
const PG = process.env.EVOLVE_TEST_PG;
if (!PG) { console.log('supabase skipped (no EVOLVE_TEST_PG)'); process.exit(0); }
(async () => {
  const { Client } = require('pg'); const c = new Client({ connectionString: PG }); await c.connect(); await c.query('delete from docs'); await c.end();
  const fake = await start({ pgUrl: PG, email: 'jackson@example.com' });
  const mem = {}; const storage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; }, removeItem: k => { delete mem[k]; } };
  const s = new SupabaseStore({ url: fake.url, anonKey: 'anon', storage });
  await assert.rejects(s.sendLink('someone@else.com', 'http://127.0.0.1:1/signed-in'), e => e.code === 'needs_reauth');
  // the Mac flow: the app waits on its local page, the email link lands there
  const linkCatch = require('../app/link-catch');
  let got = null; const redirect = await linkCatch.waitForLink(async code => { got = await s.finishLink(code); });
  assert.deepEqual(await s.sendLink('jackson@example.com', redirect), { sent: true });
  const page = await (await fetch(fake.click())).text();
  assert.ok(/Signed in/.test(page), page); assert.equal(got.email, 'jackson@example.com');
  const bad = await fetch(redirect).then(r => r.text(), () => 'closed');
  assert.ok(bad === 'closed' || /did not work/.test(bad), 'the page closes after one use');
  await assert.rejects(s.finishLink('link-code'), e => e.code === 'needs_reauth', 'a link only works once');
  assert.equal(await s.saveKey('sk-ant-test'), true);
  { const { Client } = require('pg'); const c = new Client({ connectionString: PG }); await c.connect();
    assert.equal((await c.query("select value from app_secrets where name='anthropic'")).rows[0].value, 'sk-ant-test');
    await s.saveKey(''); assert.equal((await c.query('select count(*)::int n from app_secrets')).rows[0].n, 0); await c.end(); }
  // the realtime socket joined after sign in, so the echo of every write below arrives
  const until = async (f, what) => { for (let i = 0; i < 200 && !f(); i++) await new Promise(r => setTimeout(r, 25)); assert.ok(f(), what); };
  await until(() => fake.sockets() === 1, 'realtime joined');
  const evs = []; s.onChange(e => evs.push(e.col + '/' + e.id));
  const settle = () => new Promise(r => setTimeout(r, 150));
  assert.equal((await s.set('tasks/t1', { title: 'a', meta: { x: 1, y: 2 }, n: 3 })).version, 1);
  assert.equal((await s.update('tasks/t1', { meta: { y: 5 }, n: { __delete__: true } })).version, 2);
  const g = await s.get('tasks/t1'); assert.deepEqual(g.data, { title: 'a', meta: { x: 1, y: 5 } }); assert.equal(g.exists, true);
  assert.equal((await s.get('tasks/none')).exists, false);
  await assert.rejects(s.update('tasks/none', { a: 1 }), e => e.code === 'not_found');
  await assert.rejects(s.set('tasks/t1', [1]), e => e.code === 'invalid_argument');
  await s.set('tasks/t2', { status: 'on_sheet', n: 2 }); await s.set('tasks/t3', { status: 'queued', n: 1 });
  assert.deepEqual((await s.query('tasks', { where: [['status', 'in', ['on_sheet', 'queued']]], orderBy: [['n', 'asc']] })).map(r => r.id), ['t3', 't2']);
  await s.delete('tasks/t2'); assert.equal((await s.query('tasks')).length, 2);
  await settle();
  assert.ok(fake.sent.length >= 5, 'the stand-in echoed each write'); assert.ok(fake.sent.some(x => x.type === 'DELETE'));
  assert.deepEqual(evs, ['tasks/t1', 'tasks/t1', 'tasks/t2', 'tasks/t3', 'tasks/t2'], 'one change per write, the echo is not a second one');
  // a change from somewhere else arrives once, and a delete still names its collection
  evs.length = 0;
  fake.change('UPDATE', { path: 'tasks/t3', col: 'tasks', id: 't3', version: 2 });
  fake.change('DELETE', { path: 'boards/b1/cols/c2', col: 'boards/b1/cols', id: 'c2', version: 1 });
  await until(() => evs.length >= 2, 'remote changes arrive');
  assert.deepEqual(evs, ['tasks/t3', 'boards/b1/cols/c2'], 'a delete carrying only the path still names col and id');
  // ids the board writes
  await s.set('crew/John Smith', { name: 'John Smith' });
  assert.equal((await s.get('crew/John Smith')).data.name, 'John Smith'); assert.deepEqual((await s.query('crew')).map(r => r.id), ['John Smith']);
  await assert.rejects(s.set('crew/a/b', { a: 1 }), e => e.code === 'invalid_argument');
  await assert.rejects(s.set('crew/..', { a: 1 }), e => e.code === 'invalid_argument');
  // bring in twice: the version keeps moving, so a version check after still works
  await s.set('projects/p1', { title: 'first' }); await s.update('projects/p1', { note: 'x' });   // version 2
  assert.equal(await s.importRows([{ col: 'projects', id: 'p1', data: { title: 'from file' }, version: 1 }]), 1);
  assert.equal((await s.get('projects/p1')).version, 3, 'an import never sends a version back');
  await s.importRows([{ col: 'projects', id: 'p1', data: { title: 'from file again' }, version: 1 }]);
  const v = (await s.get('projects/p1')).version; assert.equal(v, 4);
  assert.equal((await s.sb.rpc('doc_update', { p_path: 'projects/p1', p_patch: { note: 'y' }, p_if_version: v })).data, 5, 'if_version holds after two imports');
  assert.equal((await s.sb.rpc('doc_update', { p_path: 'projects/p1', p_patch: { note: 'z' }, p_if_version: 1 })).error.code, 'P0409');
  // limit and order go to Postgres when there is one orderBy and no where
  const rows = []; for (let i = 0; i < 1203; i++) rows.push({ col: 'bulk', id: 'b' + i, data: { i, at: '2026-11-' + String(1 + (i % 28)).padStart(2, '0'), odd: i % 2 ? { v: i } : undefined } });
  assert.equal(await s.importRows(rows), 1203); assert.equal((await s.query('bulk')).length, 1203, 'reads past 1000 rows');
  fake.log.length = 0;
  assert.deepEqual((await s.query('bulk', { orderBy: [['i', 'desc']], limit: 3 })).map(r => r.id), ['b1202', 'b1201', 'b1200'], 'numbers sort as numbers');
  assert.equal(fake.log.length, 1, 'one request');
  { const u = decodeURIComponent(fake.log[0][1]); assert.ok(/limit=3/.test(u) && /order=data->i\.desc\.nullslast,path\.asc/.test(u), u); }
  assert.deepEqual((await s.query('bulk', { orderBy: [['i', 'asc']], limit: 2 })).map(r => r.id), ['b0', 'b1']);
  assert.deepEqual((await s.query('bulk', { orderBy: [['odd.v', 'desc']], limit: 2 })).map(r => r.id), ['b1201', 'b1199'], 'nested field, rows without it last');
  { const r = await s.query('bulk', { orderBy: [['odd.v', 'asc']], limit: 2 });
    assert.deepEqual(r.map(x => x.id), ['b0', 'b10'], 'rows without the field first, like the local store, ties by path');
    assert.ok(r.every(x => x.data.odd === undefined)); }
  assert.equal((await s.query('bulk', { orderBy: [['at', 'asc']], limit: 50 })).length, 50);
  fake.log.length = 0;
  assert.equal((await s.query('bulk', { orderBy: [['i', 'asc']], limit: 1100 })).length, 1100, 'a limit past one page still pages');
  assert.equal(fake.log.length, 2);
  assert.deepEqual((await s.query('bulk', { where: [['i', '<', 3]], orderBy: [['i', 'desc']], limit: 2 })).map(r => r.data.i), [2, 1], 'with a where it stays client side');
  assert.deepEqual((await s.query('bulk', { orderBy: [['weird key!', 'asc']], limit: 1 })).length, 1, 'odd field names stay client side');
  // the schema leaves replica identity at the key: a delete event carries only the path, never the old row
  { const { Client } = require('pg'); const c = new Client({ connectionString: PG }); await c.connect();
    assert.equal((await c.query("select relreplident from pg_class where relname = 'docs'")).rows[0].relreplident, 'd'); await c.end(); }
  await s.signOut(); await fake.close(); console.log('supabase ok');
})().catch(e => { console.error(e); process.exit(1); });
