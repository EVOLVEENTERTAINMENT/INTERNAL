// A small document store with the same shape the board already uses inside
// claude.ai: collections of JSON documents addressed by path ("tasks/t1",
// or nested "boards/b1/columns/c2"). This is the local version, one JSON
// file per collection on disk. The Supabase version (step 2) keeps the same
// methods, so nothing above it changes.
'use strict';
const fs = require('fs');
const path = require('path');

const SEG = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;
function splitDoc(p) {
  const s = String(p || '').split('/').filter(Boolean);
  if (s.length < 2 || s.length % 2 !== 0 || !s.every(x => SEG.test(x))) throw err('invalid_argument', 'bad document path: ' + p);
  return { col: s.slice(0, -1).join('/'), id: s[s.length - 1] };
}
function checkCol(p) {
  const s = String(p || '').split('/').filter(Boolean);
  if (!s.length || s.length % 2 !== 1 || !s.every(x => SEG.test(x))) throw err('invalid_argument', 'bad collection path: ' + p);
  return s.join('/');
}
function err(code, message) { const e = new Error(message); e.code = code; return e; }
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

// update merges nested objects recursively; {__delete__:true} removes a field
function merge(base, patch) {
  const out = isObj(base) ? clone(base) : {};
  for (const k of Object.keys(patch)) {
    const v = patch[k];
    if (isObj(v) && v.__delete__ === true && Object.keys(v).length === 1) { delete out[k]; continue; }
    if (isObj(v) && isObj(out[k])) out[k] = merge(out[k], v);
    else out[k] = clone(v);
  }
  return out;
}
function stripDeletes(v) {
  if (!isObj(v)) return v;
  const o = {};
  for (const k of Object.keys(v)) {
    const x = v[k];
    if (isObj(x) && x.__delete__ === true && Object.keys(x).length === 1) continue;
    o[k] = isObj(x) ? stripDeletes(x) : x;
  }
  return o;
}

function getField(o, f) { return String(f).split('.').reduce((a, k) => (a == null ? undefined : a[k]), o); }
function cmp(a, b) {
  if (a === b) return 0; if (a === undefined) return -1; if (b === undefined) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a) < String(b) ? -1 : 1;
}
function test(op, a, b) {
  switch (String(op)) {
    case '==': case 'eq': return JSON.stringify(a) === JSON.stringify(b);
    case '!=': case 'ne': return JSON.stringify(a) !== JSON.stringify(b);
    case '<': case 'lt': return a !== undefined && cmp(a, b) < 0;
    case '<=': case 'lte': return a !== undefined && cmp(a, b) <= 0;
    case '>': case 'gt': return a !== undefined && cmp(a, b) > 0;
    case '>=': case 'gte': return a !== undefined && cmp(a, b) >= 0;
    case 'in': return Array.isArray(b) && b.some(x => JSON.stringify(x) === JSON.stringify(a));
    case 'not-in': return Array.isArray(b) && !b.some(x => JSON.stringify(x) === JSON.stringify(a));
    case 'array-contains': return Array.isArray(a) && a.some(x => JSON.stringify(x) === JSON.stringify(b));
    default: throw err('invalid_argument', 'unknown operator ' + op);
  }
}

class LocalStore {
  constructor(dir) {
    this.dir = dir; this.mem = new Map(); this.listeners = new Set();
    fs.mkdirSync(dir, { recursive: true });
  }
  file(col) { return path.join(this.dir, encodeURIComponent(col) + '.json'); }
  load(col) {
    if (this.mem.has(col)) return this.mem.get(col);
    let docs = {};
    try { docs = JSON.parse(fs.readFileSync(this.file(col), 'utf8')); } catch (e) { docs = {}; }
    this.mem.set(col, docs); return docs;
  }
  save(col) {
    const f = this.file(col), tmp = f + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.mem.get(col) || {}));
    fs.renameSync(tmp, f);
  }
  emit(col, id) { for (const fn of this.listeners) { try { fn({ col, id }); } catch (e) {} } }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  get(p) {
    const { col, id } = splitDoc(p); const d = this.load(col)[id];
    return { id, exists: !!d, data: d ? clone(d.data) : undefined, version: d ? d.version : 0, updatedAt: d ? d.updatedAt : null };
  }
  set(p, data) {
    if (!isObj(data)) throw err('invalid_argument', 'set needs an object');
    const { col, id } = splitDoc(p); const docs = this.load(col); const was = docs[id];
    docs[id] = { data: stripDeletes(clone(data)), version: (was ? was.version : 0) + 1, updatedAt: new Date().toISOString() };
    this.save(col); this.emit(col, id); return { version: docs[id].version };
  }
  update(p, data) {
    if (!isObj(data)) throw err('invalid_argument', 'update needs an object');
    const { col, id } = splitDoc(p); const docs = this.load(col); const was = docs[id];
    if (!was) throw err('not_found', 'no document at ' + p);
    docs[id] = { data: merge(was.data, data), version: was.version + 1, updatedAt: new Date().toISOString() };
    this.save(col); this.emit(col, id); return { version: docs[id].version };
  }
  delete(p) {
    const { col, id } = splitDoc(p); const docs = this.load(col);
    if (docs[id]) { delete docs[id]; this.save(col); this.emit(col, id); }
    return {};
  }
  query(colPath, q) {
    const col = checkCol(colPath); const docs = this.load(col); q = q || {};
    let rows = Object.keys(docs).map(id => ({ id, data: docs[id].data, version: docs[id].version, updatedAt: docs[id].updatedAt }));
    rows = applyQuery(rows, q);
    return rows.map(r => ({ id: r.id, data: clone(r.data), version: r.version, updatedAt: r.updatedAt }));
  }
  // One time copy of an ArtifactData export: <dir>/<collection>/<doc>.json,
  // each file {id, data, version, updatedAt}. Nested collections keep their path.
  importSnapshot(root) {
    let n = 0;
    const walk = (dir, rel) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) { walk(full, rel ? rel + '/' + ent.name : ent.name); continue; }
        if (!ent.name.endsWith('.json') || !rel) continue;
        let x; try { x = JSON.parse(fs.readFileSync(full, 'utf8')); } catch (e) { continue; }
        const id = (x && x.id) || ent.name.slice(0, -5);
        const data = x && isObj(x.data) ? x.data : x;
        const docs = this.load(rel);
        docs[id] = { data, version: Number(x && x.version) || 1, updatedAt: (x && x.updatedAt) || new Date().toISOString() };
        n++;
      }
    };
    walk(root, '');
    for (const col of this.mem.keys()) this.save(col);
    return n;
  }
  isEmpty() {
    try { return !fs.readdirSync(this.dir).some(f => f.endsWith('.json')); } catch (e) { return true; }
  }
}
// Filtering and ordering shared by every store, so local and Supabase agree.
function applyQuery(rows, q) {
  q = q || {};
  for (const w of q.where || []) rows = rows.filter(r => test(w[1], getField(r.data, w[0]), w[2]));
  for (const o of (q.orderBy || []).slice().reverse()) {
    const dir = o[1] === 'desc' ? -1 : 1;
    rows.sort((a, b) => dir * cmp(getField(a.data, o[0]), getField(b.data, o[0])));
  }
  if (q.limit) rows = rows.slice(0, q.limit);
  return rows;
}
module.exports = { LocalStore, merge, test, applyQuery, splitDoc, checkCol, stripDeletes, err };
