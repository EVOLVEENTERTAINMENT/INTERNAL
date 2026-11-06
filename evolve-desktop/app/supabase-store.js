// The board database on Supabase. Same methods as LocalStore, but async, and
// shared: the Mac app, the phone site and the scheduled tasks all see it.
// Rows live in public.docs (see supabase/schema.sql). Only the signed in
// owner can read or write them.
'use strict';
const { createClient } = require('@supabase/supabase-js');
const { applyQuery, splitDoc, checkCol, stripDeletes, err } = require('./store');
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

// The order PostgREST can take for a query: one field, no where. The field
// becomes a jsonb path (data->meta->n) so numbers sort as numbers, the way
// applyQuery sorts them. Field names outside plain words stay client side.
// Postgres jsonb ordering is not the local cmp for an explicit null (lowest
// in Postgres, the string "null" locally) or for a mix of numbers and
// strings (numbers above strings in Postgres, string compare locally), so
// the rows a limit keeps can differ there. The four board queries that use
// this all order by at, an ISO string the board always sets, so they are
// unaffected.
function orderExpr(q) {
  if ((q.where || []).length || !Array.isArray(q.orderBy) || q.orderBy.length !== 1) return null;
  const o = q.orderBy[0]; if (!Array.isArray(o) || typeof o[0] !== 'string') return null;
  const parts = o[0].split('.');
  if (!parts.every(x => /^[A-Za-z0-9_]{1,64}$/.test(x))) return null;
  return { column: 'data' + parts.map(x => '->' + x).join(''), asc: o[1] !== 'desc' };
}

class SupabaseStore {
  constructor({ url, anonKey, storage }) {
    this.sb = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce', storage } });
    this.listeners = new Set(); this.channel = null;
    // Paths this app is writing right now, so the realtime echo of our own
    // write is not a second change event. Each entry is a list of times.
    this.mine = new Map();
  }
  // No password: Supabase emails a sign-in link. Clicking it comes back with a
  // one time code that only this copy of the app can trade for the sign in.
  // Only the account already on the project can get one (sign ups are off).
  async sendLink(email, redirectTo) {
    const { error } = await this.sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo } });
    if (error) throw err('needs_reauth', error.message);
    return { sent: true };
  }
  async finishLink(code) {
    const { data, error } = await this.sb.auth.exchangeCodeForSession(code);
    if (error) throw err('needs_reauth', error.message);
    this.live(); return { email: data.user && data.user.email };
  }
  // The phone's Claude reads the key from here; nobody can read it back out.
  async saveKey(key) {
    const { error } = await this.sb.rpc('save_app_secret', { p_name: 'anthropic', p_value: key || '' });
    if (error) throw err('io_failed', error.message);
    return true;
  }
  async signOut() {
    await this.sb.auth.signOut();
    if (this.channel) await this.sb.removeChannel(this.channel);
    this.channel = null; this.sb.realtime.disconnect();
  }
  async who() { const { data } = await this.sb.auth.getSession(); return data.session ? { email: data.session.user.email } : null; }
  live() {
    if (this.channel) return;
    this.channel = this.sb.channel('docs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'docs' }, p => {
        // A delete only carries the key unless replica identity is full, so
        // take col and id from the path when the row does not say.
        const row = (p.new && p.new.path) ? p.new : (p.old || {});
        const parts = String(row.path || '').split('/');
        const id = row.id || parts.pop(), col = row.col || parts.join('/');
        if (!col || this.echo(col + '/' + id)) return;
        this.emit(col, id);
      }).subscribe();
  }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(col, id) { for (const fn of this.listeners) { try { fn({ col, id }); } catch (e) {} } }
  // One change per write: mark the path before the call, let the echo of that
  // write through as nothing, and forget marks older than 15 seconds so an
  // echo that never came cannot swallow a change from elsewhere after it.
  sweep() {
    const now = Date.now();
    for (const [k, l] of this.mine) { const keep = l.filter(t => now - t < 15000); if (keep.length) this.mine.set(k, keep); else this.mine.delete(k); }
  }
  mark(p) { this.sweep(); const l = this.mine.get(p) || []; l.push(Date.now()); this.mine.set(p, l); }
  unmark(p) { const l = this.mine.get(p); if (l) { l.pop(); if (!l.length) this.mine.delete(p); } }
  echo(p) {
    this.sweep();
    const l = this.mine.get(p); if (!l) return false;
    l.shift(); if (!l.length) this.mine.delete(p); return true;
  }
  async write(p, col, id, run) {
    this.mark(p);
    let out; try { out = await run(); } catch (e) { this.unmark(p); throw e; }
    this.emit(col, id); return out;
  }
  fail(error) { throw err(/not_found|P0002/.test(String(error.message) + error.code) ? 'not_found' : 'unavailable', error.message); }

  async get(p) {
    const { id } = splitDoc(p);
    const { data, error } = await this.sb.from('docs').select('data,version,updated_at').eq('path', p).maybeSingle();
    if (error) this.fail(error);
    return { id, exists: !!data, data: data ? data.data : undefined, version: data ? data.version : 0, updatedAt: data ? data.updated_at : null };
  }
  async set(p, d) {
    const { col, id } = splitDoc(p);
    if (!isObj(d)) throw err('invalid_argument', 'set needs an object');
    return this.write(p, col, id, async () => {
      const { data, error } = await this.sb.rpc('doc_set', { p_path: p, p_col: col, p_id: id, p_data: stripDeletes(d) });
      if (error) this.fail(error); return { version: data };
    });
  }
  async update(p, d) {
    const { col, id } = splitDoc(p);
    if (!isObj(d)) throw err('invalid_argument', 'update needs an object');
    return this.write(p, col, id, async () => {
      const { data, error } = await this.sb.rpc('doc_update', { p_path: p, p_patch: d });
      if (error) this.fail(error); return { version: data };
    });
  }
  async delete(p) {
    const { col, id } = splitDoc(p);
    return this.write(p, col, id, async () => {
      const { error } = await this.sb.from('docs').delete().eq('path', p);
      if (error) this.fail(error); return {};
    });
  }
  // One orderBy and no where: Postgres sorts and cuts, so a limit does not
  // pull the whole collection. applyQuery still runs last, so the result is
  // shaped the same way as the local store's.
  async query(colPath, q) {
    const col = checkCol(colPath); q = q || {}; const rows = [];
    const order = orderExpr(q);
    const want = order && q.limit > 0 ? Math.floor(q.limit) : Infinity;
    for (let from = 0; from < want; from += 1000) {
      const to = Math.min(from + 999, want - 1);
      let req = this.sb.from('docs').select('id,data,version,updated_at').eq('col', col);
      if (order) req = req.order(order.column, { ascending: order.asc, nullsFirst: order.asc }).order('path');
      const { data, error } = await req.range(from, to);
      if (error) this.fail(error);
      rows.push(...data.map(r => ({ id: r.id, data: r.data, version: r.version, updatedAt: r.updated_at })));
      if (data.length < to - from + 1) break;
    }
    return applyQuery(rows, q);
  }
  async count() {
    const { count, error } = await this.sb.from('docs').select('path', { count: 'exact', head: true });
    if (error) this.fail(error); return count || 0;
  }
  // One time copy from the local store or an export, 500 rows at a time. A row
  // that already exists keeps its version moving forward (docs_import in the
  // schema), so a version check made before the copy still means something.
  async importRows(rows) {
    const byPath = new Map();
    for (const r of rows) byPath.set(r.col + '/' + r.id, { path: r.col + '/' + r.id, col: r.col, id: r.id, data: r.data, version: r.version || 1 });
    const all = [...byPath.values()]; let n = 0;
    for (let i = 0; i < all.length; i += 500) {
      const chunk = all.slice(i, i + 500);
      const { data, error } = await this.sb.rpc('docs_import', { p_rows: chunk });
      if (error) this.fail(error); n += Number(data) || 0;
    }
    return n;
  }
}
module.exports = { SupabaseStore };
