// The board updating itself: downloads a new version, checks every file, reuses
// unchanged media, refuses bad files, and falls back when a version fails.
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path'); const http = require('http');
const { BoardUpdates, describe } = require('../app/board-updates');
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bu-'));
  const mk = (d, html) => { fs.mkdirSync(path.join(d, 'media'), { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), html); fs.writeFileSync(path.join(d, 'media', 'clip.mp4'), 'VIDEO'); };
  const bundled = path.join(tmp, 'bundled'); mk(bundled, '<html>v1</html>');
  const pub = path.join(tmp, 'pub'); let manifest = null; const hits = [];
  const publish = (v, html, extra) => { const d = path.join(pub, v); mk(d, html); manifest = Object.assign(describe(d, v), extra || {}); };
  const srv = http.createServer((q, r) => { const p = decodeURIComponent(new URL(q.url, 'http://x').pathname).slice(1); hits.push(p);
    if (p === 'manifest.json') { r.end(JSON.stringify(manifest)); return; }
    const f = path.join(pub, p); if (!f.startsWith(pub) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.end(fs.readFileSync(f)); }).listen(0);
  const base = 'http://127.0.0.1:' + srv.address().port;
  const u = new BoardUpdates({ cacheDir: path.join(tmp, 'cache'), bundledDir: bundled, baseUrl: base, appVersion: '0.1.0', fetchFn: fetch });
  assert.equal(u.dir(), bundled); assert.equal(u.activeVersion(), 'built-in');

  publish('v1', '<html>v1</html>'); assert.deepEqual(await u.check(), { none: 'current' }, 'same as built in');
  publish('v2', '<html>v2</html>');
  assert.deepEqual(await u.check(), { ready: 'v2' });
  assert.ok(!hits.includes('v2/media/clip.mp4'), 'unchanged video copied, not downloaded');
  assert.equal(u.dir(), bundled, 'not used until activated');
  u.activate('v2'); assert.equal(fs.readFileSync(path.join(u.dir(), 'index.html'), 'utf8'), '<html>v2</html>');
  u.confirm(); assert.equal(u.pending(), null); assert.deepEqual(await u.check(), { none: 'current' });

  // v3 fails to start: back to v2, and v3 is never taken again
  publish('v3', '<html>v3 broken</html>');
  assert.deepEqual(await u.check(), { ready: 'v3' }); u.activate('v3'); assert.ok(u.fail());
  assert.equal(u.activeVersion(), 'v2'); assert.deepEqual(await u.check(), { none: 'current' });

  // a file that does not match its checksum is refused and nothing changes
  publish('v4', '<html>v4</html>'); fs.writeFileSync(path.join(pub, 'v4', 'index.html'), '<html>tampered</html>');
  assert.deepEqual(await u.check(), { none: 'checksum' }); assert.ok(!fs.existsSync(path.join(tmp, 'cache', 'v4')));
  // paths that try to leave the folder are refused
  publish('v5', '<html>v5</html>'); manifest.files.push({ path: '../evil.js', sha256: 'a'.repeat(64) });
  assert.deepEqual(await u.check(), { none: 'bad_manifest' });
  // a board that needs a newer app waits for the app update
  publish('v6', '<html>v6</html>', { min_app: '0.2.0' }); assert.deepEqual(await u.check(), { none: 'needs_new_app' });
  // a fine one after all that
  publish('v7', '<html>v7</html>'); assert.deepEqual(await u.check(), { ready: 'v7' }); u.activate('v7'); u.confirm();
  assert.equal(u.activeVersion(), 'v7'); assert.ok(!fs.existsSync(path.join(tmp, 'cache', 'v3')), 'old versions cleaned up');
  // no source or server down: stays on what it has
  const off = new BoardUpdates({ cacheDir: path.join(tmp, 'cache'), bundledDir: bundled, baseUrl: 'http://127.0.0.1:1', appVersion: '0.1.0', fetchFn: fetch });
  await assert.rejects(off.check()); assert.equal(off.activeVersion(), 'v7');
  srv.close(); console.log('board-updates ok');
})().catch(e => { console.error(e); process.exit(1); });
