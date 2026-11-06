// The first time you sign in to Supabase and it is still empty, your board
// moves itself: the newest Evolve_OS_Data_*.json the claude.ai board saved to
// Downloads, plus anything you added in the app before signing in. It never
// runs again once Supabase has records, so it cannot overwrite anything.
'use strict';
const fs = require('fs');
const path = require('path');
const { readExport } = require('./importer');

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
  if ((await sb.count()) > 0) return { n: 0, skipped: 'not_empty' };
  const file = newestExport(downloads);
  const byPath = new Map();
  if (file) for (const r of readExport(fs.readFileSync(file, 'utf8'))) byPath.set(r.col + '/' + r.id, r);
  for (const r of localRows(local)) if (!byPath.has(r.col + '/' + r.id)) byPath.set(r.col + '/' + r.id, r);   // the export wins
  if (!byPath.size) return { n: 0 };
  return { n: await sb.importRows([...byPath.values()]), file };
}
module.exports = { autoMove, newestExport };
