// Keeps the board up to date by itself, the way a claude.ai artifact always
// shows its newest version. A small manifest on Supabase Storage names the
// current board version and every file with its sha256. New versions are
// downloaded next to the built in copy, checked file by file, and only then
// used. A version that fails to start is marked bad and never used again.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
const SAFE = p => typeof p === 'string' && /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/.test(p) && !p.split('/').some(x => x === '.' || x === '..');

class BoardUpdates {
  // fetchFn(url) -> Response (net.fetch in the app, global fetch in tests)
  constructor({ cacheDir, bundledDir, baseUrl, appVersion, fetchFn, keep = 3 }) {
    Object.assign(this, { cacheDir, bundledDir, baseUrl: (baseUrl || '').replace(/\/+$/, ''), appVersion, fetchFn, keep });
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  state() { try { return JSON.parse(fs.readFileSync(path.join(this.cacheDir, 'state.json'), 'utf8')); } catch (e) { return { active: null, bad: [], good: [] }; } }
  save(s) { const f = path.join(this.cacheDir, 'state.json'); fs.writeFileSync(f + '.tmp', JSON.stringify(s)); fs.renameSync(f + '.tmp', f); }
  // The folder the board is served from right now.
  dir() {
    const s = this.state();
    if (s.active && !s.bad.includes(s.active)) {
      const d = path.join(this.cacheDir, s.active);
      if (fs.existsSync(path.join(d, 'index.html'))) return d;
    }
    return this.bundledDir;
  }
  activeVersion() { return this.dir() === this.bundledDir ? 'built-in' : this.state().active; }

  // Looks for a newer board. Returns { ready: version } once it is downloaded
  // and checked, or { none: reason }.
  async check() {
    if (!this.baseUrl) return { none: 'no_source' };
    const r = await this.fetchFn(this.baseUrl + '/manifest.json?t=' + Date.now());
    if (!r.ok) return { none: 'manifest_' + r.status };
    const m = await r.json();
    const s = this.state();
    if (!m || typeof m.version !== 'string' || !/^[A-Za-z0-9._-]{1,80}$/.test(m.version) || !Array.isArray(m.files)) return { none: 'bad_manifest' };
    if (m.min_app && cmp(this.appVersion, m.min_app) < 0) return { none: 'needs_new_app' };
    if (m.version === s.active || s.bad.includes(m.version)) return { none: 'current' };
    if (!m.files.some(f => f.path === 'index.html')) return { none: 'bad_manifest' };
    if (!m.files.every(f => SAFE(f.path) && /^[0-9a-f]{64}$/.test(f.sha256 || ''))) return { none: 'bad_manifest' };
    // the same board the app already has built in: nothing to switch to
    const same = (dir) => m.files.every(f => { const p = path.join(dir, f.path); return fs.existsSync(p) && sha256(fs.readFileSync(p)) === f.sha256; });
    if (!s.active && same(this.bundledDir)) return { none: 'current' };
    const final = path.join(this.cacheDir, m.version), tmp = final + '.part';
    if (fs.existsSync(path.join(final, 'index.html'))) return { ready: m.version };
    fs.rmSync(tmp, { recursive: true, force: true });
    const have = this.dir();
    for (const f of m.files) {
      const dest = path.join(tmp, f.path);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      // unchanged files (videos, images) are copied from what we already have
      const local = path.join(have, f.path);
      if (fs.existsSync(local) && sha256(fs.readFileSync(local)) === f.sha256) { fs.copyFileSync(local, dest); continue; }
      const res = await this.fetchFn(this.baseUrl + '/' + m.version + '/' + f.path);
      if (!res.ok) { fs.rmSync(tmp, { recursive: true, force: true }); return { none: 'download_' + res.status }; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (sha256(buf) !== f.sha256) { fs.rmSync(tmp, { recursive: true, force: true }); return { none: 'checksum' }; }
      fs.writeFileSync(dest, buf);
    }
    fs.renameSync(tmp, final);
    return { ready: m.version };
  }
  // Switch to a downloaded version. Call confirm() once it has started fine,
  // or fail() if it did not, which goes back to the one before.
  activate(version) { const s = this.state(); s.previous = s.active; s.active = version; s.pending = version; this.save(s); }
  confirm() {
    const s = this.state(); if (!s.pending) return;
    s.good = [...new Set([s.pending, ...(s.good || [])])]; delete s.pending; this.save(s); this.prune();
  }
  fail() {
    const s = this.state(); const v = s.pending || s.active; if (!v) return false;
    s.bad = [...new Set([...(s.bad || []), v])]; s.active = s.previous && !s.bad.includes(s.previous) ? s.previous : null; delete s.pending; this.save(s); return true;
  }
  pending() { return this.state().pending || null; }
  prune() {
    const s = this.state(), keepSet = new Set([s.active, ...(s.good || []).slice(0, this.keep)]);
    for (const d of fs.readdirSync(this.cacheDir)) {
      if (d === 'state.json' || keepSet.has(d)) continue;
      fs.rmSync(path.join(this.cacheDir, d), { recursive: true, force: true });
    }
  }
}
function cmp(a, b) { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; }

// Builds the manifest and file list for a board folder (used by the publish tool and tests).
function describe(dir, version) {
  const files = [];
  const walk = rel => {
    for (const n of fs.readdirSync(path.join(dir, rel))) {
      const r = rel ? rel + '/' + n : n, full = path.join(dir, r);
      if (n.startsWith('.')) continue;
      if (fs.statSync(full).isDirectory()) walk(r); else files.push({ path: r, sha256: sha256(fs.readFileSync(full)), size: fs.statSync(full).size });
    }
  };
  walk('');
  return { version, published_at: new Date().toISOString(), files };
}
module.exports = { BoardUpdates, describe, sha256 };
