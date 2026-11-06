// The Supabase store against the stand-in above, on real Postgres with the
// real schema. Skips itself when no test database is running.
const assert = require('assert');
const { SupabaseStore } = require('../app/supabase-store');
const { start } = require('./fake-supabase');
const PG = process.env.EVOLVE_TEST_PG;
if (!PG) { console.log('supabase skipped (no EVOLVE_TEST_PG)'); process.exit(0); }
(async () => {
  const { Client } = require('pg'); const c = new Client({ connectionString: PG }); await c.connect(); await c.query('delete from docs'); await c.end();
  const fake = await start({ pgUrl: PG, email: 'jackson@example.com', code: '123456' });
  const mem = {}; const storage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; }, removeItem: k => { delete mem[k]; } };
  const s = new SupabaseStore({ url: fake.url, anonKey: 'anon', storage });
  s.live = () => {};   // no realtime socket in the stand-in
  await assert.rejects(s.sendCode('someone@else.com'), e => e.code === 'needs_reauth');
  assert.deepEqual(await s.sendCode('jackson@example.com'), { sent: true });
  await assert.rejects(s.verifyCode('jackson@example.com', '000000'), e => e.code === 'needs_reauth');
  assert.equal((await s.verifyCode('jackson@example.com', '123 456')).email, 'jackson@example.com');
  let ev = 0; s.onChange(() => ev++);
  assert.equal((await s.set('tasks/t1', { title: 'a', meta: { x: 1, y: 2 }, n: 3 })).version, 1);
  assert.equal((await s.update('tasks/t1', { meta: { y: 5 }, n: { __delete__: true } })).version, 2);
  const g = await s.get('tasks/t1'); assert.deepEqual(g.data, { title: 'a', meta: { x: 1, y: 5 } }); assert.equal(g.exists, true);
  assert.equal((await s.get('tasks/none')).exists, false);
  await assert.rejects(s.update('tasks/none', { a: 1 }), e => e.code === 'not_found');
  await s.set('tasks/t2', { status: 'on_sheet', n: 2 }); await s.set('tasks/t3', { status: 'queued', n: 1 });
  assert.deepEqual((await s.query('tasks', { where: [['status', 'in', ['on_sheet', 'queued']]], orderBy: [['n', 'asc']] })).map(r => r.id), ['t3', 't2']);
  await s.delete('tasks/t2'); assert.equal((await s.query('tasks')).length, 2);
  const rows = []; for (let i = 0; i < 1203; i++) rows.push({ col: 'bulk', id: 'b' + i, data: { i } });
  assert.equal(await s.importRows(rows), 1203); assert.equal((await s.query('bulk')).length, 1203, 'reads past 1000 rows');
  assert.ok(ev >= 5);
  await fake.close(); console.log('supabase ok');
})().catch(e => { console.error(e); process.exit(1); });
