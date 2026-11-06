// Reads the file the claude.ai board's Download data button saves:
// {format:"evolve-os-export", version:1, exported_at, build,
//  collections:{"<collection>":{"<doc id>":{...document...}}},
//  unread:["<collection the board could not read>", ...]}
// Returns {rows, skipped, unread}. A document whose id or collection the
// stores would refuse goes to skipped with a reason instead of stopping the
// whole file. unread is the board's own list, passed through as it is.
'use strict';
const { checkCol, segOk } = require('./store');

function readExport(text) {
  const j = JSON.parse(text);
  if (!j || j.format !== 'evolve-os-export' || typeof j.collections !== 'object') throw new Error('That is not an Evolve OS export file.');
  const rows = [], skipped = [];
  for (const col of Object.keys(j.collections || {})) {
    let okCol = true; try { checkCol(col); } catch (e) { okCol = false; }
    const docs = j.collections[col] || {};
    for (const id of Object.keys(docs)) {
      const d = docs[id];
      if (!okCol) { skipped.push({ path: col + '/' + id, reason: 'bad_collection' }); continue; }
      if (!segOk(id)) { skipped.push({ path: col + '/' + id, reason: 'bad_id' }); continue; }
      if (!d || typeof d !== 'object' || Array.isArray(d)) { skipped.push({ path: col + '/' + id, reason: 'not_object' }); continue; }
      rows.push({ col, id, data: d, version: 1 });
    }
  }
  const unread = Array.isArray(j.unread) ? j.unread.filter(x => typeof x === 'string') : [];
  return { rows, skipped, unread };
}

// What an import writes to diag/import so anyone can tell afterwards what
// came in and what did not. Nothing a user reads; console and the record only.
function importNote({ rows, skipped, unread, file }) {
  const cols = new Set((rows || []).map(r => r.col));
  return { at: new Date().toISOString(), file: file || null, unread: unread || [],
    counts: { collections: cols.size, records: (rows || []).length, skipped: (skipped || []).length },
    skipped: (skipped || []).slice(0, 200) };
}
function logImport(tag, note) {
  if (note.unread.length) console.log(tag + ': the board could not read ' + note.unread.join(', '));
  for (const s of note.skipped) console.log(tag + ': skipped ' + s.path + ' (' + s.reason + ')');
  console.log(tag + ': ' + note.counts.records + ' records in ' + note.counts.collections + ' collections, ' + note.counts.skipped + ' skipped');
}
module.exports = { readExport, importNote, logImport };
