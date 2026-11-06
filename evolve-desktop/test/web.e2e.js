// Phone site end to end: stand-in Supabase on real Postgres, the built site,
// and a phone sized browser that signs in and opens the board.
const fs = require('fs'); const path = require('path'); const http = require('http'); const { execFileSync } = require('child_process');
const { start } = require('./fake-supabase'); const { SupabaseStore } = require('../app/supabase-store');
const PW = process.env.EVOLVE_PLAYWRIGHT, PG = process.env.EVOLVE_TEST_PG, SNAP = process.env.EVOLVE_SNAPSHOT, SHOT = process.env.EVOLVE_SHOT || '/tmp/web.png';
(async () => {
  const { Client } = require('pg'); const c = new Client({ connectionString: PG }); await c.connect(); await c.query('delete from docs'); await c.end();
  const fake = await start({ pgUrl: PG, email: 'jackson@example.com', code: '123456' });
  const mem = {}; const s = new SupabaseStore({ url: fake.url, anonKey: 'anon', storage: { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; }, removeItem: () => {} } });
  s.live = () => {}; await s.sendCode('jackson@example.com'); await s.verifyCode('jackson@example.com', '123456');
  const rows = [];
  for (const col of fs.readdirSync(SNAP)) for (const f of fs.readdirSync(path.join(SNAP, col))) { const x = JSON.parse(fs.readFileSync(path.join(SNAP, col, f))); rows.push({ col, id: x.id, data: x.data }); }
  console.log('seeded', await s.importRows(rows));
  execFileSync('node', [path.join(__dirname, '../web/build.js')], { env: Object.assign({}, process.env, { EVOLVE_SUPABASE_URL: fake.url, EVOLVE_SUPABASE_ANON: 'anon' }), stdio: 'inherit' });
  const dist = path.join(__dirname, '../web/dist');
  const web = http.createServer((q, r) => { const f = path.join(dist, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(dist) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(0);
  const port = web.address().port;
  const { chromium } = require(PW);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, timezoneId: 'America/Chicago' })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:' + port + '/board.html'); await p.waitForTimeout(800);
  const gated = p.url().endsWith('index.html');
  await p.fill('#e', 'jackson@example.com'); await p.click('button'); await p.waitForSelector('#p', { state: 'visible' }); await p.fill('#p', '123456'); await p.click('button');
  await p.waitForURL(/board\.html/); await p.waitForTimeout(6000);
  const info = await p.evaluate(async () => {
    await dbSet('scraps/s-web-test', { id: 's-web-test', text: 'Phone site write test', at: new Date().toISOString(), state: 'raw' });
    return { build: BUILD, projects: Object.keys(S.pstate || {}).length, db: !!db, sample: !!sample, conn: (document.getElementById('connt') || {}).textContent };
  });
  await p.waitForTimeout(800);
  await p.screenshot({ path: SHOT });
  const back = await s.get('scraps/s-web-test');
  console.log(JSON.stringify({ gated, info, wroteThrough: back.exists, errs: errs.slice(0, 3) }));
  await b.close(); web.close(); await fake.close();
})().catch(e => { console.error(e); process.exit(1); });
