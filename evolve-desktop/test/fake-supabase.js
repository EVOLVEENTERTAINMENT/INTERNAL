// A stand-in for the parts of Supabase the app uses, on a real Postgres with
// the real schema: emailed link sign in, the docs table through the REST paths
// supabase-js calls, the doc_set, doc_update and docs_import functions, and a
// realtime socket that echoes every write the way Supabase does. Test use only.
'use strict';
const http = require('http');
const { Client } = require('pg');
const crypto = require('crypto');
const WS = require('ws');   // realtime-js needs it too, so it is always installed

// PostgREST order terms ("data->meta->n.desc.nullslast,path.asc") to SQL.
// The direction is optional, as in PostgREST: a bare "id" means asc.
function orderSql(param) {
  const out = [];
  for (const term of String(param || '').split(',').filter(Boolean)) {
    const m = term.match(/^([a-z_]+)((?:->[A-Za-z0-9_]+)*)(?:\.(asc|desc))?(?:\.(nullsfirst|nullslast))?$/);
    if (!m) throw new Error('bad order: ' + term);
    const col = m[1] + m[2].split('->').filter(Boolean).map(k => "->'" + k + "'").join('');
    out.push(col + ' ' + (m[3] || 'asc') + (m[4] ? (m[4] === 'nullsfirst' ? ' nulls first' : ' nulls last') : ''));
  }
  return out.length ? ' order by ' + out.join(', ') : ' order by path';
}

async function start({ pgUrl, email }) {
  let link = null;   // the last emailed link: where it goes and the PKCE challenge
  const pg = new Client({ connectionString: pgUrl }); await pg.connect();
  const user = { id: '00000000-0000-0000-0000-000000000001', email, aud: 'authenticated', role: 'authenticated' };
  const log = [];
  const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers': 'content-range' };
  const send = (res, st, body, headers) => { res.writeHead(st, Object.assign({ 'content-type': 'application/json' }, CORS, headers || {})); res.end(body === undefined ? '' : JSON.stringify(body)); };

  // Realtime: the Phoenix channel messages realtime-js sends and expects.
  // Every write below is echoed to each joined socket before the HTTP reply
  // goes out, which is the order that is hardest for the app. A delete
  // carries only the key, which is what production sends: the schema keeps
  // the default replica identity on purpose (see supabase/schema.sql).
  const COLS = [{ name: 'path', type: 'text' }, { name: 'col', type: 'text' }, { name: 'id', type: 'text' }, { name: 'version', type: 'int4' }];
  const sockets = new Set(); const sent = [];
  const wss = new WS.Server({ noServer: true });
  wss.on('connection', ws => {
    const joined = new Map();   // topic -> ids of its postgres_changes bindings
    const entry = { ws, joined }; sockets.add(entry);
    ws.on('message', raw => {
      let m; try { m = JSON.parse(String(raw)); } catch (e) { return; }
      const reply = (status, response) => ws.send(JSON.stringify({ topic: m.topic, event: 'phx_reply', ref: m.ref, payload: { status, response } }));
      if (m.event === 'heartbeat') return reply('ok', {});
      if (m.event === 'phx_join') {
        const want = ((m.payload && m.payload.config && m.payload.config.postgres_changes) || []).map((f, i) => Object.assign({ id: i + 1 }, f));
        joined.set(m.topic, want.map(f => f.id)); return reply('ok', { postgres_changes: want });
      }
      if (m.event === 'phx_leave') { joined.delete(m.topic); return reply('ok', {}); }
    });
    ws.on('close', () => sockets.delete(entry));
  });
  const change = (type, row) => {
    const rec = { path: row.path, col: row.col, id: row.id, version: row.version };
    const data = { type, schema: 'public', table: 'docs', commit_timestamp: new Date().toISOString(), columns: COLS, errors: null,
      record: type === 'DELETE' ? {} : rec, old_record: type === 'INSERT' ? {} : type === 'DELETE' ? { path: row.path } : rec };
    sent.push(data);
    for (const s of sockets) for (const [topic, ids] of s.joined) if (ids.length && s.ws.readyState === WS.OPEN)
      s.ws.send(JSON.stringify({ topic, event: 'postgres_changes', ref: null, payload: { ids, data } }));
  };
  const after = async (paths) => {   // echo the rows these paths now hold
    const r = await pg.query('select path,col,id,version from docs where path = any($1)', [paths]);
    for (const row of r.rows) change(row.version > 1 ? 'UPDATE' : 'INSERT', row);
  };
  const srv = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'); let raw = '';
    for await (const c of req) raw += c;
    const body = raw ? JSON.parse(raw) : null;
    log.push([req.method, u.pathname + u.search]);
    if (req.method === 'OPTIONS') return send(res, 204);
    try {
      const session = () => ({ access_token: 'tok', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'ref', user });
      if (u.pathname === '/auth/v1/otp') {
        if (!body || body.email !== email || body.create_user !== false) return send(res, 422, { code: 'otp_disabled', msg: 'Signups not allowed for otp' });
        link = { to: u.searchParams.get('redirect_to'), challenge: body.code_challenge };
        return send(res, 200, {});
      }
      if (u.pathname === '/auth/v1/token' && u.searchParams.get('grant_type') === 'pkce') {
        const ok = link && body && body.auth_code === 'link-code' && crypto.createHash('sha256').update(body.code_verifier || '').digest('base64url') === link.challenge;
        if (!ok) return send(res, 400, { code: 'bad_code_verifier', msg: 'code challenge does not match previously saved code verifier' });
        link = null; return send(res, 200, session());
      }
      if (u.pathname === '/auth/v1/token') return send(res, 200, session());
      if (u.pathname === '/auth/v1/user') return send(res, 200, user);
      if (u.pathname === '/auth/v1/logout') return send(res, 204);
      if (u.pathname === '/functions/v1/claude') return send(res, 200, { content: [{ type: 'text', text: '{"ok":true}' }], stop_reason: 'end_turn' });
      if (!/^Bearer tok$/.test(req.headers.authorization || '') && req.headers.apikey !== 'service') return send(res, 401, { message: 'JWT required' });
      if (u.pathname.startsWith('/rest/v1/rpc/')) {
        const fn = u.pathname.split('/').pop();
        if (fn === 'doc_set') { try { const r = await pg.query('select public.doc_set($1,$2,$3,$4::jsonb,$5) v', [body.p_path, body.p_col, body.p_id, JSON.stringify(body.p_data), body.p_if_version == null ? null : body.p_if_version]); await after([body.p_path]); return send(res, 200, r.rows[0].v); }
          catch (e) { return send(res, 400, { code: e.code, message: e.message, details: null, hint: null }); } }
        if (fn === 'doc_update') {
          try { const r = await pg.query('select public.doc_update($1,$2::jsonb,$3) v', [body.p_path, JSON.stringify(body.p_patch), body.p_if_version == null ? null : body.p_if_version]); await after([body.p_path]); return send(res, 200, r.rows[0].v); }
          catch (e) { return send(res, 400, { code: e.code, message: e.message, details: null, hint: null }); }
        }
        if (fn === 'docs_import') {
          try { const r = await pg.query('select public.docs_import($1::jsonb) v', [JSON.stringify(body.p_rows || [])]); await after((body.p_rows || []).map(x => x.path)); return send(res, 200, r.rows[0].v); }
          catch (e) { return send(res, 400, { code: e.code, message: e.message, details: null, hint: null }); }
        }
        if (fn === 'save_app_secret') {
          try { await pg.query('begin'); await pg.query("select set_config('test.uid', $1, true)", [user.id]);
            const r = await pg.query('select public.save_app_secret($1,$2) v', [body.p_name, body.p_value]); await pg.query('commit'); return send(res, 200, r.rows[0].v); }
          catch (e) { await pg.query('rollback'); return send(res, 400, { code: e.code, message: e.message, details: null, hint: null }); }
        }
        return send(res, 404, { message: 'no function' });
      }
      if (u.pathname === '/rest/v1/docs') {
        const where = [], args = [];
        for (const k of ['path', 'col']) { const v = u.searchParams.get(k); if (v && v.startsWith('eq.')) { args.push(v.slice(3)); where.push(k + ' = $' + args.length); } }
        const w = where.length ? ' where ' + where.join(' and ') : '';
        if (req.method === 'HEAD') {
          const r = await pg.query('select count(*)::int n from docs' + w, args);
          res.writeHead(200, Object.assign({ 'content-range': '*/' + r.rows[0].n }, CORS)); return res.end();
        }
        if (req.method === 'GET') {
          const cols = (u.searchParams.get('select') || '*').split(',').map(s => s.replace(/[^a-z_*]/g, '')).join(',');
          let sql = 'select ' + cols + ' from docs' + w + orderSql(u.searchParams.get('order'));
          const rg = (req.headers.range || '').match(/(\d+)-(\d+)/);
          const off = Number(u.searchParams.get('offset') || (rg ? rg[1] : 0)), lim = u.searchParams.get('limit') || (rg ? Number(rg[2]) - Number(rg[1]) + 1 : null);
          if (lim) sql += ' limit ' + Number(lim) + ' offset ' + off;
          const r = await pg.query(sql, args);
          if (/vnd\.pgrst\.object/.test(req.headers.accept || '')) {
            if (r.rows.length > 1) return send(res, 406, { message: 'multiple rows' });
            return r.rows.length ? send(res, 200, r.rows[0]) : send(res, 406, { code: 'PGRST116', message: 'no rows', details: 'The result contains 0 rows' });
          }
          return send(res, 200, r.rows);
        }
        if (req.method === 'DELETE') {
          const gone = await pg.query('delete from docs' + w + ' returning path,col,id,version', args);
          for (const row of gone.rows) change('DELETE', row);
          return send(res, 204);
        }
        if (req.method === 'POST') {
          for (const row of [].concat(body)) await pg.query(`insert into docs (path,col,id,data,version) values ($1,$2,$3,$4::jsonb,$5)
            on conflict (path) do update set data = excluded.data, version = excluded.version, updated_at = now()`, [row.path, row.col, row.id, JSON.stringify(row.data), row.version || 1]);
          await after([].concat(body).map(x => x.path));
          return send(res, 201, []);
        }
      }
      send(res, 404, { message: 'not here: ' + u.pathname });
    } catch (e) { send(res, 500, { message: e.message }); }
  });
  srv.on('upgrade', (req, socket, head) => {
    if (!req.url.startsWith('/realtime/v1/websocket')) return socket.destroy();
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  return { url: 'http://127.0.0.1:' + srv.address().port, log, sent,
    // what clicking the emailed link does: back to the app with a one time code
    click: () => link && link.to + (link.to.includes('?') ? '&' : '?') + 'code=link-code',
    // a change made somewhere else (the phone, a scheduled task): only the socket hears it
    change, sockets: () => sockets.size,
    close: async () => { for (const s of sockets) s.ws.terminate(); wss.close(); srv.close(); await pg.end(); } };
}
module.exports = { start };
