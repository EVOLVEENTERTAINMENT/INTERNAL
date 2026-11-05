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

  /* Claude. Same calls the board makes inside claude.ai: sample(input, opts)
     gives {text, truncated}, sample.json gives parsed JSON. When the board
     passes tools, Claude may call them; they run here, in the page, and the
     answer goes back to Claude until it is done. */
  function toMessages(input) {
    if (typeof input === 'string') return [{ role: 'user', content: input }];
    return (input || []).map(function (m) { return { role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) }; });
  }
  function aiErr(e) { return { code: (e && e.code) || 'upstream_error', message: String((e && e.message) || e) }; }
  function runSample(input, opts, wantJson) {
    opts = opts || {};
    var tools = (opts.tools || []).filter(function (t) { return t && t.name && typeof t.execute === 'function'; });
    var msgs = toMessages(input);
    if (wantJson) {
      var last = msgs[msgs.length - 1];
      last.content = String(last.content) + '\n\nAnswer with the JSON only, no other words and no code fence.';
    }
    var schemas = tools.map(function (t) { return { name: t.name, description: t.description, inputSchema: t.inputSchema }; });
    var rounds = 0, signal = opts.signal;
    function aborted() { return signal && signal.aborted; }
    function step() {
      if (aborted()) return Promise.reject({ code: 'cancelled', message: 'cancelled' });
      return call('ai:messages', { tier: opts.modelTier || 'default', messages: msgs, tools: schemas }).then(function (r) {
        if (aborted()) throw { code: 'cancelled', message: 'cancelled' };
        var uses = (r.content || []).filter(function (c) { return c.type === 'tool_use'; });
        if (uses.length && rounds < 12) {
          rounds++;
          msgs.push({ role: 'assistant', content: r.content });
          return Promise.all(uses.map(function (u) {
            var t = tools.filter(function (x) { return x.name === u.name; })[0];
            return Promise.resolve().then(function () {
              if (!t) throw new Error('no tool named ' + u.name);
              return t.execute(u.input || {}, { signal: signal });
            }).then(function (out) {
              return { type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(out === undefined ? null : out).slice(0, 60000) };
            }, function (e) {
              return { type: 'tool_result', tool_use_id: u.id, is_error: true, content: String((e && e.message) || e).slice(0, 2000) };
            });
          })).then(function (results) { msgs.push({ role: 'user', content: results }); return step(); });
        }
        var text = (r.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('');
        if (opts.onText) { try { opts.onText({ text: text, delta: text }); } catch (x) {} }
        return { text: text, truncated: r.stop_reason === 'max_tokens', modelTierApplied: opts.modelTier || 'default' };
      }, function (e) { throw aiErr(e); });
    }
    return step();
  }
  function parseJson(text) {
    var t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    try { return JSON.parse(t); } catch (x) {}
    var a = t.search(/[\[{]/), open = t.charAt(a), close = open === '[' ? ']' : '}', b = t.lastIndexOf(close);
    if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (x) {} }
    var e = new Error('Claude did not answer with JSON'); e.code = 'transform_error'; e.text = text; throw e;
  }
  var sample = function (input, opts) { return runSample(input, opts, false); };
  sample.json = function (input, opts) { return runSample(input, opts, true).then(function (r) { return parseJson(r.text); }); };
  sample.limits = function () { return Promise.resolve({ maxPromptBytes: 400000, images: false }); };

  var caps = { db: db, downloads: downloads, sample: sample };
  /* sample (Claude) arrives in step 3 and mcp (calendar, Gmail, texts) in
     steps 4 and 5. Until then they resolve to null, as they would on a page
     that has not been granted them. */
  var hostCaps = null;
  function ready() { return hostCaps || (hostCaps = call('host:caps', {}).catch(function () { return {}; })); }
  window.claude = Object.freeze({
    use: function (name) {
      return ready().then(function (hc) {
        if (name === 'permissions') return { state: function () { return Promise.resolve({}); }, request: function () { return Promise.resolve({}); } };
        if (name === 'sample' && !(hc && hc.sample)) return null;
        return caps[name] || null;
      });
    }
  });
})();
