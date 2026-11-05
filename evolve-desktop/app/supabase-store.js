// The board database on Supabase. Same methods as LocalStore, but async, and
// shared: the Mac app, the phone site and the scheduled tasks all see it.
// Rows live in public.docs (see supabase/schema.sql). Only the signed in
// owner can read or write them.
'use strict';
const { createClient } = require('@supabase/supabase-js');
const { applyQuery, splitDoc, checkCol, stripDeletes, err } = require('./store');

class SupabaseStore {
  constructor({ url, anonKey, storage }) {
    this.sb = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, storage } });
    this.listeners = new Set(); this.channel = null;
  }
  async signIn(email, password) {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw err('needs_reauth', error.message);
    this.live(); return { email: data.user && data.user.email };
  }
  async signOut() { await this.sb.auth.signOut(); if (this.channel) this.sb.removeChannel(this.channel); this.channel = null; }
  async who() { const { data } = await this.sb.auth.getSession(); return data.session ? { email: data.session.user.email } : null; }
  live() {
    if (this.channel) return;
    this.channel = this.sb.channel('docs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'docs' }, p => {
        const row = p.new && p.new.col ? p.new : p.old || {};
        for (const fn of this.listeners) { try { fn({ col: row.col, id: row.id }); } catch (e) {} }
      }).subscribe();
  }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(col, id) { for (const fn of this.listeners) { try { fn({ col, id }); } catch (e) {} } }
  fail(error) { throw err(/not_found|P0002/.test(String(error.message) + error.code) ? 'not_found' : 'unavailable', error.message); }

  async get(p) {
    const { id } = splitDoc(p);
    const { data, error } = await this.sb.from('docs').select('data,version,updated_at').eq('path', p).maybeSingle();
    if (error) this.fail(error);
    return { id, exists: !!data, data: data ? data.data : undefined, version: data ? data.version : 0, updatedAt: data ? data.updated_at : null };
  }
  async set(p, d) {
    const { col, id } = splitDoc(p);
    const { data, error } = await this.sb.rpc('doc_set', { p_path: p, p_col: col, p_id: id, p_data: stripDeletes(d) });
    if (error) this.fail(error); this.emit(col, id); return { version: data };
  }
  async update(p, d) {
    const { col, id } = splitDoc(p);
    const { data, error } = await this.sb.rpc('doc_update', { p_path: p, p_patch: d });
    if (error) this.fail(error); this.emit(col, id); return { version: data };
  }
  async delete(p) {
    const { col, id } = splitDoc(p);
    const { error } = await this.sb.from('docs').delete().eq('path', p);
    if (error) this.fail(error); this.emit(col, id); return {};
  }
  async query(colPath, q) {
    const col = checkCol(colPath); const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await this.sb.from('docs').select('id,data,version,updated_at').eq('col', col).range(from, from + 999);
      if (error) this.fail(error);
      rows.push(...data.map(r => ({ id: r.id, data: r.data, version: r.version, updatedAt: r.updated_at })));
      if (data.length < 1000) break;
    }
    return applyQuery(rows, q);
  }
  // One time copy from the local store or an export, 500 rows at a time.
  async importRows(rows) {
    let n = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500).map(r => ({ path: r.col + '/' + r.id, col: r.col, id: r.id, data: r.data, version: r.version || 1 }));
      const { error } = await this.sb.from('docs').upsert(chunk, { onConflict: 'path' });
      if (error) this.fail(error); n += chunk.length;
    }
    return n;
  }
}
module.exports = { SupabaseStore };
