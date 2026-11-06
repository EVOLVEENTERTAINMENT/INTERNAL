/* Evolve OS on the phone. The board's doorway (claude-shim.js) asks
   window.evolveHost for everything; here that host is Supabase, straight
   from the browser, signed in as you. Claude goes through the "claude"
   function on your Supabase project, which holds the key, so the key never
   reaches the phone. The calendar and texts are Mac only for now. */
(function () {
  'use strict';
  var C = window.EVOLVE_WEB || {};
  var sb = window.supabase.createClient(C.url, C.anon, { auth: { persistSession: true, autoRefreshToken: true } });
  var listeners = [];
  function fail(code, message) { var e = new Error(message); e.code = code; return e; }
  function splitDoc(p) { var s = String(p).split('/').filter(Boolean); if (s.length < 2 || s.length % 2) throw fail('invalid_argument', 'bad path ' + p); return { col: s.slice(0, -1).join('/'), id: s[s.length - 1] }; }
  function getField(o, f) { return String(f).split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function cmp(a, b) { if (a === b) return 0; if (a === undefined) return -1; if (b === undefined) return 1; if (typeof a === 'number' && typeof b === 'number') return a - b; return String(a) < String(b) ? -1 : 1; }
  var J = JSON.stringify;
  function test(op, a, b) {
    switch (String(op)) {
      case '==': case 'eq': return J(a) === J(b); case '!=': case 'ne': return J(a) !== J(b);
      case '<': case 'lt': return a !== undefined && cmp(a, b) < 0; case '<=': case 'lte': return a !== undefined && cmp(a, b) <= 0;
      case '>': case 'gt': return a !== undefined && cmp(a, b) > 0; case '>=': case 'gte': return a !== undefined && cmp(a, b) >= 0;
      case 'in': return Array.isArray(b) && b.some(function (x) { return J(x) === J(a); });
      case 'not-in': return Array.isArray(b) && !b.some(function (x) { return J(x) === J(a); });
      case 'array-contains': return Array.isArray(a) && a.some(function (x) { return J(x) === J(b); });
      default: throw fail('invalid_argument', 'unknown operator ' + op);
    }
  }
  function applyQuery(rows, q) {
    q = q || {};
    (q.where || []).forEach(function (w) { rows = rows.filter(function (r) { return test(w[1], getField(r.data, w[0]), w[2]); }); });
    (q.orderBy || []).slice().reverse().forEach(function (o) { var d = o[1] === 'desc' ? -1 : 1; rows.sort(function (a, b) { return d * cmp(getField(a.data, o[0]), getField(b.data, o[0])); }); });
    if (q.limit) rows = rows.slice(0, q.limit);
    return rows;
  }
  function stripDeletes(v) { if (!v || typeof v !== 'object' || Array.isArray(v)) return v; var o = {}; Object.keys(v).forEach(function (k) { var x = v[k]; if (x && typeof x === 'object' && x.__delete__ === true && Object.keys(x).length === 1) return; o[k] = stripDeletes(x); }); return o; }
  function err(e) { throw fail(/not_found|P0002/.test(String(e.message) + e.code) ? 'not_found' : 'unavailable', e.message); }
  function emit(col, id) { listeners.forEach(function (f) { try { f({ col: col, id: id }); } catch (x) {} }); }
  var H = {
    'host:caps': function () { return { sample: !!C.claude, mcp: false, store: 'supabase' }; },
    'db:get': function (a) { var d = splitDoc(a.path); return sb.from('docs').select('data,version,updated_at').eq('path', a.path).maybeSingle().then(function (r) { if (r.error) err(r.error); return { id: d.id, exists: !!r.data, data: r.data ? r.data.data : undefined, version: r.data ? r.data.version : 0 }; }); },
    'db:set': function (a) { var d = splitDoc(a.path); return sb.rpc('doc_set', { p_path: a.path, p_col: d.col, p_id: d.id, p_data: stripDeletes(a.data) }).then(function (r) { if (r.error) err(r.error); emit(d.col, d.id); return { version: r.data }; }); },
    'db:update': function (a) { var d = splitDoc(a.path); return sb.rpc('doc_update', { p_path: a.path, p_patch: a.data }).then(function (r) { if (r.error) err(r.error); emit(d.col, d.id); return { version: r.data }; }); },
    'db:delete': function (a) { var d = splitDoc(a.path); return sb.from('docs').delete().eq('path', a.path).then(function (r) { if (r.error) err(r.error); emit(d.col, d.id); return {}; }); },
    'db:acquire': function (a) { return { acquired: true, holder: a.opts && a.opts.holder }; },
    'db:query': function (a) {
      var rows = [];
      function page(from) {
        return sb.from('docs').select('id,data,version,updated_at').eq('col', a.col).range(from, from + 999).then(function (r) {
          if (r.error) err(r.error);
          r.data.forEach(function (x) { rows.push({ id: x.id, data: x.data, version: x.version }); });
          return r.data.length < 1000 ? applyQuery(rows, a.q) : page(from + 1000);
        });
      }
      return page(0);
    },
    'ai:messages': function (a) {
      return sb.functions.invoke('claude', { body: a }).then(function (r) {
        if (r.error) { var m = (r.error.context && r.error.context.status) || 0; throw fail(m === 401 ? 'not_granted' : m === 429 ? 'rate_limited' : 'upstream_error', r.error.message); }
        return r.data;
      });
    },
    'dl:save': function (a) {
      var b = a.body || {}, blob = b.b64 != null ? new Blob([Uint8Array.from(atob(b.b64), function (c) { return c.charCodeAt(0); })]) : new Blob([String(b.text || '')]);
      var u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = a.filename || 'evolve-file';
      document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
      return { saved: true };
    },
    'mcp:list': function () { return { servers: [] }; },
    'mcp:call': function () { throw fail('server_not_connected', 'The calendar and texts are on the Mac app for now.'); }
  };
  sb.channel('docs-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'docs' }, function (p) {
    var row = p.new && p.new.col ? p.new : p.old || {}; emit(row.col, row.id);
  }).subscribe();
  window.evolveHost = { kind: 'web',
    invoke: function (ch, a) { try { var f = H[ch]; if (!f) throw fail('bad_request', 'unknown call ' + ch); return Promise.resolve(f(a || {})); } catch (e) { return Promise.reject(e); } },
    on: function (ch, cb) { if (ch === 'db:changed') listeners.push(cb); } };
  window.evolveAuth = sb.auth;
})();
