// Reads the file the claude.ai board's Export everything button saves:
// {format:"evolve-os-export", version:1, exported_at, build,
//  collections:{"<collection>":{"<doc id>":{...document...}}}}
'use strict';
function readExport(text) {
  const j = JSON.parse(text);
  if (!j || j.format !== 'evolve-os-export' || typeof j.collections !== 'object') throw new Error('That is not an Evolve OS export file.');
  const rows = [];
  for (const col of Object.keys(j.collections)) {
    const docs = j.collections[col] || {};
    for (const id of Object.keys(docs)) {
      const d = docs[id];
      if (d && typeof d === 'object' && !Array.isArray(d)) rows.push({ col, id, data: d, version: 1 });
    }
  }
  return rows;
}
module.exports = { readExport };
