/* Evolve OS outside claude.ai.
   The board reaches the outside world through window.claude.use(name). This
   file provides that same doorway, backed by whatever host the page runs in:
   the Mac app (window.evolveHost, from preload.js) or, later, the phone
   website. The board itself is not changed. Each capability resolves to
   null when this host does not have it yet, which the board already treats
   as "not available" and hides the feature. */
(function () {
  'use strict';
  var host = window.evolveHost;
  if (!host) return;
  var call = function (ch, a) { return host.invoke(ch, a); };
  var clone = function (v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); };
  var META = { fromCache: false, hasPendingWrites: false };
  function dbErr(e) { return { code: (e && e.code) || 'unavailable', message: String((e && e.message) || e) }; }
  function docSnap(r) {
    var d = r && r.exists ? r.data : undefined;
    return { id: r.id, exists: !!(r && r.exists), data: function () { return clone(d); }, metadata: META };
  }
  function querySnap(rows) {
    var docs = rows.map(function (r) { return docSnap({ id: r.id, exists: true, data: r.data }); });
    return { docs: docs, size: docs.length, empty: !docs.length, metadata: META,
      forEach: function (f) { docs.forEach(f); },
      docChanges: function () { return docs.map(function (d, i) { return { type: 'added', doc: d, oldIndex: -1, newIndex: i }; }); } };
  }
  /* one listener on the host, fanned out to every open subscription */
  var subs = new Set();
  host.on('db:changed', function (ev) { subs.forEach(function (s) { if (s.col === ev.col) s.refresh(); }); });
  function subscribe(col, fetch, next, error) {
    var alive = true, busy = false, again = false;
    var s = { col: col, refresh: function () {
      if (!alive) return; if (busy) { again = true; return; } busy = true;
      fetch().then(function (v) { if (alive) next(v); }, function (e) { if (alive && error) error(dbErr(e)); })
        .then(function () { busy = false; if (again) { again = false; s.refresh(); } });
    } };
    subs.add(s); setTimeout(s.refresh, 0);
    return function () { alive = false; subs.delete(s); };
  }
  function colOf(p) { var s = String(p).split('/'); return s.slice(0, -1).join('/'); }
  function docRef(p) {
    var id = String(p).split('/').pop();
    var get = function () { return call('db:get', { path: p }).then(docSnap); };
    return { id: id, path: p, get: get,
      set: function (d) { return call('db:set', { path: p, data: d }).then(function () {}); },
      update: function (d) { return call('db:update', { path: p, data: d }).then(function () {}); },
      delete: function () { return call('db:delete', { path: p }).then(function () {}); },
      acquire: function (o) { return call('db:acquire', { path: p, opts: o }); },
      onSnapshot: function (next, error) { return subscribe(colOf(p), get, next, error); },
      collection: function (c) { return colRef(p + '/' + c); } };
  }
  function query(col, q) {
    var run = function () { return call('db:query', { col: col, q: q }).then(querySnap); };
    var ext = function (k, v) { var n = { where: (q.where || []).slice(), orderBy: (q.orderBy || []).slice(), limit: q.limit };
      if (k === 'where') n.where.push(v); else if (k === 'orderBy') n.orderBy.push(v); else n.limit = v; return query(col, n); };
    return { where: function (f, op, v) { return ext('where', [f, op, v]); },
      orderBy: function (f, dir) { return ext('orderBy', [f, dir || 'asc']); },
      limit: function (n) { return ext('limit', n); },
      get: run, onSnapshot: function (next, error) { return subscribe(col, run, next, error); } };
  }
  function colRef(col) {
    var q = query(col, {});
    q.path = col;
    q.doc = function (id) { return docRef(col + '/' + (id || Math.random().toString(36).slice(2, 12))); };
    q.add = function (d) { var r = q.doc(); return r.set(d).then(function () { return r; }); };
    return q;
  }
  var db = { doc: docRef, collection: colRef };

  var downloads = { save: function (req) {
    var data = req && req.data;
    var p = typeof data === 'string' ? Promise.resolve({ text: data })
      : (data && data.arrayBuffer ? data.arrayBuffer() : Promise.resolve(data)).then(function (buf) {
          var b = new Uint8Array(buf), s = ''; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
          return { b64: btoa(s) }; });
    return p.then(function (body) { return call('dl:save', { filename: req.filename, body: body }); })
      .then(function (r) { if (!r || !r.saved) { var e = new Error('declined'); e.code = 'declined'; throw e; } return r; });
  } };

  var caps = { db: db, downloads: downloads };
  /* sample (Claude) arrives in step 3 and mcp (calendar, Gmail, texts) in
     steps 4 and 5. Until then they resolve to null, as they would on a page
     that has not been granted them. */
  var hostCaps = null;
  function ready() { return hostCaps || (hostCaps = call('host:caps', {}).catch(function () { return {}; })); }
  window.claude = Object.freeze({
    use: function (name) {
      return ready().then(function (hc) {
        if (name === 'permissions') return { state: function () { return Promise.resolve({}); }, request: function () { return Promise.resolve({}); } };
        if (hc && hc[name] && window.__evolveCaps && window.__evolveCaps[name]) return window.__evolveCaps[name];
        return caps[name] || null;
      });
    }
  });
})();
