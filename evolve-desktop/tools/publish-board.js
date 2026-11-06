#!/usr/bin/env node
// Puts a board version up for the Mac app to pick up by itself (see
// app/board-updates.js). Uploads app/board to the public "board" bucket on
// Supabase Storage under its version, then the manifest that points at it.
// The board is only code (it is in this public repo anyway); your data is not in it.
// Needs SUPABASE_URL and SUPABASE_SERVICE_KEY. Usage: node tools/publish-board.js [board dir]
'use strict';
const fs = require('fs'); const path = require('path');
const { describe, sha256 } = require('../app/board-updates');
const URL_ = (process.env.SUPABASE_URL || 'https://agjtcdbxlqomlgqgoutd.supabase.co').replace(/\/+$/, ''), KEY = process.env.SUPABASE_SERVICE_KEY;
const dir = path.resolve(process.argv[2] || path.join(__dirname, '../app/board'));
if (!KEY) { console.error('Set SUPABASE_SERVICE_KEY.'); process.exit(2); }
const H = (x = {}) => Object.assign({ apikey: KEY, authorization: 'Bearer ' + KEY }, x);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.webm': 'video/webm', '.css': 'text/css', '.svg': 'image/svg+xml' };
(async () => {
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const build = (html.match(/BUILD\s*=\s*["']([^"']+)["']/) || [])[1] || 'board';
  const version = (build.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + sha256(Buffer.from(html)).slice(0, 8)).slice(0, 80);
  const b = await fetch(URL_ + '/storage/v1/bucket/board', { headers: H() });
  if (b.status !== 200) {
    const c = await fetch(URL_ + '/storage/v1/bucket', { method: 'POST', headers: H({ 'content-type': 'application/json' }), body: JSON.stringify({ id: 'board', name: 'board', public: true }) });
    if (!c.ok) throw new Error('bucket: ' + c.status + ' ' + await c.text());
  }
  const m = describe(dir, version);
  const up = async (key, body, type, cache) => {
    const r = await fetch(URL_ + '/storage/v1/object/board/' + key, { method: 'POST', headers: H({ 'content-type': type, 'x-upsert': 'true', 'cache-control': cache }), body });
    if (!r.ok) throw new Error(key + ': ' + r.status + ' ' + await r.text());
  };
  for (const f of m.files) await up(version + '/' + f.path, fs.readFileSync(path.join(dir, f.path)), TYPES[path.extname(f.path)] || 'application/octet-stream', 'max-age=31536000');
  await up('manifest.json', JSON.stringify(m), 'application/json', 'max-age=30');
  console.log('published', version, m.files.length, 'files');
})().catch(e => { console.error(e.message || e); process.exit(1); });
