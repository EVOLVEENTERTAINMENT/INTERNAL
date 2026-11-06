// The first time you sign in to Supabase and it is still empty, your board
// moves itself: the newest Evolve_OS_Data_*.json the claude.ai board saved to
// Downloads, plus anything you added in the app before signing in. It never
// runs again once Supabase has records, so it cannot overwrite anything.
'use strict';
const fs = require('fs');
const path = require('path');
const { readExport, importNote, logImport } = require('./importer');

function newestExport(dir) {
  let best = null;
  try {
    for (const f of fs.readdirSync(dir)) {
      if (!/^Evolve_OS_Data_.*\.json$/i.test(f)) continue;
      const p = path.join(dir, f), t = fs.statSync(p).mtimeMs;
      if (!best || t > best.t) best = { p, t };
    }
  } catch (e) { return null; }
  return best && best.p;
}

function localRows(local) {
  const rows = [];
  try {
    for (const f of fs.readdirSync(local.dir).filter(f => f.endsWith('.json'))) {
      const col = decodeURIComponent(f.slice(0, -5));
      for (const r of local.query(col)) rows.push({ col, id: r.id, data: r.data, version: r.version });
    }
  } catch (e) {}
  return rows;
}

// Returns { n, file } with how many records were copied, or { n: 0 } when
// Supabase already had records or there was nothing to copy.
async function autoMove({ sb, local, downloads }) {
  // Only his records count as "not empty". The board writes diag/boot on every
  // open and a run with nothing to copy writes diag/import, and neither must
  // stop the move once a good file is there.
  const n0 = await sb.count();
  if (n0 > 0 && (await sb.query('diag')).length < n0) return { n: 0, skipped: 'not_empty' };
  const file = newestExport(downloads);
  const byPath = new Map();
  // A bad id or a collection the board could not read is noted, never a stop.
  const exp = file ? readExport(fs.readFileSync(file, 'utf8')) : { rows: [], skipped: [], unread: [] };
  for (const r of exp.rows) byPath.set(r.col + '/' + r.id, r);
  for (const r of localRows(local)) if (!byPath.has(r.col + '/' + r.id)) byPath.set(r.col + '/' + r.id, r);   // the export wins
  const rows = [...byPath.values()];
  if (!rows.length && !exp.skipped.length && !exp.unread.length) return { n: 0 };
  const n = rows.length ? await sb.importRows(rows) : 0;
  // The note is written even when nothing came in, so the skip reasons are
  // kept in the record and not only in the console.
  const note = importNote({ rows, skipped: exp.skipped, unread: exp.unread, file });
  logImport('auto move', note);
  try { await sb.set('diag/import', note); } catch (e) { console.error('auto move: diag/import not written', e.message || e); }
  return { n, file, skipped: exp.skipped, unread: exp.unread };
}
module.exports = { autoMove, newestExport };
